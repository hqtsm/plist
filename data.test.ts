import { assertEquals } from '@std/assert';
import { PLData, PLTYPE_DATA } from './data.ts';
import { PLBoolean } from './boolean.ts';

Deno.test('initial value', () => {
	assertEquals(new PLData().buffer.byteLength, 0);
	assertEquals(new PLData().byteLength, 0);
	assertEquals(new PLData(42).buffer.byteLength, 42);
	assertEquals(new PLData(42).byteLength, 42);
});

Deno.test('is type', () => {
	assertEquals(new PLData().type, PLTYPE_DATA);
	assertEquals(new PLData()[Symbol.toStringTag], PLTYPE_DATA);
	assertEquals(
		Object.prototype.toString.call(new PLData()),
		`[object ${PLTYPE_DATA}]`,
	);

	assertEquals(PLData.is(new PLData()), true);
	assertEquals(PLData.is(new PLBoolean()), false);
	assertEquals(PLData.is({}), false);
	assertEquals(PLData.is(null), false);

	for (const v of [new PLData(), new PLBoolean(), {}, null]) {
		if (PLData.is(v)) {
			assertEquals(v.byteLength, 0);
		}
	}
});
