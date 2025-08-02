/**
 * @module
 *
 * Property list real.
 */

import type { PLType } from './type.ts';

const values: WeakMap<PLReal, number> = new WeakMap();
const bitses: WeakMap<PLReal, 32 | 64> = new WeakMap();

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
	 * Create property list real reference.
	 *
	 * @param value Real value.
	 * @param bits Real bits.
	 */
	constructor(value = 0, bits: 32 | 64 = 64) {
		value = +value;
		switch (+bits) {
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
	public get bits(): 32 | 64 {
		return bitses.get(this)!;
	}

	/**
	 * Set real bits.
	 *
	 * @param bits Real bits.
	 */
	public set bits(bits: 32 | 64) {
		switch (+bits) {
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
	 * Check if real type.
	 *
	 * @param arg Variable.
	 * @returns Is real type.
	 */
	public static is(arg: unknown): arg is PLReal {
		return (arg as PLType | null)?.[Symbol.toStringTag] === PLTYPE_REAL;
	}

	static {
		Object.defineProperty(this.prototype, Symbol.toStringTag, {
			value: PLTYPE_REAL,
		});
	}
}
