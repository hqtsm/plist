import { assertEquals } from '@std/assert/equals';
import { getISO, getTime } from './date.ts';

const UNIX_EPOCH = -978307200;

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
