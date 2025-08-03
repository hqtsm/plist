import { assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import { fixturePlist } from '../spec/fixture.ts';
import { PLArray } from '../array.ts';
import { PLBoolean } from '../boolean.ts';
import { PLData } from '../data.ts';
import { PLDate } from '../date.ts';
import { PLDict } from '../dict.ts';
import { FORMAT_XML_V1_0 } from '../format.ts';
import { PLInteger } from '../integer.ts';
import { PLReal } from '../real.ts';
import { PLString } from '../string.ts';
import type { PLType } from '../type.ts';
import { PLUID } from '../uid.ts';
import { encodeXml } from './xml.ts';

function diff(a: Uint8Array, b: Uint8Array): number {
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return i;
		}
	}
	return -1;
}

Deno.test('Default format', () => {
	assertEquals(
		new Uint8Array(encodeXml(new PLString())),
		new Uint8Array(
			encodeXml(new PLString(), { format: FORMAT_XML_V1_0 }),
		),
	);
});

Deno.test('Invalid format', () => {
	assertThrows(
		() => {
			encodeXml(new PLString(), {
				format: 'UNKNOWN' as typeof FORMAT_XML_V1_0,
			});
		},
		RangeError,
		'Invalid format',
	);
});

Deno.test('Circular reference: array', () => {
	const array = new PLArray();
	array.push(new PLDict([[new PLString('A'), array]]));
	assertThrows(
		() => {
			encodeXml(array);
		},
		TypeError,
		'Circular reference',
	);
});

Deno.test('Circular reference: dict', () => {
	const dict = new PLDict();
	dict.set(new PLString('A'), new PLArray([dict]));
	assertThrows(
		() => {
			encodeXml(dict);
		},
		TypeError,
		'Circular reference',
	);
});

Deno.test('Invalid indent', () => {
	assertThrows(
		() => {
			encodeXml(new PLString(), { indent: '\n' });
		},
		RangeError,
		'Invalid indent',
	);
});

Deno.test('Invalid type', () => {
	assertThrows(
		() => {
			encodeXml({} as unknown as PLType);
		},
		TypeError,
		'Invalid XML value type',
	);
});

Deno.test('Weird version', () => {
	const encode = encodeXml(new PLBoolean(), {
		version: `<'&">`,
	});
	const xml = new TextDecoder().decode(encode);
	assertStringIncludes(xml, `<plist version="&lt;'&amp;&quot;&gt;">`);
});

Deno.test('spec: array-0', async () => {
	const encode = encodeXml(new PLArray());
	assertEquals(
		encode,
		await fixturePlist('array-0', 'xml'),
	);
});

