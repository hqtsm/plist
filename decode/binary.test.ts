import { assertEquals, assertInstanceOf } from '@std/assert';
import { PLBoolean } from '../boolean.ts';
import { PLData } from '../data.ts';
import { PLDate } from '../date.ts';
import { FORMAT_BINARY_V1_0 } from '../format.ts';
import { PLInteger } from '../integer.ts';
import { PLReal } from '../real.ts';
import { fixturePlist } from '../spec/fixture.ts';
import { PLString } from '../string.ts';
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

Deno.test('spec: data-0', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('data-0', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLData);
	assertEquals(plist.byteLength, 0);
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

Deno.test('spec: uid-42', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('uid-42', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLUID);
	assertEquals(plist.value, 42n);
});
