/**
 * @module
 *
 * Property list integer.
 */

import type { PLType } from './type.ts';

let values: WeakMap<PLInteger, bigint>;

const MAX_VALUE = 0xffffffffffffffffn;
const MIN_VALUE = -0x8000000000000000n;

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
	 */
	constructor(value = 0n) {
		this.value = value;
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
		(values ??= new WeakMap()).set(
			this,
			value > MAX_VALUE
				? MAX_VALUE
				: (value < MIN_VALUE ? MIN_VALUE : value),
		);
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
		Object.defineProperty(this, 'MAX_VALUE', { value: MAX_VALUE });
		Object.defineProperty(this, 'MIN_VALUE', { value: MIN_VALUE });
	}
}
