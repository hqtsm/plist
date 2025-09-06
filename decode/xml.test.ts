import {
	assert,
	assertEquals,
	assertInstanceOf,
	assertNotStrictEquals,
	assertThrows,
} from '@std/assert';
import { PLArray } from '../array.ts';
import { PLBoolean } from '../boolean.ts';
import { PLData } from '../data.ts';
import { PLDict } from '../dict.ts';
import { FORMAT_XML_V0_9, FORMAT_XML_V1_0 } from '../format.ts';
import { PLInteger } from '../integer.ts';
import { fixturePlist } from '../spec/fixture.ts';
import { PLString } from '../string.ts';
import type { PLType } from '../type.ts';
import { PLUID } from '../uid.ts';
import { decodeXml } from './xml.ts';

const DOCTYPE =
	'<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">';

const TE = new TextEncoder();
const TDASCII = new TextDecoder('ascii', { fatal: true });
const ascii2utf8 = (data: Uint8Array) => TE.encode(TDASCII.decode(data));
const entityHex = (code: number) => `&#x${code.toString(16)};`;
const entityDec = (code: number) => `&#${code.toString(10)};`;

Deno.test('XML encoding: default', () => {
	const options = {
		decoder(encoding: string): Uint8Array | null {
			throw new Error(`Called for: ${encoding}`);
		},
	};
	{
		const { format, plist } = decodeXml(
			TE.encode(
				[
					DOCTYPE,
					'<plist version="1.0">',
					'<true/>',
					'</plist>',
					'',
				].join('\n'),
			),
			options,
		);
		assertEquals(format, FORMAT_XML_V1_0);
		assertInstanceOf(plist, PLBoolean);
		assertEquals(plist.value, true);
	}
	{
		const { format, plist } = decodeXml(
			TE.encode(
				[
					'<?xml version="1.0"?>',
					DOCTYPE,
					'<plist version="1.0">',
					'<true/>',
					'</plist>',
					'',
				].join('\n'),
			),
			options,
		);
		assertEquals(format, FORMAT_XML_V1_0);
		assertInstanceOf(plist, PLBoolean);
		assertEquals(plist.value, true);
	}
	{
		const { format, plist } = decodeXml(
			TE.encode(
				[
					'<?xml version="1.0" encoding=BAD?>',
					DOCTYPE,
					'<plist version="1.0">',
					'<true/>',
					'</plist>',
					'',
				].join('\n'),
			),
			options,
		);
		assertEquals(format, FORMAT_XML_V1_0);
		assertInstanceOf(plist, PLBoolean);
		assertEquals(plist.value, true);
	}
});

Deno.test('XML encoding: UTF-8', () => {
	const options = {
		decoder(encoding: string): Uint8Array | null {
			throw new Error(`Called for: ${encoding}`);
		},
	};
	{
		const { format, plist } = decodeXml(
			TE.encode(
				[
					'<?xml version="1.0" encoding="UTF-8"?>',
					DOCTYPE,
					'<plist version="1.0">',
					'<true/>',
					'</plist>',
					'',
				].join('\n'),
			),
			options,
		);
		assertEquals(format, FORMAT_XML_V1_0);
		assertInstanceOf(plist, PLBoolean);
		assertEquals(plist.value, true);
	}
	{
		const { format, plist } = decodeXml(
			TE.encode(
				[
					"<?xml version='1.0' encoding='x-mac-utf-8'?>",
					DOCTYPE,
					'<plist version="1.0">',
					'<true/>',
					'</plist>',
					'',
				].join('\n'),
			),
			options,
		);
		assertEquals(format, FORMAT_XML_V1_0);
		assertInstanceOf(plist, PLBoolean);
		assertEquals(plist.value, true);
	}
});

Deno.test('XML encoding: Error EOF', () => {
	assertThrows(
		() => decodeXml(TE.encode('<?xml version="1.0"')),
		SyntaxError,
		'Invalid end on line 1',
	);
});

