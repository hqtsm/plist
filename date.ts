/**
 * @module
 *
 * Property list date.
 */

import type { PLType } from './type.ts';

let times: WeakMap<PLDate, number>;

const Y: [number] = [0];
const M: [number] = [0];
const D: [number] = [0];
const DBM = [0, 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
const rISO = /^([-+]?\d+)-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d(\.\d+)?)Z$/;
const UNIX_EPOCH = -978307200;

const TYPE = 'PLDate' as const;

/**
 * Is year leap year.
 *
 * @param year Year.
 * @returns Is leap year.
 */
function leap(year: number): 0 | 1 {
	year = (year < 0 ? -year : year) % 400;
	return +!(year & 3 || (year && !(year % 100))) as 0 | 1;
}

/**
 * Get year, month, day.
 *
 * @param time Date value.
 * @param year Year pointer.
 * @param month Month pointer.
 * @param day Day pointer.
 */
function getYMD(
	time: number,
	year?: [number] | null,
	month?: [number] | null,
	day?: [number] | null,
): void {
	// Convert time to days.
	let z: bigint | number = time < 0
		? (time === -Infinity
			? -0x8000000000000000n
			: BigInt.asIntN(64, BigInt(Math.floor(time / 86400))))
		: (time === Infinity
			? 0x7fffffffffffffffn
			: BigInt.asIntN(64, BigInt(Math.floor(time / 86400 || 0))));

	// Years of full 400 year cycles, and the remaining days.
	let x: bigint | number = z / 146097n;
	let y: bigint | number = x * 400n;
	let m = 0;
	z -= x * 146097n;

	// Turn the remaining years of days into years.
	if (z < 0) {
		do {
			x = -(y--) % 400n;
			m = +!(x & 3n || (x && !(x % 100n)));
			z += m ? 366n : 365n;
		} while (z < 0);
	} else {
		for (let d = 365n; z >= d;) {
			z -= d;
			x = (++y + 1n) % 400n;
			m = +!(x & 3n || (x && !(x % 100n)));
			d = m ? 366n : 365n;
		}
	}
	if (year) {
		year[0] = (y > 0x7fffffff - 2001)
			? 0x7fffffff
			: Number(BigInt.asIntN(32, y + 2001n));
	}

	if (month || day) {
		// Days into year to month and day by lookup tree.
		let d = Number(z);
		d -= (d > (z = 180 + m))
			? (
				(d > (y = 272 + m))
					? (d > (x = 333 + m)
						? ((m = 12), x)
						: (d > (x = 303 + m))
						? ((m = 11), x)
						: ((m = 10), y))
					: (d > (x = 242 + m)
						? ((m = 9), x)
						: (d > (x = 211 + m))
						? ((m = 8), x)
						: ((m = 7), z))
			)
			: (
				(d > (y = 89 + m))
					? (d > (x = 150 + m)
						? ((m = 6), x)
						: (d > (x = 119 + m))
						? ((m = 5), x)
						: ((m = 4), y))
					: (d > (x = 58 + m)
						? ((m = 3), x)
						: (d > 30)
						? ((m = 2), 30)
						: -(m = 1))
			);
		if (month) {
			month[0] = m;
		}
		if (day) {
			day[0] = d;
		}
	}
}

/**
 * Get hour.
 *
 * @param time Date time.
 * @returns Hour.
 */
function getH(time: number): number {
	time = Math.floor(time / 3600);
	return time - Math.floor(time / 24) * 24 | 0;
}

/**
 * Get minute.
 *
 * @param time Date time.
 * @returns Minute.
 */
function getM(time: number): number {
	time = Math.floor(time / 60);
	return time - Math.floor(time / 60) * 60 | 0;
}

/**
 * Get second.
 *
 * @param time Date time.
 * @returns Second.
 */
function getS(time: number): number {
	return time - Math.floor(time / 60) * 60 || 0;
}

/**
 * Encode date time to ISO format.
 *
 * @param time Date time.
 * @returns ISO string.
 */
function iso(time: number): string {
	getYMD(time, Y, M, D);
	let [x] = Y as [bigint | number];
	const YY = x < 0
		? '-' + `${-x}`.padStart(6, '0')
		: (x > 9999 ? '+' + `${x}`.padStart(6, '0') : `${x}`.padStart(4, '0'));
	const MM = `${M[0]}`.padStart(2, '0');
	const DD = `${D[0]}`.padStart(2, '0');
	const hh = `${getH(time)}`.padStart(2, '0');
	const mm = `${getM(time)}`.padStart(2, '0');
	const ss = `${time = (x = getS(time)) | 0}`.padStart(2, '0');
	const f = `${(x * 1000 | 0) - time * 1000}`.padStart(3, '0');
	return `${YY}-${MM}-${DD}T${hh}:${mm}:${ss}.${f}Z`;
}

/**
 * Create time ISO values, only the year can be negative.
 *
 * @param year Year.
 * @param month Month.
 * @param day Day.
 * @param hour Hour.
 * @param minute Minute.
 * @param second Second.
 * @returns Time.
 */
