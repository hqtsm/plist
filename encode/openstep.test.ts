import { assertEquals, assertThrows } from '@std/assert';
import { fixturePlist } from '../spec/fixture.ts';
import { PLArray } from '../array.ts';
import { PLString } from '../string.ts';
import { PLData } from '../data.ts';
import { PLDict } from '../dict.ts';
import { FORMAT_OPENSTEP, FORMAT_STRINGS } from '../format.ts';
import type { PLType } from '../type.ts';
import { encodeOpenStep } from './openstep.ts';

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
		encodeOpenStep(new PLString()),
		encodeOpenStep(new PLString(), { format: FORMAT_OPENSTEP }),
	);
});

Deno.test('Invalid format', () => {
	assertThrows(
		() => {
			encodeOpenStep(new PLString(), {
				format: 'UNKNOWN' as typeof FORMAT_OPENSTEP,
			});
		},
		RangeError,
		'Invalid format',
	);
});

Deno.test('Invalid strings root', () => {
	assertThrows(
		() => {
			encodeOpenStep(new PLString(), { format: FORMAT_STRINGS });
		},
		TypeError,
		'Invalid strings root type',
	);
});

Deno.test('Circular reference: array', () => {
	const array = new PLArray();
	array.push(new PLDict([[new PLString('A'), array]]));
	assertThrows(
		() => {
			encodeOpenStep(array);
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
			encodeOpenStep(dict);
		},
		TypeError,
		'Circular reference',
	);
});

Deno.test('Custom indent', () => {
	for (const format of [FORMAT_OPENSTEP, FORMAT_STRINGS] as const) {
		for (const indent of ['  ', '\t\t', '\t ']) {
			const dict = new PLDict([
				[
					new PLString('A'),
					new PLDict([
						[
							new PLString('B'),
							new PLDict([
								[
									new PLString('C'),
									new PLDict([
										[new PLString('D'), new PLString('E')],
									]),
								],
							]),
						],
					]),
				],
			]);
			const encode = encodeOpenStep(dict, { format, indent });
			const indents = new TextDecoder().decode(encode).split('\n')
				.map((s) => s.replace(/\S.*/g, ''));
			assertEquals(
				indents,
				format === FORMAT_STRINGS
					? [
						'',
						indent,
						indent + indent,
						indent + indent + indent,
						indent + indent,
						indent,
						'',
						'',
					]
					: [
						'',
						indent,
						indent + indent,
						indent + indent + indent,
						indent + indent + indent + indent,
						indent + indent + indent,
						indent + indent,
						indent,
						'',
						'',
					],
				`${format}: ${JSON.stringify(indent)}`,
			);
		}
	}
});

Deno.test('Invalid indent', () => {
	assertThrows(
		() => {
			encodeOpenStep(new PLString(), { indent: '\n' });
		},
		RangeError,
		'Invalid indent',
	);
});

Deno.test('Invalid type', () => {
	assertThrows(
		() => {
			encodeOpenStep({} as unknown as PLType);
		},
		TypeError,
		'Invalid OpenStep value type',
	);
});

Deno.test('Custom quote', () => {
	const encode = encodeOpenStep(new PLString(' " \' '), { quote: "'" });
	assertEquals(
		encode,
		new TextEncoder().encode(`' " \\' '\n`),
	);
});

Deno.test('Invalid quote', () => {
	assertThrows(
		() => {
			encodeOpenStep(new PLString(), { quote: '`' as "'" });
		},
		RangeError,
		'Invalid quote',
	);
});

Deno.test('Always quoted', () => {
	const encode = encodeOpenStep(new PLString('A'), { quoted: true });
	assertEquals(
		encode,
		new TextEncoder().encode('"A"\n'),
	);
});

Deno.test('spec: array-0', async () => {
	const encode = encodeOpenStep(new PLArray());
	assertEquals(
		encode,
		await fixturePlist('array-0', 'openstep'),
	);
});

Deno.test('spec: array-1', async () => {
	const encode = encodeOpenStep(new PLArray([new PLString('A')]));
	assertEquals(
		encode,
		await fixturePlist('array-1', 'openstep'),
	);
});

Deno.test('spec: array-4', async () => {
	const aa = new PLData(2);
	new Uint8Array(aa.buffer).set(new Uint8Array([0x61, 0x61]));
	const bb = new PLData(2);
	new Uint8Array(bb.buffer).set(new Uint8Array([0x62, 0x62]));
	const encode = encodeOpenStep(new PLArray([aa, bb, aa, bb]));
	assertEquals(
		encode,
		await fixturePlist('array-4', 'openstep'),
	);
});

Deno.test('spec: array-8', async () => {
	const A = new PLString('A');
	const B = new PLString('B');
	const encode = encodeOpenStep(
		new PLArray([A, B, A, B, A, B, A, B]),
	);
	assertEquals(
		encode,
		await fixturePlist('array-8', 'openstep'),
	);
});