Deno.test('XML encoding: custom', () => {
	let count = 0;
	const options = {
		decoder(
			encoding: string,
			data: Uint8Array,
		): Uint8Array | null {
			count++;
			return encoding === 'ascii' ? ascii2utf8(data) : null;
		},
	};

	{
		const { format, plist } = decodeXml(
			TE.encode(
				[
					'<?xml version="1.0" encoding="ascii"?>',
					DOCTYPE,
					'<plist version="1.0">',
					'<true/>',
					'</plist>',
					'',
				].join('\n'),
			),
			options,
		);
		assertEquals(count, 1);
		assertEquals(format, FORMAT_XML_V1_0);
		assertInstanceOf(plist, PLBoolean);
		assertEquals(plist.value, true);
	}
	{
		assertThrows(() =>
			decodeXml(
				TE.encode(
					[
						'<?xml version="1.0" encoding="invalid"?>',
						DOCTYPE,
						'<plist version="1.0">',
						'<true/>',
						'</plist>',
						'',
					].join('\n'),
				),
				options,
			)
		);
		assertEquals(count, 2);
	}
	{
		assertThrows(() =>
			decodeXml(
				TE.encode(
					[
						'<?xml version="1.0" encoding="ascii">',
						DOCTYPE,
						'<plist version="1.0">',
						'<true/>',
						'</plist>',
						'',
					].join('\n'),
				),
				options,
			)
		);
		assertEquals(count, 3);
	}
});

Deno.test('XML doctype: Error EOF', () => {
	assertThrows(
		() =>
			decodeXml(
				TE.encode(
					[
						'<?xml version="1.0" encoding="UTF-8"?>',
						DOCTYPE.replaceAll('>', ''),
						'',
					].join('\n'),
				),
			),
		SyntaxError,
		'Invalid end on line 3',
	);
	assertThrows(
		() =>
			decodeXml(
				TE.encode(
					[
						'<?xml version="1.0" encoding="UTF-8"?>',
						'<!',
					].join('\n'),
				),
			),
		SyntaxError,
		'Invalid XML on line 2',
	);
});

Deno.test('XML header comments', () => {
	{
		const { format, plist } = decodeXml(
			TE.encode(
				[
					'<!--->-->',
					'<?xml version="1.0" encoding="UTF-8"?>',
					'<!--->-->',
					DOCTYPE,
					'<!--->-->',
					'<plist version="1.0">',
					'<true/>',
					'</plist>',
					'',
				].join('\n'),
			),
		);
		assertEquals(format, FORMAT_XML_V1_0);
		assertInstanceOf(plist, PLBoolean);
		assertEquals(plist.value, true);
	}
	assertThrows(
		() =>
			decodeXml(
				TE.encode(
					[
						'<!--',
						'<?xml version="1.0" encoding="UTF-8"?>',
						DOCTYPE,
						'<plist version="1.0">',
						'<true/>',
						'</plist>',
						'',
					].join('\n'),
				),
			),
		SyntaxError,
		'Invalid end on line 7',
	);
});

Deno.test('XML bad content: empty', () => {
	assertThrows(
		() =>
			decodeXml(
				TE.encode(
					[
						'<?xml version="1.0" encoding="UTF-8"?>',
						DOCTYPE,
						'',
					].join('\n'),
				),
			),
		SyntaxError,
		'Invalid end on line 3',
	);
});

Deno.test('XML bad content: not a tag', () => {
	assertThrows(
		() =>
			decodeXml(
				TE.encode(
					[
						'<?xml version="1.0" encoding="UTF-8"?>',
						DOCTYPE,
						'plist',
						'',
					].join('\n'),
				),
			),
		SyntaxError,
		'Invalid XML on line 3',
	);
});

Deno.test('Format version', () => {
	for (
		const tag of [
			'<plist>',
			'<plist version="1.0">',
			"<plist version='1.0'>",
			'<plist version="9.9">',
			'<plist data-version="0.9">',
			'<plist version= version="0.9">',
			`<plist data=" version='0.9' ">`,
			`<plist data=' version="0.9" '>`,
			'<plist version=0.9>',
			'<plist version="1.0" version="0.9">',
		]
	) {
		const { format, plist } = decodeXml(
			TE.encode(
				[
					'<?xml version="1.0" encoding="UTF-8"?>',
					DOCTYPE,
					tag,
					'<true/>',
					'</plist>',
					'',
				].join('\n'),
			),
		);
		assertEquals(format, FORMAT_XML_V1_0, tag);
		assertInstanceOf(plist, PLBoolean, tag);
		assertEquals(plist.value, true, tag);
	}
	for (
		const tag of [
			'<plist version="0.9">',
			"<plist version='0.9'>",
			'<plist version="0.9" version="1.0">',
			'<plist data="" version="0.9">',
		]
	) {
		const { format, plist } = decodeXml(
			TE.encode(
				[
					'<?xml version="1.0" encoding="UTF-8"?>',
					DOCTYPE,
					tag,
					'<true/>',
					'</plist>',
					'',
				].join('\n'),
			),
		);
		assertEquals(format, FORMAT_XML_V0_9, tag);
		assertInstanceOf(plist, PLBoolean, tag);
		assertEquals(plist.value, true, tag);
	}
	for (
		const tag of [
			'<plist version="0.9">',
			"<plist version='0.9'>",
		]
	) {
		const { format, plist } = decodeXml(
			TE.encode(
				[
					'<?xml version="1.0" encoding="UTF-8"?>',
					DOCTYPE,
					'<plist>',
					tag,
					'<true/>',
					'</plist>',
					'</plist>',
					'',
				].join('\n'),
			),
		);
		assertEquals(format, FORMAT_XML_V1_0, tag);
		assertInstanceOf(plist, PLBoolean, tag);
		assertEquals(plist.value, true, tag);
	}
});

