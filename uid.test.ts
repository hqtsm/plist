import { assertEquals } from '@std/assert';
import { PLInteger } from './integer.ts';
import { PLUID } from './uid.ts';

const MAX_U32 = 0xffffffffn;

Deno.test('initial value', () => {
	assertEquals(new PLUID().value, 0n);
	assertEquals(new PLUID(42n).value, 42n);
});

Deno.test('set value', () => {
	const pl = new PLUID();
	pl.value = 42n;
	assertEquals(pl.value, 42n);
});

Deno.test('value wrap', () => {
	const pl = new PLUID();
	for (
		const [i, w] of [
			[0n, 0n],
			[1n, 1n],
			[2n, 2n],
			[MAX_U32, MAX_U32],
			[MAX_U32 + 1n, 0n],
			[MAX_U32 + 2n, 1n],
			[-1n, MAX_U32],
			[-2n, MAX_U32 - 1n],
		]
	) {
		assertEquals(new PLUID(i).value, w, `${i} -> ${w}`);
		pl.value = i;
		assertEquals(pl.value, w, `${i} -> ${w}`);
	}
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
