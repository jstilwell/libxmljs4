# Libxmljs4

LibXML bindings for [node.js](http://nodejs.org/)

Forked from [libxmljs2](https://github.com/marudor/libxmljs2), which was forked from the original [libxmljs](https://github.com/libxmljs/libxmljs). This fork was created to address unpatched security vulnerabilities ([CVE-2024-34393](https://nvd.nist.gov/vuln/detail/CVE-2024-34393), [CVE-2024-34394](https://nvd.nist.gov/vuln/detail/CVE-2024-34394)) in the unmaintained libxmljs2, and to modernize the project for current Node.js.

TypeScript definitions are included out of the box.

## Installation

```shell
npm install libxmljs4
```

Prebuilt binaries are available for Windows, macOS, Linux, and Alpine. If a prebuild is not available for your platform, it will compile from source automatically (requires Python 3, `make`, and a C++ compiler — see [node-gyp prerequisites](https://github.com/TooTallNate/node-gyp#installation)).

**Node.js >= 22 is required.**

## Migrating from libxmljs2

libxmljs4 starts at version `1.0.0` (forked from libxmljs2 `0.37.0`). The major version bump reflects breaking changes: removed API synonyms, a fully rewritten C++ binding layer, and a new package name. Update your install and imports:

```diff
- npm install libxmljs2
+ npm install libxmljs4
```

```diff
- const libxmljs = require('libxmljs2');
+ const libxmljs = require('libxmljs4');
```

### Changes from libxmljs2

- **Security: CVE-2024-34393 and CVE-2024-34394 fixed** — In libxmljs2, calling `attrs()` or `namespaces(true)` on a DTD, entity, or declaration node (reachable through `childNodes()` of an entity reference) read the wrong C struct, which could crash the process or worse. These nodes are still returned, and `type()`, `name()`, `text()`, and `toString()` work on them, but `attrs()` and `namespaces(true)` return `[]`, `attr()` and `namespace()` return `null`, and methods that would modify them (`attr(name, value)`, `addChild()`, `remove()`, `text(value)`, and so on) throw. `test/security.test.js` covers both CVEs.
- **Patched libxml2**: The bundled libxml2 is 2.9.14 with Debian's and Ubuntu's security backports applied (see `vendor/libxml/PATCHES.md`), and `libxml_version` reports `2.9.14`. libxmljs2 shipped an unpatched mid-2021 snapshot that reported itself as 2.9.9. Two backported fixes reject inputs libxmljs2 accepted: entity expansion beyond 10 MB that is also more than 10 times the input size fails with "Maximum entity amplification factor exceeded" (also with `huge`), and without `huge`, CDATA sections over 10,000,000 bytes and quoted literals or NMTOKENs over 50,000 characters are rejected. HTML parsing output is unchanged.
- **XPath namespace and document nodes**: `find('//namespace::*')` returns `Namespace` objects, and an XPath that selects the document node (for example `find('..')` from the root) returns the `Document`. In libxmljs2 both crashed the process.
- **Invalid arguments throw**: Passing the wrong kind of value, such as `parseXml(null)`, `addChild(null)`, or a non-node to `addNextSibling()`, throws a `TypeError` instead of crashing. String arguments are still converted with `String(value)` as in libxmljs2, so `attr('count', 5)` sets `count="5"`.
- **Error lists are capped**: `doc.errors` and `doc.validationErrors` hold at most 10,000 entries by default, set by the `maxErrors` option. libxmljs2 built a JS `Error` for every libxml2 diagnostic, so a small malformed input could use hundreds of megabytes.
- **`old` works**: The documented `old` parser option is an alias for `old10`. In libxmljs2 it was silently ignored.
- **`SaxTransform` reports listener errors at end of input**: An exception thrown by a listener during the final push (for example in an `endDocument` handler) fails the stream, as it already did for earlier chunks. libxmljs2 swallowed it.
- **SAX re-entrancy**: Calling `parseString()` or `push()` from inside one of the same parser's event handlers throws an `Error`. Parsing an empty string emits an `error` event.
- **Node-API (N-API)**: Native addon now uses ABI-stable Node-API instead of NAN. Prebuilt binaries work across Node.js versions without recompilation.
- **TypeScript source**: The JS wrapper layer is now written in TypeScript with generated type definitions.
- **ESM support**: Both `require()` and `import` work via the `exports` field in package.json.
- **Removed compatibility synonyms**: `parseXmlString` (use `parseXml`), `parseHtmlString` (use `parseHtml`), `Document.fromXmlString` (use `Document.fromXml`), `Document.fromHtmlString` (use `Document.fromHtml`).
- **Replaced `bindings` package**: Native addon loading no longer depends on the `bindings` npm package.
- **Renamed package**: Published as `libxmljs4` (previously `libxmljs3`, forked from `libxmljs2`).
- **Optimized native toString()**: Element and node `toString()` option parsing now caches property lookups instead of repeatedly querying the options object.
- **Smaller npm package**: Disabled source maps and declaration maps from the published dist files.
- **`namespace()` validates its href**: Passing a non-string href (for example `el.namespace('pref', null)`) throws a `TypeError`. In libxmljs2 this aborted the process with a fatal N-API error. The single-argument `namespace(null)` form still removes the namespace.
- **Narrower Node.js support**: `engines.node` is `^22.22.2 || ^24.15.0 || >=26`.
- **`node-gyp` is not a runtime dependency**: It is only needed to build from source, so it moved to `devDependencies`. Installing this package no longer pulls it in.
- **`parseHtmlFragment` leaves its options object unchanged**: libxmljs2 set `doctype` and `implied` to `false` on the object the caller passed in.
- **SAX parsers are `instanceof EventEmitter`**: `SaxParser` and `SaxPushParser` instances have `EventEmitter.prototype` on their prototype chain. libxmljs2 only copied the EventEmitter methods onto them.

See [CHANGELOG.md](CHANGELOG.md) for the full release history.

## API Overview

### Parsing XML

```javascript
const libxmljs = require('libxmljs4');

const xmlDoc = libxmljs.parseXml(
  '<?xml version="1.0"?>' +
    '<root>' +
    '<child foo="bar">' +
    '<grandchild baz="fizbuzz">grandchild content</grandchild>' +
    '</child>' +
    '<sibling>with content!</sibling>' +
    '</root>'
);

console.log(xmlDoc.get('//grandchild').text()); // "grandchild content"
console.log(xmlDoc.root().childNodes()[0].attr('foo').value()); // "bar"
```

### Parsing HTML

```javascript
const htmlDoc = libxmljs.parseHtml('<html><body><p>Hello</p></body></html>');
const htmlFragment = libxmljs.parseHtmlFragment('<p>Hello</p><p>World</p>');
```

### Parser Options

Both `parseXml` and `parseHtml` accept an options object:

```javascript
const doc = libxmljs.parseXml(xml, {
  recover: true, // Recover from malformed XML
  noblanks: true, // Remove blank text nodes
  nonet: true, // Forbid network access (off by default; see below)
  baseUrl: 'http://example.com', // Base URL for relative references
});
```

Other options: `noent`, `dtdload`, `dtdattr`, `dtdvalid`, `xinclude`, `huge`, `noerror`, `nowarning`, `pedantic`, `sax1`, `nodict`, `nsclean`, `nocdata`, `compact`, `old10` (or its alias `old`), `nobasefix`, `big_lines`, `ignore_enc`.

Parse errors are collected in `doc.errors`, up to `maxErrors` entries (default `10000`; pass `Infinity` for no limit). `validate()`, `rngValidate()`, and `schematronValidate()` take the same option as an optional second argument, for example `doc.validate(xsd, { maxErrors: 100 })`, and limit `doc.validationErrors` the same way.

Read [Security considerations](#security-considerations) before enabling `noent`, `dtdload`, `dtdattr`, `dtdvalid`, `xinclude`, or `huge`.

### Security considerations

When parsing untrusted input:

- **The default options do not resolve external entities.** With no options set, `parseXml` neither loads an external DTD nor substitutes external entities. Neither do `SaxParser` and `SaxPushParser`.
- **Do not enable `noent`, `dtdload`, `dtdattr`, `dtdvalid`, or `xinclude`.** Each one makes the parser read local files that the document names, which is how XML external entity (XXE) attacks work. `noent` substitutes external entities into the document, `dtdload`, `dtdattr`, and `dtdvalid` load the external DTD, and `xinclude` inlines `xi:include` targets.
- **Network access is compiled out.** This build has no HTTP or FTP support (`libxmljs.features.HTTP` and `libxmljs.features.FTP` are `false`), so the parser never fetches remote URLs, with or without `nonet`. It can still read local files.
- **Do not enable `huge`.** It removes libxml2's limits on text node size, name and literal length, and nesting depth. Entity expansion is still capped by an amplification limit, but the other limits exist to bound memory use on hostile input.
- **Only use trusted schemas.** XSD, RelaxNG, and Schematron documents passed to `validate()`, `rngValidate()`, and `schematronValidate()` can include or import other files, which libxml2 loads.

### XPath Queries

```javascript
// Simple query
const nodes = doc.find('//child');
const node = doc.get('//child');

// With a default namespace URI
const divs = doc.find('//xmlns:div', 'http://www.w3.org/1999/xhtml');

// With a namespace map
const results = doc.find('//ex:body', { ex: 'urn:example' });
```

### Building Documents

```javascript
const doc = new libxmljs.Document();
doc
  .node('root')
  .node('child', 'content')
  .attr({ foo: 'bar' })
  .parent()
  .node('sibling', 'more content');

console.log(doc.toString());
```

### SAX Parser

Event-based parsing for large documents or streaming use cases.

```javascript
const parser = new libxmljs.SaxParser();

parser.on('startElementNS', (name, attrs, prefix, uri, namespaces) => {
  console.log('opened:', name);
});

parser.on('endElementNS', (name, prefix, uri) => {
  console.log('closed:', name);
});

parser.on('characters', (text) => {
  console.log('text:', text);
});

// Malformed input is reported as 'error' events. As with any EventEmitter,
// parseString() throws "Unhandled error" if there is no listener.
parser.on('error', (message) => {
  console.error('parse error:', message.trim());
});

parser.parseString('<root><child>hello</child></root>');
```

**Events:** `startDocument`, `endDocument`, `startElementNS`, `endElementNS`, `characters`, `cdata`, `comment`, `warning`, `error`

The `SaxPushParser` works the same way but accepts incremental chunks via `.push(chunk)`.

### TextWriter

Serialize XML programmatically with fine-grained control.

```javascript
const writer = new libxmljs.TextWriter();

writer.startDocument('1.0', 'UTF-8');
writer.startElementNS(undefined, 'root', 'http://example.com');
writer.startElementNS(undefined, 'child');
writer.writeString('content');
writer.endElement();
writer.endElement();
writer.endDocument();

console.log(writer.outputMemory()); // flushes and returns the XML string
```

### XSD and Schematron Validation

```javascript
const xsdDoc = libxmljs.parseXml(xsdString);
const isValid = xmlDoc.validate(xsdDoc);
console.log(xmlDoc.validationErrors);

const schematronDoc = libxmljs.parseXml(schematronString);
const isValid2 = xmlDoc.schematronValidate(schematronDoc);
```

### Utilities

```javascript
libxmljs.version; // libxmljs4 package version
libxmljs.libxml_version; // Underlying libxml2 version
libxmljs.memoryUsage(); // Bytes allocated by libxml2
libxmljs.nodeCount(); // Number of live XML nodes
```

### Worker threads

The addon can be loaded in worker threads, and the main thread keeps working after a worker exits. The bundled libxml2 is built without thread support, so its error handling is process-wide: do not parse, validate, or run XPath on more than one thread at the same time.

## Support

- [GitHub Discussions](https://github.com/jstilwell/libxmljs4/discussions)
- [Examples](https://github.com/jstilwell/libxmljs4/tree/main/examples)

## Contributing

Start by checking out the [open issues](https://github.com/jstilwell/libxmljs4/issues).

### Build from Source

Prerequisites: Python 3, `make`, C++ compiler (`g++` or equivalent).

```shell
git clone https://github.com/jstilwell/libxmljs4.git
cd libxmljs4
pnpm install --build-from-source
pnpm test
```

Tests require the `--expose_gc` Node.js flag (already configured in `npm test`).
