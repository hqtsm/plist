import { assertEquals, assertThrows } from '@std/assert';
import { fixturePlist } from '../spec/fixture.ts';
import { PLArray, PLTYPE_ARRAY } from '../array.ts';
import { PLBoolean, PLTYPE_BOOLEAN } from '../boolean.ts';
import { PLData } from '../data.ts';
import { PLDate } from '../date.ts';
import { PLDictionary, PLTYPE_DICTIONARY } from '../dictionary.ts';
import { FORMAT_BINARY_V1_0 } from '../format.ts';
import { PLInteger } from '../integer.ts';
import { PLNull } from '../null.ts';
import { PLReal } from '../real.ts';
import { PLSet, PLTYPE_SET } from '../set.ts';
import { PLString } from '../string.ts';
import type { PLType } from '../type.ts';
import { PLTYPE_UID, PLUID } from '../uid.ts';
import { encodeBinary, type EncodeBinaryOptions } from './binary.ts';

const CF_STYLE = {
	// CF duplicates encoding reused references to certain types.
	duplicates: [
		PLTYPE_ARRAY,
		PLTYPE_BOOLEAN,
		PLTYPE_DICTIONARY,
		PLTYPE_UID,
	] as const,
} as const satisfies EncodeBinaryOptions;

function diff(a: Uint8Array, b: Uint8Array): number {
	for (let i = 0, l = Math.max(a.length, b.length); i < l; i++) {
		if (a[i] !== b[i]) {
			return i;
		}
	}
	return -1;
}

Deno.test('Default format', () => {
	assertEquals(
		new Uint8Array(encodeBinary(new PLString())),
		new Uint8Array(
			encodeBinary(new PLString(), { format: FORMAT_BINARY_V1_0 }),
		),
	);
});

Deno.test('Invalid format', () => {
	assertThrows(
		() => {
			encodeBinary(new PLString(), {
				format: 'UNKNOWN' as typeof FORMAT_BINARY_V1_0,
			});
		},
		RangeError,
		'Invalid format',
	);
});

Deno.test('Invalid key', () => {
	const keys: PLType[] = [
		{ [Symbol.toStringTag]: 'UNKNOWN' } as unknown as PLType,
	];
	for (const key of keys) {
		const dict = new PLDictionary();
		dict.set(key, new PLString());
		assertThrows(
			() => encodeBinary(dict),
			TypeError,
			'Invalid binary key type',
		);
	}
});

Deno.test('Circular reference: array', () => {
	const array = new PLArray();
	array.push(new PLDictionary([[new PLString('A'), array]]));
	assertThrows(
		() => {
			encodeBinary(array);
		},
		TypeError,
		'Circular reference',
	);
});

Deno.test('Circular reference: dict', () => {
	const dict = new PLDictionary();
	dict.set(new PLString('A'), new PLArray([dict]));
	assertThrows(
		() => {
			encodeBinary(dict);
		},
		TypeError,
		'Circular reference',
	);
});

Deno.test('Circular reference: set', () => {
	const set = new PLSet();
	set.add(new PLDictionary([[new PLString('A'), set]]));
	assertThrows(
		() => {
			encodeBinary(set);
		},
		TypeError,
		'Circular reference',
	);
});

Deno.test('Invalid type', () => {
	assertThrows(
		() => {
			encodeBinary({} as unknown as PLType);
		},
		TypeError,
		'Invalid binary value type',
	);
});

Deno.test('spec: array-0', async () => {
	const encode = encodeBinary(new PLArray(), CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('array-0', 'binary'),
	);
});

Deno.test('spec: array-1', async () => {
	const encode = encodeBinary(new PLArray([new PLString('A')]), CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('array-1', 'binary'),
	);
});

Deno.test('spec: array-4', async () => {
	const data0 = new PLData(2);
	new Uint8Array(data0.buffer).set([97, 97]);
	const data1 = new PLData(2);
	new Uint8Array(data1.buffer).set([98, 98]);
	const array = new PLArray();
	for (let i = 0; i < 4; i++) {
		array.push(i % 2 ? data1 : data0);
	}
	const encode = encodeBinary(array, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('array-4', 'binary'),
	);
});

Deno.test('spec: array-8', async () => {
	const array = new PLArray();
	const A = new PLString('A');
	const B = new PLString('B');
	for (let i = 0; i < 8; i++) {
		array.push(i % 2 ? B : A);
	}
	const encode = encodeBinary(array, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('array-8', 'binary'),
	);
});

