import { assertEquals, assertNotEquals, assertThrows } from '@std/assert';
import {
	type CharCodes,
	utf8Decode,
	utf8Encode,
	utf8Encode32,
	utf8Encoded,
	utf8Length,
	utf8Size,
	utf8Size32,
} from './utf8.ts';

const TE = new TextEncoder();

const BAD_UTF32 = [
	[1, new Uint32Array([...TE.encode('ABC'), 0xD800])],
	[2, new Uint32Array([...TE.encode('\n'), 0xDBFF])],
	[2, new Uint32Array([...TE.encode('\r'), 0xDC00])],
	[2, new Uint32Array([...TE.encode('\r\n'), 0xDFFF])],
	[3, new Uint32Array([...TE.encode('\n\n'), 0x110000])],
] as const;

function charCodes(a: Uint32Array): CharCodes {
	return {
		length: a.length,
		charCodeAt: (index: number) => a[index],
	};
}

Deno.test('utf8Size', () => {
	for (
		const s of [
			'',
			'A',
			'AB',
			'ABC',
			'\u2013',
			'\u00f7',
			'\u03a9',
			'\u2705',
			'\uff0b',
			'\ud83e\udd16',
		]
	) {
		const l = TE.encode(s).length;
		assertEquals(utf8Size(s), l, JSON.stringify(s));
		assertEquals(utf8Size(`${s}${s}`), l + l, JSON.stringify(`${s}${s}`));
	}
	assertEquals(utf8Size('\ud83e'), 0);
	assertEquals(utf8Size('\ud83e\ud83e'), 0);
	assertEquals(utf8Size('\ud83eA'), 1);
	assertEquals(utf8Size('\ud83e\ud83eA'), 1);
});

Deno.test('utf8Encode', () => {
	for (
		const s of [
			'',
			'A',
			'AB',
			'ABC',
			'\u2013',
			'\u00f7',
			'\u03a9',
			'\u2705',
			'\uff0b',
			'\ud83e\udd16',
		]
	) {
		const a1 = TE.encode(s);
		const a2 = new Uint8Array(a1.length);
		assertEquals(utf8Encode(s, a2, 0), a1.length);
		assertEquals(a1, a2, JSON.stringify(s));
		const b1 = TE.encode(`${s}${s}`);
		const b2 = new Uint8Array(b1.length);
		assertEquals(utf8Encode(`${s}${s}`, b2, 0), b1.length);
		assertEquals(b1, b2, JSON.stringify(`${s}${s}`));
	}
	const a = new Uint8Array(1);
	assertEquals(utf8Encode('\ud83e', a, 0), 0);
	assertEquals(utf8Encode('\ud83e\ud83e', a, 0), 0);
	assertEquals(utf8Encode('\ud83eA', a, 0), 1);
	assertEquals(a[0], 'A'.charCodeAt(0));
	a[0] = 0;
	assertEquals(utf8Encode('\ud83e\ud83eA', a, 0), 1);
	assertEquals(a[0], 'A'.charCodeAt(0));
});

Deno.test('utf8Size32', () => {
	assertEquals(utf8Size32(charCodes(new Uint32Array([0x0000]))), 1);
	assertEquals(utf8Size32(charCodes(new Uint32Array([0x007F]))), 1);
	assertEquals(utf8Size32(charCodes(new Uint32Array([0x0080]))), 2);
	assertEquals(utf8Size32(charCodes(new Uint32Array([0x07FF]))), 2);
	assertEquals(utf8Size32(charCodes(new Uint32Array([0x0800]))), 3);
	assertEquals(utf8Size32(charCodes(new Uint32Array([0xD800 - 1]))), 3);
	assertEquals(utf8Size32(charCodes(new Uint32Array([0xDFFF + 1]))), 3);
	assertEquals(utf8Size32(charCodes(new Uint32Array([0xFFFF]))), 3);
	assertEquals(utf8Size32(charCodes(new Uint32Array([0x10000]))), 4);
	assertEquals(utf8Size32(charCodes(new Uint32Array([0x10FFFF]))), 4);
	for (const [i, [line, utf32]] of BAD_UTF32.entries()) {
		assertThrows(
			() => utf8Size32(charCodes(utf32)),
			TypeError,
			`Invalid code point on line ${line}`,
			`${i}: ${utf32.join(' ')}`,
		);
	}
});

