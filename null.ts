/**
 * @module
 *
 * Property list null.
 */

import type { PLType } from './type.ts';

/**
 * PLNull type.
 */
export const PLTYPE_NULL = 'PLNull' as const;

/**
 * Property list null type.
 */
export class PLNull {
	declare public readonly [Symbol.toStringTag]: typeof PLTYPE_NULL;

	/**
	 * Variable type.
	 */
	declare public readonly type: typeof PLTYPE_NULL;

	/**
	 * Create property list null reference.
	 */
	constructor() {}

	/**
	 * Value getter.
	 *
	 * @returns Null value.
	 */
	public valueOf(): null {
		return null;
	}

	/**
	 * String getter.
	 *
	 * @returns Null string.
	 */
	public toString(): string {
		return 'null';
	}

	/**
	 * Check if null type.
	 *
	 * @param arg Variable.
	 * @returns Is null type.
	 */
	public static is(arg: unknown): arg is PLNull {
		return (arg as PLType | null)?.[Symbol.toStringTag] === PLTYPE_NULL;
	}

	static {
		const value = {
			value: PLTYPE_NULL,
			configurable: false,
			enumerable: false,
			writable: false,
		} as const;
		Object.defineProperty(this.prototype, Symbol.toStringTag, value);
		Object.defineProperty(this.prototype, 'type', value);
	}
}
