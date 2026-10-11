import type { EventEmitter } from 'node:events';

export interface StringMap {
  [key: string]: string;
}

/**
 * A value that string-taking setters convert with `String(value)`, as
 * libxmljs2 did, so `el.attr('count', 5)` sets `count="5"`.
 */
export type StringLike = string | number | boolean;

/**
 * Options for `parseXml`, `parseHtml` and `parseHtmlFragment`.
 *
 * Boolean options map onto libxml2's `XML_PARSE_*` / `HTML_PARSE_*` flags.
 * The inverted options (`errors`, `warnings`, `blanks`, `net`, `dict`,
 * `cdata`, `xincnode`, `basefix`, `doctype`, `implied`) only take effect
 * when set to `false`.
 *
 * Read the README's "Security considerations" before enabling `noent`,
 * `dtdload`, `dtdattr`, `dtdvalid`, `xinclude` or `huge` on untrusted input.
 */
export interface ParserOptions {
  /** Recover from malformed input instead of throwing. */
  recover?: boolean;
  /** Substitute entities, including external ones (XXE risk). */
  noent?: boolean;
  /**
   * Load the external DTD subset. In `parseHtml` it has the effect of
   * `doctype: false` instead.
   */
  dtdload?: boolean;
  /**
   * HTML only: `false` stops libxml2 adding a default doctype. `parseXml`
   * ignores it. (Before 2.1.0 it shared a flag bit with `dtdload` there and
   * loaded the external DTD.)
   */
  doctype?: boolean;
  /** Apply default attributes from the DTD (loads the external DTD). */
  dtdattr?: boolean;
  /** Validate against the DTD (loads the external DTD). */
  dtdvalid?: boolean;
  /** Suppress error reports. */
  noerror?: boolean;
  /** `false` suppresses error reports. */
  errors?: boolean;
  /** Suppress warning reports. */
  nowarning?: boolean;
  /** `false` suppresses warning reports. */
  warnings?: boolean;
  /** Report pedantic errors. */
  pedantic?: boolean;
  /** Remove blank text nodes. */
  noblanks?: boolean;
  /** `false` removes blank text nodes. */
  blanks?: boolean;
  /** Use the SAX1 interface internally. */
  sax1?: boolean;
  /** Perform XInclude substitution. */
  xinclude?: boolean;
  /** Forbid network access. This build has no network support either way. */
  nonet?: boolean;
  /** `false` forbids network access. */
  net?: boolean;
  /** Do not reuse the parser context's string dictionary. */
  nodict?: boolean;
  /** `false` disables the parser context's string dictionary. */
  dict?: boolean;
  /**
   * Remove redundant namespace declarations. In `parseHtml` it has the
   * effect of `implied: false` instead.
   */
  nsclean?: boolean;
  /**
   * HTML only: `false` stops libxml2 adding implied `html`/`body` elements.
   * `parseXml` ignores it. (Before 2.1.0 it acted as `nsclean` there.)
   */
  implied?: boolean;
  /** Merge CDATA sections into text nodes. */
  nocdata?: boolean;
  /** `false` merges CDATA sections into text nodes. */
  cdata?: boolean;
  /** Do not generate XInclude start/end nodes. */
  noxincnode?: boolean;
  /** `false` stops XInclude start/end nodes being generated. */
  xincnode?: boolean;
  /**
   * Compact small text nodes. The resulting tree must not be modified
   * afterwards.
   */
  compact?: boolean;
  /** Parse using XML 1.0 rules from before the fifth edition. */
  old10?: boolean;
  /** Alias of `old10`. */
  old?: boolean;
  /** Do not fix up `xml:base` URIs of XIncluded content. */
  nobasefix?: boolean;
  /** `false` stops `xml:base` URIs of XIncluded content being fixed up. */
  basefix?: boolean;
  /** Relax libxml2's hardcoded size and depth limits. */
  huge?: boolean;
  /** Use the SAX2 interface from before libxml2 2.7.0. */
  oldsax?: boolean;
  /** Ignore the encoding declared in the document. */
  ignore_enc?: boolean;
  /** Store line numbers above 65535. */
  big_lines?: boolean;
  /** Base URL used to resolve relative references in the document. */
  baseUrl?: string;
  /**
   * Encoding of the input. `parseXml` only uses it for `Buffer` input
   * (strings are always read as UTF-8); `parseHtml` uses it for both.
   */
  encoding?: string;
  /**
   * HTML only: add neither implied elements nor a default doctype. Set by
   * `parseHtmlFragment`.
   */
  excludeImpliedElements?: boolean;
  /**
   * Maximum number of errors collected per parse or validation (default
   * 10000). Use Infinity for no limit.
   */
  maxErrors?: number;
}

