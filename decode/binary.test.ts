import { assertEquals, assertInstanceOf } from '@std/assert';
import { PLBoolean } from '../boolean.ts';
import { PLDate } from '../date.ts';
import { FORMAT_BINARY_V1_0 } from '../format.ts';
import { PLInteger } from '../integer.ts';
import { PLReal } from '../real.ts';
import { fixturePlist } from '../spec/fixture.ts';
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

Deno.test('spec: date-0.0', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('date-0.0', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLDate);
	assertEquals(plist.time, 0);
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
