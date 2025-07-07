import {
	assertAlmostEquals,
	assertEquals,
	assertGreaterOrEqual,
	assertLessOrEqual,
	assertStrictEquals,
} from '@std/assert';
import { PLDate } from './date.ts';
import { PLReal } from './real.ts';

const rISO = /^([-+]?\d+)-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}\.\d{3})Z$/;

const timePosInf = +'67767975241660800';
const timeNegInf = +'64074349346284800';
const sampleISO = [
	['2001-01-01T00:00:00.000Z', 0.0],
	['2001-01-01T00:00:01.000Z', 1.0],
	['2000-12-31T23:59:59.000Z', -1.0],
	['0131-01-02T04:56:02.000Z', -59011441438.0],
	['-000005-02-08T02:40:00.000Z', -63300000000.0],
	['2001-01-01T00:00:00.000Z', 0.000001],
	['2000-12-31T23:59:59.999Z', -0.000001],
	['2001-01-01T00:00:00.000Z', 0.00001],
	['2000-12-31T23:59:59.999Z', -0.00001],
	['2001-01-01T00:00:00.000Z', 0.0001],
	['2000-12-31T23:59:59.999Z', -0.0001],
	['2001-01-01T00:00:00.001Z', 0.001],
	['2000-12-31T23:59:59.999Z', -0.001],
	['2001-01-01T00:00:00.010Z', 0.01],
	['2000-12-31T23:59:59.990Z', -0.01],
	['2001-01-01T00:00:00.100Z', 0.1],
	['2000-12-31T23:59:59.900Z', -0.1],
	['2001-01-01T00:00:00.500Z', 0.5],
	['2000-12-31T23:59:59.500Z', -0.5],
	['2001-01-01T00:00:00.900Z', 0.9],
	['2000-12-31T23:59:59.100Z', -0.9],
	['2001-01-01T00:00:00.999Z', 0.99999],
	['2000-12-31T23:59:59.000Z', -0.99999],
	['2400-03-01T00:00:00.000Z', 12596342400.0],
	['2001-01-01T00:00:00.000Z', 2.220446049250313e-16],
	['2001-01-01T00:00:02.718Z', Math.E],
	['2001-01-01T00:00:01.442Z', Math.LOG2E],
	['2001-01-01T00:00:00.434Z', Math.LOG10E],
	['2001-01-01T00:00:00.693Z', Math.LN2],
	['2001-01-01T00:00:02.302Z', Math.LN10],
	['2001-01-01T00:00:03.141Z', Math.PI],
	['2001-01-01T00:00:01.570Z', Math.PI / 2],
	['2001-01-01T00:00:00.785Z', Math.PI / 4],
	['2001-01-01T00:00:00.318Z', 1 / Math.PI],
	['2001-01-01T00:00:00.636Z', 2 / Math.PI],
	['2001-01-01T00:00:01.128Z', 2 / Math.sqrt(Math.PI)],
	['2001-01-01T00:00:01.414Z', Math.SQRT2],
	['2001-01-01T00:00:00.707Z', Math.SQRT1_2],
	['1970-01-01T00:00:00.000Z', -978307200.0],
	['2032-01-02T00:00:00.000Z', 978307200.0],
	['2004-11-29T21:33:09.000Z', 123456789.0],
	['+285428782-11-12T07:36:31.000Z', 9007199254740991.0],
	['-285424781-02-20T16:23:29.000Z', -9007199254740991.0],
	['2001-01-01T00:00:00.000Z', NaN],
	['+2147483647-07-28T00:00:00.000Z', Infinity],
	['+2030437302-06-07T00:00:00.000Z', -Infinity],
] as const;

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

Deno.test('initial value', () => {
	assertEquals(new PLDate().time, 0);
	assertEquals(new PLDate(42).time, 42);
});

Deno.test('set value', () => {
	const pl = new PLDate();
	pl.time = 42;
	assertEquals(pl.time, 42);
	pl.time = -10;
	assertEquals(pl.time, -10);
});

Deno.test('to date', () => {
	assertEquals(
		(new PLDate(0)).toDate().toISOString(),
		'2001-01-01T00:00:00.000Z',
	);
	assertEquals(
		(new PLDate(PLDate.UNIX_EPOCH)).toDate().toISOString(),
		new Date(0).toISOString(),
	);
});

