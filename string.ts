/**
 * @module
 *
 * Property list string.
 */

import type { PLType } from './type.ts';

let values: WeakMap<PLString, string>;

/**
 * PLString type.
 */
export const PLTYPE_STRING = 'PLString' as const;

/**
 * Property list string type.
 */
export class PLString {
	declare public readonly [Symbol.toStringTag]: typeof PLTYPE_STRING;

	/**
	 * Variable type.
	 */
	declare public readonly type: typeof PLTYPE_STRING;

	/**
	 * Create property list string reference.
	 *
	 * @param value String value.
	 */
	constructor(value = '') {
		values ??= new WeakMap();
		values.set(this, '' + value);
	}

	/**
	 * Get string value.
	 *
	 * @returns String value.
	 */
	public get value(): string {
		return values.get(this)!;
	}

	/**
	 * Set string value.
	 *
	 * @param value String value.
	 */
	public set value(value: string) {
		values.set(this, '' + value);
	}

	/**
	 * Get string length.
	 *
	 * @returns String length.
	 */
	public get length(): number {
		return values.get(this)!.length;
	}

	/**
	 * Value getter.
	 *
	 * @returns String value.
	 */
	public valueOf(): string {
		return values.get(this)!;
	}

	/**
	 * Value getter.
	 *
	 * @returns String value.
	 */
	public toString(): string {
		return values.get(this)!;
	}

	/**
	 * Check if string type.
	 *
	 * @param arg Variable.
	 * @returns Is string type.
	 */
	public static is(arg: unknown): arg is PLString {
		return (arg as PLType | null)?.[Symbol.toStringTag] === PLTYPE_STRING;
	}

	static {
		const value = { value: PLTYPE_STRING } as const;
		Object.defineProperty(this.prototype, Symbol.toStringTag, value);
		Object.defineProperty(this.prototype, 'type', value);
	}
}