Deno.test('Dict bad key', () => {
	for (
		const tag of [
			'<string></string>',
			'<plist><key></key></plist>',
			'<array></array>',
			'<dict></dict>',
		]
	) {
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<plist version="1.0">',
				'<dict>',
				tag,
				'<true/>',
				'</dict>',
				'</plist>',
				'',
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data),
			SyntaxError,
			'Invalid XML on line 5',
			tag,
		);
	}
});

Deno.test('Entities: Good', () => {
	const entities = [
		['&amp;', '&'],
		['&apos;', "'"],
		['&gt;', '>'],
		['&lt;', '<'],
		['&quot;', '"'],
		['&#x4A;', 'J'],
		['&#x6f;', 'o'],
		['&#42;', '*'],
		['&#;', '\0'],
		['&#x;', '\0'],
		['&#xffff;', String.fromCharCode(0xffff)],
		['&#xffffffffffff1234;', String.fromCharCode(0x1234)],
		['&#18446744073709490740;', String.fromCharCode(0x1234)],
		['&#x111111111111ffff;', String.fromCharCode(0xffff)],
		['&#1229782938247364607;', String.fromCharCode(0xffff)],
	];
	for (const [e, c] of entities) {
		const tag = `${e} -> ${c}`;
		const { format, plist } = decodeXml(TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<plist version="1.0">',
				`<string>${e}</string>`,
				'</plist>',
				'',
			].join('\n'),
		));
		assertEquals(format, FORMAT_XML_V1_0, tag);
		assertInstanceOf(plist, PLString, tag);
		assertEquals(plist.value, c, tag);
	}

	for (const [e1, c1] of entities) {
		for (const [e2, c2] of entities) {
			for (const s of ['', ' ', 'x', ';', '00', ';;']) {
				const e = `${s}${e1}${s}${e2}${s}`;
				const c = `${s}${c1}${s}${c2}${s}`;
				const tag = `${e} -> ${c}`;
				const { format, plist } = decodeXml(TE.encode(
					[
						'<?xml version="1.0" encoding="UTF-8"?>',
						DOCTYPE,
						'<plist version="1.0">',
						`<string>${e}</string>`,
						'</plist>',
						'',
					].join('\n'),
				));
				assertEquals(format, FORMAT_XML_V1_0, tag);
				assertInstanceOf(plist, PLString, tag);
				assertEquals(plist.value, c, tag);
			}
		}
	}

	for (const c of [0, 0xD800 - 1, 0xDFFF + 1, 0xFFFF]) {
		for (const e of [entityDec(c), entityHex(c)]) {
			const tag = `${e} -> ${c}`;
			const { format, plist } = decodeXml(TE.encode(
				[
					'<?xml version="1.0" encoding="UTF-8"?>',
					DOCTYPE,
					'<plist version="1.0">',
					`<string>${e}</string>`,
					'</plist>',
					'',
				].join('\n'),
			));
			assertEquals(format, FORMAT_XML_V1_0, tag);
			assertInstanceOf(plist, PLString, tag);
			assertEquals(plist.value, String.fromCharCode(c), tag);
		}
	}
});

Deno.test('Entities: Bad', () => {
	for (const c of [0xDC00, 0xDBFF, 0xDC00, 0xDFFF]) {
		for (const e of [entityDec(c), entityHex(c)]) {
			const data = TE.encode(
				[
					'<?xml version="1.0" encoding="UTF-8"?>',
					DOCTYPE,
					'<plist version="1.0">',
					`<string>${e}</string>`,
					'</plist>',
					'',
				].join('\n'),
			);
			assertThrows(
				() => decodeXml(data),
				SyntaxError,
				'Invalid XML on line 4',
				e,
			);
		}
	}
});

Deno.test('CDATA', () => {
	for (
		const [e, s] of [
			['<![CDATA[]]>', ''],
			['<![CDATA[ABC]]>', 'ABC'],
			['<![CDATA[]]><![CDATA[]]>', ''],
			['<![CDATA[ABC]]><![CDATA[XYZ]]>', 'ABCXYZ'],
		]
	) {
		const tag = `${e} -> ${s}`;
		const { format, plist } = decodeXml(TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<plist version="1.0">',
				`<string>${e}</string>`,
				'</plist>',
				'',
			].join('\n'),
		));
		assertEquals(format, FORMAT_XML_V1_0, tag);
		assertInstanceOf(plist, PLString, tag);
		assertEquals(plist.value, s, tag);
	}
});