Deno.test('spec: array-14', async () => {
	const array = new PLArray();
	const TRUE = new PLBoolean(true);
	const FALSE = new PLBoolean(false);
	for (let i = 0; i < 14; i++) {
		array.push(i % 2 ? TRUE : FALSE);
	}
	const encode = encodeBinary(array, {
		...CF_STYLE,
		duplicates: [TRUE, FALSE],
	});
	assertEquals(
		encode,
		await fixturePlist('array-14', 'binary'),
	);
});

Deno.test('spec: array-15', async () => {
	const array = new PLArray();
	const date0 = new PLDate(0);
	const date1 = new PLDate(1);
	for (let i = 0; i < 15; i++) {
		array.push(i % 2 ? date1 : date0);
	}
	const encode = encodeBinary(array, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('array-15', 'binary'),
	);
});

Deno.test('spec: array-26', async () => {
	const array = new PLArray();
	for (let i = 0; i < 26; i++) {
		array.push(new PLString(String.fromCharCode(65 + i)));
	}
	const encode = encodeBinary(array, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('array-26', 'binary'),
	);
});

Deno.test('spec: array-128', async () => {
	const array = new PLArray();
	const real0 = new PLReal(0);
	const real1 = new PLReal(1);
	for (let i = 0; i < 128; i++) {
		array.push(i % 2 ? real1 : real0);
	}
	const encode = encodeBinary(array, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('array-128', 'binary'),
	);
});

Deno.test('spec: array-255', async () => {
	const array = new PLArray();
	const int0 = new PLInteger(0n);
	const int1 = new PLInteger(1n);
	for (let i = 0; i < 255; i++) {
		array.push(i % 2 ? int1 : int0);
	}
	const encode = encodeBinary(array, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('array-255', 'binary'),
	);
});

Deno.test('spec: array-256', async () => {
	const array = new PLArray();
	const TRUE = new PLBoolean(true);
	const FALSE = new PLBoolean(false);
	for (let i = 0; i < 256; i++) {
		array.push(i % 2 ? TRUE : FALSE);
	}
	const encode = encodeBinary(array, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('array-256', 'binary'),
	);
});

Deno.test('spec: array-65534', async () => {
	const array = new PLArray();
	const TRUE = new PLBoolean(true);
	const FALSE = new PLBoolean(false);
	for (let i = 0; i < 65534; i++) {
		array.push(i % 2 ? TRUE : FALSE);
	}
	const encode = encodeBinary(array, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('array-65534', 'binary'),
	);
});

Deno.test('spec: array-65535', async () => {
	const array = new PLArray();
	const TRUE = new PLBoolean(true);
	const FALSE = new PLBoolean(false);
	for (let i = 0; i < 65535; i++) {
		array.push(i % 2 ? TRUE : FALSE);
	}
	const encode = encodeBinary(array, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('array-65535', 'binary'),
	);
});

Deno.test('spec: array-65536', async () => {
	const array = new PLArray();
	const TRUE = new PLBoolean(true);
	const FALSE = new PLBoolean(false);
	for (let i = 0; i < 65536; i++) {
		array.push(i % 2 ? TRUE : FALSE);
	}
	const encode = encodeBinary(array, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('array-65536', 'binary'),
	);
});

Deno.test('spec: array-reuse', async () => {
	const reuse = new PLArray([new PLString('AAAA'), new PLString('BBBB')]);
	const encode = encodeBinary(new PLArray([reuse, reuse]), CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('array-reuse', 'binary'),
	);
});

Deno.test('spec: data-0', async () => {
	const encode = encodeBinary(new PLData(), CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('data-0', 'binary'),
	);
});

Deno.test('spec: data-1', async () => {
	const data = new PLData(1);
	new Uint8Array(data.buffer)[0] = 0x61;
	const encode = encodeBinary(data, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('data-1', 'binary'),
	);
});

Deno.test('spec: data-2', async () => {
	const data = new PLData(2);
	new Uint8Array(data.buffer).set(new Uint8Array([0x61, 0x62]));
	const encode = encodeBinary(data, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('data-2', 'binary'),
	);
});
Deno.test('spec: data-3', async () => {
	const data = new PLData(3);
	new Uint8Array(data.buffer).set(new Uint8Array([0x61, 0x62, 0x63]));
	const encode = encodeBinary(data, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('data-3', 'binary'),
	);
});

Deno.test('spec: data-4', async () => {
	const data = new PLData(4);
	new Uint8Array(data.buffer).set(new Uint8Array([0x61, 0x62, 0x63, 0x64]));
	const encode = encodeBinary(data, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('data-4', 'binary'),
	);
});

