/**
 * @module
 *
 * Property list date.
 */

import type { PLType } from './type.ts';

let times: WeakMap<PLDate, number>;

const UNIX_EPOCH = -978307200;

const type = 'PLDate';

/**
 * Property list date type.
 */
export class PLDate {
	declare public readonly [Symbol.toStringTag]: string;

	/**
	 * Create property list date reference.
	 *
	 * @param time Date time.
	 */
	constructor(time = 0) {
		this.time = time;
	}

	/**
	 * Get date value.
	 *
	 * @returns Date value.
	 */
	public get time(): number {
		return times.get(this)!;
	}

	/**
	 * Set date value.
	 *
	 * @param value Date value.
	 */
	public set time(time: number) {
		(times ??= new WeakMap()).set(this, time);
	}

	/**
	 * Convert to date.
	 *
	 * @returns Date.
	 */
	public toDate(): Date {
		return new Date((this.time - UNIX_EPOCH) * 1000);
	}

	/**
	 * Check if date type.
	 *
	 * @param arg Variable.
	 * @returns Is date type.
	 */
	public static is(arg: unknown): arg is PLDate {
		return arg ? (arg as PLType)[Symbol.toStringTag] === type : false;
	}

	/**
	 * Get date time for current time.
	 *
	 * @returns Date time.
	 */
	public static now(): number {
		return Date.now() / 1000 + UNIX_EPOCH;
	}

	/**
	 * Create from date.
	 *
	 * @param date Date.
	 * @returns Date type.
	 */
	public static from(date: Date): PLDate {
		return new PLDate(date.getTime() / 1000 + UNIX_EPOCH);
	}

	/**
	 * Date time for the UNIX epoch.
	 *
	 * @returns UNIX epoch date time.
	 */
	public static readonly UNIX_EPOCH: number;

	static {
		Object.defineProperty(this.prototype, Symbol.toStringTag, {
			value: type,
			configurable: true,
		});
		Object.defineProperty(this, 'UNIX_EPOCH', {
			value: UNIX_EPOCH,
			configurable: true,
		});
	}
}