Deno.test('Strings: Bad', () => {
	for (
		const s of [
			'<',
			'<_',
			'<!---->',
			'&',
			'&;',
			'& ;',
			'&# ;',
			'&#x ;',
			'&quote',
			'&quote;',
		]
	) {
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<plist version="1.0">',
				`<string>${s}</string>`,
				'</plist>',
				'',
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data),
			SyntaxError,
			'Invalid XML on line 4',
			s,
		);
	}
});

Deno.test('Strings: EOF', () => {
	for (
		const s of [
			'EOF',
			'&',
			'&#',
			'&#x',
			'&#1',
			'&#x1',
		]
	) {
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<plist version="1.0">',
				`<string>${s}`,
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data),
			SyntaxError,
			'Invalid end on line 4',
			s,
		);
	}
});

Deno.test('spec: true', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('true', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLBoolean);
	assertEquals(plist.value, true);
});

Deno.test('spec: false', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('false', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLBoolean);
	assertEquals(plist.value, false);
});

Deno.test('spec: array-0', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('array-0', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 0);
});

Deno.test('spec: array-1', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('array-1', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 1);
	const entry = plist.get(0);
	assertInstanceOf(entry, PLString);
	assertEquals(entry.value, 'A');
});

Deno.test('spec: array-4', async () => {
	// TODO
});

Deno.test('spec: array-8', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('array-8', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 8);
	for (let i = 0; i < 8; i++) {
		const entry: PLType = plist.get(i)!;
		assertInstanceOf(entry, PLString, `${i}`);
		assertEquals(entry.value, i % 2 ? 'B' : 'A', `${i}`);
	}
});

Deno.test('spec: array-14', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('array-14', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 14);
	for (let i = 0; i < 14; i++) {
		const entry: PLType = plist.get(i)!;
		assertInstanceOf(entry, PLBoolean, `${i}`);
		assertEquals(entry.value, i % 2 ? true : false, `${i}`);
	}
});

Deno.test('spec: array-15', async () => {
	// TODO
});

Deno.test('spec: array-26', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('array-26', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 26);
	for (let i = 0; i < 26; i++) {
		const entry: PLType = plist.get(i)!;
		assertInstanceOf(entry, PLString, `${i}`);
		assertEquals(entry.value, String.fromCharCode(65 + i), `${i}`);
	}
});

Deno.test('spec: array-128', async () => {
	// TODO
});

Deno.test('spec: array-255', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('array-255', 'xml'),
		{
			int64: true,
		},
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 255);
	for (let i = 0; i < 255; i++) {
		const entry: PLType = plist.get(i)!;
		assertInstanceOf(entry, PLInteger, `${i}`);
		assertEquals(entry.value, i % 2 ? 1n : 0n, `${i}`);
	}
});

Deno.test('spec: array-256', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('array-256', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 256);
	for (let i = 0; i < 256; i++) {
		const entry: PLType = plist.get(i)!;
		assertInstanceOf(entry, PLBoolean, `${i}`);
		assertEquals(entry.value, i % 2 ? true : false, `${i}`);
	}
});

Deno.test('spec: array-65534', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('array-65534', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 65534);
	for (let i = 0; i < 65534; i++) {
		const entry: PLType = plist.get(i)!;
		assertInstanceOf(entry, PLBoolean, `${i}`);
		assertEquals(entry.value, i % 2 ? true : false, `${i}`);
	}
});

Deno.test('spec: array-65535', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('array-65535', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 65535);
	for (let i = 0; i < 65535; i++) {
		const entry: PLType = plist.get(i)!;
		assertInstanceOf(entry, PLBoolean, `${i}`);
		assertEquals(entry.value, i % 2 ? true : false, `${i}`);
	}
});

Deno.test('spec: array-65536', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('array-65536', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 65536);
	for (let i = 0; i < 65536; i++) {
		const entry: PLType = plist.get(i)!;
		assertInstanceOf(entry, PLBoolean, `${i}`);
		assertEquals(entry.value, i % 2 ? true : false, `${i}`);
	}
});

Deno.test('spec: array-reuse', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('array-reuse', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 2);
	assertNotStrictEquals(plist.get(0), plist.get(1));
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

// TODO: data

// TODO: date

Deno.test('spec: dict-empties', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('dict-empties', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 2);
	const a = plist.find('array');
	assertInstanceOf(a, PLArray);
	assertEquals(a.length, 0);
	const d = plist.find('dict');
	assertInstanceOf(d, PLDict);
	assertEquals(d.size, 0);
});