Deno.test('spec: data-14', async () => {
	const chars = [...'abcdefghijklmn'].map((c) => c.charCodeAt(0));
	const data = new PLData(chars.length);
	new Uint8Array(data.buffer).set(chars);
	const encode = encodeBinary(data, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('data-14', 'binary'),
	);
});

Deno.test('spec: data-15', async () => {
	const chars = [...'abcdefghijklmno'].map((c) => c.charCodeAt(0));
	const data = new PLData(chars.length);
	new Uint8Array(data.buffer).set(chars);
	const encode = encodeBinary(data, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('data-15', 'binary'),
	);
});

Deno.test('spec: data-255', async () => {
	const bytes = new Uint8Array(255);
	for (let i = 0; i < 255; i++) {
		bytes[i] = i;
	}
	const data = new PLData(255);
	new Uint8Array(data.buffer).set(bytes);
	const encode = encodeBinary(data, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('data-255', 'binary'),
	);
});

Deno.test('spec: data-256', async () => {
	const bytes = new Uint8Array(256);
	for (let i = 0; i < 256; i++) {
		bytes[i] = i;
	}
	const data = new PLData(256);
	new Uint8Array(data.buffer).set(bytes);
	const encode = encodeBinary(data, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('data-256', 'binary'),
	);
});

Deno.test('spec: data-reuse', async () => {
	const bytes = 'reused'.split('').map((c) => c.charCodeAt(0));
	const reuse = new PLData(bytes.length);
	new Uint8Array(reuse.buffer).set(bytes);
	const encode = encodeBinary(new PLArray([reuse, reuse]), CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('data-reuse', 'binary'),
	);
});

Deno.test('spec: dict-empty', async () => {
	const dict = new PLDictionary();
	const encode = encodeBinary(dict, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('dict-empty', 'binary'),
	);
});

Deno.test('spec: dict-empties', async () => {
	const dict = new PLDictionary();
	dict.set(new PLString('dict'), new PLDictionary());
	dict.set(new PLString('array'), new PLArray());
	const encode = encodeBinary(dict, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('dict-empties', 'binary'),
	);
});

Deno.test('spec: dict-26', async () => {
	const dict = new PLDictionary();
	for (const C of 'RBKTDMVFOXHQAZJSCLUENWGPYI') {
		dict.set(new PLString(C), new PLString(C.toLowerCase()));
	}
	const encode = encodeBinary(dict, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('dict-26', 'binary'),
	);
});

Deno.test('spec: dict-long-key', async () => {
	const dict = new PLDictionary();
	dict.set(
		new PLString(
			'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789',
		),
		new PLString('64'),
	);
	const encode = encodeBinary(dict, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('dict-long-key', 'binary'),
	);
});

Deno.test('spec: dict-unicode-key', async () => {
	const dict = new PLDictionary();
	dict.set(
		new PLString('UTF\u20138'),
		new PLString('utf-8'),
	);
	const encode = encodeBinary(dict, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('dict-unicode-key', 'binary'),
	);
});

Deno.test('spec: dict-nesting', async () => {
	const encode = encodeBinary(
		new PLDictionary([
			[
				new PLString('B'),
				new PLDictionary([
					[
						new PLString('BB'),
						new PLDictionary([
							[new PLString('BBA'), new PLString('bba')],
							[new PLString('BBB'), new PLString('bbb')],
						]),
					],
					[
						new PLString('BA'),
						new PLDictionary([
							[new PLString('BAA'), new PLString('baa')],
							[new PLString('BAB'), new PLString('bab')],
						]),
					],
				]),
			],
			[
				new PLString('A'),
				new PLDictionary([
					[
						new PLString('AA'),
						new PLDictionary([
							[new PLString('AAA'), new PLString('aaa')],
							[new PLString('AAB'), new PLString('aab')],
						]),
					],
					[
						new PLString('AB'),
						new PLDictionary([
							[new PLString('ABB'), new PLString('abb')],
							[new PLString('ABA'), new PLString('aba')],
						]),
					],
				]),
			],
		]),
		CF_STYLE,
	);
	assertEquals(
		encode,
		await fixturePlist('dict-nesting', 'binary'),
	);
});

