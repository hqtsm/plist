import {
	assertEquals,
	assertInstanceOf,
	assertStrictEquals,
} from '@std/assert';
import { PLArray } from '../array.ts';
import { PLBoolean } from '../boolean.ts';
import { PLData } from '../data.ts';
import { PLDate } from '../date.ts';
import { FORMAT_BINARY_V1_0 } from '../format.ts';
import { PLInteger } from '../integer.ts';
import { PLReal } from '../real.ts';
import { fixturePlist } from '../spec/fixture.ts';
import { PLString } from '../string.ts';
import type { PLType } from '../type.ts';
import { PLUID } from '../uid.ts';
import { decodeBinary, type DecodeBinaryOptions } from './binary.ts';

const CF_STYLE = {
	int64: true,
} as const satisfies DecodeBinaryOptions;

Deno.test('spec: true', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('true', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLBoolean);
	assertEquals(plist.value, true);
});

Deno.test('spec: false', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('false', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLBoolean);
	assertEquals(plist.value, false);
});

Deno.test('spec: array-0', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('array-0', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 0);
});

Deno.test('spec: array-1', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('array-1', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 1);

	const entry = plist.get(0);
	assertInstanceOf(entry, PLString);
	assertEquals(entry.value, 'A');
});

Deno.test('spec: array-4', async () => {
	const aa = new Uint8Array([0x61, 0x61]);
	const bb = new Uint8Array([0x62, 0x62]);
	const { format, plist } = decodeBinary(
		await fixturePlist('array-4', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 4);

	for (let i = 0; i < plist.length; i++) {
		const str = plist.get(i);
		assertInstanceOf(str, PLData);
		assertEquals(new Uint8Array(str.buffer), i % 2 ? bb : aa);
	}
});

Deno.test('spec: array-8', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('array-8', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 8);

	for (let i = 0; i < 8; i++) {
		const entry: PLType = plist.get(i)!;
		assertInstanceOf(entry, PLString, `${i}`);
		assertEquals(entry.value, i % 2 ? 'B' : 'A', `${i}`);
	}
});

Deno.test('spec: array-14', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('array-14', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 14);

	for (let i = 0; i < 14; i++) {
		const entry: PLType = plist.get(i)!;
		assertInstanceOf(entry, PLBoolean, `${i}`);
		assertEquals(entry.value, i % 2 ? true : false, `${i}`);
	}
});

Deno.test('spec: array-15', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('array-15', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 15);

	for (let i = 0; i < 14; i++) {
		const entry: PLType = plist.get(i)!;
		assertInstanceOf(entry, PLDate, `${i}`);
		assertEquals(entry.time, i % 2, `${i}`);
	}
});

Deno.test('spec: array-26', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('array-26', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 26);

	for (let i = 0; i < 26; i++) {
		const entry: PLType = plist.get(i)!;
		assertInstanceOf(entry, PLString, `${i}`);
		assertEquals(entry.value, String.fromCharCode(65 + i), `${i}`);
	}
});

Deno.test('spec: array-128', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('array-128', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 128);

	for (let i = 0; i < 128; i++) {
		const entry: PLType = plist.get(i)!;
		assertInstanceOf(entry, PLReal, `${i}`);
		assertEquals(entry.value, i % 2 ? 1 : 0, `${i}`);
	}
});

Deno.test('spec: array-255', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('array-255', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 255);

	for (let i = 0; i < 255; i++) {
		const entry: PLType = plist.get(i)!;
		assertInstanceOf(entry, PLInteger, `${i}`);
		assertEquals(entry.value, i % 2 ? 1n : 0n, `${i}`);
	}
});

Deno.test('spec: array-256', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('array-256', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 256);

	for (let i = 0; i < 256; i++) {
		const entry: PLType = plist.get(i)!;
		assertInstanceOf(entry, PLBoolean, `${i}`);
		assertEquals(entry.value, i % 2 ? true : false, `${i}`);
	}
});

