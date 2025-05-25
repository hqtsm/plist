import {
	assertEquals,
	assertGreaterOrEqual,
	assertLessOrEqual,
} from '@std/assert';
import { PLDate } from './date.ts';
import { PLReal } from './real.ts';

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

Deno.test('from date', () => {
	assertEquals(
		PLDate.fromDate(new Date(0)).toDate().toISOString(),
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
