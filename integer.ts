/**
 * @module
 *
 * Property list integer.
 */

import type { PLType } from './type.ts';

/**
 * Property list integer bits.
 */
export type PLIntegerBits = 8 | 16 | 32 | 64 | 128;

const values: WeakMap<PLInteger, bigint> = new WeakMap();
const bitses: WeakMap<PLInteger, PLIntegerBits> = new WeakMap();

/**
 * PLInteger type.
 */
export const PLTYPE_INTEGER = 'PLInteger' as const;

/**
 * Property list integer type.
 */
export class PLInteger {
	declare public readonly [Symbol.toStringTag]: typeof PLTYPE_INTEGER;

	/**
	 * Create property list integer reference.
	 *
	 * @param value Integer value.
	 * @param bits Integer bits.
	 */
	constructor(value = 0n, bits: PLIntegerBits = 64) {
		value = BigInt(value);
		switch ((+bits || 0) - (bits % 1 || 0)) {
			case 8: {
				values.set(this, BigInt.asIntN(8, value));
				bitses.set(this, 8);
				break;
			}
			case 16: {
				values.set(this, BigInt.asIntN(16, value));
				bitses.set(this, 16);
				break;
			}
			case 32: {
				values.set(this, BigInt.asIntN(32, value));
				bitses.set(this, 32);
				break;
			}
			case 64: {
				values.set(this, BigInt.asIntN(64, value));
				bitses.set(this, 64);
				break;
			}
			case 128: {
				values.set(this, BigInt.asIntN(128, value));
				bitses.set(this, 128);
				break;
			}
			default: {
				throw new RangeError('Invalid bits');
			}
		}
	}

	/**
	 * Get integer value.
	 *
	 * @returns Integer value.
	 */
	public get value(): bigint {
		return values.get(this)!;
	}

	/**
	 * Set integer value.
	 *
	 * @param value Integer value.
	 */
	public set value(value: bigint) {
		value = BigInt(value);
		values.set(this, BigInt.asIntN(bitses.get(this)!, value));
	}

	/**
	 * Get integer bits.
	 *
	 * @returns Integer bits.
	 */
	public get bits(): PLIntegerBits {
		return bitses.get(this)!;
	}

	/**
	 * Set integer bits.
	 *
	 * @param bits Integer bits.
	 */
	public set bits(bits: PLIntegerBits) {
		switch ((+bits || 0) - (bits % 1 || 0)) {
			case 8: {
				values.set(this, BigInt.asIntN(8, values.get(this)!));
				bitses.set(this, 8);
				break;
			}
			case 16: {
				values.set(this, BigInt.asIntN(16, values.get(this)!));
				bitses.set(this, 16);
				break;
			}
			case 32: {
				values.set(this, BigInt.asIntN(32, values.get(this)!));
				bitses.set(this, 32);
				break;
			}
			case 64: {
				values.set(this, BigInt.asIntN(64, values.get(this)!));
				bitses.set(this, 64);
				break;
			}
			case 128: {
				bitses.set(this, 128);
				break;
			}
			default: {
				throw new RangeError('Invalid bits');
			}
		}
	}

	/**
	 * Check if integer type.
	 *
	 * @param arg Variable.
	 * @returns Is integer type.
	 */
	public static is(arg: unknown): arg is PLInteger {
		return (arg as PLType | null)?.[Symbol.toStringTag] === PLTYPE_INTEGER;
	}

	/**
	 * Maximum integer value.
	 */
	public static readonly MAX_VALUE: bigint;

	/**
	 * Minimum integer value.
	 */
	public static readonly MIN_VALUE: bigint;

	static {
		Object.defineProperty(this.prototype, Symbol.toStringTag, {
			value: PLTYPE_INTEGER,
		});
	}
}
