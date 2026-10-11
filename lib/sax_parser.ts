import * as events from 'node:events';
import bindings from './bindings';

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

export function SaxParser(callbacks?: Record<string, (...args: any[]) => void>) {
  const parser = new bindings.SaxParser();

  if (callbacks) {
    for (const callback in callbacks) {
      parser.on(callback, callbacks[callback]);
    }
  }

  return parser;
}

mixinEventEmitter(bindings.SaxParser.prototype);

export function SaxPushParser(
  callbacks?: Record<string, (...args: any[]) => void>
) {
  const parser = new bindings.SaxPushParser();

  if (callbacks) {
    for (const callback in callbacks) {
      parser.on(callback, callbacks[callback]);
    }
  }

  return parser;
}

mixinEventEmitter(bindings.SaxPushParser.prototype);
