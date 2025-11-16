/**
 * @module
 *
 * Property list boolean.
 */

import type { PLType } from './type.ts';

const values = new WeakMap<PLBoolean, boolean>();

/**
 * PLBoolean type.
 */
export const PLTYPE_BOOLEAN = 'PLBoolean' as const;

/**
 * Property list boolean type.
 */
export class PLBoolean {
	declare public readonly [Symbol.toStringTag]: typeof PLTYPE_BOOLEAN;

	/**
	 * Variable type.
	 */
	declare public readonly type: typeof PLTYPE_BOOLEAN;

	/**
	 * Create property list boolean reference.
	 *
	 * @param value Boolean value.
	 */
	constructor(value = false) {
		values.set(this, !!value);
	}

	/**
	 * Get boolean value.
	 *
	 * @returns Boolean value.
	 */
	public get value(): boolean {
		return values.get(this)!;
	}

	/**
	 * Set boolean value.
	 *
	 * @param value Boolean value.
	 */
	public set value(value: boolean) {
		values.set(this, !!value);
	}

	/**
	 * Value getter.
	 *
	 * @returns Boolean value.
	 */
	public valueOf(): boolean {
		return values.get(this)!;
	}

	/**
	 * String getter.
	 *
	 * @returns Boolean string.
	 */
	public toString(): string {
		return `${values.get(this)!}`;
	}

	/**
	 * Check if boolean type.
	 *
	 * @param arg Variable.
	 * @returns Is boolean type.
	 */
	public static is(arg: unknown): arg is PLBoolean {
		return (arg as PLType | null)?.[Symbol.toStringTag] === PLTYPE_BOOLEAN;
	}

	static {
		const value = {
			value: PLTYPE_BOOLEAN,
			configurable: false,
			enumerable: false,
			writable: false,
		} as const;
		Object.defineProperty(this.prototype, Symbol.toStringTag, value);
		Object.defineProperty(this.prototype, 'type', value);
	}
}
