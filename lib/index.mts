import { createRequire } from 'node:module';
import type * as cjs from './index.js';

const require = createRequire(import.meta.url);
const lib: typeof cjs = require('./index.js');

export const parseXml = lib.parseXml;
export const parseHtml = lib.parseHtml;
export const parseHtmlFragment = lib.parseHtmlFragment;

export const version = lib.version;
export const libxml_version = lib.libxml_version;
export const libxml_parser_version = lib.libxml_parser_version;
export const libxml_debug_enabled = lib.libxml_debug_enabled;
export const features = lib.features;

// Classes are both values and types, as in the CommonJS entry point.
export const Document = lib.Document;
export type Document = cjs.Document;
export const Element = lib.Element;
export type Element = cjs.Element;
export const Comment = lib.Comment;
export type Comment = cjs.Comment;
export const Text = lib.Text;
export type Text = cjs.Text;
export const ProcessingInstruction = lib.ProcessingInstruction;
export type ProcessingInstruction = cjs.ProcessingInstruction;

export const SaxParser = lib.SaxParser;
export type SaxParser = cjs.SaxParser;
export const SaxPushParser = lib.SaxPushParser;
export type SaxPushParser = cjs.SaxPushParser;
export const SaxTransform = lib.SaxTransform;
export type SaxTransform = cjs.SaxTransform;

export const memoryUsage = lib.memoryUsage;
export const nodeCount = lib.nodeCount;

export const TextWriter = lib.TextWriter;
export type TextWriter = cjs.TextWriter;

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
  SaxTransformEvents,
  SaxTransformOptions,
  StringLike,
  StringMap,
  SyntaxError,
  ToStringOptions,
  ValidationError,
  ValidationOptions,
  XPathNode,
  XPathScalar,
} from './index.js';

export default lib;
