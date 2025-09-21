import {
	assertEquals,
	assertInstanceOf,
	assertStrictEquals,
	assertThrows,
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
import { PLDict } from '../dict.ts';
import { binaryError } from '../pri/data.ts';

const CF_STYLE = {
	int64: true,
} as const satisfies DecodeBinaryOptions;

const I64_MAX = 0x7fffffffffffffffn;

Deno.test('Bad header', () => {
	let data: Uint8Array;
	data = new Uint8Array([...'bplist0'].map((c) => c.charCodeAt(0)));
	assertThrows(
		() => decodeBinary(data, CF_STYLE),
		SyntaxError,
		binaryError(0),
	);
	data = new Uint8Array([...'bplist_0'].map((c) => c.charCodeAt(0)));
	assertThrows(
		() => decodeBinary(data, CF_STYLE),
		SyntaxError,
		binaryError(0),
	);
	data = new Uint8Array([...'bplis_00'].map((c) => c.charCodeAt(0)));
	assertThrows(
		() => decodeBinary(data, CF_STYLE),
		SyntaxError,
		binaryError(0),
	);
	data = new Uint8Array([...'bpl_st00'].map((c) => c.charCodeAt(0)));
	assertThrows(
		() => decodeBinary(data, CF_STYLE),
		SyntaxError,
		binaryError(0),
	);
	data = new Uint8Array([...'bp_ist00'].map((c) => c.charCodeAt(0)));
	assertThrows(
		() => decodeBinary(data, CF_STYLE),
		SyntaxError,
		binaryError(0),
	);
	data = new Uint8Array([...'b_list00'].map((c) => c.charCodeAt(0)));
	assertThrows(
		() => decodeBinary(data, CF_STYLE),
		SyntaxError,
		binaryError(0),
	);
	data = new Uint8Array([...'_plist00'].map((c) => c.charCodeAt(0)));
	assertThrows(
		() => decodeBinary(data, CF_STYLE),
		SyntaxError,
		binaryError(0),
	);
});

Deno.test('Bad trailer: length', () => {
	const data = new Uint8Array(39);
	data.set([...'bplist0'].map((c) => c.charCodeAt(0)));
	assertThrows(
		() => decodeBinary(data, CF_STYLE),
		SyntaxError,
		binaryError(8),
	);
});

Deno.test('Bad trailer: objects > I64_MAX', () => {
	const data = new Uint8Array(40);
	const view = new DataView(data.buffer);
	data.set([...'bplist00'].map((c) => c.charCodeAt(0)));
	view.setBigUint64(data.length - 24, I64_MAX + 1n);
	assertThrows(
		() => decodeBinary(data, CF_STYLE),
		SyntaxError,
		binaryError(data.length - 24),
	);
});

Deno.test('Bad trailer: table > I64_MAX', () => {
	const data = new Uint8Array(40);
	const view = new DataView(data.buffer);
	data.set([...'bplist00'].map((c) => c.charCodeAt(0)));
	view.setBigUint64(data.length - 8, I64_MAX + 1n);
	assertThrows(
		() => decodeBinary(data, CF_STYLE),
		SyntaxError,
		binaryError(data.length - 8),
	);
});

Deno.test('Bad trailer: objects = 0', () => {
	const data = new Uint8Array(40);
	data.set([...'bplist00'].map((c) => c.charCodeAt(0)));
	assertThrows(
		() => decodeBinary(data, CF_STYLE),
		SyntaxError,
		binaryError(data.length - 24),
	);
});

Deno.test('Bad trailer: top >= objects', () => {
	const data = new Uint8Array(40);
	const view = new DataView(data.buffer);
	data.set([...'bplist00'].map((c) => c.charCodeAt(0)));
	view.setBigUint64(data.length - 24, 1n);
	view.setBigUint64(data.length - 16, 1n);
	assertThrows(
		() => decodeBinary(data, CF_STYLE),
		SyntaxError,
		binaryError(data.length - 16),
	);
});

Deno.test('Bad trailer: table < 9', () => {
	const data = new Uint8Array(44);
	const view = new DataView(data.buffer);
	data.set([...'bplist00'].map((c) => c.charCodeAt(0)));
	view.setBigUint64(data.length - 24, 1n);
	view.setBigUint64(data.length - 8, 8n);
	assertThrows(
		() => decodeBinary(data, CF_STYLE),
		SyntaxError,
		binaryError(data.length - 8),
	);
});

Deno.test('Bad trailer: table > trailer', () => {
	const data = new Uint8Array(44);
	const view = new DataView(data.buffer);
	data.set([...'bplist00'].map((c) => c.charCodeAt(0)));
	view.setBigUint64(data.length - 24, 1n);
	view.setBigUint64(data.length - 8, BigInt(data.length - 32 + 1));
	assertThrows(
		() => decodeBinary(data, CF_STYLE),
		SyntaxError,
		binaryError(data.length - 8),
	);
});

Deno.test('Bad trailer: int = 0', () => {
	const data = new Uint8Array(44);
	const view = new DataView(data.buffer);
	data.set([...'bplist00'].map((c) => c.charCodeAt(0)));
	view.setBigUint64(data.length - 24, 1n);
	view.setBigUint64(data.length - 8, 9n);
	assertThrows(
		() => decodeBinary(data, CF_STYLE),
		SyntaxError,
		binaryError(data.length - 26),
	);
});

Deno.test('Bad trailer: ref = 0', () => {
	const data = new Uint8Array(44);
	const view = new DataView(data.buffer);
	data.set([...'bplist00'].map((c) => c.charCodeAt(0)));
	view.setBigUint64(data.length - 24, 1n);
	view.setBigUint64(data.length - 8, 9n);
	data[data.length - 26] = 1;
	assertThrows(
		() => decodeBinary(data, CF_STYLE),
		SyntaxError,
		binaryError(data.length - 25),
	);
});

Deno.test('Bad trailer: objects * int > U64_MAX', () => {
	const data = new Uint8Array(44);
	const view = new DataView(data.buffer);
	data.set([...'bplist00'].map((c) => c.charCodeAt(0)));
	view.setBigUint64(data.length - 24, I64_MAX);
	view.setBigUint64(data.length - 8, 9n);
	data[data.length - 26] = 255;
	data[data.length - 25] = 1;
	assertThrows(
		() => decodeBinary(data, CF_STYLE),
		SyntaxError,
		binaryError(data.length - 24),
	);
});

Deno.test('Bad trailer: table * objects * int != length', () => {
	const data = new Uint8Array(44);
	const view = new DataView(data.buffer);
	data.set([...'bplist00'].map((c) => c.charCodeAt(0)));
	view.setBigUint64(data.length - 24, 1n);
	view.setBigUint64(data.length - 8, 10n);
	data[data.length - 26] = 1;
	data[data.length - 25] = 1;
	assertThrows(
		() => decodeBinary(data, CF_STYLE),
		SyntaxError,
		binaryError(data.length - 24),
	);
});

Deno.test('Bad trailer: ref size too small', () => {
	const data = new Uint8Array(500);
	const view = new DataView(data.buffer);
	data.set([...'bplist00'].map((c) => c.charCodeAt(0)));
	view.setBigUint64(data.length - 24, 500n - 132n);
	view.setBigUint64(data.length - 8, 100n);
	data[data.length - 26] = 1;
	data[data.length - 25] = 1;
	assertThrows(
		() => decodeBinary(data, CF_STYLE),
		SyntaxError,
		binaryError(data.length - 25),
	);
});

Deno.test('Bad trailer: int size too small', () => {
	const data = new Uint8Array(500);
	const view = new DataView(data.buffer);
	data.set([...'bplist00'].map((c) => c.charCodeAt(0)));
	view.setBigUint64(data.length - 24, 1n);
	view.setBigUint64(data.length - 8, 500n - 33n);
	data[data.length - 26] = 1;
	data[data.length - 25] = 1;
	assertThrows(
		() => decodeBinary(data, CF_STYLE),
		SyntaxError,
		binaryError(data.length - 26),
	);
});

Deno.test('Bad trailer: ref value over under', () => {
	const data = new Uint8Array(8 + 1 + 1 + 32);
	const view = new DataView(data.buffer);
	data.set([...'bplist00'].map((c) => c.charCodeAt(0)));
	view.setBigUint64(data.length - 24, 1n);
	view.setBigUint64(data.length - 8, 9n);
	data[data.length - 26] = 1;
	data[data.length - 25] = 1;
	data[9] = 9;
	assertThrows(
		() => decodeBinary(data, CF_STYLE),
		SyntaxError,
		binaryError(9),
	);
	data[9] = 7;
	assertThrows(
		() => decodeBinary(data, CF_STYLE),
		SyntaxError,
		binaryError(9),
	);
});

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

Deno.test('spec: dict-empties', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('dict-empties', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 2);

	const array = plist.find('array');
	assertInstanceOf(array, PLArray);
	assertEquals(array.length, 0);

	const dict = plist.find('dict');
	assertInstanceOf(dict, PLDict);
	assertEquals(dict.size, 0);
});