/** Options for `validate()`, `rngValidate()` and `schematronValidate()`. */
export interface ValidationOptions {
  /**
   * Maximum number of errors collected per parse or validation (default
   * 10000). Use Infinity for no limit.
   */
  maxErrors?: number;
}

/**
 * An error reported by libxml2, as thrown by the parse functions and
 * collected in `Document#errors`. It is a plain `Error`, not an instance of
 * the global `SyntaxError`.
 */
export interface SyntaxError extends Error {
  /** libxml2 error domain (`xmlErrorDomain`); 1 is the XML parser. */
  domain: number;
  /** libxml2 error code (`xmlParserErrors`). */
  code: number;
  /** 1 = warning, 2 = error, 3 = fatal error. */
  level: number;
  /** 1-based line number, 0 if not available. */
  line: number;
  /** 1-based column number, 0 if not available. */
  column: number;
  /** File or URL the error occurred in, when known. */
  file?: string;
  /** Extra information, such as the element or entity name involved. */
  str1?: string;
  str2?: string;
  str3?: string;
  /** Extra numeric information; only set when non-zero. */
  int1?: number;
}

/**
 * An error collected in `Document#validationErrors`. It has the same shape as
 * a parse error.
 */
export interface ValidationError extends SyntaxError {}

export interface ToStringOptions {
  /** `false` omits the XML declaration. */
  declaration?: boolean;
  /** `false` writes empty elements as `<a></a>` instead of `<a/>`. */
  selfCloseEmpty?: boolean;
  /** Add non-significant whitespace. */
  whitespace?: boolean;
  /** Indent the output. */
  format?: boolean;
  /** Serialize as this type regardless of the document's own type. */
  type?: 'xml' | 'html' | 'xhtml' | 'XML' | 'HTML' | 'XHTML';
  /**
   * Output encoding. Only `Document#toString` uses it; nodes always
   * serialize as UTF-8.
   */
  encoding?:
    | 'HTML'
    | 'ASCII'
    | 'UTF-8'
    | 'UTF-16'
    | 'ISO-Latin-1'
    | 'ISO-8859-1'
    | (string & {});
}

/** The values `type()` can return for a node or document. */
export type NodeType =
  | 'element'
  | 'attribute'
  | 'text'
  | 'cdata'
  | 'entity_ref'
  | 'entity'
  | 'pi'
  | 'comment'
  | 'document'
  | 'document_type'
  | 'document_frag'
  | 'notation'
  | 'html_document'
  | 'dtd'
  | 'element_decl'
  | 'attribute_decl'
  | 'entity_decl'
  | 'namespace_decl'
  | 'xinclude_start'
  | 'xinclude_end'
  | 'docb_document';

/**
 * A node that can appear in an element's `childNodes()`. CDATA sections,
 * entity references, DTDs and declarations are wrapped as `Element`; use
 * `type()` to tell them apart.
 */
export type ChildNode = Element | Text | Comment | ProcessingInstruction;

/** Anything an XPath node-set can contain. */
export type XPathNode =
  | Element
  | Text
  | Comment
  | ProcessingInstruction
  | Attribute
  | Namespace
  | Document;

/** The scalar results of XPath expressions such as `count()` or `string()`. */
export type XPathScalar = string | number | boolean;

