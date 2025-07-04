/**
 * @module
 *
 * Property list UID.
 */

import type { PLType } from './type.ts';

let values: WeakMap<PLUID, bigint>;

const MIN_VALUE = 0n;
const MAX_VALUE = 0xffffffffn;

const TYPE = 'PLUID' as const;

/**
 * Property list UID type.
 */
export class PLUID {
	declare public readonly [Symbol.toStringTag]: typeof TYPE;

	/**
	 * Create property list UID reference.
	 *
	 * @param value UID value.
	 */
	constructor(value = 0n) {
		this.value = value;
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
		(values ??= new WeakMap()).set(
			this,
			value > MAX_VALUE
				? MAX_VALUE
				: (value < MIN_VALUE ? MIN_VALUE : value),
		);
	}

	/**
	 * Check if UID type.
	 *
	 * @param arg Variable.
	 * @returns Is UID type.
	 */
	public static is(arg: unknown): arg is PLUID {
		return arg ? (arg as PLType)[Symbol.toStringTag] === TYPE : false;
	}

	/**
	 * Variable type.
	 */
	public static readonly TYPE: typeof TYPE;

	/**
	 * Maximum UID value.
	 */
	public static readonly MAX_VALUE: bigint;

	/**
	 * Minimum UID value.
	 */
	public static readonly MIN_VALUE: bigint;

	static {
		const type = { value: TYPE };
		Object.defineProperty(this.prototype, Symbol.toStringTag, type);
		Object.defineProperty(this, 'TYPE', type);
		Object.defineProperty(this, 'MAX_VALUE', { value: MAX_VALUE });
		Object.defineProperty(this, 'MIN_VALUE', { value: MIN_VALUE });
	}
}
