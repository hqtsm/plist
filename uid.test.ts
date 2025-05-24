import { assertEquals } from '@std/assert';
import { PLInteger } from './integer.ts';
import { PLUID } from './uid.ts';

const { MAX_VALUE, MIN_VALUE } = PLUID;

Deno.test('initial value', () => {
	assertEquals(new PLUID().value, 0n);
	assertEquals(new PLUID(42n).value, 42n);
});

Deno.test('set value', () => {
	const pl = new PLUID();
	pl.value = 42n;
	assertEquals(pl.value, 42n);
});

Deno.test('value clamped', () => {
	const pl = new PLUID();

	assertEquals(new PLUID(MAX_VALUE).value, MAX_VALUE);
	pl.value = MAX_VALUE;
	assertEquals(pl.value, MAX_VALUE);

	assertEquals(new PLUID(MAX_VALUE + 1n).value, MAX_VALUE);
	pl.value = MAX_VALUE + 1n;
	assertEquals(pl.value, MAX_VALUE);

	assertEquals(new PLUID(MAX_VALUE + 2n).value, MAX_VALUE);
	pl.value = MAX_VALUE + 2n;
	assertEquals(pl.value, MAX_VALUE);

	assertEquals(new PLUID(MAX_VALUE * 2n).value, MAX_VALUE);
	pl.value = MAX_VALUE * 2n;
	assertEquals(pl.value, MAX_VALUE);

	assertEquals(new PLUID(MIN_VALUE).value, MIN_VALUE);
	pl.value = MIN_VALUE;
	assertEquals(pl.value, MIN_VALUE);

	assertEquals(new PLUID(MIN_VALUE - 1n).value, MIN_VALUE);
	pl.value = MIN_VALUE - 1n;
	assertEquals(pl.value, MIN_VALUE);

	assertEquals(new PLUID(MIN_VALUE - 2n).value, MIN_VALUE);
	pl.value = MIN_VALUE - 2n;
	assertEquals(pl.value, MIN_VALUE);

	assertEquals(new PLUID(MIN_VALUE * 2n).value, MIN_VALUE);
	pl.value = MIN_VALUE * 2n;
	assertEquals(pl.value, MIN_VALUE);
});

Deno.test('is type', () => {
	assertEquals(PLUID.is(new PLUID()), true);
	assertEquals(PLUID.is(new PLInteger()), false);
	assertEquals(PLUID.is({}), false);
	assertEquals(PLUID.is(null), false);

	for (const v of [new PLUID(), new PLInteger(), {}, null]) {
		if (PLUID.is(v)) {
			assertEquals(v.value, 0n);
		}
	}
});
