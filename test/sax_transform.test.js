const { SaxTransform } = require('../index');
const { once } = require('node:events');
const { Readable } = require('node:stream');

// Assertions run after the stream finishes, not inside SAX listeners. A
// listener that throws during the final push is swallowed by _flush, so an
// assertion made there could never fail the test. Vitest also does not
// supply a `done` callback; a test's first argument is its context object.

describe('SaxTransform', () => {
  it('emits startDocument and endDocument', async () => {
    const transform = new SaxTransform();
    const events = [];

    transform.on('startDocument', () => events.push('startDocument'));
    transform.on('endDocument', () => events.push('endDocument'));

    transform.end('<?xml version="1.0"?><root/>');
    await once(transform, 'finish');

    expect(events).toEqual(['startDocument', 'endDocument']);
  });

  it('emits startElementNS and endElementNS', async () => {
    const transform = new SaxTransform();
    const elements = [];

    transform.on('startElementNS', (name) => elements.push(`start:${name}`));
    transform.on('endElementNS', (name) => elements.push(`end:${name}`));

    transform.end('<root><child/></root>');
    await once(transform, 'finish');

    expect(elements).toEqual([
      'start:root',
      'start:child',
      'end:child',
      'end:root',
    ]);
  });

  it('emits characters', async () => {
    const transform = new SaxTransform();
    let text = '';

    transform.on('characters', (chars) => {
      text += chars;
    });

    transform.end('<root>hello</root>');
    await once(transform, 'finish');

    expect(text).toBe('hello');
  });

  it('works with piped streams', async () => {
    const transform = new SaxTransform();
    const elements = [];

    transform.on('startElementNS', (name) => elements.push(name));

    const source = new Readable({
      read() {
        this.push('<root>');
        this.push('<item/>');
        this.push('<item/>');
        this.push('</root>');
        this.push(null);
      },
    });

    source.pipe(transform);
    await once(transform, 'finish');

    expect(elements).toEqual(['root', 'item', 'item']);
  });

  it('handles multiple chunks', async () => {
    const transform = new SaxTransform();
    const events = [];

    transform.on('startElementNS', (name) => events.push(name));

    transform.write('<root><a/>');
    transform.end('<b/></root>');
    await once(transform, 'finish');

    expect(events).toEqual(['root', 'a', 'b']);
  });

  it('decodes multi-byte characters split across chunks', async () => {
    const transform = new SaxTransform();
    let text = '';
    let ended = false;

    transform.on('characters', (chars) => {
      text += chars;
    });
    transform.on('endDocument', () => {
      ended = true;
    });

    // 'é' is C3 A9 and '€' is E2 82 AC in UTF-8. Each cut below falls
    // inside one of those sequences.
    const bytes = Buffer.from('<r>héllo €</r>', 'utf-8');
    const cuts = [5, 11, 12];
    let start = 0;
    for (const cut of cuts) {
      expect(bytes[cut - 1] >= 0x80 && bytes[cut] >= 0x80).toBe(true);
      transform.write(bytes.subarray(start, cut));
      start = cut;
    }
    transform.end(bytes.subarray(start));
    await once(transform, 'finish');

    expect(ended).toBe(true);
    expect(text).toBe('héllo €');
  });
});
