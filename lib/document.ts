import bindings from './bindings';
import { Element } from './element';
import type {
  DocumentConstructor,
  ParsedDocument,
  ParserOptions,
} from './types';

function assertRoot(doc: any): void {
  if (!doc.root()) {
    throw new Error('Document has no root element');
  }
}

const Document = bindings.Document;
Document.prototype = bindings.Document.prototype;

Document.prototype.node = function node(
  this: any,
  name: string,
  content?: string
) {
  return this.root(Element(this, name, content));
};

Document.prototype.find = function find(
  this: any,
  xpath: string,
  ns_uri?: string | Record<string, string>
) {
  assertRoot(this);
  return this.root().find(xpath, ns_uri);
};

Document.prototype.get = function get(
  this: any,
  xpath: string,
  ns_uri?: string | Record<string, string>
) {
  assertRoot(this);
  return this.root().get(xpath, ns_uri);
};

Document.prototype.child = function child(this: any, id: number) {
  if (id === undefined || typeof id !== 'number') {
    throw new Error('id argument required for #child');
  }
  assertRoot(this);
  return this.root().child(id);
};

Document.prototype.childNodes = function childNodes(this: any) {
  assertRoot(this);
  return this.root().childNodes();
};

Document.prototype.setDtd = function setDtd(
  this: any,
  name: string,
  ext?: string,
  sys?: string
) {
  if (!name) {
    throw new Error('Must pass in a DTD name');
  } else if (typeof name !== 'string') {
    throw new Error('Must pass in a valid DTD name');
  }

  const params: string[] = [name];

  if (typeof ext !== 'undefined') {
    params.push(ext);
  }
  if (ext && typeof sys !== 'undefined') {
    params.push(sys);
  }

  return this._setDtd(...params);
};

Document.prototype.namespaces = function namespaces(this: any) {
  assertRoot(this);
  return this.root().namespaces();
};

export default Document as unknown as DocumentConstructor;

// Validate the HTML parsers' options argument. `null` is treated like an
// omitted argument; passed through, it would reach the native layer, which
// cannot read properties from it and aborts the process.
function htmlOptions(fn: string, opts: ParserOptions | null): ParserOptions {
  if (opts === undefined || opts === null) {
    return {};
  }
  if (typeof opts !== 'object') {
    throw new Error(`${fn} options must be an object`);
  }
  return opts;
}

/**
 * Parse an HTML document. Parse errors and warnings are collected in the
 * returned document's `errors`.
 */
export function fromHtml(
  source: string | Buffer,
  opts: ParserOptions | null = {}
): ParsedDocument {
  return bindings.fromHtml(source, htmlOptions('fromHtml', opts));
}

/**
 * Parse an HTML fragment, without the implied `html`/`body` elements and
 * default doctype that `fromHtml` adds.
 */
export function fromHtmlFragment(
  source: string | Buffer,
  opts: ParserOptions | null = {}
): ParsedDocument {
  // Override doctype/implied without mutating the caller's object. The
  // native layer reads options with an ordinary property lookup, so an
  // object inheriting from the caller's sees every option they set,
  // including inherited and non-enumerable ones a spread copy would drop.
  const fragmentOpts = Object.create(htmlOptions('fromHtmlFragment', opts));
  fragmentOpts.doctype = false;
  fragmentOpts.implied = false;
  return bindings.fromHtml(source, fragmentOpts);
}

/**
 * Parse an XML document. Throws a `SyntaxError` if the input is not
 * well-formed (unless `recover` is set) or has no root element. Recoverable
 * errors and warnings are collected in the returned document's `errors`.
 */
export function fromXml(
  source: string | Buffer,
  options: ParserOptions | null = {}
): ParsedDocument {
  // `null` would abort the process in the native layer; treat it like an
  // omitted argument. Other values are passed through unchanged, as before.
  return bindings.fromXml(source, options ?? {});
}
