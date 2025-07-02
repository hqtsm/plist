/**
 * @module
 *
 * Property list real.
 */

import type { PLType } from './type.ts';

let values: WeakMap<PLReal, number>;
let bitses: WeakMap<PLReal, 32 | 64>;

const type = 'PLReal';

/**
 * Property list real type.
 */
export class PLReal {
	declare public readonly [Symbol.toStringTag]: string;

	/**
	 * Create property list real reference.
	 *
	 * @param value Real value.
	 * @param bits Real bits.
	 */
	constructor(value = 0, bits: 32 | 64 = 64) {
		this.value = value;
		this.bits = bits;
	}

	/**
	 * Get real value.
	 *
	 * @returns Real value.
	 */
	public get value(): number {
		return values.get(this)!;
	}

	/**
	 * Set real value.
	 *
	 * @param value Real value.
	 */
	public set value(value: number) {
		(values ??= new WeakMap()).set(
			this,
			bitses?.get(this) === 32 ? Math.fround(value) : value,
		);
	}

	/**
	 * Get real bits.
	 *
	 * @returns Real bits.
	 */
	public get bits(): number {
		return bitses.get(this)!;
	}

	/**
	 * Set real bits.
	 *
	 * @param bits Real bits.
	 */
	public set bits(bits: 32 | 64) {
		bitses ??= new WeakMap();
		if (bits === 32 && bitses.get(this) !== bits) {
			bitses.set(this, bits);
			values.set(this, Math.fround(values.get(this)!));
		} else {
			bitses.set(this, bits);
		}
	}

	/**
	 * Check if real type.
	 *
	 * @param arg Variable.
	 * @returns Is real type.
	 */
	public static is(arg: unknown): arg is PLReal {
		return arg ? (arg as PLType)[Symbol.toStringTag] === type : false;
	}

	static {
		Object.defineProperty(this.prototype, Symbol.toStringTag, {
			value: type,
			configurable: true,
		});
	}
}
