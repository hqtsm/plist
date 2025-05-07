import type { PLType } from './type.ts';

type Timed = Pick<Date, 'getTime'>;

let times: WeakMap<PLDate, number>;

const UNIX_EPOCH = -978307200;

const type = 'PLDate';

/**
 * Property list date type.
 */
export class PLDate implements PLType {
	declare public readonly [Symbol.toStringTag]: string;

	/**
	 * Create property list date reference.
	 *
	 * @param time Date time.
	 */
	constructor(time: number | Timed = 0) {
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
	public set time(time: number | Timed) {
		if ((time as Timed).getTime) {
			time = (time as Timed).getTime() / 1000 + UNIX_EPOCH;
		}
		(times ??= new WeakMap()).set(this, time as number);
	}

	/**
	 * Check if type is date type.
	 *
	 * @param arg Property list type.
	 * @returns Is type date type.
	 */
	public static is(arg: PLType): arg is PLDate {
		return arg[Symbol.toStringTag] === type;
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