Deno.test('spec: dict-26', async () => {
	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const { format, plist } = decodeXml(
		await fixturePlist('dict-26', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 26);
	for (let i = 0; i < plist.size; i++) {
		const str = plist.find(alphabet[i]);
		assertInstanceOf(str, PLString);
		assertEquals(str.value, alphabet[i].toLowerCase());
	}
});

Deno.test('spec: dict-long-key', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('dict-long-key', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 1);
	const str = plist.find(
		'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789',
	);
	assertInstanceOf(str, PLString);
	assertEquals(str.value, '64');
});

Deno.test('spec: dict-unicode-key', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('dict-unicode-key', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 1);
	const str = plist.find('UTF\u20138');
	assertInstanceOf(str, PLString);
	assertEquals(str.value, 'utf-8');
});

Deno.test('spec: dict-nesting', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('dict-nesting', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
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
	const { format, plist } = decodeXml(
		await fixturePlist('dict-order', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
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
	const { format, plist } = decodeXml(
		await fixturePlist('dict-reuse', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
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
	assertNotStrictEquals(AA, BB);
});

Deno.test('spec: dict-repeat', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('dict-repeat', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 6);
	const expected = [
		['A', '11'],
		['B', '21'],
		['B', '22'],
		['C', '32'],
		['C', '31'],
		['C', '33'],
	];
	for (const [i, [k, v]] of [...plist].entries()) {
		assertInstanceOf(v, PLString);
		assertEquals(k.value, expected[i][0]);
		assertEquals(v.value, expected[i][1]);
	}
});

Deno.test('spec: string-empty', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('string-empty', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, '');
});

Deno.test('spec: string-ascii', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('string-ascii', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, 'ASCII');
});

Deno.test('spec: string-chars', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('string-chars', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	for (let i = 0; i < plist.length;) {
		const k: PLType = plist.get(i)!;
		assertInstanceOf(k, PLString, `[${i}]`);
		const code = +k.value;
		i++;
		const v: PLType = plist.get(i)!;
		assertInstanceOf(v, PLString, k.value);
		i++;
		if (code < 0xD800 || code >= 0xE000) {
			assertEquals(v.value, String.fromCharCode(code), k.value);
		} else {
			assertEquals(v.value, '', k.value);
		}
	}
});

Deno.test('spec: string-unicode', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('string-unicode', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, 'UTF\u20138');
});

Deno.test('spec: string-long-unicode', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('string-long-unicode', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(
		plist.value,
		new Array(8).fill('UTF\u20138').join(' '),
	);
});

Deno.test('spec: string-utf8-mb2-divide', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('string-utf8-mb2-divide', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, '\u00f7');
});

Deno.test('spec: string-utf8-mb2-ohm', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('string-utf8-mb2-ohm', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, '\u03a9');
});

Deno.test('spec: string-utf8-mb3-check', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('string-utf8-mb3-check', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, '\u2705');
});

Deno.test('spec: string-utf8-mb3-plus', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('string-utf8-mb3-plus', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, '\uff0b');
});

Deno.test('spec: string-utf8-mb4-robot', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('string-utf8-mb4-robot', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, '\ud83e\udd16');
});

Deno.test('spec: integer-0', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('integer-0', 'xml'),
		{
			int64: true,
		},
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLInteger);
	assertEquals(plist.value, 0n);
	assertEquals(plist.bits, 64);
});

Deno.test('spec: integer-big', async () => {
	const MIN_128 = -0x8000000000000000_0000000000000000n;

	const data = await fixturePlist('integer-big', 'xml');

	// Not very compatible, created with a private API.
	assertThrows(
		() =>
			decodeXml(data, {
				int64: true,
			}),
		SyntaxError,
		'Invalid XML on line 6',
	);

	const { format, plist } = decodeXml(data);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 12);
	const all = new Map<string, PLInteger>();
	for (let i = 0; i < 12;) {
		const name: PLType = plist.get(i)!;
		assertInstanceOf(name, PLString, `${i}`);
		i++;
		const value: PLType = plist.get(i)!;
		assertInstanceOf(value, PLInteger, `${i}`);
		i++;
		all.set(name.value, value);
	}

	const BIG = all.get('BIG')!;
	assertEquals(BIG.value, 0x1112131415161718_0102030405060708n);
	assertEquals(BIG.bits, 128);

	const SMALL = all.get('SMALL')!;
	assertEquals(SMALL.value, 42n);
	assertEquals(SMALL.bits, 64);

	const MAX = all.get('MAX')!;
	assertEquals(MAX.value, 0x7FFFFFFFFFFFFFFF_FFFFFFFFFFFFFFFFn);
	assertEquals(MAX.bits, 128);

	// Weird bug encodes -0, not MIN128?
	const MIN = all.get('MIN')!;
	assertEquals(MIN.value, 0n);
	assertEquals(MIN.bits, 64);

	const MIN_PLUS_1 = all.get('MIN+1')!;
	assertEquals(MIN_PLUS_1.value, MIN_128 + 1n);
	assertEquals(MIN_PLUS_1.bits, 128);

	const MIN_PLUS_2 = all.get('MIN+2')!;
	assertEquals(MIN_PLUS_2.value, MIN_128 + 2n);
	assertEquals(MIN_PLUS_2.bits, 128);
});

