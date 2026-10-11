const { spawnSync } = require('node:child_process');
const path = require('node:path');

// Regression tests for inputs that used to abort or crash the process.
// Each case runs in its own child process so a regression shows up as a
// failed assertion instead of taking down the test worker.
const root = path.resolve(__dirname, '..');

function run(body) {
  const script = `
    const libxml = require(${JSON.stringify(path.join(root, 'index.js'))});
    const out = (v) => process.stdout.write(JSON.stringify(v) + '\\n');
    const throws = (fn) => {
      try { fn(); return null; } catch (e) { return e.constructor.name; }
    };
    ${body}
  `;
  const res = spawnSync(process.execPath, ['--expose-gc', '-e', script], {
    encoding: 'utf8',
    timeout: 60000,
  });
  const lines = res.stdout.trim().split('\n').filter(Boolean);
  return {
    status: res.status,
    signal: res.signal,
    stderr: res.stderr,
    values: lines.map((l) => JSON.parse(l)),
  };
}

// libxml2 may print diagnostics to stderr; only the exit matters here.
function expectClean(res) {
  expect({ status: res.status, signal: res.signal }, res.stderr).toEqual({
    status: 0,
    signal: null,
  });
}

const ENTITY_DOC = `<?xml version="1.0"?>
<!DOCTYPE note [
<!ENTITY writer PUBLIC "${'A'.repeat(40)}" "sys">
]>
<from>&writer;</from>`;