Deno.test('to ISO', () => {
	assertEquals(
		(new PLDate(0)).toISOString(),
		'2001-01-01T00:00:00.000Z',
	);
	assertEquals(
		(new PLDate(PLDate.UNIX_EPOCH)).toISOString(),
		new Date(0).toISOString(),
	);
});

Deno.test('now', () => {
	const befUMS = Date.now();
	const now = PLDate.now();
	const aftUMS = Date.now();

	const nowUMS = (now - PLDate.UNIX_EPOCH) * 1000;
	assertGreaterOrEqual(nowUMS, befUMS);
	assertLessOrEqual(nowUMS, aftUMS);
});

Deno.test('from date', () => {
	assertEquals(
		PLDate.from(new Date(0)).toDate().toISOString(),
		new Date(0).toISOString(),
	);
});

Deno.test('parse', () => {
	assertEquals(PLDate.parse('2001-01-01T00:00:00.000Z'), 0);
	assertEquals(PLDate.parse(new Date(0).toISOString()), PLDate.UNIX_EPOCH);
	assertEquals(PLDate.parse('+2004-11-29T21:33:09.000Z'), 123456789);
	assertEquals(PLDate.parse('BAD'), NaN);
	assertEquals(PLDate.parse('1'), NaN);
	assertEquals(PLDate.parse(''), NaN);
});

Deno.test('parse second over', () => {
	const date = new PLDate();

	date.time = PLDate.parse('2004-01-01T00:00:00.000Z');
	date.second = 60;
	assertEquals(date.time, PLDate.parse('2004-01-01T00:00:60.000Z'));

	date.time = PLDate.parse('2004-01-01T00:00:00.000Z');
	date.second = 99;
	assertEquals(date.time, PLDate.parse('2004-01-01T00:00:99.000Z'));
});

Deno.test('parse minute over', () => {
	const date = new PLDate();

	date.time = PLDate.parse('2004-01-01T00:00:00.000Z');
	date.minute = 60;
	assertEquals(date.time, PLDate.parse('2004-01-01T00:60:00.000Z'));

	date.time = PLDate.parse('2004-01-01T00:00:00.000Z');
	date.minute = 99;
	assertEquals(date.time, PLDate.parse('2004-01-01T00:99:00.000Z'));
});

Deno.test('parse hour over', () => {
	const date = new PLDate();

	date.time = PLDate.parse('2004-01-01T00:00:00.000Z');
	date.hour = 60;
	assertEquals(date.time, PLDate.parse('2004-01-01T60:00:00.000Z'));

	date.time = PLDate.parse('2004-01-01T00:00:00.000Z');
	date.hour = 99;
	assertEquals(date.time, PLDate.parse('2004-01-01T99:00:00.000Z'));
});

Deno.test('parse day under over', () => {
	const date = new PLDate();

	date.time = PLDate.parse('2004-01-01T00:00:00.000Z');
	date.day = 0;
	assertEquals(PLDate.parse('2004-01-00T00:00:00.000Z'), date.time);

	date.time = PLDate.parse('2004-01-01T00:00:00.000Z');
	date.day = 32;
	assertEquals(PLDate.parse('2004-01-32T00:00:00.000Z'), date.time);

	date.time = PLDate.parse('2004-01-01T00:00:00.000Z');
	date.day = 99;
	assertEquals(PLDate.parse('2004-01-99T00:00:00.000Z'), date.time);
});

Deno.test('parse month under over', () => {
	const date = new PLDate();

	date.time = PLDate.parse('2004-01-01T00:00:00.000Z');
	date.month = 0;
	assertEquals(PLDate.parse('2004-00-01T00:00:00.000Z'), date.time);

	date.time = PLDate.parse('2004-01-01T00:00:00.000Z');
	date.month = 13;
	assertEquals(PLDate.parse('2004-13-01T00:00:00.000Z'), date.time);

	date.time = PLDate.parse('2004-01-01T00:00:00.000Z');
	date.month = 25;
	assertEquals(PLDate.parse('2004-25-01T00:00:00.000Z'), date.time);

	date.time = PLDate.parse('2004-01-01T00:00:00.000Z');
	date.month = 99;
	assertEquals(PLDate.parse('2004-99-01T00:00:00.000Z'), date.time);
});

