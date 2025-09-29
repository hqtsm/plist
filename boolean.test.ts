import { assertEquals } from '@std/assert';
import { PLBoolean, PLTYPE_BOOLEAN } from './boolean.ts';
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

Deno.test('valueOf', () => {
	const pl = new PLBoolean(true);
	assertEquals(pl.valueOf(), true);
	pl.value = false;
	assertEquals(pl.valueOf(), false);
});

Deno.test('toString', () => {
	const pl = new PLBoolean(true);
	assertEquals(pl.toString(), 'true');
	pl.value = false;
	assertEquals(pl.toString(), 'false');
});

Deno.test('is type', () => {
	assertEquals(new PLBoolean().type, PLTYPE_BOOLEAN);
	assertEquals(new PLBoolean()[Symbol.toStringTag], PLTYPE_BOOLEAN);
	assertEquals(
		Object.prototype.toString.call(new PLBoolean()),
		`[object ${PLTYPE_BOOLEAN}]`,
	);

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