Deno.test('spec: array-65534', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('array-65534', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 65534);

	for (let i = 0; i < 65534; i++) {
		const entry: PLType = plist.get(i)!;
		assertInstanceOf(entry, PLBoolean, `${i}`);
		assertEquals(entry.value, i % 2 ? true : false, `${i}`);
	}
});

Deno.test('spec: array-65535', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('array-65535', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 65535);

	for (let i = 0; i < 65535; i++) {
		const entry: PLType = plist.get(i)!;
		assertInstanceOf(entry, PLBoolean, `${i}`);
		assertEquals(entry.value, i % 2 ? true : false, `${i}`);
	}
});

Deno.test('spec: array-65536', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('array-65536', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 65536);

	for (let i = 0; i < 65536; i++) {
		const entry: PLType = plist.get(i)!;
		assertInstanceOf(entry, PLBoolean, `${i}`);
		assertEquals(entry.value, i % 2 ? true : false, `${i}`);
	}
});

Deno.test('spec: array-reuse', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('array-reuse', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 2);
	assertStrictEquals(plist.get(0), plist.get(1));

	for (let i = 0; i < plist.length; i++) {
		const a = plist.get(i);
		assertInstanceOf(a, PLArray);
		assertEquals(a.length, 2);
		for (let j = 0; j < a.length; j++) {
			const b: PLType = a.get(j)!;
			assertInstanceOf(b, PLString);
			assertEquals(b.value, j ? 'BBBB' : 'AAAA');
		}
	}
});

Deno.test('spec: data-0', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('data-0', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLData);
	assertEquals(plist.byteLength, 0);
});

Deno.test('spec: data-1', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('data-1', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLData);
	assertEquals(plist.byteLength, 1);
	assertEquals(
		new Uint8Array(plist.buffer),
		new Uint8Array([0x61]),
	);
});

Deno.test('spec: data-2', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('data-2', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLData);
	assertEquals(plist.byteLength, 2);
	assertEquals(
		new Uint8Array(plist.buffer),
		new Uint8Array([0x61, 0x62]),
	);
});

Deno.test('spec: data-3', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('data-3', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLData);
	assertEquals(plist.byteLength, 3);
	assertEquals(
		new Uint8Array(plist.buffer),
		new Uint8Array([0x61, 0x62, 0x63]),
	);
});

Deno.test('spec: data-4', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('data-4', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLData);
	assertEquals(plist.byteLength, 4);
	assertEquals(
		new Uint8Array(plist.buffer),
		new Uint8Array([0x61, 0x62, 0x63, 0x64]),
	);
});