Deno.test('is type', () => {
	assertEquals(PLDate.is(new PLDate()), true);
	assertEquals(PLDate.is(new PLReal()), false);
	assertEquals(PLDate.is({}), false);
	assertEquals(PLDate.is(null), false);

	for (const v of [new PLDate(), new PLReal(), {}, null]) {
		if (PLDate.is(v)) {
			assertEquals(v.time, 0);
		}
	}
});

Deno.test('set year', () => {
	const deltas = [
		...(new Array(800)).fill(0).map((_, i) => i),
		Math.PI,
		NaN,
	];
	for (const start of startTimes) {
		for (const year of new Set([...deltas, ...deltas.map((d) => -d)])) {
			const pld = new PLDate(start);
			pld.year = year;
			const jsd = new Date((start - PLDate.UNIX_EPOCH) * 1000);
			jsd.setUTCFullYear(year || 0);
			assertEquals(pld.toISOString(), jsd.toISOString());
		}
	}
});

Deno.test('set month', () => {
	const deltas = [
		...(new Array(5000)).fill(0).map((_, i) => i),
		Math.PI,
		NaN,
	];
	for (const start of startTimes) {
		for (const month of new Set([...deltas, ...deltas.map((d) => -d)])) {
			const pld = new PLDate(start);
			pld.month = month;
			const jsd = new Date((start - PLDate.UNIX_EPOCH) * 1000);
			jsd.setUTCMonth((month || 0) - 1);
			assertEquals(pld.toISOString(), jsd.toISOString());
		}
	}
});

Deno.test('set day', () => {
	const deltas = [
		...new Array(1000).fill(0).map((_, i) => i),
		10000,
		Math.PI,
		NaN,
	];
	const allDeltas = new Set([...deltas, ...deltas.map((d) => -d)]);
	for (const start of startTimes) {
		for (const day of allDeltas) {
			const tag = `${start}: ${day}`;
			const pld = new PLDate(start);
			pld.day = day;
			const jsd = new Date((start - PLDate.UNIX_EPOCH) * 1000);
			jsd.setUTCDate(day || 0);
			assertEquals(pld.toISOString(), jsd.toISOString(), tag);
		}
	}
});

Deno.test('set hour', () => {
	const deltas = [
		0,
		1,
		2,
		12,
		24,
		25,
		48,
		1000000,
		Math.PI,
		NaN,
	];
	const allDeltas = new Set([...deltas, ...deltas.map((d) => -d)]);
	for (const start of startTimes) {
		for (const hour of allDeltas) {
			const tag = `${start}: ${hour}`;
			const pld = new PLDate(start);
			pld.hour = hour;
			const jsd = new Date((start - PLDate.UNIX_EPOCH) * 1000);
			jsd.setUTCHours(hour || 0);
			assertEquals(pld.toISOString(), jsd.toISOString(), tag);
		}
	}
});

Deno.test('set minute', () => {
	const deltas = [
		0,
		1,
		2,
		59,
		60,
		61,
		120,
		1000000,
		Math.PI,
		NaN,
	];
	const allDeltas = new Set([...deltas, ...deltas.map((d) => -d)]);
	for (const start of startTimes) {
		for (const minute of allDeltas) {
			const tag = `${start}: ${minute}`;
			const pld = new PLDate(start);
			pld.minute = minute;
			const jsd = new Date((start - PLDate.UNIX_EPOCH) * 1000);
			jsd.setUTCMinutes(minute || 0);
			assertEquals(pld.toISOString(), jsd.toISOString(), tag);
		}
	}
});

Deno.test('set second', () => {
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
		NaN,
	];
	const allDeltas = new Set([...deltas, ...deltas.map((d) => -d)]);
	for (const start of startTimes) {
		for (const second of allDeltas) {
			const tag = `${start}: ${second}`;
			const pld = new PLDate(start);
			pld.second = second;
			const jsd = new Date((start - PLDate.UNIX_EPOCH) * 1000);
			jsd.setUTCMilliseconds(Math.floor(second * 1000) || 0);
			assertEquals(pld.toISOString(), jsd.toISOString(), tag);
		}
	}
});

