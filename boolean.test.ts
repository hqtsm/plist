import { assertEquals } from '@std/assert';
import { PLBoolean } from './boolean.ts';
import { PLInteger } from './integer.ts';

Deno.test('initial value', () => {
	assertEquals(new PLBoolean().value, false);
	assertEquals(new PLBoolean(true).value, true);
	assertEquals(new PLBoolean(false).value, false);
});

Deno.test('set value', () => {
	const pl = new PLBoolean();
	pl.value = true;
	assertEquals(pl.value, true);
	pl.value = false;
	assertEquals(pl.value, false);
});

Deno.test('is type', () => {
	assertEquals(PLBoolean.is(new PLBoolean()), true);
	assertEquals(PLBoolean.is(new PLInteger()), false);
	assertEquals(PLBoolean.is({}), false);
	assertEquals(PLBoolean.is(null), false);

	for (const v of [new PLBoolean(), new PLInteger(), {}, null]) {
		if (PLBoolean.is(v)) {
			assertEquals(v.value, false);
		}
	}
});