/**
 * XPath methods shared by `Document` and `Element`.
 *
 * The second argument registers namespaces for the expression: a string
 * binds it to the `xmlns` prefix, an object maps prefixes to URIs.
 *
 * The type parameter is an assertion about what the expression selects, in
 * the style of the DOM's `querySelector<E>()`. It defaults to `Element`; pass
 * e.g. `find<Text>('//a/text()')` for other node types, or
 * `get<number>('count(//a)')` for expressions that do not return a node-set.
 */
interface XPathQueries {
  /**
   * Evaluate an XPath expression.
   *
   * @returns The selected nodes, or the value of a scalar expression. `null`
   * if the expression is invalid (libxml2 reports the error on stderr).
   */
  find<T extends XPathNode = Element>(
    xpath: string,
    namespaces?: string | StringMap
  ): T[] | null;
  find<T extends XPathScalar>(
    xpath: string,
    namespaces?: string | StringMap
  ): T | null;
  /**
   * Evaluate an XPath expression and return the first selected node.
   *
   * @returns The first node, `undefined` if nothing matched, the value of a
   * scalar expression, or `null` if the expression is invalid.
   */
  get<T extends XPathNode = Element>(
    xpath: string,
    namespaces?: string | StringMap
  ): T | null | undefined;
  get<T extends XPathScalar>(
    xpath: string,
    namespaces?: string | StringMap
  ): T | null;
}

/** Members shared by every node type: elements, text, comments, etc. */
export interface Node {
  /** The document this node belongs to. */
  doc(): Document;
  /**
   * The parent element, or the document for the root element and for nodes
   * that are not attached to a parent.
   */
  parent(): Element | Document;
  /** The node's namespace; always `null` for nodes that cannot have one. */
  namespace(): Namespace | null;
  /**
   * Namespaces in scope at this node, or with `local` set to `true` only the
   * ones declared on it.
   */
  namespaces(local?: boolean): Namespace[];
  prevSibling(): Node | null;
  nextSibling(): Node | null;
  /** Line number in the parsed source. */
  line(): number;
  type(): NodeType;
  /** Detach the node from its parent. */
  remove(): this;
  /** Copy the node; `recurse` (default `true`) also copies its children. */
  clone(recurse?: boolean): this;
  /** Serialize the node. `true` indents the output. */
  toString(format?: boolean | ToStringOptions): string;
}

/**
 * An element. Other node types without a dedicated class (CDATA sections,
 * entity references, DTDs and declarations) are also wrapped as `Element`;
 * `type()` tells them apart, and modifying methods throw on DTDs and
 * declarations.
 */
export interface Element extends Node, XPathQueries {
  /**
   * The element name. A CDATA section, which is also wrapped as `Element`,
   * returns `undefined`.
   */
  name(): string;
  /** Rename the element. */
  name(name: StringLike): this;
  /** The text content of the element and its descendants. */
  text(): string;
  /** Replace the element's children with a text node. */
  text(content: StringLike): this;
  /** The attribute with this name, or `null` if there is none. */
  attr(name: string): Attribute | null;
  /** Set an attribute. */
  attr(name: string, value: StringLike): this;
  /** Set several attributes. */
  attr(attributes: Record<string, StringLike>): this;
  attrs(): Attribute[];
  /** Append a CDATA section. */
  cdata(content?: string): this;
  /** The child at `index`, or `null` if there is none. */
  child(index: number): ChildNode | null;
  childNodes(): ChildNode[];
  /** Append a child; nodes from another document are copied in. */
  addChild(child: Node): this;
  /** Create an element and append it. Returns the new element. */
  node(name: string, content?: string): Element;
  prevElement(): Element | null;
  nextElement(): Element | null;
  prevSibling(): ChildNode | null;
  nextSibling(): ChildNode | null;
  /** Insert a sibling before this node. Returns the inserted node. */
  addPrevSibling<T extends Node>(sibling: T): T;
  /** Insert a sibling after this node. Returns the inserted node. */
  addNextSibling<T extends Node>(sibling: T): T;
  /** Replace this node with a text node. Returns the string. */
  replace(replacement: string): string;
  /** Replace this node with another node. Returns the replacement. */
  replace<T extends Node>(replacement: T): T;
  /** XPath expression for this node, e.g. `/root/child[2]`. */
  path(): string;
  /**
   * Declare a namespace on this element without applying it. With one
   * argument it is a default (unprefixed) namespace.
   */
  defineNamespace(href: string): Namespace;
  defineNamespace(prefix: string, href: string): Namespace;
  namespace(): Namespace | null;
  /** Remove the element's namespace. */
  namespace(ns: null): null;
  /** Set the element's namespace. */
  namespace(ns: Namespace): this;
  /**
   * Use the in-scope namespace with this prefix or href, declaring a new
   * default namespace with this href if there is none.
   */
  namespace(prefixOrHref: string): this;
  /**
   * Use the in-scope namespace with this prefix, declaring it with `href` if
   * there is none.
   */
  namespace(prefix: string, href: string): this;
  type(): Exclude<
    NodeType,
    | 'attribute'
    | 'text'
    | 'pi'
    | 'comment'
    | 'document'
    | 'html_document'
    | 'namespace_decl'
  >;
}

