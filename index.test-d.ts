import { EventEmitter } from 'node:events';
import { Readable, Transform } from 'node:stream';
import {
  expectAssignable,
  expectError,
  expectNotAssignable,
  expectType,
} from 'tsd';
import * as libxml from '.';
import type * as esmTypes from './dist/index.mjs' with {
  'resolution-mode': 'import',
};

const xml = '<root xmlns:ex="urn:example"><child a="1">hi</child></root>';

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

const doc = libxml.parseXml(xml);
expectType<libxml.ParsedDocument>(doc);
expectAssignable<libxml.Document>(doc);
expectType<libxml.SyntaxError[]>(doc.errors);
expectType<libxml.ParsedDocument>(libxml.parseXml(Buffer.from(xml)));
expectType<libxml.ParsedDocument>(libxml.parseXml(xml, { recover: true }));
expectType<libxml.ParsedDocument>(libxml.parseXml(xml, null));
expectType<libxml.ParsedDocument>(
  libxml.parseXml(xml, {
    baseUrl: 'http://example.com/',
    encoding: 'UTF-8',
    noblanks: true,
    nonet: true,
    dtdattr: true,
    old10: true,
    old: true,
    xincnode: false,
    maxErrors: Infinity,
  })
);
expectType<libxml.ParsedDocument>(libxml.parseHtml('<p>hi</p>'));
expectType<libxml.ParsedDocument>(
  libxml.parseHtml(Buffer.from('<p>hi</p>'), { excludeImpliedElements: true })
);
expectType<libxml.ParsedDocument>(libxml.parseHtmlFragment('<p>a</p><p>b</p>'));
expectType<libxml.ParsedDocument>(libxml.Document.fromXml(xml));
expectType<libxml.ParsedDocument>(libxml.Document.fromHtml('<p/>'));
expectType<libxml.ParsedDocument>(libxml.Document.fromHtmlFragment('<p/>'));

expectError(libxml.parseXml(5));
expectError(libxml.parseXml(xml, { recover: 'yes' }));
expectError(libxml.parseXml(xml, { maxErrors: '10' }));
expectError(libxml.parseXml(xml, { notAnOption: true }));
expectError(libxml.parseXmlString(xml));
expectError(libxml.Document.fromXmlString(xml));

// Thrown and collected errors carry libxml2's details.
const syntaxError = doc.errors[0];
expectAssignable<Error>(syntaxError);
expectType<number>(syntaxError.domain);
expectType<number>(syntaxError.code);
expectType<number>(syntaxError.level);
expectType<number>(syntaxError.line);
expectType<number>(syntaxError.column);
expectType<string | undefined>(syntaxError.file);
expectType<string | undefined>(syntaxError.str1);
expectType<string | undefined>(syntaxError.str2);
expectType<string | undefined>(syntaxError.str3);
expectType<number | undefined>(syntaxError.int1);
expectType<string>(syntaxError.message);

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

const built = new libxml.Document();
expectType<libxml.Document>(built);
expectType<libxml.Document>(new libxml.Document('1.0', 'UTF-8'));
expectType<libxml.SyntaxError[] | undefined>(built.errors);
expectError(libxml.Document());
expectAssignable<libxml.Document>(libxml.Document.prototype);

expectType<libxml.Element | null>(doc.root());
expectType<libxml.ChildNode[]>(doc.childNodes());
expectType<libxml.ChildNode | null>(doc.child(0));
expectType<libxml.Namespace[]>(doc.namespaces());
expectType<string | null>(doc.encoding());
expectType<libxml.ParsedDocument>(doc.encoding('UTF-8'));
expectType<string | null>(doc.version());
expectType<'document'>(doc.type());
expectType<string>(doc.toString());
expectType<string>(doc.toString(false));
expectType<string>(
  doc.toString({
    declaration: false,
    format: true,
    selfCloseEmpty: false,
    whitespace: true,
    type: 'html',
    encoding: 'ISO-8859-1',
  })
);
expectError(doc.toString({ type: 'json' }));
expectType<libxml.Dtd | null>(doc.getDtd());
expectType<string | null>(doc.getDtd()!.name);
expectType<string | null>(doc.getDtd()!.externalId);
expectType<string | null>(doc.getDtd()!.systemId);
expectType<libxml.Document>(built.setDtd('html'));
expectType<libxml.Document>(built.setDtd('html', 'ext', 'sys'));

