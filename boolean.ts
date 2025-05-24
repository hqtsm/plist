import type { PLType } from './type.ts';

let values: WeakMap<PLBoolean, boolean>;

const type = 'PLBoolean';

/**
 * Property list boolean type.
 */
export class PLBoolean implements PLType {
	declare public readonly [Symbol.toStringTag]: string;

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
		return arg ? (arg as PLType)[Symbol.toStringTag] === type : false;
	}

	static {
		Object.defineProperty(this.prototype, Symbol.toStringTag, {
			value: type,
			configurable: true,
		});
	}
}
