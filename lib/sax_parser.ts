import * as events from 'node:events';
import bindings from './bindings';
import type {
  SaxCallbacks,
  SaxParser as SaxParserInstance,
  SaxParserConstructor,
  SaxPushParser as SaxPushParserInstance,
  SaxPushParserConstructor,
} from './types';

// Give a native prototype the EventEmitter methods. They are copied on as
// own properties, as they always have been, and EventEmitter.prototype is
// also put on the prototype chain so instances are `instanceof
// EventEmitter`. The copies shadow the inherited methods, so calls resolve
// exactly as before.
function mixinEventEmitter(proto: any): void {
  for (const k in events.EventEmitter.prototype) {
    proto[k] = (events.EventEmitter.prototype as any)[k];
  }
  Object.setPrototypeOf(proto, events.EventEmitter.prototype);
}

function SaxParser(callbacks?: SaxCallbacks) {
  const parser = new bindings.SaxParser();

  if (callbacks) {
    for (const callback in callbacks) {
      parser.on(callback, (callbacks as any)[callback]);
    }
  }

  return parser;
}

mixinEventEmitter(bindings.SaxParser.prototype);

function SaxPushParser(callbacks?: SaxCallbacks) {
  const parser = new bindings.SaxPushParser();

  if (callbacks) {
    for (const callback in callbacks) {
      parser.on(callback, (callbacks as any)[callback]);
    }
  }

  return parser;
}

mixinEventEmitter(bindings.SaxPushParser.prototype);

// Both functions return the native parser, so they work with or without
// `new`. Export them with that public type.
const TypedSaxParser = SaxParser as unknown as SaxParserConstructor;
const TypedSaxPushParser = SaxPushParser as unknown as SaxPushParserConstructor;
export { TypedSaxParser as SaxParser, TypedSaxPushParser as SaxPushParser };
export type SaxParser = SaxParserInstance;
export type SaxPushParser = SaxPushParserInstance;