// ---------------------------------------------------------------------------
// Building documents
// ---------------------------------------------------------------------------

const root = built.node('root');
expectType<libxml.Element>(root);
expectType<libxml.Element>(root.node('child', 'content'));
expectType<libxml.Element>(
  root.node('child').attr({ foo: 'bar' }).parent().node('sibling')
);

const elem = new libxml.Element(built, 'elem', 'content');
expectType<libxml.Element>(elem);
expectType<libxml.Element>(libxml.Element(built, 'elem'));
expectError(new libxml.Element('not a document', 'elem'));
expectError(new libxml.Element(built));

const text = new libxml.Text(built, 'text');
expectType<libxml.Text>(text);
expectError(new libxml.Text(built));
const comment = new libxml.Comment(built, 'comment');
expectType<libxml.Comment>(comment);
expectType<libxml.Comment>(new libxml.Comment(built));
const pi = new libxml.ProcessingInstruction(built, 'target', 'data');
expectType<libxml.ProcessingInstruction>(pi);
expectType<libxml.ProcessingInstruction>(
  new libxml.ProcessingInstruction(built, 'target')
);

expectType<libxml.Element>(root.addChild(elem));
expectType<libxml.Element>(root.addChild(text));
expectType<libxml.Element>(root.addChild(comment));
expectError(root.addChild(built));
expectError(root.addChild('text'));
expectType<libxml.Text>(elem.addNextSibling(text));
expectType<libxml.Comment>(elem.addPrevSibling(comment));
expectType<libxml.ProcessingInstruction>(text.addNextSibling(pi));
expectType<libxml.Element>(text.addPrevSibling(elem));
expectType<string>(elem.replace('replacement'));
expectType<libxml.Comment>(elem.replace(comment));
expectType<string>(text.replace('replacement'));
expectType<libxml.Element>(text.replace(elem));
expectType<libxml.Element>(elem.cdata('<raw>'));
expectType<libxml.Element>(elem.cdata());
expectType<libxml.Element>(elem.remove());
expectType<libxml.Text>(text.remove());
expectType<libxml.Element>(elem.clone());
expectType<libxml.Text>(text.clone(false));

const empty = new libxml.Document();
expectType<libxml.Element>(empty.root(elem));
expectType<libxml.Text>(empty.root(text));
expectError(empty.root('root'));

// ---------------------------------------------------------------------------
// Traversal
// ---------------------------------------------------------------------------

expectType<libxml.Document>(elem.doc());
expectType<libxml.Element | libxml.Document>(elem.parent());
expectType<libxml.Element | libxml.Document>(text.parent());
expectType<libxml.ChildNode[]>(elem.childNodes());
expectType<libxml.ChildNode | null>(elem.child(0));
expectType<libxml.ChildNode | null>(elem.nextSibling());
expectType<libxml.ChildNode | null>(text.prevSibling());
expectType<libxml.ChildNode | null>(comment.nextSibling());
expectType<libxml.ChildNode | null>(pi.prevSibling());
expectType<libxml.Element | null>(elem.nextElement());
expectType<libxml.Element | null>(text.prevElement());
expectType<number>(elem.line());
expectType<string>(elem.path());
expectType<string>(text.path());

// Narrowing a child node by class.
const first = elem.childNodes()[0];
if (first instanceof libxml.Element) {
  expectType<libxml.Element>(first);
} else if (first instanceof libxml.Text) {
  expectType<libxml.Text>(first);
}
expectError(first.attr('a'));
expectAssignable<libxml.Node>(first);
expectAssignable<libxml.ChildNode>(elem);
expectNotAssignable<libxml.ChildNode>(elem.attr('a'));

// type() is a string union; declarations and DTDs are wrapped as Element.
expectAssignable<libxml.NodeType>(elem.type());
expectAssignable<ReturnType<libxml.Element['type']>>('dtd');
expectAssignable<ReturnType<libxml.Element['type']>>('cdata');
expectNotAssignable<ReturnType<libxml.Element['type']>>('text');
expectType<'text'>(text.type());
expectType<'comment'>(comment.type());
expectType<'pi'>(pi.type());