export interface Attribute extends Node {
  name(): string;
  value(): string;
  value(value: StringLike): this;
  /** The element the attribute belongs to, or `null` once removed. */
  node(): Element | null;
  prevSibling(): Attribute | null;
  nextSibling(): Attribute | null;
  type(): 'attribute';
}

export interface Text extends Node {
  /** Always `'text'`. */
  name(): string;
  text(): string;
  text(content: StringLike): this;
  /** XPath expression for this node, e.g. `/root/text()`. */
  path(): string;
  prevElement(): Element | null;
  nextElement(): Element | null;
  prevSibling(): ChildNode | null;
  nextSibling(): ChildNode | null;
  /** Insert a sibling before this node. Returns the inserted node. */
  addPrevSibling<T extends Node>(sibling: T): T;
  /** Insert a sibling after this node. Returns the inserted node. */
  addNextSibling<T extends Node>(sibling: T): T;
  /** Replace this node with a text node. Returns the string. */
  replace(replacement: string): string;
  /** Replace this node with another node. Returns the replacement. */
  replace<T extends Node>(replacement: T): T;
  type(): 'text';
}

export interface Comment extends Node {
  text(): string;
  text(content: StringLike): this;
  prevSibling(): ChildNode | null;
  nextSibling(): ChildNode | null;
  type(): 'comment';
}

export interface ProcessingInstruction extends Node {
  /** The PI target. */
  name(): string;
  name(name: StringLike): this;
  text(): string;
  text(content: StringLike): this;
  prevSibling(): ChildNode | null;
  nextSibling(): ChildNode | null;
  type(): 'pi';
}

export interface Namespace {
  href(): string;
  /** `null` for a default (unprefixed) namespace. */
  prefix(): string | null;
}

/** The internal DTD subset, as returned by `Document#getDtd()`. */
export interface Dtd {
  name: string | null;
  externalId: string | null;
  systemId: string | null;
}

export interface Document extends XPathQueries {
  /**
   * Errors and warnings collected while parsing. Set on documents returned
   * by the parse functions (see `ParsedDocument`), `undefined` on documents
   * created with `new Document()`.
   */
  errors?: SyntaxError[];
  /**
   * Errors from the most recent `validate()`, `rngValidate()` or
   * `schematronValidate()` call that did not throw; `undefined` before one.
   */
  validationErrors?: ValidationError[];
  /** The root element, or `null` if the document has none. */
  root(): Element | null;
  /**
   * Set the root node. Throws if the document already has a root element.
   * Returns the node.
   */
  root<T extends ChildNode>(node: T): T;
  /** Create the root element. Throws if the document already has one. */
  node(name: string, content?: string): Element;
  /** The root element's child at `index`. Throws if there is no root. */
  child(index: number): ChildNode | null;
  /** The root element's children. Throws if there is no root. */
  childNodes(): ChildNode[];
  /** Namespaces in scope at the root element. Throws if there is no root. */
  namespaces(): Namespace[];
  /**
   * The document's encoding. `null` for HTML documents and for XML parsed
   * from a `Buffer` without an encoding declaration.
   */
  encoding(): string | null;
  encoding(encoding: string): this;
  /** The XML version; `null` for HTML documents. */
  version(): string | null;
  type(): 'document';
  /**
   * Serialize the document. Indented unless `format` is `false` (or an
   * options object without `format: true`).
   */
  toString(format?: boolean | ToStringOptions): string;
  /** Validate against an XSD schema; errors go to `validationErrors`. */
  validate(schema: Document, options?: ValidationOptions): boolean;
  /** Validate against a RELAX NG schema; errors go to `validationErrors`. */
  rngValidate(schema: Document, options?: ValidationOptions): boolean;
  /** Validate against a Schematron schema; errors go to `validationErrors`. */
  schematronValidate(schema: Document, options?: ValidationOptions): boolean;
  /** The internal DTD subset, or `null` if there is none. */
  getDtd(): Dtd | null;
  /** Replace the internal DTD subset. */
  setDtd(name: string, externalId?: string, systemId?: string): this;
}

