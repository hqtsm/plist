/**
 * @module
 *
 * Property list UID.
 */

import type { PLType } from './type.ts';

const values: WeakMap<PLUID, bigint> = new WeakMap();
const MIN_VALUE = 0n;
const MAX_VALUE = 0xffffffffn;
const set = (t: PLUID, value: bigint): void => {
	values.set(
		t,
		value > MAX_VALUE ? MAX_VALUE : (value < MIN_VALUE ? MIN_VALUE : value),
	);
};

export const PLTYPE_UID = 'PLUID' as const;

/**
 * Property list UID type.
 */
export class PLUID {
	declare public readonly [Symbol.toStringTag]: typeof PLTYPE_UID;

	/**
	 * Create property list UID reference.
	 *
	 * @param value UID value.
	 */
	constructor(value = 0n) {
		set(this, BigInt(value));
	}

	/**
	 * Get UID value.
	 *
	 * @returns UID value.
	 */
	public get value(): bigint {
		return values.get(this)!;
	}

	/**
	 * Set UID value.
	 *
	 * @param value UID value.
	 */
	public set value(value: bigint) {
		set(this, BigInt(value));
	}

	/**
	 * Check if UID type.
	 *
	 * @param arg Variable.
	 * @returns Is UID type.
	 */
	public static is(arg: unknown): arg is PLUID {
		return (arg as PLType | null)?.[Symbol.toStringTag] === PLTYPE_UID;
	}

	/**
	 * Maximum UID value.
	 */
	public static readonly MAX_VALUE: bigint;

	/**
	 * Minimum UID value.
	 */
	public static readonly MIN_VALUE: bigint;

	static {
		Object.defineProperty(this.prototype, Symbol.toStringTag, {
			value: PLTYPE_UID,
		});
		Object.defineProperty(this, 'MAX_VALUE', { value: MAX_VALUE });
		Object.defineProperty(this, 'MIN_VALUE', { value: MIN_VALUE });
	}
}