// Element, Text, Comment, ProcessingInstruction content.
expectType<string>(elem.name());
expectType<libxml.Element>(elem.name('renamed'));
expectType<string>(elem.text());
expectType<libxml.Element>(elem.text('new text'));
expectType<libxml.Element>(elem.text(5));
expectType<string>(text.name());
expectType<string>(text.text());
expectType<libxml.Text>(text.text('new'));
expectType<string>(comment.text());
expectType<libxml.Comment>(comment.text(true));
expectType<string>(pi.name());
expectType<libxml.ProcessingInstruction>(pi.name('other'));
expectType<string>(pi.text());
expectType<libxml.ProcessingInstruction>(pi.text('data'));
expectType<string>(elem.toString());
expectType<string>(elem.toString(true));
expectType<string>(text.toString({ declaration: false, type: 'xhtml' }));

// ---------------------------------------------------------------------------
// Attributes
// ---------------------------------------------------------------------------

const attr = elem.attr('a');
expectType<libxml.Attribute | null>(attr);
expectType<libxml.Element>(elem.attr('a', 'value'));
expectType<libxml.Element>(elem.attr('count', 5));
expectType<libxml.Element>(elem.attr('flag', true));
expectType<libxml.Element>(elem.attr({ a: 'value', count: 5, flag: false }));
expectType<libxml.Attribute[]>(elem.attrs());
expectError(elem.attr('a', { not: 'a string' }));
expectError(text.attr('a'));
if (attr) {
  expectType<string>(attr.name());
  expectType<string>(attr.value());
  expectType<libxml.Attribute>(attr.value('new'));
  expectType<libxml.Attribute>(attr.value(42));
  expectType<libxml.Element | null>(attr.node());
  expectType<libxml.Element | libxml.Document>(attr.parent());
  expectType<libxml.Namespace | null>(attr.namespace());
  expectType<libxml.Attribute | null>(attr.nextSibling());
  expectType<'attribute'>(attr.type());
  expectType<libxml.Attribute>(attr.remove());
  expectAssignable<libxml.Node>(attr);
}
// Attribute and Namespace are types only; the package exports no
// constructor for them.
expectError(libxml.Attribute);
expectError(libxml.Namespace);
expectError(libxml.Node);

// ---------------------------------------------------------------------------
// XPath
// ---------------------------------------------------------------------------

// The default result type is Element, like the DOM's querySelector().
expectType<libxml.Element[] | null>(doc.find('//child'));
expectType<libxml.Element | null | undefined>(doc.get('//child'));
expectType<libxml.Element[] | null>(elem.find('child'));
expectType<libxml.Element | null | undefined>(elem.get('child'));
expectType<libxml.Element[] | null>(doc.find('//xmlns:div', 'urn:x'));
expectType<libxml.Element[] | null>(doc.find('//ex:a', { ex: 'urn:example' }));
expectType<libxml.Text[] | null>(doc.find<libxml.Text>('//text()'));
expectType<libxml.Attribute | null | undefined>(
  doc.get<libxml.Attribute>('//@a')
);
expectType<libxml.Namespace[] | null>(
  doc.find<libxml.Namespace>('//namespace::*')
);
expectType<libxml.Document | null | undefined>(elem.get<libxml.Document>('/'));
expectType<libxml.XPathNode[] | null>(doc.find<libxml.XPathNode>('//node()'));
// Expressions that do not select nodes return the value itself.
expectType<number | null>(doc.get<number>('count(//child)'));
expectType<number | null>(doc.find<number>('count(//child)'));
expectType<string | null>(doc.get<string>('string(//child)'));
expectType<boolean | null>(elem.find<boolean>('boolean(child)'));
expectError(doc.find<Date>('//child'));
expectError(doc.find('//child', 5));
expectError(doc.get('//child')!.foo());

// ---------------------------------------------------------------------------
// Namespaces
// ---------------------------------------------------------------------------