Deno.test('spec: integer-min', async () => {
	const MIN64 = -0x8000000000000000n;

	const { format, plist } = decodeXml(
		await fixturePlist('integer-min', 'xml'),
		{
			int64: true,
		},
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLInteger);
	assertEquals(plist.value, MIN64);
	assertEquals(plist.bits, 64);
});

Deno.test('spec: integer-negative', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('integer-negative', 'xml'),
		{
			int64: true,
		},
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLInteger);
	assertEquals(plist.value, -42n);
	assertEquals(plist.bits, 64);
});

Deno.test('spec: integer-reuse', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('integer-reuse', 'xml'),
		{
			int64: true,
		},
	);
	assertEquals(format, FORMAT_XML_V1_0);
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

	assertNotStrictEquals(a, b);
});

Deno.test('spec: integer-sizes', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('integer-sizes', 'xml'),
		{
			int64: true,
		},
	);
	assertEquals(format, FORMAT_XML_V1_0);
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

Deno.test('spec: uid-42', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('uid-42', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLUID);
	assertEquals(plist.value, 42n);
});

Deno.test('spec: uid-reuse', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('uid-reuse', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);

	const a = plist.get(0)!;
	assertInstanceOf(a, PLUID);
	assertEquals(a.value, 42n);

	const b = plist.get(1)!;
	assertInstanceOf(b, PLUID);
	assertEquals(b.value, 42n);

	assertNotStrictEquals(a, b);
});

Deno.test('spec: uid-sizes', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('uid-sizes', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
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

// TODO: real

// TODO: uid

Deno.test('spec: xml-edge array-attrs-close', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'array-attrs-close'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 0);
});

Deno.test('spec: xml-edge bad-attr', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'bad-attr'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLBoolean);
	assertEquals(plist.value, true);
});

Deno.test('spec: xml-edge cdata', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'cdata'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 1);
	for (const [k, v] of plist) {
		assertEquals(k.value, `For "<keys>" & '<strings>' only!`);
		assertInstanceOf(v, PLString);
		assertEquals(v.value, `_<!--[[]]-->_`);
	}
});

Deno.test('spec: xml-edge comments', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'comments'),
		{
			int64: true,
		},
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 2);

	const dict = plist.find('dict')!;
	assertInstanceOf(dict, PLDict);
	assertEquals(dict.size, 0);

	const array = plist.find('array')!;
	assertInstanceOf(array, PLArray);
	assertEquals(array.length, 2);

	const a = array.get(0)!;
	assertInstanceOf(a, PLInteger);
	assertEquals(a.value, 1n);

	const b = array.get(1)!;
	assertInstanceOf(b, PLInteger);
	assertEquals(b.value, 2n);
});

Deno.test('spec: xml-edge data-attrs', async () => {
	// TODO
});

Deno.test('spec: xml-edge data-chunks', async () => {
	// TODO
});

Deno.test('spec: xml-edge data-close', async () => {
	const data = await fixturePlist('xml-edge', 'data-close');
	assertThrows(
		() => decodeXml(data),
		SyntaxError,
		'Invalid XML on line 4',
	);
});

Deno.test('spec: xml-edge data-edge', async () => {
	// TODO
});

Deno.test('spec: xml-edge data-junk', async () => {
	// TODO
});

Deno.test('spec: xml-edge data-long', async () => {
	// TODO
});

Deno.test('spec: xml-edge data-padding', async () => {
	// TODO
});

Deno.test('spec: xml-edge data-whitespace', async () => {
	// TODO
});

Deno.test('spec: xml-edge date-attrs', async () => {
	// TODO
});

Deno.test('spec: xml-edge date-edge', async () => {
	// TODO
});

Deno.test('spec: xml-edge date-over-under', async () => {
	// TODO
});

Deno.test('spec: xml-edge dict-attrs-close', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'dict-attrs-close'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 0);
});

