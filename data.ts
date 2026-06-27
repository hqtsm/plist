/**
 * @module
 *
 * Property list data.
 */

import type { PLType } from './type.ts';

const buffers = new WeakMap<PLData, ArrayBuffer>();
const offsets = new WeakMap<PLData, number | undefined>();
const lengths = new WeakMap<PLData, number | undefined>();

/**
 * PLData type.
 */
export const PLTYPE_DATA = 'PLData' as const;

/**
 * Property list data type.
 */
export class PLData {
	declare public readonly [Symbol.toStringTag]: typeof PLTYPE_DATA;

	/**
	 * Variable type.
	 */
	declare public readonly type: typeof PLTYPE_DATA;

	/**
	 * Create property list data reference.
	 *
	 * @param byteLength Byte length.
	 */
	constructor(byteLength?: number);

	/**
	 * Create property list data reference.
	 *
	 * @param buffer Buffer.
	 * @param byteOffset Byte offset.
	 * @param byteLength Byte length.
	 */
	constructor(
		buffer: ArrayBuffer,
		byteOffset?: number,
		byteLength?: number,
	);

	/**
	 * Create property list data reference.
	 *
	 * @param buffer Buffer or byte length.
	 * @param byteOffset Byte offset.
	 * @param byteLength Byte length.
	 */
	constructor(
		buffer?: number | ArrayBuffer,
		byteOffset?: number,
		byteLength?: number,
	) {
		buffer ||= 0;
		if (typeof buffer === 'number') {
			buffer = new ArrayBuffer(buffer);
		}
		buffers.set(this, buffer);
		offsets.set(this, byteOffset);
		lengths.set(this, byteLength);
	}

	/**
	 * Get buffer.
	 *
	 * @returns Data buffer.
	 */
	public get buffer(): ArrayBuffer {
		return buffers.get(this)!;
	}

	/**
	 * Get byte length.
	 *
	 * @returns Byte length.
	 */
	public get byteLength(): number {
		const limit = Math.max(
			buffers.get(this)!.byteLength - Math.max(offsets.get(this) || 0, 0),
			0,
		);
		return Math.min(lengths.get(this) ?? limit, limit);
	}

	/**
	 * Get byte offset.
	 *
	 * @returns Byte offset, always 0.
	 */
	public get byteOffset(): number {
		const offset = Math.max(offsets.get(this) || 0, 0);
		return offset > buffers.get(this)!.byteLength ? 0 : offset;
	}

	/**
	 * Value getter.
	 *
	 * @returns Buffer value.
	 */
	public valueOf(): ArrayBuffer {
		return buffers.get(this)!;
	}

	/**
	 * String getter.
	 *
	 * @returns ASCII string.
	 */
	public toString(): string {
		let r = '';
		for (
			let a = new Uint8Array(buffers.get(this)!), i = 0, l = a.length;
			l--;
		) {
			r += String.fromCharCode(a[i++]);
		}
		return r;
	}

	/**
	 * Check if data type.
	 *
	 * @param arg Variable.
	 * @returns Is data type.
	 */
	public static is(arg: unknown): arg is PLData {
		return (arg as PLType | null)?.[Symbol.toStringTag] === PLTYPE_DATA;
	}

	static {
		const value = {
			value: PLTYPE_DATA,
			configurable: false,
			enumerable: false,
			writable: false,
		} as const;
		Object.defineProperty(this.prototype, Symbol.toStringTag, value);
		Object.defineProperty(this.prototype, 'type', value);
	}
}