Deno.test('utf8Encode32', () => {
	const buffer = new Uint8Array(256);
	for (
		const s of [
			'',
			'A',
			'AB',
			'ABC',
			'\u2013',
			'\u00f7',
			'\u03a9',
			'\u2705',
			'\uff0b',
			'\ud83e\udd16',
		]
	) {
		const tag = JSON.stringify(s);
		const u32 = new Uint32Array([...s].map((c) => c.codePointAt(0)!));
		const l = utf8Encode32(charCodes(u32), buffer, 0);
		assertEquals(l, utf8Size32(charCodes(u32)), tag);
		assertEquals(buffer.slice(0, l), TE.encode(s), tag);
	}
	for (const [i, [line, utf32]] of BAD_UTF32.entries()) {
		assertThrows(
			() => utf8Encode32(charCodes(utf32), buffer, 0),
			TypeError,
			`Invalid code point on line ${line}`,
			`${i}: ${utf32.join(' ')}`,
		);
	}
});

Deno.test('utf8Length + utf8Decode', () => {
	{
		const data1 = new Uint8Array(1);
		for (let i = 0; i < 128; i++) {
			data1[0] = i;

			assertEquals(utf8Length(data1), 1);
			assertEquals(utf8Decode(data1), String.fromCharCode(i));
		}
	}
	{
		const data2 = new Uint8Array(2);
		for (let i = 0x0080 - 1; i <= 0x07FF; i++) {
			data2[0] = (i >> 6) | 0xC0;
			data2[1] = (i & 0x3F) | 0x80;

			if (i < 0x0080) {
				assertThrows(
					() => utf8Length(data2),
					TypeError,
					'Invalid code point on line 1',
				);
				assertThrows(
					() => utf8Decode(data2),
					TypeError,
					'Invalid code point on line 1',
				);
			} else {
				assertEquals(utf8Length(data2), 1);
				assertEquals(utf8Decode(data2), String.fromCharCode(i));
			}

			if (i === 0x0080 || i === 0x07FF) {
				assertThrows(
					() => utf8Length(data2.slice(0, 1)),
					TypeError,
					'Invalid code point on line 1',
				);
				assertThrows(
					() => utf8Decode(data2.slice(0, 1)),
					TypeError,
					'Invalid code point on line 1',
				);
			}
		}
	}
	{
		const data3 = new Uint8Array(3);
		for (let i = 0x0800 - 1; i <= 0xFFFF; i++) {
			data3[0] = (i >> 12) | 0xE0;
			data3[1] = ((i >> 6) & 0x3F) | 0x80;
			data3[2] = (i & 0x3F) | 0x80;

			if (i < 0x0800) {
				assertThrows(
					() => utf8Length(data3),
					TypeError,
					'Invalid code point on line 1',
				);
				assertThrows(
					() => utf8Decode(data3),
					TypeError,
					'Invalid code point on line 1',
				);
			} else {
				assertEquals(utf8Length(data3), 1);
				assertEquals(utf8Decode(data3), String.fromCharCode(i));
			}

			if (i === 0x0800 || i === 0xFFFF) {
				assertThrows(
					() => utf8Length(data3.slice(0, 1)),
					TypeError,
					'Invalid code point on line 1',
				);
				assertThrows(
					() => utf8Decode(data3.slice(0, 1)),
					TypeError,
					'Invalid code point on line 1',
				);
				assertThrows(
					() => utf8Length(data3.slice(0, 2)),
					TypeError,
					'Invalid code point on line 1',
				);
				assertThrows(
					() => utf8Decode(data3.slice(0, 2)),
					TypeError,
					'Invalid code point on line 1',
				);
			}
		}
	}
	{
		const data4 = new Uint8Array(4);
		for (let i = 0x10000 - 1; i <= 0x10FFFF + 1; i++) {
			data4[0] = (i >> 18) | 0xF0;
			data4[1] = ((i >> 12) & 0x3F) | 0x80;
			data4[2] = ((i >> 6) & 0x3F) | 0x80;
			data4[3] = (i & 0x3F) | 0x80;

			if (i < 0x10000) {
				assertThrows(
					() => utf8Length(data4),
					TypeError,
					'Invalid code point on line 1',
				);
				assertThrows(
					() => utf8Decode(data4),
					TypeError,
					'Invalid code point on line 1',
				);
			} else if (i > 0x10FFFF) {
				assertThrows(
					() => utf8Length(data4),
					TypeError,
					'Invalid code point on line 1',
				);
				assertThrows(
					() => utf8Decode(data4),
					TypeError,
					'Invalid code point on line 1',
				);
			} else {
				assertEquals(utf8Length(data4), 2);
				assertEquals(utf8Decode(data4, 0, 2).length, 2);
			}

			if (i === 0x10000 || i === 0x10FFFF) {
				assertThrows(
					() => utf8Length(data4.slice(0, 1)),
					TypeError,
					'Invalid code point on line 1',
				);
				assertThrows(
					() => utf8Decode(data4.slice(0, 1)),
					TypeError,
					'Invalid code point on line 1',
				);
				assertThrows(
					() => utf8Length(data4.slice(0, 2)),
					TypeError,
					'Invalid code point on line 1',
				);
				assertThrows(
					() => utf8Decode(data4.slice(0, 2)),
					TypeError,
					'Invalid code point on line 1',
				);
				assertThrows(
					() => utf8Length(data4.slice(0, 3)),
					TypeError,
					'Invalid code point on line 1',
				);
				assertThrows(
					() => utf8Decode(data4.slice(0, 3)),
					TypeError,
					'Invalid code point on line 1',
				);

				data4[0] &= 0xBF;
				assertThrows(
					() => utf8Length(data4),
					TypeError,
					'Invalid code point on line 1',
				);
				assertThrows(
					() => utf8Decode(data4),
					TypeError,
					'Invalid code point on line 1',
				);

				data4[0] = 0xFF;
				assertThrows(
					() => utf8Length(data4),
					TypeError,
					'Invalid code point on line 1',
				);
				assertThrows(
					() => utf8Decode(data4),
					TypeError,
					'Invalid code point on line 1',
				);
			}
		}
	}
	{
		const data = new Uint8Array(5);
		data[4] = 0x80;
		data.set([...'\r\n\r\n'].map((c) => c.charCodeAt(0)));
		assertThrows(
			() => utf8Length(data),
			TypeError,
			'Invalid code point on line 3',
		);
		data.set([...'\n\r\n\r'].map((c) => c.charCodeAt(0)));
		assertThrows(
			() => utf8Length(data),
			TypeError,
			'Invalid code point on line 4',
		);
		data.set([...'\r\r\r\r'].map((c) => c.charCodeAt(0)));
		assertThrows(
			() => utf8Length(data),
			TypeError,
			'Invalid code point on line 5',
		);
		data.set([...'\n\n\n\n'].map((c) => c.charCodeAt(0)));
		assertThrows(
			() => utf8Length(data),
			TypeError,
			'Invalid code point on line 5',
		);
	}
	{
		const data = new Uint8Array([0xF0, 0x9F, 0xA4, 0x96]);
		assertEquals(utf8Decode(data), '\ud83e\udd16');
	}
});

