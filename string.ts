/**
 * @module
 *
 * Property list string.
 */

import type { PLType } from './type.ts';

let values: WeakMap<PLString, string>;

export const PLTYPE_STRING = 'PLString' as const;

/**
 * Property list string type.
 */
export class PLString {
	declare public readonly [Symbol.toStringTag]: typeof PLTYPE_STRING;

	/**
	 * Create property list string reference.
	 *
	 * @param value String value.
	 */
	constructor(value = '') {
		this.value = value;
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
		(values ??= new WeakMap()).set(this, String(value));
	}

	/**
	 * Get string length.
	 *
	 * @returns String length.
	 */
	public get length(): number {
		return this.value.length;
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
		Object.defineProperty(this.prototype, Symbol.toStringTag, {
			value: PLTYPE_STRING,
		});
	}
}