Deno.test('spec: xml-edge doctype-internal-subset', async () => {
	const data = await fixturePlist('xml-edge', 'doctype-internal-subset');
	assertThrows(
		() => decodeXml(data),
		SyntaxError,
		'Invalid XML on line 2',
	);
});

Deno.test('spec: xml-edge doctype-lowercase', async () => {
	const data = await fixturePlist('xml-edge', 'doctype-lowercase');
	assertThrows(
		() => decodeXml(data),
		SyntaxError,
		'Invalid XML on line 2',
	);
});

Deno.test('spec: xml-edge empty', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'empty'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 7);

	const t = plist.get(0);
	assertInstanceOf(t, PLBoolean);
	assertEquals(t.value, true);

	const f = plist.get(1);
	assertInstanceOf(f, PLBoolean);
	assertEquals(f.value, false);

	const dict = plist.get(2);
	assertInstanceOf(dict, PLDict);
	assertEquals(dict.size, 0);

	const arr = plist.get(3);
	assertInstanceOf(arr, PLArray);
	assertEquals(arr.length, 0);

	const str = plist.get(4);
	assertInstanceOf(str, PLString);
	assertEquals(str.value, '');

	const key = plist.get(5);
	assertInstanceOf(key, PLString);
	assertEquals(key.value, '');

	const data = plist.get(6);
	assertInstanceOf(data, PLData);
	assertEquals(data.byteLength, 0);
});

Deno.test('spec: xml-edge false-attrs-close', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'false-attrs-close'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLBoolean);
	assertEquals(plist.value, false);
});

Deno.test('spec: xml-edge integer-attrs', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'integer-attrs'),
		{
			int64: true,
		},
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLInteger);
	assertEquals(plist.value, 0n);
	assertEquals(plist.bits, 64);
});

Deno.test('spec: xml-edge integer-edge', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'integer-edge'),
		{
			int64: true,
		},
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLDict);
	for (const [k, v] of plist) {
		const key = k.value;
		assertInstanceOf(v, PLInteger, key);
		const expected = BigInt(key.split('|')[1]);
		assertEquals(v.value, expected, key);
		assertEquals(v.bits, expected > 0x7fffffffffffffffn ? 128 : 64, key);
	}
});

Deno.test('spec: xml-edge key-array', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'key-array'),
		{
			int64: true,
		},
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 3);

	const A = plist.get(0);
	assertInstanceOf(A, PLString);
	assertEquals(A.value, 'A');

	const B = plist.get(1);
	assertInstanceOf(B, PLString);
	assertEquals(B.value, 'B');

	const C = plist.get(2);
	assertInstanceOf(C, PLInteger);
	assertEquals(C.value, 1n);
});

Deno.test('spec: xml-edge key-dict', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'key-dict'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 2);

	const A = plist.find('A');
	assertInstanceOf(A, PLString);
	assertEquals(A.value, 'Apple');

	const B = plist.find('B');
	assertInstanceOf(B, PLString);
	assertEquals(B.value, 'Banana');
});

Deno.test('spec: xml-edge key-root', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'key-root'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, 'string-like');
});

Deno.test('spec: xml-edge legacy-10.0-0.9-1-null', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'legacy-10.0-0.9-1-null'),
	);
	assertEquals(format, FORMAT_XML_V0_9);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 1);

	const name = plist.find('Name');
	assertInstanceOf(name, PLString);
	assertEquals(name.value, 'John Smith');
});

Deno.test('spec: xml-edge legacy-10.0-0.9-2', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'legacy-10.0-0.9-2'),
	);
	assertEquals(format, FORMAT_XML_V0_9);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 2);

	assertEquals([...plist.keys()].map((k) => k.value), ['Age', 'Name']);

	const age = plist.find('Age');
	assertInstanceOf(age, PLInteger);
	assertEquals(age.value, 42n);

	const name = plist.find('Name');
	assertInstanceOf(name, PLString);
	assertEquals(name.value, 'John Smith');
});

Deno.test('spec: xml-edge nothing', async () => {
	const data = await fixturePlist('xml-edge', 'nothing');
	assertThrows(
		() => decodeXml(data),
		SyntaxError,
		'Invalid XML on line 4',
	);
});

Deno.test('spec: xml-edge plist-none-array', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'plist-none-array'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 1);
	const a = plist.get(0);
	assertInstanceOf(a, PLBoolean);
	assertEquals(a.value, true);
});

Deno.test('spec: xml-edge plist-none-true', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'plist-none-true'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLBoolean);
	assertEquals(plist.value, true);
});

