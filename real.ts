/**
 * @module
 *
 * Property list real.
 */

import type { PLType } from './type.ts';

let values: WeakMap<PLReal, number>;
let bitses: WeakMap<PLReal, 32 | 64>;

export const PLTYPE_REAL = 'PLReal' as const;

/**
 * Set the internal values.
 *
 * @param t PLReal.
 * @param value Value.
 * @param bits Bits.
 */
function set(t: PLReal, value?: number | null, bits?: number | null): void {
	values ??= new WeakMap();
	bitses ??= new WeakMap();
	switch (bits ?? bitses.get(t)) {
		case 32: {
			values.set(t, Math.fround(value ?? values.get(t)!));
			bitses.set(t, 32);
			return;
		}
		case 64: {
			values.set(t, value ?? values.get(t)!);
			bitses.set(t, 64);
			return;
		}
	}
	throw new RangeError('Invalid bits');
}

/**
 * Property list real type.
 */
export class PLReal {
	declare public readonly [Symbol.toStringTag]: typeof PLTYPE_REAL;

	/**
	 * Create property list real reference.
	 *
	 * @param value Real value.
	 * @param bits Real bits.
	 */
	constructor(value = 0, bits: 32 | 64 = 64) {
		set(this, +value, +bits);
	}

	/**
	 * Get real value.
	 *
	 * @returns Real value.
	 */
	public get value(): number {
		return values.get(this)!;
	}

	/**
	 * Set real value.
	 *
	 * @param value Real value.
	 */
	public set value(value: number) {
		set(this, +value);
	}

	/**
	 * Get real bits.
	 *
	 * @returns Real bits.
	 */
	public get bits(): 32 | 64 {
		return bitses.get(this)!;
	}

	/**
	 * Set real bits.
	 *
	 * @param bits Real bits.
	 */
	public set bits(bits: 32 | 64) {
		set(this, null, +bits);
	}

	/**
	 * Check if real type.
	 *
	 * @param arg Variable.
	 * @returns Is real type.
	 */
	public static is(arg: unknown): arg is PLReal {
		return (arg as PLType | null)?.[Symbol.toStringTag] === PLTYPE_REAL;
	}

	static {
		Object.defineProperty(this.prototype, Symbol.toStringTag, {
			value: PLTYPE_REAL,
		});
	}
}