Deno.test('spec: dict-order', async () => {
	const encode = encodeBinary(
		new PLDictionary([
			[new PLString('ac'), new PLString('6')],
			[new PLString('abb'), new PLString('5')],
			[new PLString('ab'), new PLString('4')],
			[new PLString('aaa'), new PLString('3')],
			[new PLString('aa'), new PLString('2')],
			[new PLString('a'), new PLString('1')],
			[new PLString(), new PLString('0')],
		]),
		CF_STYLE,
	);
	assertEquals(
		encode,
		await fixturePlist('dict-order', 'binary'),
	);
});

Deno.test('spec: dict-reuse', async () => {
	const reuse = new PLDictionary([
		[new PLString('AAAA'), new PLString('1111')],
		[new PLString('BBBB'), new PLString('2222')],
	]);
	const encode = encodeBinary(
		new PLArray([reuse, reuse]),
		CF_STYLE,
	);
	assertEquals(
		encode,
		await fixturePlist('dict-reuse', 'binary'),
	);
});

Deno.test('spec: dict-repeat', async () => {
	const encode = encodeBinary(
		new PLDictionary([
			[new PLString('C'), new PLString('32')],
			[new PLString('A'), new PLString('11')],
			[new PLString('C'), new PLString('31')],
			[new PLString('B'), new PLString('21')],
			[new PLString('C'), new PLString('33')],
			[new PLString('B'), new PLString('22')],
		]),
		CF_STYLE,
	);
	assertEquals(
		encode,
		await fixturePlist('dict-repeat', 'binary'),
	);
});

Deno.test('spec: string-empty', async () => {
	const encode = encodeBinary(new PLString(), CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('string-empty', 'binary'),
	);
});

Deno.test('spec: string-reuse', async () => {
	const reuse = new PLString('reused');
	const encode = encodeBinary(new PLArray([reuse, reuse]), CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('string-reuse', 'binary'),
	);
});

Deno.test('spec: string-ascii', async () => {
	const encode = encodeBinary(new PLString('ASCII'), CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('string-ascii', 'binary'),
	);
});

Deno.test('spec: string-chars', async () => {
	const array = new PLArray();
	for (let i = 0; i <= 0xffff; i++) {
		array.push(
			new PLString(`${i}`.padStart(5, '0')),
			new PLString(String.fromCharCode(i)),
		);
	}
	const encode = encodeBinary(array, CF_STYLE);
	assertEquals(
		diff(
			encode,
			await fixturePlist('string-chars', 'binary'),
		),
		-1,
	);
});

Deno.test('spec: string-unicode', async () => {
	const encode = encodeBinary(new PLString('UTF\u20138'), CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('string-unicode', 'binary'),
	);
});

Deno.test('spec: string-long-unicode', async () => {
	const encode = encodeBinary(
		new PLString(new Array(8).fill('UTF\u20138').join(' ')),
		CF_STYLE,
	);
	assertEquals(
		encode,
		await fixturePlist('string-long-unicode', 'binary'),
	);
});

Deno.test('spec: string-utf8-mb2-divide', async () => {
	const encode = encodeBinary(new PLString('\u00f7'), CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('string-utf8-mb2-divide', 'binary'),
	);
});

Deno.test('spec: string-utf8-mb2-ohm', async () => {
	const encode = encodeBinary(new PLString('\u03a9'), CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('string-utf8-mb2-ohm', 'binary'),
	);
});

Deno.test('spec: string-utf8-mb3-check', async () => {
	const encode = encodeBinary(new PLString('\u2705'), CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('string-utf8-mb3-check', 'binary'),
	);
});

Deno.test('spec: string-utf8-mb3-plus', async () => {
	const encode = encodeBinary(new PLString('\uff0b'), CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('string-utf8-mb3-plus', 'binary'),
	);
});

Deno.test('spec: string-utf8-mb4-robot', async () => {
	const encode = encodeBinary(new PLString('\ud83e\udd16'), CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('string-utf8-mb4-robot', 'binary'),
	);
});

Deno.test('spec: true', async () => {
	const encode = encodeBinary(new PLBoolean(true), CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('true', 'binary'),
	);
});

Deno.test('spec: false', async () => {
	const encode = encodeBinary(new PLBoolean(false), CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('false', 'binary'),
	);
});

Deno.test('spec: integer-0', async () => {
	const encode = encodeBinary(new PLInteger(0n), CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('integer-0', 'binary'),
	);
});

Deno.test('spec: integer-negative', async () => {
	const encode = encodeBinary(new PLInteger(-42n), CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('integer-negative', 'binary'),
	);
});

