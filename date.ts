/**
 * @module
 *
 * Property list date.
 */

import {
	getDay,
	getHour,
	getISO,
	getMinute,
	getMonth,
	getSecond,
	getYear,
	parseISO,
	setDay,
	setHour,
	setMinute,
	setMonth,
	setSecond,
	setYear,
} from './pri/date.ts';
import type { PLType } from './type.ts';

let times: WeakMap<PLDate, number>;
const UNIX_EPOCH = -978307200;

/**
 * PLDate type.
 */
export const PLTYPE_DATE = 'PLDate' as const;

/**
 * Property list date type.
 */
export class PLDate {
	declare public readonly [Symbol.toStringTag]: typeof PLTYPE_DATE;

	/**
	 * Variable type.
	 */
	declare public readonly type: typeof PLTYPE_DATE;

	/**
	 * Create property list date reference.
	 *
	 * @param time Date time.
	 */
	constructor(time = 0) {
		times ??= new WeakMap();
		times.set(this, +time);
	}

	/**
	 * Get date time.
	 *
	 * @returns Date time.
	 */
	public get time(): number {
		return times.get(this)!;
	}

	/**
	 * Set date time.
	 *
	 * @param time Date time.
	 */
	public set time(time: number) {
		times.set(this, +time);
	}

	/**
	 * Get year.
	 *
	 * @returns Year.
	 */
	public get year(): number {
		return getYear(times.get(this)!);
	}

	/**
	 * Set year.
	 *
	 * @param year Year.
	 */
	public set year(year: number) {
		times.set(
			this,
			setYear(times.get(this)!, (+year || 0) - (year % 1 || 0)),
		);
	}

	/**
	 * Get month.
	 *
	 * @returns Month, 1 indexed.
	 */
	public get month(): number {
		return getMonth(times.get(this)!);
	}

	/**
	 * Set month.
	 *
	 * @param month Month.
	 */
	public set month(month: number) {
		times.set(
			this,
			setMonth(times.get(this)!, (+month || 0) - (month % 1 || 0)),
		);
	}

	/**
	 * Get day.
	 *
	 * @returns Day.
	 */
	public get day(): number {
		return getDay(times.get(this)!);
	}

	/**
	 * Set day.
	 *
	 * @param day Day.
	 */
	public set day(day: number) {
		times.set(
			this,
			setDay(times.get(this)!, (+day || 0) - (day % 1 || 0)),
		);
	}

	/**
	 * Get hour.
	 *
	 * @returns Hour.
	 */
	public get hour(): number {
		return getHour(times.get(this)!);
	}

	/**
	 * Set hour.
	 *
	 * @param hour Hour.
	 */
	public set hour(hour: number) {
		times.set(
			this,
			setHour(times.get(this)!, (+hour || 0) - (hour % 1 || 0)),
		);
	}

	/**
	 * Get minute.
	 *
	 * @returns Minute.
	 */
	public get minute(): number {
		return getMinute(times.get(this)!);
	}

	/**
	 * Set minute.
	 *
	 * @param minute Minute.
	 */
	public set minute(minute: number) {
		times.set(
			this,
			setMinute(times.get(this)!, (+minute || 0) - (minute % 1 || 0)),
		);
	}

	/**
	 * Get second.
	 *
	 * @returns Second.
	 */
	public get second(): number {
		return getSecond(times.get(this)!);
	}

	/**
	 * Set second.
	 *
	 * @param second Second.
	 */
	public set second(second: number) {
		times.set(
			this,
			setSecond(times.get(this)!, +second || 0),
		);
	}

	/**
	 * Convert to date.
	 *
	 * @returns Date, potentially invalid.
	 */
	public toDate(): Date {
		return new Date((times.get(this)! - UNIX_EPOCH) * 1000);
	}

	/**
	 * Convert to ISO string.
	 *
	 * @returns ISO string.
	 */
	public toISOString(): string {
		return getISO(times.get(this)!);
	}

	/**
	 * Value getter.
	 *
	 * @returns Date time.
	 */
	public valueOf(): number {
		return times.get(this)!;
	}

	/**
	 * String getter.
	 *
	 * @returns ISO string.
	 */
	public toString(): string {
		return getISO(times.get(this)!);
	}

	/**
	 * Check if date type.
	 *
	 * @param arg Variable.
	 * @returns Is date type.
	 */
	public static is(arg: unknown): arg is PLDate {
		return (arg as PLType | null)?.[Symbol.toStringTag] === PLTYPE_DATE;
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
	 * Encode date time to ISO format.
	 *
	 * @param time Date time.
	 * @returns ISO format.
	 */
	public static ISO(time: number): string {
		return getISO(time);
	}

	/**
	 * Parse ISO format to date time.
	 *
	 * @param date ISO date.
	 * @returns Date time.
	 */
	public static parse(date: string): number {
		return parseISO(date);
	}

	/**
	 * Date time for the UNIX epoch.
	 *
	 * @returns UNIX epoch date time.
	 */
	public static readonly UNIX_EPOCH: number;

	static {
		const value = { value: PLTYPE_DATE } as const;
		Object.defineProperty(this.prototype, Symbol.toStringTag, value);
		Object.defineProperty(this.prototype, 'type', value);
		Object.defineProperty(this, 'UNIX_EPOCH', { value: UNIX_EPOCH });
	}
}