const ns = elem.defineNamespace('urn:default');
expectType<libxml.Namespace>(ns);
expectType<libxml.Namespace>(elem.defineNamespace('ex', 'urn:example'));
expectType<string>(ns.href());
expectType<string | null>(ns.prefix());
expectType<libxml.Namespace | null>(elem.namespace());
expectType<libxml.Element>(elem.namespace(ns));
expectType<libxml.Element>(elem.namespace('urn:example'));
expectType<libxml.Element>(elem.namespace('ex', 'urn:example'));
expectType<null>(elem.namespace(null));
expectError(elem.namespace('ex', null));
expectType<libxml.Namespace[]>(elem.namespaces());
expectType<libxml.Namespace[]>(elem.namespaces(true));
expectType<libxml.Namespace | null>(text.namespace());
expectError(text.namespace(ns));

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const schema = libxml.parseXml('<xs:schema/>');
expectType<boolean>(doc.validate(schema));
expectType<boolean>(doc.validate(schema, { maxErrors: 100 }));
expectType<boolean>(doc.rngValidate(schema));
expectType<boolean>(doc.rngValidate(schema, { maxErrors: Infinity }));
expectType<boolean>(doc.schematronValidate(schema));
expectType<boolean>(doc.schematronValidate(schema, {}));
expectError(doc.validate('<xs:schema/>'));
expectError(doc.validate(schema, { maxErrors: 'all' }));
expectType<libxml.ValidationError[] | undefined>(doc.validationErrors);
const validationError = doc.validationErrors![0];
expectAssignable<Error>(validationError);
expectType<number>(validationError.line);
expectType<string | undefined>(validationError.str1);

// ---------------------------------------------------------------------------
// SAX
// ---------------------------------------------------------------------------

const parser = new libxml.SaxParser();
expectType<libxml.SaxParser>(parser);
expectType<libxml.SaxParser>(libxml.SaxParser());
expectAssignable<EventEmitter>(parser);
expectType<boolean>(parser.parseString('<a/>'));
expectError(parser.parseString(Buffer.from('<a/>')));

expectType<libxml.SaxParser>(
  parser.on('startElementNS', (elem, attrs, prefix, uri, namespaces) => {
    expectType<string>(elem);
    expectType<[string, string, string, string][]>(attrs);
    expectType<string | null>(prefix);
    expectType<string | null>(uri);
    expectType<[string | null, string][]>(namespaces);
  })
);
parser.on('endElementNS', (elem, prefix, uri) => {
  expectType<string>(elem);
  expectType<string | null>(prefix);
  expectType<string | null>(uri);
});
parser.once('characters', (chars) => expectType<string>(chars));
parser.addListener('cdata', (cdata) => expectType<string>(cdata));
parser.prependListener('comment', (comment) => expectType<string>(comment));
parser.prependOnceListener('warning', (msg) => expectType<string>(msg));
parser.on('error', (msg) => expectType<string>(msg));
parser.on('startDocument', () => {});
parser.on('endDocument', () => {});
// Other EventEmitter methods and events still work.
parser.on('newListener', (event, listener) => [event, listener]);
expectType<boolean>(parser.emit('startDocument'));
expectType<number>(parser.listenerCount('startElementNS'));
expectType<libxml.SaxParser>(parser.removeAllListeners());
expectType<libxml.SaxParser>(parser.off('error', () => {}));

const callbacks: libxml.SaxCallbacks = {
  startElementNS(elem, attrs) {
    expectType<string>(elem);
    expectType<[string, string, string, string][]>(attrs);
  },
  error(message) {
    expectType<string>(message);
  },
};
expectType<libxml.SaxParser>(new libxml.SaxParser(callbacks));
expectType<libxml.SaxParser>(libxml.SaxParser({ endDocument() {} }));
expectError(new libxml.SaxParser({ startElement() {} }));
expectType<[message: string]>([] as unknown as libxml.SaxParserEvents['error']);

const pushParser = new libxml.SaxPushParser({ characters() {} });
expectType<libxml.SaxPushParser>(pushParser);
expectType<libxml.SaxPushParser>(libxml.SaxPushParser());
expectAssignable<EventEmitter>(pushParser);
expectType<boolean>(pushParser.push('<a>'));
expectType<boolean>(pushParser.push('</a>', true));
pushParser.on('startElementNS', (elem) => expectType<string>(elem));

// ---------------------------------------------------------------------------
// SaxTransform
// ---------------------------------------------------------------------------

const transform = new libxml.SaxTransform();
expectType<libxml.SaxTransform>(transform);
expectAssignable<Transform>(transform);
expectType<libxml.SaxTransform>(
  new libxml.SaxTransform({
    callbacks: { startElementNS: (elem) => expectType<string>(elem) },
    highWaterMark: 1024,
  })
);
expectError(new libxml.SaxTransform({ callbacks: { nope() {} } }));
expectType<libxml.SaxTransform>(
  transform.on('startElementNS', (elem, attrs, prefix) => {
    expectType<string>(elem);
    expectType<[string, string, string, string][]>(attrs);
    expectType<string | null>(prefix);
  })
);
transform.on('saxError', (message) => expectType<string>(message));
transform.on('error', (err) => expectType<Error>(err));
transform.once('pipe', (src) => expectType<Readable>(src));
transform.on('finish', () => {});
transform.on('custom-event', (...args) => expectType<any[]>(args));
expectType<boolean>(transform.write('<a>'));
Readable.from(['<a/>']).pipe(transform);
const transformOptions: libxml.SaxTransformOptions = { callbacks };
expectType<libxml.SaxCallbacks | undefined>(transformOptions.callbacks);
expectType<[]>([] as libxml.SaxTransformEvents['endDocument']);

