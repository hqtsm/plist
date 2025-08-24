import { assertEquals, assertThrows } from '@std/assert';
import { utf8Encode, utf8Length, utf8Size } from './utf8.ts';

Deno.test('utf8Size', () => {
	const te = new TextEncoder();
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
		const l = te.encode(s).length;
		assertEquals(utf8Size(s), l, JSON.stringify(s));
		assertEquals(utf8Size(`${s}${s}`), l + l, JSON.stringify(`${s}${s}`));
	}
	assertEquals(utf8Size('\ud83e'), 0);
	assertEquals(utf8Size('\ud83e\ud83e'), 0);
	assertEquals(utf8Size('\ud83eA'), 1);
	assertEquals(utf8Size('\ud83e\ud83eA'), 1);
});

Deno.test('utf8Encode', () => {
	const te = new TextEncoder();
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
		const a1 = te.encode(s);
		const a2 = new Uint8Array(a1.length);
		assertEquals(utf8Encode(s, a2, 0), a1.length);
		assertEquals(a1, a2, JSON.stringify(s));
		const b1 = te.encode(`${s}${s}`);
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

Deno.test('utf8Encoded', () => {
	{
		const data1 = new Uint8Array(1);
		for (let i = 0; i < 128; i++) {
			data1[0] = i;
			assertEquals(utf8Length(data1), 1);
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
					'Invalid UTF-8 encoded text on line 1',
				);
			} else {
				assertEquals(utf8Length(data2), 1);
			}
			if (i === 0x0080 || i === 0x07FF) {
				assertThrows(
					() => utf8Length(data2.slice(0, 1)),
					TypeError,
					'Invalid UTF-8 encoded text on line 1',
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
					'Invalid UTF-8 encoded text on line 1',
				);
			} else {
				assertEquals(utf8Length(data3), 1);
			}
			if (i === 0x0800 || i === 0xFFFF) {
				assertThrows(
					() => utf8Length(data3.slice(0, 1)),
					TypeError,
					'Invalid UTF-8 encoded text on line 1',
				);
				assertThrows(
					() => utf8Length(data3.slice(0, 2)),
					TypeError,
					'Invalid UTF-8 encoded text on line 1',
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
					'Invalid UTF-8 encoded text on line 1',
				);
			} else if (i > 0x10FFFF) {
				assertThrows(
					() => utf8Length(data4),
					TypeError,
					'Invalid UTF-8 encoded text on line 1',
				);
			} else {
				assertEquals(utf8Length(data4), 2);
			}
			if (i === 0x10000 || i === 0x10FFFF) {
				assertThrows(
					() => utf8Length(data4.slice(0, 1)),
					TypeError,
					'Invalid UTF-8 encoded text on line 1',
				);
				assertThrows(
					() => utf8Length(data4.slice(0, 2)),
					TypeError,
					'Invalid UTF-8 encoded text on line 1',
				);
				assertThrows(
					() => utf8Length(data4.slice(0, 3)),
					TypeError,
					'Invalid UTF-8 encoded text on line 1',
				);

				data4[0] &= 0xBF;
				assertThrows(
					() => utf8Length(data4),
					TypeError,
					'Invalid UTF-8 encoded text on line 1',
				);

				data4[0] = 0xFF;
				assertThrows(
					() => utf8Length(data4),
					TypeError,
					'Invalid UTF-8 encoded text on line 1',
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
			'Invalid UTF-8 encoded text on line 3',
		);
		data.set([...'\n\r\n\r'].map((c) => c.charCodeAt(0)));
		assertThrows(
			() => utf8Length(data),
			TypeError,
			'Invalid UTF-8 encoded text on line 4',
		);
		data.set([...'\r\r\r\r'].map((c) => c.charCodeAt(0)));
		assertThrows(
			() => utf8Length(data),
			TypeError,
			'Invalid UTF-8 encoded text on line 5',
		);
		data.set([...'\n\n\n\n'].map((c) => c.charCodeAt(0)));
		assertThrows(
			() => utf8Length(data),
			TypeError,
			'Invalid UTF-8 encoded text on line 5',
		);
	}
});
