const libxml = require('../index');

if (!global.gc) {
  throw new Error('must run with --expose_gc for memory management tests');
}

function makeDocument() {
  const body =
    "<?xml version='1.0' encoding='UTF-8'?>\n" +
    '<root><outer><middle><inner><center/></inner></middle></outer></root>';

  return libxml.parseXml(body);
}

function collectGarbage(minCycles = 3, maxCycles = 10) {
  let cycles = 0;
  let freedRss = 0;
  let usage = process.memoryUsage();

  do {
    global.gc();

    const usageAfterGc = process.memoryUsage();

    freedRss = usage.rss - usageAfterGc.rss;
    usage = usageAfterGc;

    cycles += 1;
  } while (cycles < minCycles || (freedRss !== 0 && cycles < maxCycles));

  return usage;
}

// Node-API runs finalizers on a later event-loop turn, not during gc(), so
// native memory is only released after yielding. Alternate both.
async function collectGarbageAndFinalize(cycles = 5) {
  for (let i = 0; i < cycles; i += 1) {
    collectGarbage(1, 1);
    await new Promise((resolve) => setImmediate(resolve));
  }
  collectGarbage();
}

describe('memory management', () => {
  beforeEach(() => {
    collectGarbage();
  });

  it('inaccessible document freed', async () => {
    const xml_memory_before_document = libxml.memoryUsage();

    for (let i = 0; i < 10; i += 1) {
      makeDocument();
    }
    await collectGarbageAndFinalize();
    expect(libxml.memoryUsage() <= xml_memory_before_document).toBeTruthy();
  });

  it('inaccessible document freed when node freed', async () => {
    const xml_memory_before_document = libxml.memoryUsage();
    let nodes = [];

    for (let i = 0; i < 10; i += 1) {
      nodes.push(makeDocument().get('//center'));
    }
    nodes = null;
    await collectGarbageAndFinalize();
    expect(libxml.memoryUsage() <= xml_memory_before_document).toBeTruthy();
  });

  it('inaccessible document freed after middle nodes proxies', async () => {
    const xml_memory_before_document = libxml.memoryUsage();
    let doc = makeDocument();

    let _middle = doc.get('//middle');
    let inner = doc.get('//inner');

    inner.remove(); // v0.14.3, v0.15: proxy ref'd parent but can't unref when destroyed
    doc = _middle = inner = null;
    await collectGarbageAndFinalize();
    expect(libxml.memoryUsage() <= xml_memory_before_document).toBeTruthy();
  });

  it('inaccessible tree freed', () =>
    new Promise((done) => {
      const doc = makeDocument();
      const xml_memory_after_document = libxml.memoryUsage();

      doc.get('//middle').remove();
      process.nextTick(() => {
        collectGarbage();
        expect(libxml.memoryUsage() <= xml_memory_after_document).toBeTruthy();
        done();
      });
    }));

  it('namespace list freed', () => {
    return new Promise((done) => {
      const doc = makeDocument();
      const el = doc.get('//center');

      // A non-string href throws since 2.0.0, so give the namespace one.
      el.namespace('bar', 'urn:bar');
      const xmlMemBefore = libxml.memoryUsage();

      for (let i = 0; i < 1000; i += 1) {
        el.namespaces();
      }
      process.nextTick(() => {
        collectGarbage();
        expect(libxml.memoryUsage() <= xmlMemBefore).toBeTruthy();
        done();
      });
    });
  });
});
