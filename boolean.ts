/**
 * @module
 *
 * Property list boolean.
 */

import type { PLType } from './type.ts';

let values: WeakMap<PLBoolean, boolean>;

const TYPE = 'PLBoolean' as const;

/**
 * Property list boolean type.
 */
export class PLBoolean {
	declare public readonly [Symbol.toStringTag]: typeof TYPE;

	/**
	 * Create property list boolean reference.
	 *
	 * @param value Boolean value.
	 */
	constructor(value = false) {
		this.value = value;
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
		(values ??= new WeakMap()).set(this, value);
	}

	/**
	 * Check if boolean type.
	 *
	 * @param arg Variable.
	 * @returns Is boolean type.
	 */
	public static is(arg: unknown): arg is PLBoolean {
		return (arg as PLType | null)?.[Symbol.toStringTag] === TYPE;
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