Deno.test('spec: integer-reuse', async () => {
	const reuse = new PLInteger(42n);
	const encode = encodeBinary(new PLArray([reuse, reuse]), CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('integer-reuse', 'binary'),
	);
});

Deno.test('spec: integer-min', async () => {
	const encode = encodeBinary(new PLInteger(-0x8000000000000000n), CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('integer-min', 'binary'),
	);
});

Deno.test('spec: integer-sizes', async () => {
	const array = new PLArray();
	for (
		const i of [
			0x0n,
			0x1n,
			0x7fn,
			0x80n,
			0xffn,
			0x100n,
			0xffffn,
			0x10000n,
			0xffffffn,
			0x1000000n,
			0xffffffffn,
			0x100000000n,
			0xffffffffffn,
			0x10000000000n,
			0xffffffffffffn,
			0x1000000000000n,
			0xffffffffffffffn,
			0x100000000000000n,
			0xffffffffffffffffn,
		]
	) {
		array.push(
			new PLString(`0x${i.toString(16)}`),
			new PLInteger(i === 0xffffffffffffffffn ? -1n : i),
		);
	}
	const encode = encodeBinary(array, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('integer-sizes', 'binary'),
	);
});

Deno.test('spec: integer-big', async () => {
	const MIN = -0x80000000000000000000000000000000n;
	const array = new PLArray([
		new PLString('BIG'),
		new PLInteger(0x11121314151617180102030405060708n, 128),
		new PLString('SMALL'),
		new PLInteger(42n, 128),
		new PLString('MAX'),
		new PLInteger(0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn, 128),
		new PLString('MIN'),
		new PLInteger(MIN, 128),
		new PLString('MIN+1'),
		new PLInteger(MIN + 1n, 128),
		new PLString('MIN+2'),
		new PLInteger(MIN + 2n, 128),
	]);
	const encode = encodeBinary(array, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('integer-big', 'binary'),
	);
});

Deno.test('spec: real-float-p0.0', async () => {
	const encode = encodeBinary(new PLReal(0, 32));
	assertEquals(
		encode,
		await fixturePlist('real-float-p0.0', 'binary'),
	);
});

Deno.test('spec: real-double-p0.0', async () => {
	const encode = encodeBinary(new PLReal(0, 64));
	assertEquals(
		encode,
		await fixturePlist('real-double-p0.0', 'binary'),
	);
});

Deno.test('spec: real-reuse', async () => {
	const reuse = new PLReal(3.14);
	const encode = encodeBinary(new PLArray([reuse, reuse]));
	assertEquals(
		encode,
		await fixturePlist('real-reuse', 'binary'),
	);
});

Deno.test('spec: real-sizes', async () => {
	const buffer = new Uint8Array(8);
	const view = new DataView(buffer.buffer);
	const array = new PLArray();
	const realMixed = new Map<string | number, PLReal>();
	const real32 = new Map<string | number, PLReal>();
	const real64 = new Map<string | number, PLReal>();
	for (
		const key of [
			'f64 0000000000000000 0.0',
			'f32 00000000 0.0',
			'f64 8000000000000000 -0.0',
			'f32 80000000 -0.0',
			'f64 3ff0000000000000 1.0',
			'f32 3f800000 1.0',
			'f64 bff0000000000000 -1.0',
			'f32 bf800000 -1.0',
			'f64 4024000000000000 10.0',
			'f32 41200000 10.0',
			'f64 c024000000000000 -10.0',
			'f32 c1200000 -10.0',
			'f64 3f847ae147ae147b 0.01',
			'f32 3c23d70a 0.01',
			'f64 bf847ae147ae147b -0.01',
			'f32 bc23d70a -0.01',
			'f64 40091eb851eb851f 3.14',
			'f32 4048f5c3 3.14',
			'f64 c0091eb851eb851f -3.14',
			'f32 c048f5c3 -3.14',
			'f64 36bc8b8218854567 5e-45',
			'f32 00000004 5e-45',
			'f64 b6bc8b8218854567 -5e-45',
			'f32 80000004 -5e-45',
			'f64 3686d601ad376ab9 5e-46',
			'f32 00000000 5e-46',
			'f64 b686d601ad376ab9 -5e-46',
			'f32 80000000 -5e-46',
			'f64 0000000000000001 5e-324',
			'f32 00000000 5e-324',
			'f64 8000000000000001 -5e-324',
			'f32 80000000 -5e-324',
			'f64 400921fb54442d18 PI',
			'f32 40490fdb PI',
			'f64 c00921fb54442d18 -PI',
			'f32 c0490fdb -PI',
			'f64 7ff8000000000000 NAN',
			'f32 7fc00000 NAN',
			'f64 7ff0000000000000 INFINITY',
			'f32 7f800000 INFINITY',
			'f64 fff0000000000000 -INFINITY',
			'f32 ff800000 -INFINITY',
		]
	) {
		const [bits, hex] = key.split(' ');
		for (let i = 0; i < hex.length; i += 2) {
			buffer[i / 2] = parseInt(hex.slice(i, i + 2), 16);
		}
		let real;
		if (bits === 'f32') {
			const value = view.getFloat32(0);
			if (Object.is(value, -0)) {
				real = new PLReal(value, 32);
			} else {
				const b = Number.isFinite(value) ? real32 : realMixed;
				b.set(value, real = b.get(value) ?? new PLReal(value, 32));
			}
		} else {
			const value = view.getFloat64(0);
			if (Object.is(value, -0)) {
				real = new PLReal(value);
			} else {
				const b = Number.isFinite(value) ? real64 : realMixed;
				b.set(value, real = b.get(value) ?? new PLReal(value));
			}
		}
		array.push(new PLString(key), real);
	}
	const encode = encodeBinary(array, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('real-sizes', 'binary'),
	);
});

