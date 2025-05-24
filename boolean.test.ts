import { assertEquals } from '@std/assert';
import { PLBoolean } from './boolean.ts';

Deno.test('initial value', () => {
	assertEquals(new PLBoolean().value, false);
	assertEquals(new PLBoolean(true).value, true);
	assertEquals(new PLBoolean(false).value, false);
});

Deno.test('set value', () => {
	const integer = new PLBoolean();
	integer.value = true;
	assertEquals(integer.value, true);
	integer.value = false;
	assertEquals(integer.value, false);
});

Deno.test('is type', () => {
	const boolean = new PLBoolean();

	assertEquals(PLBoolean.is(boolean), true);
	assertEquals(PLBoolean.is({}), false);
	assertEquals(PLBoolean.is(null), false);

	for (const v of [boolean, {}, null]) {
		if (PLBoolean.is(v)) {
			assertEquals(v.value, false);
		}
	}
});
