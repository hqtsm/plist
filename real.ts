/**
 * @module
 *
 * Property list real.
 */

import type { PLType } from './type.ts';

let values: WeakMap<PLReal, number>;
let bitses: WeakMap<PLReal, 32 | 64>;

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
			bitses?.get(this) === 32 ? Math.fround(value) : Number(value),
		);
	}

	/**
	 * Get real bits.
	 *
	 * @returns Real bits.
	 */
	public get bits(): number {
		return bitses?.get(this) ?? 64;
	}

	/**
	 * Set real bits.
	 *
	 * @param bits Real bits.
	 */
	public set bits(bits: 32 | 64) {
		switch (+bits) {
			case 32: {
				if (bitses?.get(this) !== 32) {
					(bitses ??= new WeakMap()).set(this, 32);
					values.set(this, Math.fround(values.get(this)!));
				}
				break;
			}
			case 64: {
				bitses?.delete(this);
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
