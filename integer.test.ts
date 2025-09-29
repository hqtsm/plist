import { assertEquals, assertThrows } from '@std/assert';
import { PLInteger, PLTYPE_INTEGER } from './integer.ts';
import { PLReal } from './real.ts';

Deno.test('initial value', () => {
	assertEquals(new PLInteger().value, 0n);
	assertEquals(new PLInteger(42n).value, 42n);
});

Deno.test('set value', () => {
	const pl = new PLInteger();
	pl.value = -42n;
	assertEquals(pl.value, -42n);
	assertEquals(pl.bits, 64);

	pl.bits = 128;
	assertEquals(pl.bits, 128);
	assertEquals(pl.value, -42n);
	pl.value = 0x18171615141312110807060504030201n;
	assertEquals(pl.value, 0x18171615141312110807060504030201n);

	pl.bits = 64;
	assertEquals(pl.bits, 64);
	assertEquals(pl.value, 0x0807060504030201n);

	pl.bits = 32;
	assertEquals(pl.bits, 32);
	assertEquals(pl.value, 0x04030201n);

	pl.bits = 16;
	assertEquals(pl.bits, 16);
	assertEquals(pl.value, 0x0201n);

	pl.bits = 8;
	assertEquals(pl.bits, 8);
	assertEquals(pl.value, 0x01n);
});

Deno.test('round bits', () => {
	for (const bits of [32.1, 32.5, 32.9]) {
		assertEquals(new PLInteger(0n, bits as 32).bits, 32);
	}
});

Deno.test('bad bits', () => {
	for (const bits of [0, -1, NaN, Infinity, -Infinity, 33]) {
		const tag = `bits: ${bits}`;
		assertThrows(
			() => {
				new PLInteger(0n, bits as 32);
			},
			RangeError,
			'Invalid bits',
			tag,
		);
		const pl = new PLInteger(0x1122334455n);
		assertThrows(
			() => {
				pl.bits = bits as 32;
			},
			RangeError,
			'Invalid bits',
			tag,
		);
		assertEquals(pl.bits, 64, tag);
		assertEquals(pl.value, 0x1122334455n, tag);
	}
});

Deno.test('value wrap', () => {
	const pl = new PLInteger();
	for (const bits of [8, 16, 32, 64, 128] as const) {
		pl.bits = bits;
		const max = (1n << BigInt(bits - 1)) - 1n;
		const min = -(max + 1n);
		for (
			const [i, w] of [
				[0n, 0n],
				[1n, 1n],
				[2n, 2n],
				[max, max],
				[max + 1n, min],
				[max + 2n, min + 1n],
				[min, min],
				[min - 1n, max],
				[min - 2n, max - 1n],
			]
		) {
			assertEquals(new PLInteger(i, bits).value, w, `${i} -> ${w}`);
			pl.value = i;
			assertEquals(pl.value, w, `${i} -> ${w}`);
		}
	}
});

Deno.test('valueOf', () => {
	const pl = new PLInteger();
	assertEquals(pl.valueOf(), 0n);
	pl.value = 42n;
	assertEquals(pl.valueOf(), 42n);
	pl.value = -42n;
	assertEquals(pl.valueOf(), -42n);
});

Deno.test('toString', () => {
	const pl = new PLInteger();
	assertEquals(pl.valueOf(), 0n);
	pl.value = 42n;
	assertEquals(pl.toString(), '42');
	pl.value = -42n;
	assertEquals(pl.toString(), '-42');
});

Deno.test('is type', () => {
	assertEquals(new PLInteger().type, PLTYPE_INTEGER);
	assertEquals(new PLInteger()[Symbol.toStringTag], PLTYPE_INTEGER);
	assertEquals(
		Object.prototype.toString.call(new PLInteger()),
		`[object ${PLTYPE_INTEGER}]`,
	);

	assertEquals(PLInteger.is(new PLInteger()), true);
	assertEquals(PLInteger.is(new PLReal()), false);
	assertEquals(PLInteger.is({}), false);
	assertEquals(PLInteger.is(null), false);

	for (const v of [new PLInteger(), new PLReal(), {}, null]) {
		if (PLInteger.is(v)) {
			assertEquals(v.value, 0n);
		}
	}
});
