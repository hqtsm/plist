/**
 * @module
 *
 * Property list boolean.
 */

import type { PLType } from './type.ts';

const values: WeakMap<PLBoolean, boolean> = new WeakMap();

export const PLTYPE_BOOLEAN = 'PLBoolean' as const;

/**
 * Property list boolean type.
 */
export class PLBoolean {
	declare public readonly [Symbol.toStringTag]: typeof PLTYPE_BOOLEAN;

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
	 * Check if boolean type.
	 *
	 * @param arg Variable.
	 * @returns Is boolean type.
	 */
	public static is(arg: unknown): arg is PLBoolean {
		return (arg as PLType | null)?.[Symbol.toStringTag] === PLTYPE_BOOLEAN;
	}

	static {
		Object.defineProperty(this.prototype, Symbol.toStringTag, {
			value: PLTYPE_BOOLEAN,
		});
	}
}
