import { assertEquals } from '@std/assert';
import { PLInteger } from './integer.ts';
import { PLReal } from './real.ts';

const { MAX_VALUE, MIN_VALUE } = PLInteger;

Deno.test('initial value', () => {
	assertEquals(new PLInteger().value, 0n);
	assertEquals(new PLInteger(42n).value, 42n);
});

Deno.test('set value', () => {
	const pl = new PLInteger();
	pl.value = -42n;
	assertEquals(pl.value, -42n);
});

Deno.test('value clamped', () => {
	const pl = new PLInteger();

	assertEquals(new PLInteger(MAX_VALUE).value, MAX_VALUE);
	pl.value = MAX_VALUE;
	assertEquals(pl.value, MAX_VALUE);

	assertEquals(new PLInteger(MAX_VALUE + 1n).value, MAX_VALUE);
	pl.value = MAX_VALUE + 1n;
	assertEquals(pl.value, MAX_VALUE);

	assertEquals(new PLInteger(MAX_VALUE + 2n).value, MAX_VALUE);
	pl.value = MAX_VALUE + 2n;
	assertEquals(pl.value, MAX_VALUE);

	assertEquals(new PLInteger(MAX_VALUE * 2n).value, MAX_VALUE);
	pl.value = MAX_VALUE * 2n;
	assertEquals(pl.value, MAX_VALUE);

	assertEquals(new PLInteger(MIN_VALUE).value, MIN_VALUE);
	pl.value = MIN_VALUE;
	assertEquals(pl.value, MIN_VALUE);

	assertEquals(new PLInteger(MIN_VALUE - 1n).value, MIN_VALUE);
	pl.value = MIN_VALUE - 1n;
	assertEquals(pl.value, MIN_VALUE);

	assertEquals(new PLInteger(MIN_VALUE - 2n).value, MIN_VALUE);
	pl.value = MIN_VALUE - 2n;
	assertEquals(pl.value, MIN_VALUE);

	assertEquals(new PLInteger(MIN_VALUE * 2n).value, MIN_VALUE);
	pl.value = MIN_VALUE * 2n;
	assertEquals(pl.value, MIN_VALUE);
});

Deno.test('is type', () => {
	assertEquals(PLInteger.is(new PLInteger()), true);
	assertEquals(PLInteger.is(new PLReal()), false);
	assertEquals(PLInteger.is({}), false);
	assertEquals(PLInteger.is(null), false);

	for (const v of [new PLInteger(), new PLReal(), {}, null]) {
		if (PLInteger.is(v)) {
			assertEquals(v.value, 0n);
		}
	}
});