function getTime(
	year: number,
	month: number,
	day: number,
	hour: number,
	minute: number,
	second: number,
): number {
	// Roll months into years.
	let r;
	let x: number | bigint = (month > 12)
		? (r = month % 12, (month - (month = r)) / 12)
		: (month ? 0 : (month = 12, -1));
	let y = BigInt.asIntN(64, BigInt(year + x - 2001));

	// Years of full 400 year cycles, and the remaining days.
	let z = y / 400n;
	r = Number(BigInt.asIntN(64, z * 146097n));
	y -= z * 400n;

	// Remaining years of days.
	if (y < 0) {
		for (z = y; z;) {
			x = -(++z) % 400n;
			r -= (x & 3n || (x && !(x % 100n))) ? 365 : 366;
		}
	} else {
		for (z = 0n; z < y;) {
			x = ++z % 400n;
			r += (x & 3n || (x && !(x % 100n))) ? 365 : 366;
		}
	}

	// Remaining months of days and add all together.
	return (
		86400 * (
				r +
				DBM[month] + day + (
					month > 2 &&
						(
							!((x = (++y < 0 ? -y : y) % 400n) & 3n ||
								(x && !(x % 100n)))
						)
						? 0
						: -1
				)
			) +
		3600 * hour +
		60 * minute +
		second
	);
}

/**
 * Property list date type.
 */
export class PLDate {
	declare public readonly [Symbol.toStringTag]: typeof TYPE;

	/**
	 * Create property list date reference.
	 *
	 * @param time Date time.
	 */
	constructor(time = 0) {
		this.time = time;
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
		(times ??= new WeakMap()).set(this, time);
	}

	/**
	 * Get year.
	 *
	 * @returns Year.
	 */
	public get year(): number {
		getYMD(this.time, Y);
		return Y[0];
	}

	/**
	 * Set year.
	 *
	 * @param year Year.
	 */
	public set year(year: number) {
		const { time } = this;
		year = (+year || 0) - (year % 1 || 0);
		getYMD(time, null, M, D);
		this.time = getTime(
			year,
			M[0],
			D[0],
			getH(time),
			getM(time),
			getS(time),
		);
	}

	/**
	 * Get month.
	 *
	 * @returns Month.
	 */
	public get month(): number {
		getYMD(this.time, null, M);
		return M[0];
	}

	/**
	 * Set month.
	 *
	 * @param month Month.
	 */
	public set month(month: number) {
		const { time } = this;
		month = (+month || 0) - (month % 1 || 0);
		getYMD(time, Y, M);
		let [y] = Y;
		const [m] = M;
		const days = DBM[m] + (m > 2 ? leap(y) : 0);
		let d = 0;
		if (month > 0) {
			for (; month > 12; month -= 12) {
				d += 365 + leap(y++);
			}
			d += DBM[month] + (month > 2 ? leap(y) : 0);
		} else {
			for (; month <= -12; month += 12) {
				d -= 365 + leap(--y);
			}
			d -= 365 - DBM[month += 12] + (month > 2 ? 0 : leap(y - 1));
		}
		this.time = time + (d - days) * 86400;
	}

	/**
	 * Get day.
	 *
	 * @returns Day.
	 */
	public get day(): number {
		getYMD(this.time, null, null, D);
		return D[0];
	}

	/**
	 * Set day.
	 *
	 * @param day Day.
	 */
	public set day(day: number) {
		const { time } = this;
		day = (+day || 0) - (day % 1 || 0);
		getYMD(time, null, null, D);
		this.time = time + (day - D[0]) * 86400;
	}

	/**
	 * Get hour.
	 *
	 * @returns Hour.
	 */
	public get hour(): number {
		return getH(this.time);
	}

	/**
	 * Set hour.
	 *
	 * @param hour Hour.
	 */
	public set hour(hour: number) {
		const { time } = this;
		this.time = time + ((+hour || 0) - (hour % 1 || 0) - getH(time)) * 3600;
	}

	/**
	 * Get minute.
	 *
	 * @returns Minute.
	 */
	public get minute(): number {
		return getM(this.time);
	}

	/**
	 * Set minute.
	 *
	 * @param minute Minute.
	 */
	public set minute(minute: number) {
		const { time } = this;
		this.time = time +
			((+minute || 0) - (minute % 1 || 0) - getM(time)) * 60;
	}

	/**
	 * Get second.
	 *
	 * @returns Second.
	 */
	public get second(): number {
		return getS(this.time);
	}

	/**
	 * Set second.
	 *
	 * @param second Second.
	 */
	public set second(second: number) {
		const { time } = this;
		this.time = time + (+second || 0) - getS(time);
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
	 * Convert to ISO string.
	 *
	 * @returns ISO string.
	 */
	public toISOString(): string {
		return iso(this.time);
	}

	/**
	 * Check if date type.
	 *
	 * @param arg Variable.
	 * @returns Is date type.
	 */
	public static is(arg: unknown): arg is PLDate {
		return (arg as PLType | null)?.[Symbol.toStringTag] === TYPE;
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
		return iso(time);
	}

	/**
	 * Parse ISO format to date time.
	 *
	 * @param date ISO date.
	 * @returns Date time.
	 */
	public static parse(date: string): number {
		const m = date.match(rISO);
		return m ? getTime(+m[1] | 0, +m[2], +m[3], +m[4], +m[5], +m[6]) : NaN;
	}

	/**
	 * Date time for the UNIX epoch.
	 *
	 * @returns UNIX epoch date time.
	 */
	public static readonly UNIX_EPOCH: number;

	static {
		Object.defineProperty(this.prototype, Symbol.toStringTag, {
			value: TYPE,
		});
		Object.defineProperty(this, 'UNIX_EPOCH', { value: UNIX_EPOCH });
	}
}
