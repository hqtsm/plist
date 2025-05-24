import type { PLType } from './type.ts';

let values: WeakMap<PLString, string>;

const type = 'PLString';

/**
 * Property list string type.
 */
export class PLString implements PLType {
	declare public readonly [Symbol.toStringTag]: string;

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
		return arg ? (arg as PLType)[Symbol.toStringTag] === type : false;
	}

	static {
		Object.defineProperty(this.prototype, Symbol.toStringTag, {
			value: type,
			configurable: true,
		});
	}
}
