import type { PLType } from './type.ts';

let values: WeakMap<PLUID, bigint>;

const MAX_VALUE = 0xffffffffn;

const type = 'PLUID';

/**
 * Property list UID type.
 */
export class PLUID implements PLType {
	declare public readonly [Symbol.toStringTag]: string;

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
		(values ??= new WeakMap()).set(this, value & MAX_VALUE);
	}

	/**
	 * Check if type is UID type.
	 *
	 * @param arg Property list type.
	 * @returns True if type is UID type.
	 */
	public static is(arg: PLType): arg is PLUID {
		return arg[Symbol.toStringTag] === type;
	}

	static {
		Object.defineProperty(this.prototype, Symbol.toStringTag, {
			value: type,
			configurable: true,
		});
	}
}
