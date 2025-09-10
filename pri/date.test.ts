import { assertEquals } from '@std/assert';
import {
	getDay,
	getHour,
	getISO,
	getMinute,
	getMonth,
	getSecond,
	getTime,
	getYear,
	parseISO,
	setDay,
	setHour,
	setMinute,
	setMonth,
	setSecond,
	setYear,
} from './date.ts';

const UNIX_EPOCH = -978307200;

const startTimes = [
	// 2001-01-01T00:00:00.000Z
	0,
	// 2004-01-01T00:00:00.000Z
	94608000,
	// 2004-02-29T00:00:00.000Z
	99705600,
	// 2004-03-01T00:00:00.000Z
	99792000,
	// 2400-03-01T00:00:00.000Z
	12596342400,
	// -000005-02-08T02:40:00.000Z
	-63300000000,
];

Deno.test('getISO', () => {
	assertEquals(getISO(UNIX_EPOCH), '1970-01-01T00:00:00.000Z');
	assertEquals(getISO(0), '2001-01-01T00:00:00.000Z');
});

Deno.test('getTime: normal', () => {
	assertEquals(
		getTime(1970, 1, 1, 0, 0, 0),
		UNIX_EPOCH,
	);
	assertEquals(
		getTime(2001, 1, 1, 0, 0, 0),
		0,
	);
	assertEquals(
		getISO(getTime(2004, 1, 1, 0, 0, 0)),
		'2004-01-01T00:00:00.000Z',
	);
	assertEquals(
		getISO(getTime(2010, 1, 1, 0, 0, 0)),
		'2010-01-01T00:00:00.000Z',
	);
});

Deno.test('getTime: month:0', () => {
	assertEquals(
		getISO(getTime(2004, 0, 1, 0, 0, 0)),
		'2004-01-01T00:00:00.000Z',
	);
});

Deno.test('getTime: month:13', () => {
	assertEquals(
		getISO(getTime(2004, 13, 1, 0, 0, 0)),
		'2005-01-01T00:00:00.000Z',
	);
	assertEquals(
		getISO(getTime(2010, 13, 1, 0, 0, 0)),
		'2011-01-01T00:00:00.000Z',
	);
});

Deno.test('getTime: month:14-99', () => {
	assertEquals(
		getISO(getTime(2004, 14, 1, 0, 0, 0)),
		'2004-01-01T00:00:00.000Z',
	);
	assertEquals(
		getISO(getTime(2010, 14, 1, 0, 0, 0)),
		'2010-01-01T00:00:00.000Z',
	);
	for (let i = 15; i < 100; i++) {
		assertEquals(
			getISO(getTime(2004, i, 1, 0, 0, 0)),
			'2004-01-01T00:00:00.000Z',
			`${i}`,
		);
		assertEquals(
			getISO(getTime(2010, i, 1, 0, 0, 0)),
			'2010-01-01T00:00:00.000Z',
			`${i}`,
		);
	}

	assertEquals(
		getTime(-2147481648, 12, 31, 23, 59, 59),
		+'67768038400752000',
	);
});

Deno.test('getTime: day:0', () => {
	assertEquals(
		getISO(getTime(2004, 1, 0, 0, 0, 0)),
		'2003-12-31T00:00:00.000Z',
	);
});

Deno.test('getTime: day:1-99', () => {
	const jsd = new Date(0);
	for (let day = 1; day < 100; day++) {
		jsd.setUTCFullYear(2004);
		jsd.setUTCMonth(0);
		jsd.setUTCDate(day);
		assertEquals(
			getISO(getTime(2004, 1, day, 0, 0, 0)),
			jsd.toISOString(),
		);
	}
	assertEquals(
		getISO(getTime(2004, 2, 28, 0, 0, 0)),
		'2004-02-28T00:00:00.000Z',
	);
	assertEquals(
		getISO(getTime(2004, 2, 29, 0, 0, 0)),
		'2004-02-29T00:00:00.000Z',
	);
	assertEquals(
		getISO(getTime(2004, 2, 30, 0, 0, 0)),
		'2004-03-01T00:00:00.000Z',
	);
});