Deno.test('spec: dict-26', async () => {
	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const { format, plist } = decodeBinary(
		await fixturePlist('dict-26', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 26);

	for (let i = 0; i < plist.size; i++) {
		const str = plist.find(alphabet[i]);
		assertInstanceOf(str, PLString);
		assertEquals(str.value, alphabet[i].toLowerCase());
	}
});

Deno.test('spec: dict-long-key', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('dict-long-key', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 1);

	const str = plist.find(
		'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789',
	);
	assertInstanceOf(str, PLString);
	assertEquals(str.value, '64');
});

Deno.test('spec: dict-unicode-key', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('dict-unicode-key', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 1);

	const str = plist.find('UTF\u20138');
	assertInstanceOf(str, PLString);
	assertEquals(str.value, 'utf-8');
});

Deno.test('spec: dict-nesting', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('dict-nesting', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 2);

	const A = plist.find('A');
	assertInstanceOf(A, PLDict);
	assertEquals(A.size, 2);

	const AA = A.find('AA');
	assertInstanceOf(AA, PLDict);
	assertEquals(AA.size, 2);

	const AAA = AA.find('AAA');
	assertInstanceOf(AAA, PLString);
	assertEquals(AAA.value, 'aaa');

	const AAB = AA.find('AAB');
	assertInstanceOf(AAB, PLString);
	assertEquals(AAB.value, 'aab');

	const AB = A.find('AB');
	assertInstanceOf(AB, PLDict);
	assertEquals(AB.size, 2);

	const ABA = AB.find('ABA');
	assertInstanceOf(ABA, PLString);
	assertEquals(ABA.value, 'aba');

	const ABB = AB.find('ABB');
	assertInstanceOf(ABB, PLString);
	assertEquals(ABB.value, 'abb');

	const B = plist.find('B');
	assertInstanceOf(B, PLDict);
	assertEquals(B.size, 2);

	const BA = B.find('BA');
	assertInstanceOf(BA, PLDict);
	assertEquals(BA.size, 2);

	const BAA = BA.find('BAA');
	assertInstanceOf(BAA, PLString);
	assertEquals(BAA.value, 'baa');

	const BAB = BA.find('BAB');
	assertInstanceOf(BAB, PLString);
	assertEquals(BAB.value, 'bab');

	const BB = B.find('BB');
	assertInstanceOf(BB, PLDict);
	assertEquals(BB.size, 2);

	const BBA = BB.find('BBA');
	assertInstanceOf(BBA, PLString);
	assertEquals(BBA.value, 'bba');

	const BBB = BB.find('BBB');
	assertInstanceOf(BBB, PLString);
	assertEquals(BBB.value, 'bbb');
});

