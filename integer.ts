import type { PLType } from './type.ts';

let values: WeakMap<PLInteger, bigint>;

const P = 0xffffffffffffffffn;
const N = -0x8000000000000000n;

const type = 'PLInteger';

/**
 * Property list integer type.
 */
export class PLInteger implements PLType {
	declare public readonly [Symbol.toStringTag]: string;

	/**
	 * Create property list integer reference.
	 *
	 * @param value Integer value.
	 */
	constructor(value = 0n) {
		this.value = value;
	}

	/**
	 * Get integer value.
	 *
	 * @returns Integer value.
	 */
	public get value(): bigint {
		return values.get(this)!;
	}

	/**
	 * Set integer value.
	 *
	 * @param value Integer value.
	 */
	public set value(value: bigint) {
		(values ??= new WeakMap()).set(this, value % (value < 0 ? N : P));
	}

	/**
	 * Check if type is integer type.
	 *
	 * @param arg Property list type.
	 * @returns True if type is integer type.
	 */
	public static is(arg: PLType): arg is PLInteger {
		return arg[Symbol.toStringTag] === type;
	}

	static {
		Object.defineProperty(this.prototype, Symbol.toStringTag, {
			value: type,
			configurable: true,
		});
	}
}
