/**
 * @module
 *
 * Property list UID.
 */

import type { PLType } from './type.ts';

const values = new WeakMap<PLUID, bigint>();

/**
 * PLUID type.
 */
export const PLTYPE_UID = 'PLUID' as const;

/**
 * Property list UID type.
 */
export class PLUID {
	declare public readonly [Symbol.toStringTag]: typeof PLTYPE_UID;

	/**
	 * Variable type.
	 */
	declare public readonly type: typeof PLTYPE_UID;

	/**
	 * Create property list UID reference.
	 *
	 * @param value UID value.
	 */
	constructor(value = 0n) {
		values.set(this, BigInt.asUintN(32, BigInt(value)));
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
		values.set(this, BigInt.asUintN(32, BigInt(value)));
	}

	/**
	 * Value getter.
	 *
	 * @returns UID value.
	 */
	public valueOf(): bigint {
		return values.get(this)!;
	}

	/**
	 * String getter.
	 *
	 * @returns Integer string.
	 */
	public toString(): string {
		return `${values.get(this)!}`;
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

	static {
		const value = {
			value: PLTYPE_UID,
			configurable: false,
			enumerable: false,
			writable: false,
		} as const;
		Object.defineProperty(this.prototype, Symbol.toStringTag, value);
		Object.defineProperty(this.prototype, 'type', value);
	}
}