describe('security regressions', () => {
  it('entity declarations reached through an entity reference (CVE-2024-34393/34394)', () => {
    const res = run(`
      const doc = libxml.parseXml(${JSON.stringify(ENTITY_DOC)});
      const decl = doc.get('//from').childNodes()[0].childNodes()[0];
      out(decl.type());
      out(decl.attrs());
      out(decl.namespaces(true));
      out(decl.namespace());
      out(decl.attr('x'));
      out(throws(() => decl.attr('x', 'y')));
      out(throws(() => decl.namespace('p', 'urn:p')));
      out(throws(() => decl.remove()));
      out(throws(() => decl.addChild(new libxml.Element(doc, 'x'))));
      out(throws(() => decl.text('t')));
      out(decl.toString().startsWith('<!ENTITY writer'));
    `);
    expectClean(res);
    expect(res.values).toEqual([
      'entity_decl',
      [],
      [],
      null,
      null,
      'Error',
      'Error',
      'Error',
      'Error',
      'Error',
      true,
    ]);
  });

  it('DTD and declaration nodes are inert', () => {
    const res = run(`
      const doc = libxml.parseXml(
        '<!DOCTYPE r [<!ELEMENT r EMPTY><!ATTLIST r a CDATA "d">]><r/>'
      );
      const dtd = doc.root().prevSibling();
      out(dtd.type());
      out(dtd.attrs());
      out(dtd.namespaces(true));
      for (const decl of dtd.childNodes()) {
        out([decl.type(), decl.attrs(), decl.namespaces(true)]);
      }
      // A DTD-defaulted attribute is not a real attribute node.
      out(doc.root().attr('a'));
    `);
    expectClean(res);
    expect(res.values).toEqual([
      'dtd',
      [],
      [],
      ['element_decl', [], []],
      ['attribute_decl', [], []],
      null,
    ]);
  });

  it('XPath namespace and document nodes', () => {
    const res = run(`
      const doc = libxml.parseXml('<r xmlns:a="urn:a"><c/></r>');
      const nodes = doc.find('//namespace::*');
      out(nodes.map((n) => [n.prefix(), n.href()]).sort());
      out(doc.root().find('..')[0] === doc);
    `);
    expectClean(res);
    // Each element reports every namespace in scope: <r> and <c> both see
    // a: and xml:.
    expect(res.values).toEqual([
      [
        ['a', 'urn:a'],
        ['a', 'urn:a'],
        ['xml', 'http://www.w3.org/XML/1998/namespace'],
        ['xml', 'http://www.w3.org/XML/1998/namespace'],
      ],
      true,
    ]);
  });

  it('attributes have no local namespace list', () => {
    const res = run(`
      const doc = libxml.parseXml('<r a="1"/>');
      out(doc.root().attr('a').namespaces(true));
    `);
    expectClean(res);
    expect(res.values).toEqual([[]]);
  });

  it('non-string attribute values are converted like libxmljs2', () => {
    const res = run(`
      const doc = libxml.parseXml('<r/>');
      doc.root().attr('n', 5);
      doc.root().attr({ b: true, z: 0 });
      out(doc.root().toString());
      out(throws(() => doc.root().attr('s', Symbol('x'))));
    `);
    expectClean(res);
    expect(res.values).toEqual(['<r n="5" b="true" z="0"/>', 'TypeError']);
  });

  it('invalid arguments throw instead of aborting', () => {
    const res = run(`
      const doc = libxml.parseXml('<r>t</r>');
      const text = doc.root().childNodes()[0];
      out(throws(() => libxml.parseXml(null)));
      out(throws(() => libxml.parseXml(123)));
      out(throws(() => libxml.parseHtml(5)));
      out(throws(() => doc.root().addChild(null)));
      out(throws(() => doc.root().addPrevSibling(null)));
      out(throws(() => doc.root().replace(null)));
      out(throws(() => text.addNextSibling({})));
      out(throws(() => text.replace({})));
      out(throws(() => new libxml.Element(doc.root(), 'x')));
      const w = new libxml.TextWriter();
      w.startDocument(5);
      w.startElementNS(undefined, 7);
      w.endElement();
      out(w.outputMemory().includes('<7/>'));
    `);
    expectClean(res);
    expect(res.values).toEqual([
      'TypeError',
      'TypeError',
      'TypeError',
      'TypeError',
      'TypeError',
      'TypeError',
      'TypeError',
      'TypeError',
      'Error',
      true,
    ]);
  });

  it('a failed schema validation does not leave a dangling error handler', () => {
    const res = run(`
      const doc = libxml.parseXml('<r><c/></r>');
      const bad = libxml.parseXml(
        '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">' +
        '<xs:element name="r" type="nope:missing"/></xs:schema>'
      );
      out(throws(() => doc.validate(bad)));
      out(throws(() => doc.rngValidate(bad)));
      // Malformed XPath makes libxml2 report through the global error
      // handler; this used to call into the freed validate() frame.
      let completed = 0;
      for (let i = 0; i < 2000; i++) {
        doc.find('//c[[[' + i);
        completed++;
      }
      out(completed);
    `);
    expectClean(res);
    expect(res.values).toEqual(['Error', 'Error', 2000]);
  });

  it('inserting a text sibling next to text keeps the JS node usable', () => {
    const res = run(`
      const doc = libxml.parseXml('<r><a/>tail</r>');
      const a = doc.root().childNodes()[0];
      const t = new libxml.Text(doc, 'x');
      a.addNextSibling(t);
      global.gc();
      out(t.text());
      out(doc.root().toString());
    `);
    expectClean(res);
    expect(res.values[0]).toBe('x');
  });

  it('wrappers collected but not yet finalized are recreated', () => {
    const res = run(`
      const doc = libxml.parseXml('<r><c/></r>');
      let failures = 0;
      for (let i = 0; i < 20000; i++) {
        try {
          if (doc.get('//c').name() !== 'c') failures++;
        } catch (e) { failures++; }
        if (i % 1000 === 0) global.gc();
      }
      out(failures);
    `);
    expectClean(res);
    expect(res.values).toEqual([0]);
  });

  it('the main thread keeps working after worker threads exit', () => {
    const res = run(`
      const { Worker } = require('node:worker_threads');
      const entry = ${JSON.stringify(path.join(root, 'index.js'))};
      const runWorker = () => new Promise((resolve, reject) => {
        const w = new Worker(
          'const l = require(' + JSON.stringify(entry) + ');' +
          'require("node:worker_threads").parentPort.postMessage(' +
          'l.parseXml("<w><x/></w>").get("//x").name());',
          { eval: true }
        );
        w.once('message', resolve);
        w.once('error', reject);
      });
      (async () => {
        out(libxml.parseXml('<a/>').root().name());
        for (let i = 0; i < 3; i++) {
          out(await runWorker());
          // Let the worker's env tear down before using the addon again.
          await new Promise((r) => setTimeout(r, 50));
          global.gc();
          out(libxml.parseXml('<b><c/></b>').get('//c').name());
        }
      })();
    `);
    expectClean(res);
    expect(res.values).toEqual(['a', 'x', 'c', 'x', 'c', 'x', 'c']);
  });

  it('typed arrays and DataViews are read as bytes', () => {
    const res = run(`
      const b = Buffer.from('<r><c/></r>');
      out(libxml.parseXml(new DataView(b.buffer, b.byteOffset, b.length)).root().name());
      out(libxml.parseHtml(new DataView(b.buffer, b.byteOffset, b.length)).get('//c').name());
      out(libxml.parseXml(new Uint8Array(b)).root().name());
      out(throws(() => libxml.parseXml({})));
    `);
    expectClean(res);
    expect(res.values).toEqual(['r', 'c', 'r', 'TypeError']);
  });

  it('HTML-only options do not load an external DTD in parseXml', () => {
    const res = run(`
      const fs = require('node:fs');
      const os = require('node:os');
      const path = require('node:path');
      const { pathToFileURL } = require('node:url');
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'libxmljs4-dtd-'));
      // A file URL, because libxml2 cannot resolve relative to a Windows path.
      const baseUrl = pathToFileURL(path.join(dir, 'x.xml')).href;
      fs.writeFileSync(path.join(dir, 'ext.dtd'), '<!ENTITY e "from-ext">');
      const xml = '<!DOCTYPE r SYSTEM "ext.dtd"><r>&e;</r>';
      // The external DTD declares the entity, so it resolves only if loaded.
      const loaded = (opts) => !libxml
        .parseXml(xml, { baseUrl, recover: true, ...opts })
        .errors.some((e) => /Entity 'e' not defined/.test(e.message));
      out([loaded({}), loaded({ doctype: false }), loaded({ implied: false })]);
      out(loaded({ dtdload: true }));
      fs.rmSync(dir, { recursive: true });
    `);
    expectClean(res);
    expect(res.values).toEqual([[false, false, false], true]);
  });

  it('SAX parsers reject re-entrant calls and handle empty input', () => {
    const res = run(`
      const p = new libxml.SaxParser();
      let inner = null;
      p.on('startElementNS', () => {
        inner = throws(() => p.parseString('<x/>'));
      });
      p.parseString('<r/>');
      out(inner);

      const errors = [];
      const empty = new libxml.SaxParser();
      empty.on('error', (msg) => errors.push(msg.trim()));
      empty.parseString('');
      out(errors);

      const push = new libxml.SaxPushParser();
      let pushInner = null;
      push.on('startElementNS', () => {
        pushInner = throws(() => push.push('<y/>'));
      });
      push.push('<r/>', 1);
      out(pushInner);
    `);
    expectClean(res);
    expect(res.values).toEqual(['Error', ['Document is empty'], 'Error']);
  });
});