Deno.test('spec: array-1', async () => {
	const encode = encodeXml(
		new PLArray([
			new PLString('A'),
		]),
	);
	assertEquals(
		encode,
		await fixturePlist('array-1', 'xml'),
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
	const encode = encodeXml(array);
	assertEquals(
		encode,
		await fixturePlist('array-4', 'xml'),
	);
});

Deno.test('spec: array-8', async () => {
	const array = new PLArray();
	const A = new PLString('A');
	const B = new PLString('B');
	for (let i = 0; i < 8; i++) {
		array.push(i % 2 ? B : A);
	}
	const encode = encodeXml(array);
	assertEquals(
		encode,
		await fixturePlist('array-8', 'xml'),
	);
});

Deno.test('spec: array-14', async () => {
	const array = new PLArray();
	const TRUE = new PLBoolean(true);
	const FALSE = new PLBoolean(false);
	for (let i = 0; i < 14; i++) {
		array.push(i % 2 ? TRUE : FALSE);
	}
	const encode = encodeXml(array);
	assertEquals(
		encode,
		await fixturePlist('array-14', 'xml'),
	);
});

Deno.test('spec: array-15', async () => {
	const array = new PLArray();
	const date0 = new PLDate(0);
	const date1 = new PLDate(1);
	for (let i = 0; i < 15; i++) {
		array.push(i % 2 ? date1 : date0);
	}
	const encode = encodeXml(array);
	assertEquals(
		encode,
		await fixturePlist('array-15', 'xml'),
	);
});

Deno.test('spec: array-26', async () => {
	const array = new PLArray();
	for (let i = 0; i < 26; i++) {
		array.push(new PLString(String.fromCharCode(65 + i)));
	}
	const encode = encodeXml(array);
	assertEquals(
		encode,
		await fixturePlist('array-26', 'xml'),
	);
});

Deno.test('spec: array-128', async () => {
	const array = new PLArray();
	const real0 = new PLReal(0);
	const real1 = new PLReal(1);
	for (let i = 0; i < 128; i++) {
		array.push(i % 2 ? real1 : real0);
	}
	const encode = encodeXml(array);
	assertEquals(
		encode,
		await fixturePlist('array-128', 'xml'),
	);
});

Deno.test('spec: array-255', async () => {
	const array = new PLArray();
	const int0 = new PLInteger(0n);
	const int1 = new PLInteger(1n);
	for (let i = 0; i < 255; i++) {
		array.push(i % 2 ? int1 : int0);
	}
	const encode = encodeXml(array);
	assertEquals(
		encode,
		await fixturePlist('array-255', 'xml'),
	);
});

Deno.test('spec: array-256', async () => {
	const array = new PLArray();
	const TRUE = new PLBoolean(true);
	const FALSE = new PLBoolean(false);
	for (let i = 0; i < 256; i++) {
		array.push(i % 2 ? TRUE : FALSE);
	}
	const encode = encodeXml(array);
	assertEquals(
		encode,
		await fixturePlist('array-256', 'xml'),
	);
});

Deno.test('spec: array-65534', async () => {
	const array = new PLArray();
	const TRUE = new PLBoolean(true);
	const FALSE = new PLBoolean(false);
	for (let i = 0; i < 65534; i++) {
		array.push(i % 2 ? TRUE : FALSE);
	}
	const encode = encodeXml(array);
	assertEquals(
		encode,
		await fixturePlist('array-65534', 'xml'),
	);
});

Deno.test('spec: array-65535', async () => {
	const array = new PLArray();
	const TRUE = new PLBoolean(true);
	const FALSE = new PLBoolean(false);
	for (let i = 0; i < 65535; i++) {
		array.push(i % 2 ? TRUE : FALSE);
	}
	const encode = encodeXml(array);
	assertEquals(
		encode,
		await fixturePlist('array-65535', 'xml'),
	);
});

Deno.test('spec: array-65536', async () => {
	const array = new PLArray();
	const TRUE = new PLBoolean(true);
	const FALSE = new PLBoolean(false);
	for (let i = 0; i < 65536; i++) {
		array.push(i % 2 ? TRUE : FALSE);
	}
	const encode = encodeXml(array);
	assertEquals(
		encode,
		await fixturePlist('array-65536', 'xml'),
	);
});

Deno.test('spec: array-reuse', async () => {
	const reuse = new PLArray([new PLString('AAAA'), new PLString('BBBB')]);
	const encode = encodeXml(new PLArray([reuse, reuse]));
	assertEquals(
		encode,
		await fixturePlist('array-reuse', 'xml'),
	);
});

Deno.test('spec: data-0', async () => {
	const encode = encodeXml(new PLData());
	assertEquals(
		encode,
		await fixturePlist('data-0', 'xml'),
	);
});

Deno.test('spec: data-1', async () => {
	const data = new PLData(1);
	new Uint8Array(data.buffer)[0] = 0x61;
	const encode = encodeXml(data);
	assertEquals(
		encode,
		await fixturePlist('data-1', 'xml'),
	);
});

Deno.test('spec: data-2', async () => {
	const data = new PLData(2);
	new Uint8Array(data.buffer).set(new Uint8Array([0x61, 0x62]));
	const encode = encodeXml(data);
	assertEquals(
		encode,
		await fixturePlist('data-2', 'xml'),
	);
});
Deno.test('spec: data-3', async () => {
	const data = new PLData(3);
	new Uint8Array(data.buffer).set(new Uint8Array([0x61, 0x62, 0x63]));
	const encode = encodeXml(data);
	assertEquals(
		encode,
		await fixturePlist('data-3', 'xml'),
	);
});

Deno.test('spec: data-4', async () => {
	const data = new PLData(4);
	new Uint8Array(data.buffer).set(new Uint8Array([0x61, 0x62, 0x63, 0x64]));
	const encode = encodeXml(data);
	assertEquals(
		encode,
		await fixturePlist('data-4', 'xml'),
	);
});

Deno.test('spec: data-14', async () => {
	const chars = [...'abcdefghijklmn'].map((c) => c.charCodeAt(0));
	const data = new PLData(chars.length);
	new Uint8Array(data.buffer).set(chars);
	const encode = encodeXml(data);
	assertEquals(
		encode,
		await fixturePlist('data-14', 'xml'),
	);
});

Deno.test('spec: data-15', async () => {
	const chars = [...'abcdefghijklmno'].map((c) => c.charCodeAt(0));
	const data = new PLData(chars.length);
	new Uint8Array(data.buffer).set(chars);
	const encode = encodeXml(data);
	assertEquals(
		encode,
		await fixturePlist('data-15', 'xml'),
	);
});

Deno.test('spec: data-255', async () => {
	const bytes = new Uint8Array(255);
	for (let i = 0; i < 255; i++) {
		bytes[i] = i;
	}
	const data = new PLData(255);
	new Uint8Array(data.buffer).set(bytes);
	const encode = encodeXml(data);
	assertEquals(
		encode,
		await fixturePlist('data-255', 'xml'),
	);
});

Deno.test('spec: data-256', async () => {
	const bytes = new Uint8Array(256);
	for (let i = 0; i < 256; i++) {
		bytes[i] = i;
	}
	const data = new PLData(256);
	new Uint8Array(data.buffer).set(bytes);
	const encode = encodeXml(data);
	assertEquals(
		encode,
		await fixturePlist('data-256', 'xml'),
	);
});

Deno.test('spec: data-reuse', async () => {
	const bytes = 'reused'.split('').map((c) => c.charCodeAt(0));
	const reuse = new PLData(bytes.length);
	new Uint8Array(reuse.buffer).set(bytes);
	const encode = encodeXml(new PLArray([reuse, reuse]));
	assertEquals(
		encode,
		await fixturePlist('data-reuse', 'xml'),
	);
});

Deno.test('spec: dict-empty', async () => {
	const dict = new PLDict();
	const encode = encodeXml(dict);
	assertEquals(
		encode,
		await fixturePlist('dict-empty', 'xml'),
	);
});

Deno.test('spec: dict-empties', async () => {
	const dict = new PLDict();
	dict.set(new PLString('array'), new PLArray());
	dict.set(new PLString('dict'), new PLDict());
	const encode = encodeXml(dict);
	assertEquals(
		encode,
		await fixturePlist('dict-empties', 'xml'),
	);
});

Deno.test('spec: dict-long-key', async () => {
	const dict = new PLDict();
	dict.set(
		new PLString(
			'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789',
		),
		new PLString('64'),
	);
	const encode = encodeXml(dict);
	assertEquals(
		encode,
		await fixturePlist('dict-long-key', 'xml'),
	);
});

Deno.test('spec: dict-nesting', async () => {
	const encode = encodeXml(
		new PLDict([
			[
				new PLString('A'),
				new PLDict([
					[
						new PLString('AA'),
						new PLDict([
							[new PLString('AAA'), new PLString('aaa')],
							[new PLString('AAB'), new PLString('aab')],
						]),
					],
					[
						new PLString('AB'),
						new PLDict([
							[new PLString('ABA'), new PLString('aba')],
							[new PLString('ABB'), new PLString('abb')],
						]),
					],
				]),
			],
			[
				new PLString('B'),
				new PLDict([
					[
						new PLString('BA'),
						new PLDict([
							[new PLString('BAA'), new PLString('baa')],
							[new PLString('BAB'), new PLString('bab')],
						]),
					],
					[
						new PLString('BB'),
						new PLDict([
							[new PLString('BBA'), new PLString('bba')],
							[new PLString('BBB'), new PLString('bbb')],
						]),
					],
				]),
			],
		]),
	);
	assertEquals(
		encode,
		await fixturePlist('dict-nesting', 'xml'),
	);
});

Deno.test('spec: dict-order', async () => {
	const encode = encodeXml(
		new PLDict([
			[new PLString(), new PLString('0')],
			[new PLString('a'), new PLString('1')],
			[new PLString('aa'), new PLString('2')],
			[new PLString('aaa'), new PLString('3')],
			[new PLString('ab'), new PLString('4')],
			[new PLString('abb'), new PLString('5')],
			[new PLString('ac'), new PLString('6')],
		]),
	);
	assertEquals(
		encode,
		await fixturePlist('dict-order', 'xml'),
	);
});

Deno.test('spec: dict-reuse', async () => {
	const reuse = new PLDict([
		[new PLString('AAAA'), new PLString('1111')],
		[new PLString('BBBB'), new PLString('2222')],
	]);
	const encode = encodeXml(
		new PLDict([
			[new PLString('AA'), reuse],
			[new PLString('BB'), reuse],
		]),
	);
	assertEquals(
		encode,
		await fixturePlist('dict-reuse', 'xml'),
	);
});

Deno.test('spec: dict-repeat', async () => {
	const encode = encodeXml(
		new PLDict([
			[new PLString('A'), new PLString('11')],
			[new PLString('B'), new PLString('21')],
			[new PLString('B'), new PLString('22')],
			[new PLString('C'), new PLString('32')],
			[new PLString('C'), new PLString('31')],
			[new PLString('C'), new PLString('33')],
		]),
	);
	assertEquals(
		encode,
		await fixturePlist('dict-repeat', 'xml'),
	);
});

Deno.test('spec: string-empty', async () => {
	const encode = encodeXml(new PLString());
	assertEquals(
		encode,
		await fixturePlist('string-empty', 'xml'),
	);
});

Deno.test('spec: string-reuse', async () => {
	const reuse = new PLString('reused');
	const encode = encodeXml(new PLArray([reuse, reuse]));
	assertEquals(
		encode,
		await fixturePlist('string-reuse', 'xml'),
	);
});

Deno.test('spec: string-ascii', async () => {
	const encode = encodeXml(new PLString('ASCII'));
	assertEquals(
		encode,
		await fixturePlist('string-ascii', 'xml'),
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
	const encode = encodeXml(array);
	assertEquals(
		diff(encode, await fixturePlist('string-chars', 'xml')),
		-1,
	);
});

Deno.test('spec: string-unicode', async () => {
	const encode = encodeXml(new PLString('UTF\u20138'));
	assertEquals(
		encode,
		await fixturePlist('string-unicode', 'xml'),
	);
});

Deno.test('spec: string-utf8-mb2-divide', async () => {
	const encode = encodeXml(new PLString('\u00f7'));
	assertEquals(
		encode,
		await fixturePlist('string-utf8-mb2-divide', 'xml'),
	);
});

Deno.test('spec: string-utf8-mb2-ohm', async () => {
	const encode = encodeXml(new PLString('\u03a9'));
	assertEquals(
		encode,
		await fixturePlist('string-utf8-mb2-ohm', 'xml'),
	);
});

Deno.test('spec: string-utf8-mb3-check', async () => {
	const encode = encodeXml(new PLString('\u2705'));
	assertEquals(
		encode,
		await fixturePlist('string-utf8-mb3-check', 'xml'),
	);
});

Deno.test('spec: string-utf8-mb3-plus', async () => {
	const encode = encodeXml(new PLString('\uff0b'));
	assertEquals(
		encode,
		await fixturePlist('string-utf8-mb3-plus', 'xml'),
	);
});

Deno.test('spec: string-utf8-mb4-robot', async () => {
	const encode = encodeXml(new PLString('\ud83e\udd16'));
	assertEquals(
		encode,
		await fixturePlist('string-utf8-mb4-robot', 'xml'),
	);
});

Deno.test('spec: true', async () => {
	const encode = encodeXml(new PLBoolean(true));
	assertEquals(
		encode,
		await fixturePlist('true', 'xml'),
	);
});

Deno.test('spec: false', async () => {
	const encode = encodeXml(new PLBoolean(false));
	assertEquals(
		encode,
		await fixturePlist('false', 'xml'),
	);
});

Deno.test('spec: integer-0', async () => {
	const encode = encodeXml(new PLInteger(0n));
	assertEquals(
		encode,
		await fixturePlist('integer-0', 'xml'),
	);
});

Deno.test('spec: integer-negative', async () => {
	const encode = encodeXml(new PLInteger(-42n));
	assertEquals(
		encode,
		await fixturePlist('integer-negative', 'xml'),
	);
});

Deno.test('spec: integer-reuse', async () => {
	const reuse = new PLInteger(42n);
	const encode = encodeXml(new PLArray([reuse, reuse]));
	assertEquals(
		encode,
		await fixturePlist('integer-reuse', 'xml'),
	);
});

Deno.test('spec: integer-min', async () => {
	const encode = encodeXml(new PLInteger(-0x8000000000000000n));
	assertEquals(
		encode,
		await fixturePlist('integer-min', 'xml'),
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
	const encode = encodeXml(array);
	assertEquals(
		encode,
		await fixturePlist('integer-sizes', 'xml'),
	);
});

Deno.test('spec: integer-big', async () => {
	const MIN = -0x80000000000000000000000000000000n;
	const dict = new PLArray([
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
	const encode = encodeXml(dict);
	assertEquals(
		encode,
		await fixturePlist('integer-big', 'xml'),
	);
});

Deno.test('spec: real-float-p0.0', async () => {
	const encode = encodeXml(new PLReal(0, 32));
	assertEquals(
		encode,
		await fixturePlist('real-float-p0.0', 'xml'),
	);
});

Deno.test('spec: real-double-p0.0', async () => {
	const encode = encodeXml(new PLReal(0, 64));
	assertEquals(
		encode,
		await fixturePlist('real-double-p0.0', 'xml'),
	);
});

Deno.test('spec: real-reuse', async () => {
	const reuse = new PLReal(3.14);
	const encode = encodeXml(new PLArray([reuse, reuse]));
	assertEquals(
		encode,
		await fixturePlist('real-reuse', 'xml'),
	);
});

Deno.test('spec: real-sizes', async () => {
	const buffer = new Uint8Array(8);
	const view = new DataView(buffer.buffer);
	const array = new PLArray();
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
		const f32 = bits === 'f32';
		const value = f32 ? view.getFloat32(0) : view.getFloat64(0);
		array.push(new PLString(key), new PLReal(value, f32 ? 32 : 64));
	}
	const encode = encodeXml(array);
	assertEquals(
		encode,
		await fixturePlist('real-sizes', 'xml'),
	);
});

Deno.test('spec: date-0.0', async () => {
	const encode = encodeXml(new PLDate(0));
	assertEquals(
		encode,
		await fixturePlist('date-0.0', 'xml'),
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
	const encode = encodeXml(array);
	assertEquals(
		encode,
		await fixturePlist('date-every-day-2001', 'xml'),
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
	const encode = encodeXml(array);
	assertEquals(
		encode,
		await fixturePlist('date-every-day-2004', 'xml'),
	);
});

Deno.test('spec: date-reuse', async () => {
	const date = new PLDate(42);
	const encode = encodeXml(new PLArray([date, date]));
	assertEquals(
		encode,
		await fixturePlist('date-reuse', 'xml'),
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
	const encode = encodeXml(array);
	assertEquals(
		encode,
		await fixturePlist('date-edge', 'xml'),
	);
});

Deno.test('spec: uid-42', async () => {
	const encode = encodeXml(new PLUID(42n));
	assertEquals(
		encode,
		await fixturePlist('uid-42', 'xml'),
	);
});

Deno.test('spec: uid-reuse', async () => {
	const uid = new PLUID(42n);
	const encode = encodeXml(new PLArray([uid, uid]));
	assertEquals(
		encode,
		await fixturePlist('uid-reuse', 'xml'),
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
	const encode = encodeXml(array);
	assertEquals(
		encode,
		await fixturePlist('uid-sizes', 'xml'),
	);
});

Deno.test('Surrogate Pairs', () => {
	const points = [];
	for (let i = 0x10000; i <= 0x10FFFF; i += 23 + (i % 73)) {
		points.push(i);
	}
	points.push(0x10FFFF);

	let start = 0;
	let end = 0;
	const str = new PLString('_');
	{
		const e = encodeXml(str);
		start = e.indexOf(str.value.charCodeAt(0));
		end = start + 1 - e.length;
	}
	const te = new TextEncoder();
	const sd = new Uint8Array(4);

	for (const point of points) {
		const s = String.fromCodePoint(point);
		str.value = s;
		assertEquals(te.encodeInto(s, sd).written, 4);
		const encode = encodeXml(str).slice(start, end);
		assertEquals(encode, sd);
	}
});
