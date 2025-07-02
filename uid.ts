import type { PLType } from './type.ts';

let values: WeakMap<PLUID, bigint>;

const MIN_VALUE = 0n;
const MAX_VALUE = 0xffffffffn;

const type = 'PLUID';

/**
 * Property list UID type.
 */
export class PLUID {
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
		return arg ? (arg as PLType)[Symbol.toStringTag] === type : false;
	}

	/**
	 * Maximum UID value.
	 */
	public static readonly MAX_VALUE: bigint;

	/**
	 * Minimum UID value.
	 */
	public static readonly MIN_VALUE: bigint;

	static {
		Object.defineProperty(this.prototype, Symbol.toStringTag, {
			value: type,
			configurable: true,
		});
		Object.defineProperty(this, 'MAX_VALUE', {
			value: MAX_VALUE,
			configurable: true,
		});
		Object.defineProperty(this, 'MIN_VALUE', {
			value: MIN_VALUE,
			configurable: true,
		});
	}
}