Deno.test('spec: array-26', async () => {
	const encode = encodeOpenStep(
		new PLArray(
			[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map((s) => new PLString(s)),
		),
	);
	assertEquals(
		encode,
		await fixturePlist('array-26', 'openstep'),
	);
});

Deno.test('spec: array-reuse', async () => {
	const reuse = new PLArray([new PLString('AAAA'), new PLString('BBBB')]);
	const encode = encodeOpenStep(new PLArray([reuse, reuse]));
	assertEquals(
		encode,
		await fixturePlist('array-reuse', 'openstep'),
	);
});

Deno.test('spec: data-0', async () => {
	const encode = encodeOpenStep(new PLData());
	assertEquals(
		encode,
		await fixturePlist('data-0', 'openstep'),
	);
});

Deno.test('spec: data-1', async () => {
	const data = new PLData(1);
	new Uint8Array(data.buffer)[0] = 0x61;
	const encode = encodeOpenStep(data);
	assertEquals(
		encode,
		await fixturePlist('data-1', 'openstep'),
	);
});

Deno.test('spec: data-2', async () => {
	const data = new PLData(2);
	new Uint8Array(data.buffer).set(new Uint8Array([0x61, 0x62]));
	const encode = encodeOpenStep(data);
	assertEquals(
		encode,
		await fixturePlist('data-2', 'openstep'),
	);
});
Deno.test('spec: data-3', async () => {
	const data = new PLData(3);
	new Uint8Array(data.buffer).set(new Uint8Array([0x61, 0x62, 0x63]));
	const encode = encodeOpenStep(data);
	assertEquals(
		encode,
		await fixturePlist('data-3', 'openstep'),
	);
});

Deno.test('spec: data-4', async () => {
	const data = new PLData(4);
	new Uint8Array(data.buffer).set(new Uint8Array([0x61, 0x62, 0x63, 0x64]));
	const encode = encodeOpenStep(data);
	assertEquals(
		encode,
		await fixturePlist('data-4', 'openstep'),
	);
});

Deno.test('spec: data-256', async () => {
	const bytes = new Uint8Array(256);
	for (let i = 0; i < 256; i++) {
		bytes[i] = i;
	}
	const data = new PLData(256);
	new Uint8Array(data.buffer).set(bytes);
	const encode = encodeOpenStep(data);
	assertEquals(
		encode,
		await fixturePlist('data-256', 'openstep'),
	);
});

Deno.test('spec: dict-empty', async () => {
	const dict = new PLDict();
	{
		const encode = encodeOpenStep(dict);
		assertEquals(
			encode,
			await fixturePlist('dict-empty', 'openstep'),
		);
	}
	{
		const encode = encodeOpenStep(dict, {
			format: FORMAT_STRINGS,
		});
		assertEquals(
			encode,
			await fixturePlist('dict-empty', 'strings'),
		);
	}
});

Deno.test('spec: dict-chars', async () => {
	const dict = new PLDict();
	for (let i = 0; i <= 0xffff; i++) {
		dict.set(
			new PLString(String.fromCharCode(i)),
			new PLString(String(i)),
		);
	}
	{
		const encode = encodeOpenStep(dict);
		assertEquals(
			diff(encode, await fixturePlist('dict-chars', 'openstep')),
			-1,
		);
	}
	{
		const encode = encodeOpenStep(dict, {
			format: FORMAT_STRINGS,
		});
		assertEquals(
			diff(encode, await fixturePlist('dict-chars', 'strings')),
			-1,
		);
	}
});

Deno.test('spec: dict-order', async () => {
	const encode = encodeOpenStep(
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
		await fixturePlist('dict-order', 'openstep'),
	);
});

Deno.test('spec: dict-reuse', async () => {
	const reuse = new PLDict([
		[new PLString('AAAA'), new PLString('1111')],
		[new PLString('BBBB'), new PLString('2222')],
	]);
	{
		const encode = encodeOpenStep(
			new PLDict([
				[new PLString('AA'), reuse],
				[new PLString('BB'), reuse],
			]),
		);
		assertEquals(
			encode,
			await fixturePlist('dict-reuse', 'openstep'),
		);
	}
	{
		const encode = encodeOpenStep(
			new PLDict([
				[new PLString('AA'), reuse],
				[new PLString('BB'), reuse],
			]),
			{
				format: FORMAT_STRINGS,
			},
		);
		assertEquals(
			encode,
			await fixturePlist('dict-reuse', 'strings'),
		);
	}
});

Deno.test('spec: dict-repeat', async () => {
	const encode = encodeOpenStep(
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
		await fixturePlist('dict-repeat', 'openstep'),
	);
});

Deno.test('spec: string-empty', async () => {
	const encode = encodeOpenStep(new PLString());
	assertEquals(
		encode,
		await fixturePlist('string-empty', 'openstep'),
	);
});

Deno.test('spec: string-ascii', async () => {
	const encode = encodeOpenStep(new PLString('ASCII'));
	assertEquals(
		encode,
		await fixturePlist('string-ascii', 'openstep'),
	);
});

Deno.test('spec: string-chars', async () => {
	const keys = [];
	for (let i = 0; i <= 0xffff; i++) {
		keys.push(String(i));
	}
	keys.sort();
	const dict = new PLDict();
	for (const key of keys) {
		dict.set(new PLString(key), new PLString(String.fromCharCode(+key)));
	}
	{
		const encode = encodeOpenStep(dict);
		assertEquals(
			diff(encode, await fixturePlist('string-chars', 'openstep')),
			-1,
		);
	}
	{
		const encode = encodeOpenStep(dict, {
			format: FORMAT_STRINGS,
		});
		assertEquals(
			diff(encode, await fixturePlist('string-chars', 'strings')),
			-1,
		);
	}
});

Deno.test('spec: string-unicode', async () => {
	const encode = encodeOpenStep(new PLString('UTF\u20138'));
	assertEquals(
		encode,
		await fixturePlist('string-unicode', 'openstep'),
	);
});

Deno.test('spec: string-utf8-mb2-divide', async () => {
	const encode = encodeOpenStep(new PLString('\u00f7'));
	assertEquals(
		encode,
		await fixturePlist('string-utf8-mb2-divide', 'openstep'),
	);
});

Deno.test('spec: string-utf8-mb2-ohm', async () => {
	const encode = encodeOpenStep(new PLString('\u03a9'));
	assertEquals(
		encode,
		await fixturePlist('string-utf8-mb2-ohm', 'openstep'),
	);
});

Deno.test('spec: string-utf8-mb3-check', async () => {
	const encode = encodeOpenStep(new PLString('\u2705'));
	assertEquals(
		encode,
		await fixturePlist('string-utf8-mb3-check', 'openstep'),
	);
});

Deno.test('spec: string-utf8-mb3-plus', async () => {
	const encode = encodeOpenStep(new PLString('\uff0b'));
	assertEquals(
		encode,
		await fixturePlist('string-utf8-mb3-plus', 'openstep'),
	);
});

Deno.test('spec: string-utf8-mb4-robot', async () => {
	const encode = encodeOpenStep(new PLString('\ud83e\udd16'));
	assertEquals(
		encode,
		await fixturePlist('string-utf8-mb4-robot', 'openstep'),
	);
});

Deno.test('spec: openstep-edge escapes-octal', async () => {
	const encode = encodeOpenStep(
		new PLDict([
			[new PLString('null-0'), new PLString('\x000')],
			[new PLString('null-8'), new PLString('\x008')],
			[new PLString('oct16'), new PLString('\x0E')],
			[new PLString('oct16-7'), new PLString('\x0E7')],
		]),
	);
	assertEquals(
		encode,
		await fixturePlist('openstep-edge', 'escapes-octal'),
	);
});

Deno.test('spec: openstep-edge all-types', async () => {
	const data = new PLData(4);
	new Uint8Array(data.buffer).set(new Uint8Array([0x01, 0x23, 0x45, 0x67]));
	const encode = encodeOpenStep(
		new PLDict<PLType>([
			[
				new PLString('STRING'),
				new PLString('Example'),
			],
			[
				new PLString('DICT'),
				new PLDict([
					[new PLString('A'), new PLString('a')],
					[new PLString('B'), new PLString('b')],
				]),
			],
			[
				new PLString('ARRAY'),
				new PLArray([
					new PLString('1'),
					new PLString('2'),
					new PLString('3'),
				]),
			],
			[
				new PLString('DATA'),
				data,
			],
		]),
	);
	assertEquals(
		encode,
		await fixturePlist('openstep-edge', 'all-types'),
	);
});

Deno.test('spec: strings-edge all-types', async () => {
	const data = new PLData(4);
	new Uint8Array(data.buffer).set(new Uint8Array([0x01, 0x23, 0x45, 0x67]));
	const encode = encodeOpenStep(
		new PLDict<PLType>([
			[
				new PLString('STRING'),
				new PLString('Example'),
			],
			[
				new PLString('DICT'),
				new PLDict([
					[new PLString('A'), new PLString('a')],
					[new PLString('B'), new PLString('b')],
				]),
			],
			[
				new PLString('ARRAY'),
				new PLArray([
					new PLString('1'),
					new PLString('2'),
					new PLString('3'),
				]),
			],
			[
				new PLString('DATA'),
				data,
			],
		]),
		{
			format: FORMAT_STRINGS,
		},
	);
	assertEquals(
		encode,
		await fixturePlist('strings-edge', 'all-types'),
	);
});
