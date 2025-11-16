/**
 * @module
 *
 * Property list real.
 */

import type { PLType } from './type.ts';

/**
 * Property list real bits.
 */
export type PLRealBits = 32 | 64;

let values: WeakMap<PLReal, number>;
let bitses: WeakMap<PLReal, PLRealBits>;

/**
 * PLReal type.
 */
export const PLTYPE_REAL = 'PLReal' as const;

/**
 * Property list real type.
 */
export class PLReal {
	declare public readonly [Symbol.toStringTag]: typeof PLTYPE_REAL;

	/**
	 * Variable type.
	 */
	declare public readonly type: typeof PLTYPE_REAL;

	/**
	 * Create property list real reference.
	 *
	 * @param value Real value.
	 * @param bits Real bits.
	 */
	constructor(value = 0, bits: PLRealBits = 64) {
		values ??= new WeakMap();
		bitses ??= new WeakMap();
		value = +value;
		switch ((+bits || 0) - (bits % 1 || 0)) {
			case 32: {
				values.set(this, Math.fround(value));
				bitses.set(this, 32);
				break;
			}
			case 64: {
				values.set(this, value);
				bitses.set(this, 64);
				break;
			}
			default: {
				throw new RangeError('Invalid bits');
			}
		}
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
		value = +value;
		values.set(this, bitses.get(this) === 32 ? Math.fround(value) : value);
	}

	/**
	 * Get real bits.
	 *
	 * @returns Real bits.
	 */
	public get bits(): PLRealBits {
		return bitses.get(this)!;
	}

	/**
	 * Set real bits.
	 *
	 * @param bits Real bits.
	 */
	public set bits(bits: PLRealBits) {
		switch ((+bits || 0) - (bits % 1 || 0)) {
			case 32: {
				values.set(this, Math.fround(values.get(this)!));
				bitses.set(this, 32);
				break;
			}
			case 64: {
				bitses.set(this, 64);
				break;
			}
			default: {
				throw new RangeError('Invalid bits');
			}
		}
	}

	/**
	 * Value getter.
	 *
	 * @returns Real value.
	 */
	public valueOf(): number {
		return values.get(this)!;
	}

	/**
	 * String getter.
	 *
	 * @returns Real string.
	 */
	public toString(): string {
		return `${values.get(this)!}`;
	}

	/**
	 * Check if real type.
	 *
	 * @param arg Variable.
	 * @returns Is real type.
	 */
	public static is(arg: unknown): arg is PLReal {
		return (arg as PLType | null)?.[Symbol.toStringTag] === PLTYPE_REAL;
	}

	static {
		const value = {
			value: PLTYPE_REAL,
			configurable: false,
			enumerable: false,
			writable: false,
		} as const;
		Object.defineProperty(this.prototype, Symbol.toStringTag, value);
		Object.defineProperty(this.prototype, 'type', value);
	}
}
