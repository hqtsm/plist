import { assertEquals } from '@std/assert';
import { PLInteger } from './integer.ts';
import { PLUID } from './uid.ts';

const { MAX_VALUE, MIN_VALUE } = PLUID;

Deno.test('initial value', () => {
	assertEquals(new PLUID().value, 0n);
	assertEquals(new PLUID(42n).value, 42n);
});

Deno.test('set value', () => {
	const integer = new PLUID();
	integer.value = 42n;
	assertEquals(integer.value, 42n);
});

Deno.test('value clamped', () => {
	const integer = new PLUID();

	assertEquals(new PLUID(MAX_VALUE).value, MAX_VALUE);
	integer.value = MAX_VALUE;
	assertEquals(integer.value, MAX_VALUE);

	assertEquals(new PLUID(MAX_VALUE + 1n).value, MAX_VALUE);
	integer.value = MAX_VALUE + 1n;
	assertEquals(integer.value, MAX_VALUE);

	assertEquals(new PLUID(MAX_VALUE + 2n).value, MAX_VALUE);
	integer.value = MAX_VALUE + 2n;
	assertEquals(integer.value, MAX_VALUE);

	assertEquals(new PLUID(MAX_VALUE * 2n).value, MAX_VALUE);
	integer.value = MAX_VALUE * 2n;
	assertEquals(integer.value, MAX_VALUE);

	assertEquals(new PLUID(MIN_VALUE).value, MIN_VALUE);
	integer.value = MIN_VALUE;
	assertEquals(integer.value, MIN_VALUE);

	assertEquals(new PLUID(MIN_VALUE - 1n).value, MIN_VALUE);
	integer.value = MIN_VALUE - 1n;
	assertEquals(integer.value, MIN_VALUE);

	assertEquals(new PLUID(MIN_VALUE - 2n).value, MIN_VALUE);
	integer.value = MIN_VALUE - 2n;
	assertEquals(integer.value, MIN_VALUE);

	assertEquals(new PLUID(MIN_VALUE * 2n).value, MIN_VALUE);
	integer.value = MIN_VALUE * 2n;
	assertEquals(integer.value, MIN_VALUE);
});

Deno.test('is type', () => {
	const integer = new PLUID();

	assertEquals(PLUID.is(integer), true);
	assertEquals(PLUID.is(new PLInteger()), false);
	assertEquals(PLUID.is({}), false);
	assertEquals(PLUID.is(null), false);

	for (const v of [integer, new PLInteger(), {}, null]) {
		if (PLUID.is(v)) {
			assertEquals(v.value, 0n);
		}
	}
});