Deno.test('spec: dict-order', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('dict-order', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 7);

	const empty = plist.find('');
	assertInstanceOf(empty, PLString);
	assertEquals(empty.value, '0');

	const a = plist.find('a');
	assertInstanceOf(a, PLString);
	assertEquals(a.value, '1');

	const aa = plist.find('aa');
	assertInstanceOf(aa, PLString);
	assertEquals(aa.value, '2');

	const aaa = plist.find('aaa');
	assertInstanceOf(aaa, PLString);
	assertEquals(aaa.value, '3');

	const ab = plist.find('ab');
	assertInstanceOf(ab, PLString);
	assertEquals(ab.value, '4');

	const abb = plist.find('abb');
	assertInstanceOf(abb, PLString);
	assertEquals(abb.value, '5');

	const ac = plist.find('ac');
	assertInstanceOf(ac, PLString);
	assertEquals(ac.value, '6');
});

Deno.test('spec: dict-reuse', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('dict-reuse', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLDict);

	const AA = plist.find('AA');
	assertInstanceOf(AA, PLDict);
	{
		const AAAA = AA.find('AAAA');
		assertInstanceOf(AAAA, PLString);
		assertEquals(AAAA.value, '1111');
		const BBBB = AA.find('BBBB');
		assertInstanceOf(BBBB, PLString);
		assertEquals(BBBB.value, '2222');
	}

	const BB = plist.find('BB');
	assertInstanceOf(BB, PLDict);
	{
		const AAAA = BB.find('AAAA');
		assertInstanceOf(AAAA, PLString);
		assertEquals(AAAA.value, '1111');
		const BBBB = BB.find('BBBB');
		assertInstanceOf(BBBB, PLString);
		assertEquals(BBBB.value, '2222');
	}

	assertStrictEquals(AA, BB);
});

