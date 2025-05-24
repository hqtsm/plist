import { assertEquals } from '@std/assert';
import { PLReal } from './real.ts';
import { PLInteger } from './integer.ts';

const PI64 = Math.PI;
const PI32 = Math.fround(PI64);

Deno.test('initial value', () => {
	assertEquals(new PLReal().value, 0);
	assertEquals(new PLReal().bits, 64);
	assertEquals(new PLReal(PI64).value, PI64);
	assertEquals(new PLReal(0, 64).bits, 64);
	assertEquals(new PLReal(PI64, 64).value, PI64);
	assertEquals(new PLReal(0, 32).bits, 32);
	assertEquals(new PLReal(PI64, 32).value, PI32);
	assertEquals(new PLReal(PI64, 32).bits, 32);
});

Deno.test('set value', () => {
	const pl = new PLReal();
	assertEquals(pl.bits, 64);
	pl.value = PI64;
	assertEquals(pl.value, PI64);
	pl.bits = 32;
	assertEquals(pl.bits, 32);
	pl.bits = 32;
	assertEquals(pl.value, PI32);
	pl.value = PI64;
	assertEquals(pl.value, PI32);
	pl.bits = 64;
	assertEquals(pl.bits, 64);
	pl.bits = 64;
	assertEquals(pl.value, PI32);
	pl.value = PI64;
	assertEquals(pl.value, PI64);
});

Deno.test('is type', () => {
	assertEquals(PLReal.is(new PLReal()), true);
	assertEquals(PLReal.is(new PLInteger()), false);
	assertEquals(PLReal.is({}), false);
	assertEquals(PLReal.is(null), false);

	for (const v of [new PLReal(), new PLInteger(), {}, null]) {
		if (PLReal.is(v)) {
			assertEquals(v.value, 0);
		}
	}
});