/** A document returned by a parse function, with its parse errors. */
export interface ParsedDocument extends Document {
  errors: SyntaxError[];
}

export interface DocumentConstructor {
  /**
   * Create an empty document.
   * @param version XML version, default `'1.0'`.
   * @param encoding Encoding, default `'utf8'`.
   */
  new (version?: string, encoding?: string): Document;
  readonly prototype: Document;
  fromXml(
    source: string | Buffer,
    options?: ParserOptions | null
  ): ParsedDocument;
  fromHtml(
    source: string | Buffer,
    options?: ParserOptions | null
  ): ParsedDocument;
  fromHtmlFragment(
    source: string | Buffer,
    options?: ParserOptions | null
  ): ParsedDocument;
}

export interface ElementConstructor {
  /** Create an element that is not yet attached to the document. */
  new (doc: Document, name: string, content?: string): Element;
  (doc: Document, name: string, content?: string): Element;
  readonly prototype: Element;
}

export interface TextConstructor {
  new (doc: Document, content: string): Text;
  readonly prototype: Text;
}

export interface CommentConstructor {
  new (doc: Document, content?: string): Comment;
  readonly prototype: Comment;
}

export interface ProcessingInstructionConstructor {
  new (doc: Document, name: string, content?: string): ProcessingInstruction;
  readonly prototype: ProcessingInstruction;
}

/** SAX events and the arguments their listeners receive. */
export interface SaxParserEvents {
  startDocument: [];
  endDocument: [];
  /**
   * Attribute entries are `[localName, prefix, uri, value]`, with `''` for a
   * missing prefix or URI. Namespace entries are `[prefix, uri]`, with a
   * `null` prefix for a default namespace.
   */
  startElementNS: [
    elem: string,
    attrs: [localName: string, prefix: string, uri: string, value: string][],
    prefix: string | null,
    uri: string | null,
    namespaces: [prefix: string | null, uri: string][],
  ];
  endElementNS: [elem: string, prefix: string | null, uri: string | null];
  characters: [chars: string];
  cdata: [cdata: string];
  comment: [comment: string];
  warning: [message: string];
  /**
   * A malformed document. As with any EventEmitter, an `error` event with no
   * listener throws.
   */
  error: [message: string];
}

/** Listeners to register, keyed by SAX event name. */
export type SaxCallbacks = {
  [E in keyof SaxParserEvents]?: (...args: SaxParserEvents[E]) => void;
};

/** An EventEmitter whose listener methods are typed for the SAX events. */
interface SaxEventEmitter extends EventEmitter {
  on<E extends keyof SaxParserEvents>(
    event: E,
    listener: (...args: SaxParserEvents[E]) => void
  ): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this;
  once<E extends keyof SaxParserEvents>(
    event: E,
    listener: (...args: SaxParserEvents[E]) => void
  ): this;
  once(event: string | symbol, listener: (...args: any[]) => void): this;
  addListener<E extends keyof SaxParserEvents>(
    event: E,
    listener: (...args: SaxParserEvents[E]) => void
  ): this;
  addListener(event: string | symbol, listener: (...args: any[]) => void): this;
  prependListener<E extends keyof SaxParserEvents>(
    event: E,
    listener: (...args: SaxParserEvents[E]) => void
  ): this;
  prependListener(
    event: string | symbol,
    listener: (...args: any[]) => void
  ): this;
  prependOnceListener<E extends keyof SaxParserEvents>(
    event: E,
    listener: (...args: SaxParserEvents[E]) => void
  ): this;
  prependOnceListener(
    event: string | symbol,
    listener: (...args: any[]) => void
  ): this;
}

