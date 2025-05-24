import type { PLType } from './type.ts';

let buffers: WeakMap<PLData, ArrayBuffer>;

const type = 'PLData';

/**
 * Property list data type.
 */
export class PLData implements PLType {
	declare public readonly [Symbol.toStringTag]: string;

	/**
	 * Create property list data reference.
	 *
	 * @param byteLength Byte length.
	 */
	constructor(byteLength = 0) {
		(buffers ??= new WeakMap()).set(this, new ArrayBuffer(byteLength));
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
		return buffers.get(this)!.byteLength;
	}

	/**
	 * Check if data type.
	 *
	 * @param arg Variable.
	 * @returns Is data type.
	 */
	public static is(arg: unknown): arg is PLData {
		return arg ? (arg as PLType)[Symbol.toStringTag] === type : false;
	}

	static {
		Object.defineProperty(this.prototype, Symbol.toStringTag, {
			value: type,
			configurable: true,
		});
	}
}
