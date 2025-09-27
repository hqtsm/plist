import { assertEquals } from '@std/assert';
import { PLString, PLTYPE_STRING } from './string.ts';
import { PLBoolean } from './boolean.ts';

const edge = '[\0][\u00f7][\u03a9][\u2705][\uff0b][\u{1f916}]';

Deno.test('initial value', () => {
	assertEquals(new PLString().value, '');
	assertEquals(new PLString().length, 0);
	assertEquals(new PLString('Hello world!').value, 'Hello world!');
	assertEquals(new PLString(edge).value, edge);
});

Deno.test('set value', () => {
	const pl = new PLString();
	pl.value = edge;
	assertEquals(pl.value, edge);
	assertEquals(pl.value.length, edge.length);
	pl.value = '';
	assertEquals(pl.value, '');
	assertEquals(pl.value.length, 0);
});

Deno.test('is type', () => {
	assertEquals(new PLString().type, PLTYPE_STRING);
	assertEquals(new PLString()[Symbol.toStringTag], PLTYPE_STRING);
	assertEquals(
		Object.prototype.toString.call(new PLString()),
		`[object ${PLTYPE_STRING}]`,
	);

	assertEquals(PLString.is(new PLString()), true);
	assertEquals(PLString.is(new PLBoolean()), false);
	assertEquals(PLString.is({}), false);
	assertEquals(PLString.is(null), false);

	for (const v of [new PLString(), new PLBoolean(), {}, null]) {
		if (PLString.is(v)) {
			assertEquals(v.value, '');
		}
	}
});
