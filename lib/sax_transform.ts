import { Transform, TransformCallback, TransformOptions } from 'node:stream';
import { StringDecoder } from 'node:string_decoder';
import { SaxPushParser } from './sax_parser';

export interface SaxTransformOptions extends TransformOptions {
  callbacks?: Record<string, (...args: any[]) => void>;
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
      this._parser.push(this.#decoder.end(), true);
    } catch {
      // Ignore errors from signaling end-of-document — the document
      // may already be complete from a prior chunk.
    }
    callback();
  }
}
