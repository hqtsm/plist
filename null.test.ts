import { assertEquals } from '@std/assert';
import { PLBoolean } from './boolean.ts';
import { PLNull, PLTYPE_NULL } from './null.ts';

Deno.test('valueOf', () => {
	const pl = new PLNull();
	assertEquals(pl.valueOf(), null);
});

Deno.test('toString', () => {
	const pl = new PLNull();
	assertEquals(pl.toString(), 'null');
});

Deno.test('is type', () => {
	assertEquals(new PLNull().type, PLTYPE_NULL);
	assertEquals(new PLNull()[Symbol.toStringTag], PLTYPE_NULL);
	assertEquals(
		Object.prototype.toString.call(new PLNull()),
		`[object ${PLTYPE_NULL}]`,
	);

	assertEquals(PLNull.is(new PLNull()), true);
	assertEquals(PLNull.is(new PLBoolean()), false);
	assertEquals(PLNull.is({}), false);
	assertEquals(PLNull.is(null), false);

	for (const v of [new PLNull(), new PLBoolean(), {}, null]) {
		if (PLNull.is(v)) {
			assertEquals(v.valueOf(), null);
		}
	}
});