Deno.test('spec: xml-edge plist-tags-array', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'plist-tags-array'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 2);

	const a = plist.get(0);
	assertInstanceOf(a, PLBoolean);
	assertEquals(a.value, true);

	const b = plist.get(1);
	assertInstanceOf(b, PLBoolean);
	assertEquals(b.value, false);
});

Deno.test('spec: xml-edge plist-tags-dict', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'plist-tags-dict'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 2);

	const t = plist.find('true');
	assertInstanceOf(t, PLBoolean);
	assertEquals(t.value, true);

	const f = plist.find('false');
	assertInstanceOf(f, PLBoolean);
	assertEquals(f.value, false);
});

Deno.test('spec: xml-edge processing-instructions', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'processing-instructions'),
		{
			int64: true,
		},
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 2);

	const dict = plist.find('dict')!;
	assertInstanceOf(dict, PLDict);
	assertEquals(dict.size, 0);

	const array = plist.find('array')!;
	assertInstanceOf(array, PLArray);
	assertEquals(array.length, 2);

	const a = array.get(0)!;
	assertInstanceOf(a, PLInteger);
	assertEquals(a.value, 1n);

	const b = array.get(1)!;
	assertInstanceOf(b, PLInteger);
	assertEquals(b.value, 2n);
});

Deno.test('spec: xml-edge real-attrs', async () => {
	// TODO
});

Deno.test('spec: xml-edge real-edge', async () => {
	// TODO
});

Deno.test('spec: xml-edge self-closed', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'self-closed'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 6);

	const t = plist.get(0);
	assertInstanceOf(t, PLBoolean);
	assertEquals(t.value, true);

	const f = plist.get(1);
	assertInstanceOf(f, PLBoolean);
	assertEquals(f.value, false);

	const dict = plist.get(2);
	assertInstanceOf(dict, PLDict);
	assertEquals(dict.size, 0);

	const arr = plist.get(3);
	assertInstanceOf(arr, PLArray);
	assertEquals(arr.length, 0);

	const str = plist.get(4);
	assertInstanceOf(str, PLString);
	assertEquals(str.value, '');

	const key = plist.get(5);
	assertInstanceOf(key, PLString);
	assertEquals(key.value, '');
});

Deno.test('spec: string-attrs-close', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'string-attrs-close'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, '');
});

Deno.test('spec: string-entity-dec', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'string-entity-dec'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	for (let i = 0; i < plist.length; i++) {
		const str = plist.get(i);
		assertInstanceOf(str, PLString, `${i}`);
		const tag = JSON.stringify(str.value);
		assertEquals(str.length, 1, tag);
		const c = str.value.charCodeAt(0);
		assert((c >= 0 && c < 0xD800) || (c > 0xDFFF && c <= 0xFFFF), tag);
	}
});

Deno.test('spec: string-entity-hex', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'string-entity-hex'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	for (let i = 0; i < plist.length; i++) {
		const str = plist.get(i);
		assertInstanceOf(str, PLString, `${i}`);
		const tag = JSON.stringify(str.value);
		assertEquals(str.length, 1, tag);
		const c = str.value.charCodeAt(0);
		assert((c >= 0 && c < 0xD800) || (c > 0xDFFF && c <= 0xFFFF), tag);
	}
});

Deno.test('spec: xml-edge string-raw-gt', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'string-raw-gt'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, '>');
});

Deno.test('spec: xml-edge trailer-close', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'trailer-close'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLBoolean);
	assertEquals(plist.value, true);
});

Deno.test('spec: xml-edge trailer-plist', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'trailer-plist'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLBoolean);
	assertEquals(plist.value, true);
});

Deno.test('spec: xml-edge true-attrs-close', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'true-attrs-close'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLBoolean);
	assertEquals(plist.value, true);
});

Deno.test('spec: xml-edge uid-attrs', async () => {
	// TODO
});

Deno.test('spec: xml-edge uid-negative', async () => {
	// TODO
});

Deno.test('spec: xml-edge uid-not', async () => {
	// TODO
});

Deno.test('spec: xml-edge uid-over', async () => {
	// TODO
});

Deno.test('spec: xml-edge uid-real', async () => {
	// TODO
});

Deno.test('spec: xml-edge uid-string', async () => {
	// TODO
});

Deno.test('spec: xml-edge version-0.0', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'version-0.0'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, 'Version 0.0');
});

Deno.test('spec: xml-edge version-1.9', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'version-1.9'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, 'Version 1.9');
});

Deno.test('spec: xml-edge version-9', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'version-9'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, 'Version 9');
});

Deno.test('spec: xml-edge version-empty', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'version-empty'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, 'Version empty');
});

Deno.test('spec: xml-edge version-none', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'version-none'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, 'Version none');
});
