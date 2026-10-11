import { Transform, TransformCallback, TransformOptions } from 'node:stream';
import type { Readable } from 'node:stream';
import { StringDecoder } from 'node:string_decoder';
import { SaxPushParser } from './sax_parser';
import type { SaxCallbacks, SaxParserEvents } from './types';

export interface SaxTransformOptions extends TransformOptions {
  /** Listeners to register on the underlying `SaxPushParser`. */
  callbacks?: SaxCallbacks;
}

/**
 * Events a `SaxTransform` emits, and the arguments their listeners receive:
 * the SAX events, with the parser's `error` renamed `saxError`, plus the
 * stream events.
 */
export interface SaxTransformEvents extends Omit<SaxParserEvents, 'error'> {
  saxError: SaxParserEvents['error'];
  close: [];
  data: [chunk: any];
  drain: [];
  end: [];
  error: [err: Error];
  finish: [];
  pause: [];
  pipe: [src: Readable];
  readable: [];
  resume: [];
  unpipe: [src: Readable];
}

/**
 * A Transform stream that wraps SaxPushParser.
 * Write XML chunks to it; SAX events are emitted on the stream.
 *
 * Events: startDocument, endDocument, startElementNS, endElementNS,
 *         characters, cdata, comment, warning, saxError
 */
export class SaxTransform extends Transform {
  private _parser: any;
  // A Buffer chunk can end partway through a multi-byte UTF-8 sequence.
  // The decoder holds those bytes until the rest of the sequence arrives
  // in a later chunk, instead of turning each half into U+FFFD.
  #decoder = new StringDecoder('utf-8');

  constructor(opts?: SaxTransformOptions) {
    super({ ...opts, readableObjectMode: true });
    this._parser = SaxPushParser(opts?.callbacks);

    // Forward SAX events from the push parser to this stream.
    // The SAX 'error' event is re-emitted as 'saxError' to avoid
    // conflicting with Node.js stream's 'error' event semantics.
    const events = [
      'startDocument',
      'endDocument',
      'startElementNS',
      'endElementNS',
      'characters',
      'cdata',
      'comment',
      'warning',
    ];
    for (const event of events) {
      this._parser.on(event, (...args: any[]) => {
        this.emit(event, ...args);
      });
    }
    this._parser.on('error', (...args: any[]) => {
      this.emit('saxError', ...args);
    });
  }

  _transform(
    chunk: Buffer | string,
    _encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    try {
      let str: string;
      if (typeof chunk === 'string') {
        // Only reachable with decodeStrings: false. Emit any bytes still
        // held from an earlier Buffer chunk first, to keep input order.
        str = this.#decoder.end() + chunk;
      } else if (Buffer.isBuffer(chunk)) {
        str = this.#decoder.write(chunk);
      } else {
        // Only reachable in writable object mode; unchanged behavior.
        str = (chunk as any).toString('utf-8');
      }
      this._parser.push(str, false);
      callback();
    } catch (err) {
      callback(err instanceof Error ? err : new Error(String(err)));
    }
  }

  _flush(callback: TransformCallback): void {
    try {
      // Push any bytes the decoder still holds. They can only be an
      // incomplete sequence at end of input, which end() returns as U+FFFD.
      // Parse errors arrive as 'saxError' events, so anything thrown here
      // comes from a listener (e.g. one handling endDocument) and fails the
      // stream, the same as during _transform.
      this._parser.push(this.#decoder.end(), true);
    } catch (err) {
      callback(err instanceof Error ? err : new Error(String(err)));
      return;
    }
    callback();
  }
}

// Type-only: declaration merging gives the inherited EventEmitter methods
// listener types for the events above. No runtime code is added.
export interface SaxTransform {
  on<E extends keyof SaxTransformEvents>(
    event: E,
    listener: (...args: SaxTransformEvents[E]) => void
  ): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this;
  once<E extends keyof SaxTransformEvents>(
    event: E,
    listener: (...args: SaxTransformEvents[E]) => void
  ): this;
  once(event: string | symbol, listener: (...args: any[]) => void): this;
  addListener<E extends keyof SaxTransformEvents>(
    event: E,
    listener: (...args: SaxTransformEvents[E]) => void
  ): this;
  addListener(event: string | symbol, listener: (...args: any[]) => void): this;
  prependListener<E extends keyof SaxTransformEvents>(
    event: E,
    listener: (...args: SaxTransformEvents[E]) => void
  ): this;
  prependListener(
    event: string | symbol,
    listener: (...args: any[]) => void
  ): this;
  prependOnceListener<E extends keyof SaxTransformEvents>(
    event: E,
    listener: (...args: SaxTransformEvents[E]) => void
  ): this;
  prependOnceListener(
    event: string | symbol,
    listener: (...args: any[]) => void
  ): this;
}
