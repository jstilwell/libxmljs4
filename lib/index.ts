import bindings from './bindings';
import Document, { fromXml, fromHtml, fromHtmlFragment } from './document';
import { Element } from './element';
import { SaxParser, SaxPushParser } from './sax_parser';
import type * as T from './types';

// Re-export types
export type {
  Attribute,
  ChildNode,
  Dtd,
  Namespace,
  Node,
  NodeType,
  ParsedDocument,
  ParserOptions,
  SaxCallbacks,
  SaxParserEvents,
  StringLike,
  StringMap,
  SyntaxError,
  ToStringOptions,
  ValidationError,
  ValidationOptions,
  XPathNode,
  XPathScalar,
} from './types';

// Parse functions
/**
 * Parse an XML document. Throws a `SyntaxError` if the input is not
 * well-formed (unless `recover` is set) or has no root element. Recoverable
 * errors and warnings are collected in the returned document's `errors`.
 */
export const parseXml = fromXml;
/**
 * Parse an HTML document. Parse errors and warnings are collected in the
 * returned document's `errors`.
 */
export const parseHtml = fromHtml;
export { fromHtmlFragment as parseHtmlFragment };

// Constants
export const version: string = require('../package.json').version;
export const libxml_version: string = bindings.libxml_version;
export const libxml_parser_version: string = bindings.libxml_parser_version;
export const libxml_debug_enabled: boolean = bindings.libxml_debug_enabled;
export const features: Record<string, boolean> = bindings.features;

// Classes. Each name is both a value (the constructor) and a type (an
// instance), like a class.
export const Comment = bindings.Comment;
export type Comment = T.Comment;
export { Document };
export type Document = T.Document;
export { Element };
export const ProcessingInstruction = bindings.ProcessingInstruction;
export type ProcessingInstruction = T.ProcessingInstruction;
export const Text = bindings.Text;
export type Text = T.Text;

// Static helpers on Document
(Document as any).fromXml = fromXml;
(Document as any).fromHtml = fromHtml;
(Document as any).fromHtmlFragment = fromHtmlFragment;

// SAX parsers
export { SaxParser, SaxPushParser };
export { SaxTransform } from './sax_transform';
export type { SaxTransformEvents, SaxTransformOptions } from './sax_transform';

// Utilities
export const memoryUsage = bindings.xmlMemUsed;
export const nodeCount = bindings.xmlNodeCount;

// TextWriter
export const TextWriter = bindings.TextWriter;
export type TextWriter = T.TextWriter;