Deno.test('getTime: hour:0-99', () => {
	const jsd = new Date(0);
	for (let hour = 1; hour < 100; hour++) {
		jsd.setUTCFullYear(2004);
		jsd.setUTCMonth(0);
		jsd.setUTCDate(1);
		jsd.setUTCHours(hour);
		assertEquals(
			getISO(getTime(2004, 1, 1, hour, 0, 0)),
			jsd.toISOString(),
		);
	}
});

Deno.test('getTime: minute:0-99', () => {
	const jsd = new Date(0);
	for (let minute = 1; minute < 100; minute++) {
		jsd.setUTCFullYear(2004);
		jsd.setUTCMonth(0);
		jsd.setUTCDate(1);
		jsd.setUTCHours(0);
		jsd.setUTCMinutes(minute);
		assertEquals(
			getISO(getTime(2004, 1, 1, 0, minute, 0)),
			jsd.toISOString(),
		);
	}
});

Deno.test('getTime: second:0-99', () => {
	const jsd = new Date(0);
	for (let second = 1; second < 100; second++) {
		jsd.setUTCFullYear(2004);
		jsd.setUTCMonth(0);
		jsd.setUTCDate(1);
		jsd.setUTCHours(0);
		jsd.setUTCMinutes(0);
		jsd.setUTCSeconds(second);
		assertEquals(
			getISO(getTime(2004, 1, 1, 0, 0, second)),
			jsd.toISOString(),
		);
	}
});

Deno.test('parseISO: normal', () => {
	assertEquals(parseISO('2001-01-01T00:00:00.000Z'), 0);
	assertEquals(parseISO(new Date(0).toISOString()), UNIX_EPOCH);
	assertEquals(parseISO('+2004-11-29T21:33:09.000Z'), 123456789);
});

Deno.test('parseISO: bad', () => {
	assertEquals(parseISO('BAD'), NaN);
	assertEquals(parseISO('1'), NaN);
	assertEquals(parseISO(''), NaN);
});

Deno.test('parseISO: second over', () => {
	assertEquals(parseISO('2004-01-01T00:00:60.000Z'), NaN);
});

Deno.test('parseISO: minute over', () => {
	assertEquals(parseISO('2004-01-01T00:60:00.000Z'), NaN);
});

Deno.test('parseISO: hour over', () => {
	assertEquals(
		parseISO('2004-01-01T24:00:00.000Z'),
		parseISO('2004-01-02T00:00:00.000Z'),
	);
	assertEquals(parseISO('2004-01-01T24:00:00.001Z'), NaN);
	assertEquals(parseISO('2004-01-01T24:00:01.000Z'), NaN);
	assertEquals(parseISO('2004-01-01T24:01:00.000Z'), NaN);
	assertEquals(parseISO('2004-01-01T25:00:00.000Z'), NaN);
});

Deno.test('parseISO: day under over', () => {
	assertEquals(parseISO('2004-01-00T00:00:00.000Z'), NaN);
	assertEquals(parseISO('2004-01-32T00:00:00.000Z'), NaN);
	assertEquals(
		parseISO('2003-02-29T00:00:00.000Z'),
		parseISO('2003-03-01T00:00:00.000Z'),
	);
	assertEquals(
		parseISO('2004-02-30T00:00:00.000Z'),
		parseISO('2004-03-01T00:00:00.000Z'),
	);
});

Deno.test('parseISO: month under over', () => {
	assertEquals(parseISO('2004-00-01T00:00:00.000Z'), NaN);
	assertEquals(parseISO('2004-13-01T00:00:00.000Z'), NaN);
});

