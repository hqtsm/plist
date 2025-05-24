import { assertEquals } from '@std/assert';
import { PLInteger } from './integer.ts';

const { MAX_VALUE, MIN_VALUE } = PLInteger;

Deno.test('initial value', () => {
	assertEquals(new PLInteger().value, 0n);
	assertEquals(new PLInteger(42n).value, 42n);
});

Deno.test('set value', () => {
	const integer = new PLInteger();
	integer.value = -42n;
	assertEquals(integer.value, -42n);
});

Deno.test('value clamped', () => {
	const integer = new PLInteger();

	assertEquals(new PLInteger(MAX_VALUE).value, MAX_VALUE);
	integer.value = MAX_VALUE;
	assertEquals(integer.value, MAX_VALUE);

	assertEquals(new PLInteger(MAX_VALUE + 1n).value, MAX_VALUE);
	integer.value = MAX_VALUE + 1n;
	assertEquals(integer.value, MAX_VALUE);

	assertEquals(new PLInteger(MAX_VALUE + 2n).value, MAX_VALUE);
	integer.value = MAX_VALUE + 2n;
	assertEquals(integer.value, MAX_VALUE);

	assertEquals(new PLInteger(MAX_VALUE * 2n).value, MAX_VALUE);
	integer.value = MAX_VALUE * 2n;
	assertEquals(integer.value, MAX_VALUE);

	assertEquals(new PLInteger(MIN_VALUE).value, MIN_VALUE);
	integer.value = MIN_VALUE;
	assertEquals(integer.value, MIN_VALUE);

	assertEquals(new PLInteger(MIN_VALUE - 1n).value, MIN_VALUE);
	integer.value = MIN_VALUE - 1n;
	assertEquals(integer.value, MIN_VALUE);

	assertEquals(new PLInteger(MIN_VALUE - 2n).value, MIN_VALUE);
	integer.value = MIN_VALUE - 2n;
	assertEquals(integer.value, MIN_VALUE);

	assertEquals(new PLInteger(MIN_VALUE * 2n).value, MIN_VALUE);
	integer.value = MIN_VALUE * 2n;
	assertEquals(integer.value, MIN_VALUE);
});

Deno.test('is integer', () => {
	const integer = new PLInteger();
	const unknown = { [Symbol.toStringTag]: 'PLUnknown' };
	assertEquals(PLInteger.is(integer), true);
	assertEquals(PLInteger.is(unknown), false);
	for (const v of [integer, unknown]) {
		if (PLInteger.is(v)) {
			assertEquals(v.value, 0n);
		}
	}
});
