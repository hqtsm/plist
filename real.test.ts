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
	const real = new PLReal();
	assertEquals(real.bits, 64);
	real.value = PI64;
	assertEquals(real.value, PI64);
	real.bits = 32;
	assertEquals(real.bits, 32);
	real.bits = 32;
	assertEquals(real.value, PI32);
	real.value = PI64;
	assertEquals(real.value, PI32);
	real.bits = 64;
	assertEquals(real.bits, 64);
	real.bits = 64;
	assertEquals(real.value, PI32);
	real.value = PI64;
	assertEquals(real.value, PI64);
});

Deno.test('is type', () => {
	const real = new PLReal();

	assertEquals(PLReal.is(real), true);
	assertEquals(PLReal.is(new PLInteger()), false);
	assertEquals(PLReal.is({}), false);
	assertEquals(PLReal.is(null), false);

	for (const v of [real, new PLInteger(), {}, null]) {
		if (PLReal.is(v)) {
			assertEquals(v.value, 0);
		}
	}
});
