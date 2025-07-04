/**
 * @module
 *
 * Property list string.
 */

import type { PLType } from './type.ts';

let values: WeakMap<PLString, string>;

const TYPE = 'PLString' as const;

/**
 * Property list string type.
 */
export class PLString {
	declare public readonly [Symbol.toStringTag]: typeof TYPE;

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
		(values ??= new WeakMap()).set(this, value);
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
		return arg ? (arg as PLType)[Symbol.toStringTag] === TYPE : false;
	}

	/**
	 * Variable type.
	 */
	public static readonly TYPE: typeof TYPE;

	static {
		const type = { value: TYPE };
		Object.defineProperty(this.prototype, Symbol.toStringTag, type);
		Object.defineProperty(this, 'TYPE', type);
	}
}