Deno.test('spec: date-0.0', async () => {
	const encode = encodeBinary(new PLDate(0), CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('date-0.0', 'binary'),
	);
});

Deno.test('spec: date-every-day-2001', async () => {
	const array = new PLArray();
	for (let day = 1; day <= 365; day++) {
		const date = new PLDate();
		date.year = 2001;
		date.day = day;
		array.push(new PLString(String(day).padStart(3, '0')), date);
	}
	const encode = encodeBinary(array, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('date-every-day-2001', 'binary'),
	);
});

Deno.test('spec: date-every-day-2004', async () => {
	const array = new PLArray();
	for (let day = 1; day <= 366; day++) {
		const date = new PLDate();
		date.year = 2004;
		date.day = day;
		array.push(new PLString(String(day).padStart(3, '0')), date);
	}
	const encode = encodeBinary(array, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('date-every-day-2004', 'binary'),
	);
});

Deno.test('spec: date-reuse', async () => {
	const date = new PLDate(42);
	const encode = encodeBinary(new PLArray([date, date]), CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('date-reuse', 'binary'),
	);
});

Deno.test('spec: date-edge', async () => {
	const values = [
		0.0,
		1.0,
		-1.0,
		-59011441438.0,
		-63300000000.0,
		0.000001,
		-0.000001,
		0.00001,
		-0.00001,
		0.0001,
		-0.0001,
		0.001,
		-0.001,
		0.01,
		-0.01,
		0.1,
		-0.1,
		0.5,
		-0.5,
		0.9,
		-0.9,
		0.99999,
		-0.99999,
		12596342400.0,
		2.220446049250313e-16,
		Math.E,
		Math.LOG2E,
		Math.LOG10E,
		Math.LN2,
		Math.LN10,
		Math.PI,
		Math.PI / 2,
		Math.PI / 4,
		1 / Math.PI,
		2 / Math.PI,
		2 / Math.sqrt(Math.PI),
		Math.SQRT2,
		Math.SQRT1_2,
		-978307200.0,
		978307200.0,
		123456789.0,
		9007199254740991.0,
		-9007199254740991.0,
		NaN,
		Infinity,
		-Infinity,
	];
	const floatBytes = new Uint8Array(8);
	const floatView = new DataView(floatBytes.buffer);
	const array = new PLArray();
	for (const value of values) {
		let key;
		if (Object.is(value, -0)) {
			key = '-0.000000';
		} else if (value === Infinity) {
			key = 'inf';
		} else if (value === -Infinity) {
			key = '-inf';
		} else if (Object.is(value, NaN)) {
			key = 'nan';
		} else {
			key = value.toFixed(6);
		}
		key += ' ';
		floatView.setFloat64(0, value);
		for (const byte of floatBytes) {
			key += byte.toString(16).padStart(2, '0');
		}
		array.push(new PLString(key), new PLDate(value));
	}
	const encode = encodeBinary(array);
	assertEquals(
		encode,
		await fixturePlist('date-edge', 'binary'),
	);
});

Deno.test('spec: uid-42', async () => {
	const encode = encodeBinary(new PLUID(42n), CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('uid-42', 'binary'),
	);
});

Deno.test('spec: uid-reuse', async () => {
	const uid = new PLUID(42n);
	const encode = encodeBinary(new PLArray([uid, uid]), CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('uid-reuse', 'binary'),
	);
});