Deno.test('time to date', () => {
	for (const [iso, time] of sampleISO) {
		assertEquals(PLDate.ISO(time), iso);

		const date = new PLDate(time);
		assertEquals(date.toISOString(), iso);

		const [_, Y, M, D, h, m, s] = iso.match(rISO)!;
		assertStrictEquals(date.year, +Y);
		assertStrictEquals(date.month, +M);
		assertStrictEquals(date.day, +D);
		assertStrictEquals(date.hour, +h);
		assertStrictEquals(date.minute, +m);
		assertAlmostEquals(date.second, +s, 0.001);
		assertStrictEquals(
			`${date.second * 1000 | 0}`.padStart(5, '0'),
			s.replace('.', ''),
		);
	}
});

Deno.test('date to time', () => {
	for (const [iso, time] of sampleISO) {
		const parsed = PLDate.parse(iso);
		if (Number.isNaN(time)) {
			assertStrictEquals(parsed, 0);
			continue;
		}
		if (time === Infinity) {
			assertStrictEquals(parsed, timePosInf);
			continue;
		}
		if (time === -Infinity) {
			assertStrictEquals(parsed, timeNegInf);
			continue;
		}
		if (iso.endsWith('.000Z')) {
			assertStrictEquals(parsed, Math.round(time));
			continue;
		}
		assertAlmostEquals(parsed, time, 0.001);
	}
});

Deno.test('every day 1990', () => {
	let i = 0;
	const months = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	for (const [month, days] of months.entries()) {
		const mm = `${month + 1}`.padStart(2, '0');
		for (let day = 0; day < days; day++) {
			const dd = `${day + 1}`.padStart(2, '0');
			const iso = `1990-${mm}-${dd}T00:00:00.000Z`;
			const time = -347155200 + 86400 * i++;
			assertEquals(PLDate.ISO(time), iso);

			const date = new PLDate(time);
			assertEquals(date.toISOString(), iso);
			assertStrictEquals(date.year, 1990);
			assertStrictEquals(date.month, month + 1);
			assertStrictEquals(date.day, day + 1);
			assertStrictEquals(date.hour, 0);
			assertStrictEquals(date.minute, 0);
			assertAlmostEquals(date.second, 0);

			assertEquals(PLDate.parse(iso), time);
		}
	}
});

Deno.test('every day 2001', () => {
	let i = 0;
	const months = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	for (const [month, days] of months.entries()) {
		const mm = `${month + 1}`.padStart(2, '0');
		for (let day = 0; day < days; day++) {
			const dd = `${day + 1}`.padStart(2, '0');
			const iso = `2001-${mm}-${dd}T00:00:00.000Z`;
			const time = 86400 * i++;
			assertEquals(PLDate.ISO(time), iso);

			const date = new PLDate(time);
			assertEquals(date.toISOString(), iso);
			assertStrictEquals(date.year, 2001);
			assertStrictEquals(date.month, month + 1);
			assertStrictEquals(date.day, day + 1);
			assertStrictEquals(date.hour, 0);
			assertStrictEquals(date.minute, 0);
			assertAlmostEquals(date.second, 0);

			assertEquals(PLDate.parse(iso), time);
		}
	}
});

Deno.test('every day 2004', () => {
	let i = 0;
	const months = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	for (const [month, days] of months.entries()) {
		const mm = `${month + 1}`.padStart(2, '0');
		for (let day = 0; day < days; day++) {
			const dd = `${day + 1}`.padStart(2, '0');
			const iso = `2004-${mm}-${dd}T00:00:00.000Z`;
			const time = 94608000 + 86400 * i++;
			assertEquals(PLDate.ISO(time), iso);

			const date = new PLDate(time);
			assertEquals(date.toISOString(), iso);
			assertStrictEquals(date.year, 2004);
			assertStrictEquals(date.month, month + 1);
			assertStrictEquals(date.day, day + 1);
			assertStrictEquals(date.hour, 0);
			assertStrictEquals(date.minute, 0);
			assertAlmostEquals(date.second, 0);

			assertEquals(PLDate.parse(iso), time);
		}
	}
});
