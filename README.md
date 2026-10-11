# libxmljs4

Node.js bindings for [libxml2](https://gitlab.gnome.org/GNOME/libxml2): parse, query, build, and validate XML and HTML.

A maintained fork of [libxmljs2](https://github.com/marudor/libxmljs2), which is unmaintained and has unfixed vulnerabilities ([CVE-2024-34393](https://nvd.nist.gov/vuln/detail/CVE-2024-34393), [CVE-2024-34394](https://nvd.nist.gov/vuln/detail/CVE-2024-34394)). It bundles libxml2 2.9.14 with distribution security patches ([list](vendor/libxml/PATCHES.md)) and includes TypeScript types.

## Install

```shell
npm install libxmljs4
```

Requires Node.js `^22.22.2`, `^24.15.0`, or `>=26`. Prebuilt binaries ship for Linux (x64, arm64, Alpine x64), macOS (Apple silicon), and Windows (x64, arm64). Other platforms, including Intel Macs, compile on install, which needs Python 3, `make`, and a C++ compiler ([details](https://github.com/nodejs/node-gyp#installation)).

## Usage

```javascript
const libxmljs = require('libxmljs4'); // or: import { parseXml } from 'libxmljs4';

const doc = libxmljs.parseXml(
  '<root><child id="a">hello</child><child>world</child></root>'
);

doc.get('//child').text(); // 'hello'
doc.get('//child').attr('id').value(); // 'a'
doc.find('//child').map((c) => c.text()); // ['hello', 'world']
doc.root().name(); // 'root'
```

### Parsing

`parseXml()` and `parseHtml()` take a string or a `Buffer` (any typed array works) and an optional options object. `parseHtmlFragment()` parses HTML without adding `<html>` and `<body>`.

`parseXml()` throws on malformed input; the error carries `line`, `column`, and `code`. With `recover: true` it keeps going and collects the problems in `doc.errors`, up to `maxErrors` (default 10,000; `Infinity` for no limit). `parseHtml()` always recovers.

```javascript
const doc = libxmljs.parseXml('<a><b></a>', { recover: true });
doc.errors.length; // 2
```

Common options: `recover`, `noblanks` (drop whitespace-only text), `nocdata` (merge CDATA into text), `baseUrl`, `encoding` (for `Buffer` input), and `maxErrors`. [`ParserOptions`](lib/types.ts) documents them all. Read [Security](#security) before enabling `noent`, `dtdload`, `dtdattr`, `dtdvalid`, `xinclude`, or `huge`.

### XPath

```javascript
doc.find('//child[@id]'); // all matches
doc.get('//child'); // first match, or undefined
doc.get('count(//child)'); // 2

// Namespaces: a prefix map, or the default namespace's URI
doc.find('//ex:item', { ex: 'urn:example' });
doc.find('//xmlns:div', 'http://www.w3.org/1999/xhtml');
```

### Building documents

```javascript
const doc = new libxmljs.Document();
doc
  .node('root')
  .node('child', 'content')
  .attr({ id: 'a' })
  .parent()
  .node('sibling');

doc.toString();
// <?xml version="1.0" encoding="UTF-8"?>
// <root>
//   <child id="a">content</child>
//   <sibling/>
// </root>
```

Nodes also have `text()`, `attr()`, `addChild()`, `addNextSibling()`, `replace()`, `remove()`, `clone()`, `namespace()`, and more; the [types](lib/types.ts) list them all. For streaming output, use `TextWriter`.

### Validation

Each returns `true` or `false` and puts the reasons in `doc.validationErrors`.

```javascript
const schema = libxmljs.parseXml(xsdString);
doc.validate(schema); // XSD
doc.validationErrors; // [] when valid

doc.schematronValidate(libxmljs.parseXml(schematronString)); // Schematron
// RELAX NG: doc.rngValidate(schemaDoc)
```

### SAX

For large inputs, `SaxParser` emits events instead of building a tree. `SaxPushParser` takes chunks with `push(chunk, isLast)`, and `SaxTransform` is a writable stream.

```javascript
const parser = new libxmljs.SaxParser();
parser.on('startElementNS', (name, attrs, prefix, uri, namespaces) => {});
parser.on('characters', (text) => {});
parser.on('error', (message) => {}); // required: an unhandled 'error' throws
parser.parseString('<root><child>hello</child></root>');
```

Events: `startDocument`, `endDocument`, `startElementNS`, `endElementNS`, `characters`, `cdata`, `comment`, `warning`, `error`. `SaxTransform` emits the same events but renames `error` to `saxError`:

```javascript
const fs = require('node:fs');

fs.createReadStream('big.xml')
  .pipe(new libxmljs.SaxTransform())
  .on('startElementNS', (name) => console.log(name))
  .on('saxError', (message) => console.error(message));
```

### TypeScript

Types are included for `require` and `import`. `find()` and `get()` assume elements; pass a type argument for anything else.

```typescript
import { parseXml, type Text } from 'libxmljs4';

const doc = parseXml('<list><item id="a">one</item></list>');

doc.root()?.name(); // 'list'
doc.get('//item')?.attr('id')?.value(); // 'a'
doc.get<Text>('//item/text()')?.text(); // 'one'
doc.get<number>('count(//item)'); // 1
```

### Utilities

```javascript
libxmljs.version; // this package's version
libxmljs.libxml_version; // '2.9.14'
libxmljs.memoryUsage(); // bytes allocated by libxml2
```

Worker threads can load the addon, but don't parse, validate, or run XPath on more than one thread at a time: the bundled libxml2 has process-wide error handling.

## Security

For untrusted input:

- **Keep the defaults.** They don't load external DTDs or resolve external entities.
- **Don't enable `noent`, `dtdload`, `dtdattr`, `dtdvalid`, or `xinclude`.** Each lets the document read local files (XXE). Network access is compiled out entirely.
- **Don't enable `huge`.** It lifts libxml2's size and depth limits.
- **Only validate against trusted schemas.** Schemas can include other files.

## Migrating from libxmljs2

Change the package name; most code works unchanged.

```diff
- const libxmljs = require('libxmljs2');
+ const libxmljs = require('libxmljs4');
```

Differences you may hit:

- **Node.js** `^22.22.2`, `^24.15.0`, or `>=26`.
- **Removed aliases:** use `parseXml`, `parseHtml`, `Document.fromXml`, and `Document.fromHtml` instead of the `…String` versions.
- **Bad arguments throw a `TypeError`** instead of crashing. Strings are still converted with `String()`, so `attr('n', 5)` works.
- **DTD and declaration nodes are read-only.** They can be reached through an entity reference's `childNodes()`. Element-only methods on them return `[]` or `null`, and changing them throws; this fixes CVE-2024-34393 and CVE-2024-34394.
- **`doc.errors` and `doc.validationErrors` stop at 10,000 entries** unless you raise `maxErrors`.
- **`parseXml()` ignores the HTML-only `doctype` and `implied` options.**
- **Stricter libxml2 limits:** runaway entity expansion, CDATA sections over 10 MB, and literals over 50,000 characters are rejected.
- **SAX:** calling `parseString()` or `push()` from inside the same parser's handler throws, and `SaxTransform` fails the stream if a listener throws.
- **TypeScript:** the types follow the runtime, so strict code may need null checks such as `doc.root()?.name()`.

[CHANGELOG.md](CHANGELOG.md) has the full history.

## Contributing

Bug reports and pull requests are welcome; ask questions in [Discussions](https://github.com/jstilwell/libxmljs4/discussions). To build from source you need Python 3, `make`, and a C++ compiler:

```shell
git clone https://github.com/jstilwell/libxmljs4.git
cd libxmljs4
corepack enable # on Node 25+, first: npm install -g corepack
pnpm install # also compiles the addon
pnpm build:ts
pnpm test
```

## License

[MIT](LICENSE)
