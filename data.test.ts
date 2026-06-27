import {
	assertEquals,
	assertInstanceOf,
	assertStrictEquals,
} from '@std/assert';
import { PLData, PLTYPE_DATA } from './data.ts';
import { PLBoolean } from './boolean.ts';

Deno.test('initial value', () => {
	assertInstanceOf(
		(
			new PLData(new ArrayBuffer(0)) satisfies ArrayBufferView<
				ArrayBuffer
			>
		)
			.buffer,
		ArrayBuffer,
	);
	assertEquals(new PLData(new ArrayBuffer(0)).buffer.byteLength, 0);
	assertEquals(new PLData(new ArrayBuffer(0)).byteLength, 0);
	assertEquals(new PLData(new ArrayBuffer(0)).byteOffset, 0);

	{
		const ab = new ArrayBuffer(8);
		const ua = new Uint8Array(ab);

		const pl = new PLData(ab);
		assertEquals(pl.byteOffset, ua.byteOffset);
		assertEquals(pl.byteLength, ua.byteLength);
	}
	{
		const ab = new ArrayBuffer(8);
		const ua = new Uint8Array(ab, 1);

		const pl = new PLData(ab, 1);
		assertEquals(pl.byteOffset, ua.byteOffset);
		assertEquals(pl.byteLength, ua.byteLength);
	}
	{
		const ab = new ArrayBuffer(8);
		const ua = new Uint8Array(ab, 8);

		const pl = new PLData(ab, 8);
		assertEquals(pl.byteOffset, ua.byteOffset);
		assertEquals(pl.byteLength, ua.byteLength);
	}
	{
		const ab = new ArrayBuffer(9, { maxByteLength: 9 });
		const ua = new Uint8Array(ab, 9);
		ab.resize(8);

		const pl = new PLData(ab, 9);
		assertEquals(pl.byteOffset, ua.byteOffset);
		assertEquals(pl.byteLength, ua.byteLength);
	}
	{
		const ab = new ArrayBuffer(8);
		const ua = new Uint8Array(ab, 2, 4);

		const pl = new PLData(ab, 2, 4);
		assertEquals(pl.byteOffset, ua.byteOffset);
		assertEquals(pl.byteLength, ua.byteLength);
	}
	{
		const ab = new ArrayBuffer(8, { maxByteLength: 8 });
		const ua = new Uint8Array(ab, 2, 4);
		ab.resize(4);

		const pl = new PLData(ab, 8);
		assertEquals(pl.byteOffset, ua.byteOffset);
		assertEquals(pl.byteLength, ua.byteLength);
	}
});

Deno.test('valueOf', () => {
	const pl = new PLData(new ArrayBuffer(42));
	assertStrictEquals(pl.valueOf(), pl.buffer);
});

Deno.test('toString', () => {
	const pl = new PLData(new ArrayBuffer(256));
	const a = new Uint8Array(pl.buffer);
	let e = '';
	for (let i = 0; i < 256; i++) {
		a[i] = i;
		e += String.fromCharCode(i);
	}
	assertEquals(pl.toString(), e);
});

Deno.test('is type', () => {
	assertEquals(new PLData(new ArrayBuffer()).type, PLTYPE_DATA);
	assertEquals(
		new PLData(new ArrayBuffer())[Symbol.toStringTag],
		PLTYPE_DATA,
	);
	assertEquals(
		Object.prototype.toString.call(new PLData(new ArrayBuffer())),
		`[object ${PLTYPE_DATA}]`,
	);

	assertEquals(PLData.is(new PLData(new ArrayBuffer())), true);
	assertEquals(PLData.is(new PLBoolean()), false);
	assertEquals(PLData.is({}), false);
	assertEquals(PLData.is(null), false);

	for (
		const v of [new PLData(new ArrayBuffer()), new PLBoolean(), {}, null]
	) {
		if (PLData.is(v)) {
			assertEquals(v.byteLength, 0);
		}
	}
});