Deno.test('spec: dict-repeat', async () => {
	const expected = [
		['C', '32'],
		['A', '11'],
		['C', '31'],
		['B', '21'],
		['C', '33'],
		['B', '22'],
	];
	const { format, plist } = decodeBinary(
		await fixturePlist('dict-repeat', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 6);

	for (const [i, [k, v]] of [...plist].entries()) {
		assertInstanceOf(v, PLString);
		assertEquals(k.value, expected[i][0], `key:${i}`);
		assertEquals(v.value, expected[i][1], `value:${i}`);
	}
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

Deno.test('spec: string-chars', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('string-chars', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLArray);

	for (let i = 0; i < plist.length;) {
		const k: PLType = plist.get(i)!;
		assertInstanceOf(k, PLString, `[${i}]`);
		const code = +k.value;
		i++;

		const v: PLType = plist.get(i)!;
		assertInstanceOf(v, PLString, k.value);
		assertEquals(v.value, String.fromCharCode(code), k.value);
		i++;
	}
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

Deno.test('spec: integer-big', async () => {
	const MIN_128 = -0x8000000000000000_0000000000000000n;
	const data = await fixturePlist('integer-big', 'binary');
	{
		const { format, plist } = decodeBinary(data, CF_STYLE);
		assertEquals(format, FORMAT_BINARY_V1_0);
		assertInstanceOf(plist, PLArray);
		assertEquals(plist.length, 12);
		const all = new Map<string, PLInteger>();
		for (let i = 0; i < 12;) {
			const name: PLType = plist.get(i)!;
			assertInstanceOf(name, PLString, `${i}`);
			i++;

			const value: PLType = plist.get(i)!;
			assertInstanceOf(value, PLInteger, `${i}`);
			all.set(name.value, value);
			i++;
		}

		const BIG = all.get('BIG')!;
		assertEquals(BIG.value, 0x102030405060708n);
		assertEquals(BIG.bits, 128);

		const SMALL = all.get('SMALL')!;
		assertEquals(SMALL.value, 42n);
		assertEquals(SMALL.bits, 128);

		const MAX = all.get('MAX')!;
		assertEquals(MAX.value, 0xFFFFFFFFFFFFFFFFn);
		assertEquals(MAX.bits, 128);

		const MIN = all.get('MIN')!;
		assertEquals(MIN.value, 0n);
		assertEquals(MIN.bits, 128);

		const MIN_PLUS_1 = all.get('MIN+1')!;
		assertEquals(MIN_PLUS_1.value, 1n);
		assertEquals(MIN_PLUS_1.bits, 128);

		const MIN_PLUS_2 = all.get('MIN+2')!;
		assertEquals(MIN_PLUS_2.value, 2n);
		assertEquals(MIN_PLUS_2.bits, 128);
	}
	{
		const { format, plist } = decodeBinary(data);
		assertEquals(format, FORMAT_BINARY_V1_0);
		assertInstanceOf(plist, PLArray);
		assertEquals(plist.length, 12);
		const all = new Map<string, PLInteger>();
		for (let i = 0; i < 12;) {
			const name: PLType = plist.get(i)!;
			assertInstanceOf(name, PLString, `${i}`);
			i++;

			const value: PLType = plist.get(i)!;
			assertInstanceOf(value, PLInteger, `${i}`);
			all.set(name.value, value);
			i++;
		}

		const BIG = all.get('BIG')!;
		assertEquals(BIG.value, 0x1112131415161718_0102030405060708n);
		assertEquals(BIG.bits, 128);

		const SMALL = all.get('SMALL')!;
		assertEquals(SMALL.value, 42n);
		assertEquals(SMALL.bits, 128);

		const MAX = all.get('MAX')!;
		assertEquals(MAX.value, 0x7FFFFFFFFFFFFFFF_FFFFFFFFFFFFFFFFn);
		assertEquals(MAX.bits, 128);

		const MIN = all.get('MIN')!;
		assertEquals(MIN.value, MIN_128);
		assertEquals(MIN.bits, 128);

		const MIN_PLUS_1 = all.get('MIN+1')!;
		assertEquals(MIN_PLUS_1.value, MIN_128 + 1n);
		assertEquals(MIN_PLUS_1.bits, 128);

		const MIN_PLUS_2 = all.get('MIN+2')!;
		assertEquals(MIN_PLUS_2.value, MIN_128 + 2n);
		assertEquals(MIN_PLUS_2.bits, 128);
	}
});

Deno.test('spec: integer-min', async () => {
	const MIN64 = -0x8000000000000000n;

	const { format, plist } = decodeBinary(
		await fixturePlist('integer-min', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLInteger);
	assertEquals(plist.value, MIN64);
	assertEquals(plist.bits, 64);
});

Deno.test('spec: integer-negative', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('integer-negative', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLInteger);
	assertEquals(plist.value, -42n);
	assertEquals(plist.bits, 64);
});

Deno.test('spec: integer-reuse', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('integer-reuse', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 2);

	const a = plist.get(0)!;
	assertInstanceOf(a, PLInteger);
	assertEquals(a.value, 42n);
	assertEquals(a.bits, 64);

	const b = plist.get(1)!;
	assertInstanceOf(b, PLInteger);
	assertEquals(b.value, 42n);
	assertEquals(b.bits, 64);

	assertStrictEquals(a, b);
});

Deno.test('spec: integer-sizes', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('integer-sizes', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 38);

	for (let i = 0; i < 38;) {
		const k: PLType = plist.get(i)!;
		assertInstanceOf(k, PLString, `${i}`);
		i++;

		const v: PLType = plist.get(i)!;
		assertInstanceOf(v, PLInteger, `${i}`);
		const expected = BigInt.asIntN(64, BigInt(k.value));
		assertEquals(v.value, expected, k.value);
		i++;
	}
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

Deno.test('spec: real-reuse', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('real-reuse', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLArray);

	const a = plist.get(0)!;
	assertInstanceOf(a, PLReal);
	assertEquals(a.value, 3.14);
	assertEquals(a.bits, 64);

	const b = plist.get(1)!;
	assertInstanceOf(b, PLReal);
	assertEquals(b.value, 3.14);
	assertEquals(b.bits, 64);

	assertStrictEquals(a, b);
});

Deno.test('spec: real-sizes', async () => {
	const reused = new Map<number, number>();

	const { format, plist } = decodeBinary(
		await fixturePlist('real-sizes', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 84);

	const d64 = new Uint8Array(8);
	const d32 = new Uint8Array(d64.buffer, 0, 4);
	const dv = new DataView(d64.buffer);
	for (let i = 0; i < 84;) {
		const k: PLType = plist.get(i)!;
		assertInstanceOf(k, PLString, `${i}`);
		const tag: string = k.value;
		i++;

		const [type, hex] = k.value.split(' ');
		const v: PLType = plist.get(i)!;
		assertInstanceOf(v, PLReal, tag);

		// CF reuses non-finite reals at encode.
		let bits = type === 'f32' ? 32 : 64;
		if (!Number.isFinite(v.value)) {
			if (reused.has(v.value)) {
				bits = reused.get(v.value)!;
			} else {
				reused.set(v.value, bits);
			}
		}
		assertEquals(v.bits, bits, tag);

		let d;
		switch (type) {
			case 'f32': {
				dv.setFloat32(0, v.value);
				d = d32;
				break;
			}
			case 'f64': {
				dv.setFloat64(0, v.value);
				d = d64;
				break;
			}
			default: {
				throw new Error(`Unknown type: ${type}`);
			}
		}
		const dh = [...d].map((b) => b.toString(16).padStart(2, '0')).join('');
		assertEquals(dh, hex, tag);
		i++;
	}
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

Deno.test('spec: uid-reuse', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('uid-reuse', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLArray);

	const a = plist.get(0)!;
	assertInstanceOf(a, PLUID);
	assertEquals(a.value, 42n);

	const b = plist.get(1)!;
	assertInstanceOf(b, PLUID);
	assertEquals(b.value, 42n);

	assertStrictEquals(a, b);
});

Deno.test('spec: uid-sizes', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('uid-sizes', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 22);

	for (let i = 0; i < 22;) {
		const k: PLType = plist.get(i)!;
		assertInstanceOf(k, PLString, `${i}`);
		i++;

		const v: PLType = plist.get(i)!;
		assertInstanceOf(v, PLUID, `${i}`);
		const expected = BigInt(k.value);
		assertEquals(v.value, expected, k.value);
		i++;
	}
});

Deno.test('spec: binary-edge fill', async () => {
	const data = await fixturePlist('binary-edge', 'fill');
	assertThrows(
		() => decodeBinary(data, CF_STYLE),
		SyntaxError,
		binaryError(8),
	);
});

Deno.test('spec: binary-edge infinite-recursion', async () => {
	const data = await fixturePlist('binary-edge', 'infinite-recursion');
	assertThrows(
		() => decodeBinary(data, CF_STYLE),
		SyntaxError,
		binaryError(8),
	);
});

Deno.test('spec: binary-edge uid-over', async () => {
	const data = await fixturePlist('binary-edge', 'uid-over');
	assertThrows(
		() => decodeBinary(data, CF_STYLE),
		SyntaxError,
		binaryError(8),
	);
});