Deno.test('spec: data-14', async () => {
	const chars = [...'abcdefghijklmn'].map((c) => c.charCodeAt(0));
	const { format, plist } = decodeBinary(
		await fixturePlist('data-14', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLData);
	assertEquals(plist.byteLength, 14);
	assertEquals(
		new Uint8Array(plist.buffer),
		new Uint8Array(chars),
	);
});

Deno.test('spec: data-15', async () => {
	const chars = [...'abcdefghijklmno'].map((c) => c.charCodeAt(0));
	const { format, plist } = decodeBinary(
		await fixturePlist('data-15', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLData);
	assertEquals(plist.byteLength, 15);
	assertEquals(
		new Uint8Array(plist.buffer),
		new Uint8Array(chars),
	);
});

Deno.test('spec: data-255', async () => {
	const bytes = new Uint8Array(255);
	for (let i = 0; i < 255; i++) {
		bytes[i] = i;
	}
	const { format, plist } = decodeBinary(
		await fixturePlist('data-255', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLData);
	assertEquals(plist.byteLength, 255);
	assertEquals(
		new Uint8Array(plist.buffer),
		bytes,
	);
});

Deno.test('spec: data-256', async () => {
	const bytes = new Uint8Array(256);
	for (let i = 0; i < 256; i++) {
		bytes[i] = i;
	}
	const { format, plist } = decodeBinary(
		await fixturePlist('data-256', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLData);
	assertEquals(plist.byteLength, 256);
	assertEquals(
		new Uint8Array(plist.buffer),
		bytes,
	);
});

Deno.test('spec: date-0.0', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('date-0.0', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLDate);
	assertEquals(plist.time, 0);
});

Deno.test('spec: date-edge', async () => {
	const d = new Uint8Array(8);
	const dv = new DataView(d.buffer);

	const { format, plist } = decodeBinary(
		await fixturePlist('date-edge', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 92);

	for (let i = 0; i < plist.length;) {
		const key: PLType = plist.get(i)!;
		assertInstanceOf(key, PLString, `${i}`);
		const tag: string = key.value;
		const hex = key.value.split(' ')[1];
		for (let i = hex.length / 2; i--;) {
			d[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
		}
		i++;

		const date = plist.get(i);
		assertInstanceOf(date, PLDate, tag);
		const expected = dv.getFloat64(0);
		assertEquals(date.time, expected, tag);
		i++;
	}
});

Deno.test('spec: date-every-day-2001', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('date-every-day-2001', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 365 * 2);

	const d = new Date(0);
	d.setUTCFullYear(2001);
	for (let i = 0; i < plist.length;) {
		const key = plist.get(i);
		assertInstanceOf(key, PLString, `${i}`);
		const tag: string = key.value;
		d.setUTCMonth(0);
		d.setUTCDate(+key.value);
		i++;

		const date = plist.get(i);
		assertInstanceOf(date, PLDate, tag);
		assertEquals(date.toISOString(), d.toISOString(), tag);
		i++;
	}
});

Deno.test('spec: date-every-day-2004', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('date-every-day-2004', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 366 * 2);

	const d = new Date(0);
	d.setUTCFullYear(2004);
	for (let i = 0; i < plist.length;) {
		const key = plist.get(i);
		assertInstanceOf(key, PLString, `${i}`);
		const tag: string = key.value;
		d.setUTCMonth(0);
		d.setUTCDate(+key.value);
		i++;

		const date = plist.get(i);
		assertInstanceOf(date, PLDate, tag);
		assertEquals(date.toISOString(), d.toISOString(), tag);
		i++;
	}
});

Deno.test('spec: date-reuse', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('date-reuse', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 2);

	const a = plist.get(0);
	assertInstanceOf(a, PLDate);

	const b = plist.get(1);
	assertInstanceOf(b, PLDate);

	assertEquals(a.time, b.time);
	assertStrictEquals(a, b);
});

// TODO: dict

Deno.test('spec: string-empty', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('string-empty', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, '');
});

Deno.test('spec: string-ascii', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('string-ascii', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, 'ASCII');
});

Deno.test('spec: string-unicode', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('string-unicode', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, 'UTF\u20138');
});

Deno.test('spec: string-long-unicode', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('string-long-unicode', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(
		plist.value,
		new Array(8).fill('UTF\u20138').join(' '),
	);
});

Deno.test('spec: string-utf8-mb2-divide', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('string-utf8-mb2-divide', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, '\u00f7');
});

Deno.test('spec: string-utf8-mb2-ohm', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('string-utf8-mb2-ohm', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, '\u03a9');
});

Deno.test('spec: string-utf8-mb3-check', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('string-utf8-mb3-check', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, '\u2705');
});

Deno.test('spec: string-utf8-mb3-plus', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('string-utf8-mb3-plus', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, '\uff0b');
});

Deno.test('spec: string-utf8-mb4-robot', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('string-utf8-mb4-robot', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, '\ud83e\udd16');
});

Deno.test('spec: integer-0', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('integer-0', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLInteger);
	assertEquals(plist.value, 0n);
	assertEquals(plist.bits, 64);
});

Deno.test('spec: real-double-p0.0', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('real-double-p0.0', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLReal);
	assertEquals(plist.value, 0);
	assertEquals(plist.bits, 64);
});

Deno.test('spec: real-float-p0.0', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('real-float-p0.0', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLReal);
	assertEquals(plist.value, 0);
	assertEquals(plist.bits, 32);
});

Deno.test('spec: uid-42', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('uid-42', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLUID);
	assertEquals(plist.value, 42n);
});