Deno.test('utf8Encoded: UTF-32BE BOM', () => {
	const A = 'A'.charCodeAt(0);
	const d = new Uint8Array(
		[0x00, 0x00, 0xFE, 0xFF, 0x00, 0x00, 0x00, A, 0x00],
	);
	assertEquals(utf8Encoded(d), new Uint8Array([A]));
});

Deno.test('utf8Encoded: UTF-32LE BOM', () => {
	const A = 'A'.charCodeAt(0);
	const d = new Uint8Array(
		[0xFF, 0xFE, 0x00, 0x00, A, 0x00, 0x00, 0x00, 0x00],
	);
	assertEquals(utf8Encoded(d), new Uint8Array([A]));
});

Deno.test('utf8Encoded: UTF-16BE BOM', () => {
	const A = 'A'.charCodeAt(0);
	const d = new Uint8Array([0xFF, 0xFE, A, 0x00, 0x00]);
	assertEquals(utf8Encoded(d), new Uint8Array([A]));
});

Deno.test('utf8Encoded: UTF-16BE NO-BOM', () => {
	const _ = ' '.charCodeAt(0);
	const A = 'A'.charCodeAt(0);
	const d = new Uint8Array([0x00, _, 0x00, A]);
	assertEquals(utf8Encoded(d), new Uint8Array([A]));
	assertEquals(utf8Encoded(d, false), new Uint8Array([A]));
	assertNotEquals(utf8Encoded(d, true), new Uint8Array([A]));
});

Deno.test('utf8Encoded: UTF-16LE BOM', () => {
	const A = 'A'.charCodeAt(0);
	const d = new Uint8Array([0xFE, 0xFF, 0x00, A, 0x00]);
	assertEquals(utf8Encoded(d), new Uint8Array([A]));
});

Deno.test('utf8Encoded: UTF-16LE NO-BOM', () => {
	const _ = ' '.charCodeAt(0);
	const A = 'A'.charCodeAt(0);
	const d = new Uint8Array([_, 0x00, A, 0x00]);
	assertEquals(utf8Encoded(d), new Uint8Array([A]));
	assertEquals(utf8Encoded(d, true), new Uint8Array([A]));
	assertNotEquals(utf8Encoded(d, false), new Uint8Array([A]));
});

Deno.test('utf8Encoded: UTF-8 BOM', () => {
	const A = 'A'.charCodeAt(0);
	const d = new Uint8Array([0xEF, 0xBB, 0xBF, A, A]);
	const dec = utf8Encoded(d);
	assertEquals(dec, new Uint8Array([A, A]));
	assertEquals(dec?.byteOffset, 3);
});

Deno.test('utf8Encoded: UTF-8 NO-BOM', () => {
	const A = 'A'.charCodeAt(0);
	const d = new Uint8Array([A, A]);
	const dec = utf8Encoded(d);
	assertEquals(dec, null);
});