/** Parses a complete document in one call, emitting SAX events. */
export interface SaxParser extends SaxEventEmitter {
  /**
   * Parse a document. Throws if called from one of this parser's own event
   * handlers. Always returns `true`; errors are emitted as `error` events.
   */
  parseString(source: string): boolean;
}

/** Parses a document pushed in chunks, emitting SAX events. */
export interface SaxPushParser extends SaxEventEmitter {
  /**
   * Parse the next chunk. Set `terminate` on the last chunk. Throws if
   * called from one of this parser's own event handlers. Always returns
   * `true`; errors are emitted as `error` events.
   */
  push(chunk: string, terminate?: boolean): boolean;
}

export interface SaxParserConstructor {
  new (callbacks?: SaxCallbacks): SaxParser;
  (callbacks?: SaxCallbacks): SaxParser;
}

export interface SaxPushParserConstructor {
  new (callbacks?: SaxCallbacks): SaxPushParser;
  (callbacks?: SaxCallbacks): SaxPushParser;
}

/**
 * Writes XML to an in-memory buffer. The write methods return libxml2's
 * count of bytes written, which is often 0 while output is buffered, and
 * throw if libxml2 reports a failure.
 */
export interface TextWriter {
  startDocument(
    version?: string | null,
    encoding?: string | null,
    standalone?: boolean | string | null
  ): number;
  endDocument(): number;
  startElementNS(
    prefix: string | null | undefined,
    name: string,
    namespaceURI?: string | null
  ): number;
  endElement(): number;
  startAttributeNS(
    prefix: string | null | undefined,
    name: string,
    namespaceURI?: string | null
  ): number;
  endAttribute(): number;
  startCdata(): number;
  endCdata(): number;
  startComment(): number;
  endComment(): number;
  writeString(content: StringLike): number;
  /**
   * Flush and return the output. Called with no argument or a truthy
   * `clear`, the buffer is emptied afterwards.
   */
  outputMemory(clear?: boolean): string;
  /** Flush and return the output without emptying the buffer. */
  toString(): string;
  /** Empty the output buffer. */
  clear(): void;
}

export interface TextWriterConstructor {
  new (): TextWriter;
  readonly prototype: TextWriter;
}

// Type declarations for the native C++ bindings. The prototypes of Document,
// Element and the SAX parsers are augmented in lib/, so they stay loosely
// typed here; the public types above describe the finished classes.
export interface NativeBindings {
  Document: NativeDocumentConstructor;
  Element: NativeElementConstructor;
  Comment: CommentConstructor;
  Text: TextConstructor;
  ProcessingInstruction: ProcessingInstructionConstructor;
  Namespace: NativeNamespaceConstructor;
  SaxParser: NativeSaxParserConstructor;
  SaxPushParser: NativeSaxPushParserConstructor;
  TextWriter: TextWriterConstructor;

  fromXml(source: string | Buffer, options: ParserOptions): any;
  fromHtml(source: string | Buffer, options: ParserOptions): any;

  libxml_version: string;
  libxml_parser_version: string;
  libxml_debug_enabled: boolean;
  features: Record<string, boolean>;

  xmlMemUsed(): number;
  xmlNodeCount(): number;
}

export interface NativeDocumentConstructor {
  new (version?: string, encoding?: string): any;
  prototype: any;
}

export interface NativeElementConstructor {
  new (doc: any, name: string, content?: string): any;
  prototype: any;
}

export interface NativeNamespaceConstructor {
  new (node: any, prefix: string | null, href: string): any;
}

export interface NativeSaxParserConstructor extends EventEmitter {
  new (): any;
  prototype: any;
}

export interface NativeSaxPushParserConstructor extends EventEmitter {
  new (): any;
  prototype: any;
}