Deno.test('setYear + getYear', () => {
	const deltas = (new Array(800)).fill(0).map((_, i) => i);
	const allDeltas = new Set([...deltas, ...deltas.map((d) => -d)]);
	for (const start of startTimes) {
		for (const year of allDeltas) {
			const tag = `${start}: ${year}`;
			const time = setYear(start, year);
			const jsd = new Date((start - UNIX_EPOCH) * 1000);
			jsd.setUTCFullYear(year);
			assertEquals(getISO(time), jsd.toISOString(), tag);
			assertEquals(getYear(time), year, tag);
		}
	}
});

Deno.test('setMonth + getMonth', () => {
	const deltas = (new Array(5000)).fill(0).map((_, i) => i);
	const allDeltas = new Set([...deltas, ...deltas.map((d) => -d)]);
	for (const start of startTimes) {
		for (const month of allDeltas) {
			const tag = `${start}: ${month}`;
			const time = setMonth(start, month);
			const jsd = new Date((start - UNIX_EPOCH) * 1000);
			jsd.setUTCMonth(month - 1);
			assertEquals(getISO(time), jsd.toISOString(), tag);
			assertEquals(getMonth(time), jsd.getUTCMonth() + 1, tag);
		}
	}
});

Deno.test('setDay + getDay', () => {
	const deltas = [...new Array(1000).fill(0).map((_, i) => i), 10000];
	const allDeltas = new Set([...deltas, ...deltas.map((d) => -d)]);
	for (const start of startTimes) {
		for (const day of allDeltas) {
			const tag = `${start}: ${day}`;
			const time = setDay(start, day);
			const jsd = new Date((start - UNIX_EPOCH) * 1000);
			jsd.setUTCDate(day);
			assertEquals(getISO(time), jsd.toISOString(), tag);
			assertEquals(getDay(time), jsd.getUTCDate(), tag);
		}
	}
});

Deno.test('setHour + getHour', () => {
	const deltas = [
		0,
		1,
		2,
		12,
		24,
		25,
		48,
		1000000,
	];
	const allDeltas = new Set([...deltas, ...deltas.map((d) => -d)]);
	for (const start of startTimes) {
		for (const hour of allDeltas) {
			const tag = `${start}: ${hour}`;
			const time = setHour(start, hour);
			const jsd = new Date((start - UNIX_EPOCH) * 1000);
			jsd.setUTCHours(hour);
			assertEquals(getISO(time), jsd.toISOString(), tag);
			assertEquals(getHour(time), jsd.getUTCHours(), tag);
		}
	}
});

Deno.test('setMinute + getMinute', () => {
	const deltas = [
		0,
		1,
		2,
		59,
		60,
		61,
		120,
		1000000,
	];
	const allDeltas = new Set([...deltas, ...deltas.map((d) => -d)]);
	for (const start of startTimes) {
		for (const minute of allDeltas) {
			const tag = `${start}: ${minute}`;
			const time = setMinute(start, minute);
			const jsd = new Date((start - UNIX_EPOCH) * 1000);
			jsd.setUTCMinutes(minute);
			assertEquals(getISO(time), jsd.toISOString(), tag);
			assertEquals(getMinute(time), jsd.getUTCMinutes(), tag);
		}
	}
});

Deno.test('setSecond + getSecond', () => {
	const deltas = [
		0,
		1,
		2,
		10,
		100,
		1000,
		10000,
		100000,
		1000000,
		10000000,
		100000000,
		Math.PI,
	];
	const allDeltas = new Set([...deltas, ...deltas.map((d) => -d)]);
	for (const start of startTimes) {
		for (const second of allDeltas) {
			const tag = `${start}: ${second}`;
			const time = setSecond(start, second);
			const jsd = new Date((start - UNIX_EPOCH) * 1000);
			jsd.setUTCMilliseconds(Math.floor(second * 1000));
			assertEquals(getISO(time), jsd.toISOString(), tag);
			const seconds = getSecond(time);
			const fullSeconds = Math.floor(seconds);
			assertEquals(fullSeconds, jsd.getUTCSeconds(), tag);
			assertEquals(
				Math.floor((seconds - fullSeconds) * 1000),
				jsd.getUTCMilliseconds(),
				tag,
			);
		}
	}
});