Deno.test('spec: uid-sizes', async () => {
	const array = new PLArray();
	for (
		const value of [
			0x0,
			0x1,
			0x7f,
			0x80,
			0xff,
			0x100,
			0xffff,
			0x10000,
			0xffffff,
			0x1000000,
			0xffffffff,
		]
	) {
		array.push(
			new PLString(`0x${value.toString(16)}`),
			new PLUID(BigInt(value)),
		);
	}
	const encode = encodeBinary(array, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('uid-sizes', 'binary'),
	);
});

Deno.test('spec: null', async () => {
	const plist = new PLNull();
	const encode = encodeBinary(plist, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('null', 'binary'),
	);
});

Deno.test('spec: array-null', async () => {
	const plist = new PLArray([new PLNull()]);
	const encode = encodeBinary(plist, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('array-null', 'binary'),
	);
});

Deno.test('spec: set-0', async () => {
	const plist = new PLSet();
	const encode = encodeBinary(plist, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('set-0', 'binary'),
	);
});

Deno.test('spec: set-1', async () => {
	const plist = new PLSet([new PLString('A')]);
	const encode = encodeBinary(plist, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('set-1', 'binary'),
	);
});

Deno.test('spec: set-14', async () => {
	const plist = new PLSet();
	for (let i = 0; i < 14; i++) {
		plist.add(new PLString(i.toString(16).toUpperCase()));
	}
	const encode = encodeBinary(plist, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('set-14', 'binary'),
	);
});

Deno.test('spec: set-15', async () => {
	const plist = new PLSet();
	for (let i = 0; i < 15; i++) {
		plist.add(new PLString(i.toString(16).toUpperCase()));
	}
	const encode = encodeBinary(plist, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('set-15', 'binary'),
	);
});

Deno.test('spec: set-26', async () => {
	const plist = new PLSet();
	for (let i = 0; i < 26; i++) {
		plist.add(new PLString(String.fromCharCode(65 + i)));
	}
	const encode = encodeBinary(plist, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('set-26', 'binary'),
	);
});

Deno.test('spec: set-128', async () => {
	const plist = new PLSet();
	for (let i = 0; i < 128; i++) {
		plist.add(new PLString(i.toString().padStart(3, '0')));
	}
	const encode = encodeBinary(plist, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('set-128', 'binary'),
	);
});

Deno.test('spec: set-254', async () => {
	const plist = new PLSet();
	for (let i = 0; i < 254; i++) {
		plist.add(new PLString(i.toString().padStart(3, '0')));
	}
	const encode = encodeBinary(plist, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('set-254', 'binary'),
	);
});

Deno.test('spec: set-255', async () => {
	const plist = new PLSet();
	for (let i = 0; i < 255; i++) {
		plist.add(new PLString(i.toString().padStart(3, '0')));
	}
	const encode = encodeBinary(plist, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('set-255', 'binary'),
	);
});

Deno.test('spec: set-256', async () => {
	const plist = new PLSet();
	for (let i = 0; i < 256; i++) {
		plist.add(new PLString(i.toString().padStart(3, '0')));
	}
	const encode = encodeBinary(plist, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('set-256', 'binary'),
	);
});

Deno.test('spec: set-65534', async () => {
	const plist = new PLSet();
	for (let i = 0; i < 65534; i++) {
		plist.add(new PLString(i.toString().padStart(5, '0')));
	}
	const encode = encodeBinary(plist, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('set-65534', 'binary'),
	);
});

Deno.test('spec: set-65535', async () => {
	const plist = new PLSet();
	for (let i = 0; i < 65535; i++) {
		plist.add(new PLString(i.toString().padStart(5, '0')));
	}
	const encode = encodeBinary(plist, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('set-65535', 'binary'),
	);
});

Deno.test('spec: set-reuse', async () => {
	const set = new PLSet([new PLString('AAAA'), new PLString('BBBB')]);
	const plist = new PLArray([set, set]);
	const encode = encodeBinary(plist, {
		...CF_STYLE,
		duplicates: [...CF_STYLE.duplicates, PLTYPE_SET],
	});
	assertEquals(
		encode,
		await fixturePlist('set-reuse', 'binary'),
	);
});

Deno.test('spec: array-set', async () => {
	const plist = new PLArray([new PLSet()]);
	const encode = encodeBinary(plist, CF_STYLE);
	assertEquals(
		encode,
		await fixturePlist('array-set', 'binary'),
	);
});