// ---------------------------------------------------------------------------
// TextWriter
// ---------------------------------------------------------------------------

const writer = new libxml.TextWriter();
expectType<libxml.TextWriter>(writer);
expectError(libxml.TextWriter());
expectType<number>(writer.startDocument());
expectType<number>(writer.startDocument('1.0', 'UTF-8', true));
expectType<number>(writer.startDocument('1.0', null, 'no'));
expectType<number>(writer.startElementNS(undefined, 'root', 'urn:x'));
expectType<number>(writer.startElementNS('ex', 'child'));
expectType<number>(writer.startAttributeNS(null, 'attr'));
expectType<number>(writer.writeString('value'));
expectType<number>(writer.writeString(5));
expectType<number>(writer.endAttribute());
expectType<number>(writer.startCdata());
expectType<number>(writer.endCdata());
expectType<number>(writer.startComment());
expectType<number>(writer.endComment());
expectType<number>(writer.endElement());
expectType<number>(writer.endDocument());
expectType<string>(writer.toString());
expectType<string>(writer.outputMemory());
expectType<string>(writer.outputMemory(false));
expectType<void>(writer.clear());
expectError(writer.startElementNS(undefined));

// ---------------------------------------------------------------------------
// Module constants and utilities
// ---------------------------------------------------------------------------

expectType<string>(libxml.version);
expectType<string>(libxml.libxml_version);
expectType<string>(libxml.libxml_parser_version);
expectType<boolean>(libxml.libxml_debug_enabled);
expectType<Record<string, boolean>>(libxml.features);
expectType<boolean>(libxml.features.HTTP);
expectType<number>(libxml.memoryUsage());
expectType<number>(libxml.nodeCount());

// ---------------------------------------------------------------------------
// The ESM entry point (dist/index.d.mts) exports the same types.
// ---------------------------------------------------------------------------

async function esmEntryPoint() {
  const esm = await import('./dist/index.mjs');
  expectType<libxml.ParsedDocument>(esm.parseXml(xml));
  expectType<libxml.ParsedDocument>(esm.parseHtml('<p/>'));
  expectType<libxml.ParsedDocument>(esm.parseHtmlFragment('<p/>'));
  expectType<libxml.ParsedDocument>(esm.default.parseXml(xml));
  expectType<libxml.Document>(new esm.Document());
  expectType<libxml.Element>(new esm.Element(new esm.Document(), 'a'));
  expectType<libxml.Text>(new esm.Text(new esm.Document(), 'a'));
  expectType<libxml.Comment>(new esm.Comment(new esm.Document()));
  expectType<libxml.ProcessingInstruction>(
    new esm.ProcessingInstruction(new esm.Document(), 'pi')
  );
  expectType<libxml.SaxParser>(new esm.SaxParser());
  expectType<libxml.SaxPushParser>(esm.SaxPushParser());
  expectType<libxml.SaxTransform>(new esm.SaxTransform());
  expectType<libxml.TextWriter>(new esm.TextWriter());
  expectType<string>(esm.version);
  expectType<number>(esm.memoryUsage());
  expectType<Record<string, boolean>>(esm.features);

  // Types are exported under the same names.
  const d: esmTypes.Document = esm.parseXml(xml);
  expectType<libxml.Document>(d);
  expectType<libxml.Element | null>(d.root());
  const e: esmTypes.Element = new esm.Element(d, 'a');
  expectType<libxml.Element>(e);
  expectType<libxml.Text | undefined>(undefined as esmTypes.Text | undefined);
  expectType<libxml.SyntaxError[]>([] as esmTypes.SyntaxError[]);
  expectType<libxml.ParserOptions>({} as esmTypes.ParserOptions);
  expectType<libxml.SaxCallbacks>({} as esmTypes.SaxCallbacks);
  expectType<libxml.XPathNode>(e as esmTypes.XPathNode);
}
void esmEntryPoint;