Deno.test('spec: binary-edge key-type-string-ascii', async () => {
	const plist = new PLDictionary([
		[new PLString('KEY'), new PLString('value')],
	]);
	const encode = encodeBinary(plist);
	assertEquals(
		encode,
		await fixturePlist('binary-edge', 'key-type-string-ascii'),
	);
});

Deno.test('spec: binary-edge key-type-string-unicode', async () => {
	const plist = new PLDictionary([
		[new PLString('\u263A'), new PLString('value')],
	]);
	const encode = encodeBinary(plist);
	assertEquals(
		encode,
		await fixturePlist('binary-edge', 'key-type-string-unicode'),
	);
});

Deno.test('spec: binary-edge key-type-null', async () => {
	const plist = new PLDictionary([
		[new PLNull(), new PLString('value')],
	]);
	const encode = encodeBinary(plist);
	assertEquals(
		encode,
		await fixturePlist('binary-edge', 'key-type-null'),
	);
});

Deno.test('spec: binary-edge key-type-false', async () => {
	const plist = new PLDictionary([
		[new PLBoolean(false), new PLString('value')],
	]);
	const encode = encodeBinary(plist);
	assertEquals(
		encode,
		await fixturePlist('binary-edge', 'key-type-false'),
	);
});

Deno.test('spec: binary-edge key-type-true', async () => {
	const plist = new PLDictionary([
		[new PLBoolean(true), new PLString('value')],
	]);
	const encode = encodeBinary(plist);
	assertEquals(
		encode,
		await fixturePlist('binary-edge', 'key-type-true'),
	);
});

Deno.test('spec: binary-edge key-type-data', async () => {
	const key = new PLData(1);
	new Uint8Array(key.buffer)[0] = 'K'.charCodeAt(0);
	const plist = new PLDictionary([
		[key, new PLString('value')],
	]);
	const encode = encodeBinary(plist);
	assertEquals(
		encode,
		await fixturePlist('binary-edge', 'key-type-data'),
	);
});

Deno.test('spec: binary-edge key-type-date', async () => {
	const plist = new PLDictionary([
		[new PLDate(3.14), new PLString('value')],
	]);
	const encode = encodeBinary(plist);
	assertEquals(
		encode,
		await fixturePlist('binary-edge', 'key-type-date'),
	);
});

Deno.test('spec: binary-edge key-type-float', async () => {
	const plist = new PLDictionary([
		[new PLReal(3.14, 32), new PLString('value')],
	]);
	const encode = encodeBinary(plist);
	assertEquals(
		encode,
		await fixturePlist('binary-edge', 'key-type-float'),
	);
});

Deno.test('spec: binary-edge key-type-double', async () => {
	const plist = new PLDictionary([
		[new PLReal(3.14, 64), new PLString('value')],
	]);
	const encode = encodeBinary(plist);
	assertEquals(
		encode,
		await fixturePlist('binary-edge', 'key-type-double'),
	);
});

Deno.test('spec: binary-edge key-type-int', async () => {
	const plist = new PLDictionary([
		[new PLInteger(123n), new PLString('value')],
	]);
	const encode = encodeBinary(plist);
	assertEquals(
		encode,
		await fixturePlist('binary-edge', 'key-type-int'),
	);
});

Deno.test('spec: binary-edge key-type-uid', async () => {
	const plist = new PLDictionary([
		[new PLUID(42n), new PLString('value')],
	]);
	const encode = encodeBinary(plist);
	assertEquals(
		encode,
		await fixturePlist('binary-edge', 'key-type-uid'),
	);
});

Deno.test('spec: binary-edge key-type-array', async () => {
	const plist = new PLDictionary([
		[new PLArray(), new PLString('value')],
	]);
	const encode = encodeBinary(plist);
	assertEquals(
		encode,
		await fixturePlist('binary-edge', 'key-type-array'),
	);
});

Deno.test('spec: binary-edge key-type-dict', async () => {
	const plist = new PLDictionary([
		[new PLDictionary(), new PLString('value')],
	]);
	const encode = encodeBinary(plist);
	assertEquals(
		encode,
		await fixturePlist('binary-edge', 'key-type-dict'),
	);
});

Deno.test('spec: binary-edge key-type-set', async () => {
	const plist = new PLDictionary([
		[new PLSet(), new PLString('value')],
	]);
	const encode = encodeBinary(plist);
	assertEquals(
		encode,
		await fixturePlist('binary-edge', 'key-type-set'),
	);
});
