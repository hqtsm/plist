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
import { PLDate } from '../date.ts';
import { PLDict } from '../dict.ts';
import { FORMAT_XML_V0_9, FORMAT_XML_V1_0 } from '../format.ts';
import { PLInteger } from '../integer.ts';
import { PLReal } from '../real.ts';
import { fixturePlist } from '../spec/fixture.ts';
import { PLString } from '../string.ts';
import type { PLType } from '../type.ts';
import { PLUID } from '../uid.ts';
import { decodeXml, type DecodeXmlOptions } from './xml.ts';

const CF_STYLE = {
	// Integers are limited to 64-bit signed or unsigned values range.
	int64: true,
} as const satisfies DecodeXmlOptions;

const DOCTYPE =
	'<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">';

const TE = new TextEncoder();
const TDASCII = new TextDecoder('ascii', { fatal: true });
const ascii2utf8 = (data: Uint8Array) => TE.encode(TDASCII.decode(data));
const entityHex = (code: number) => `&#x${code.toString(16)};`;
const entityDec = (code: number) => `&#${code.toString(10)};`;

function realWS(): string[] {
	const ws: string[] = [];
	for (let i = 0; i <= 0x20; i++) {
		ws.push(String.fromCharCode(i));
	}
	for (let i = 0x7F; i <= 0xA0; i++) {
		ws.push(String.fromCharCode(i));
	}
	for (let i = 0x2000; i <= 0x200B; i++) {
		ws.push(String.fromCharCode(i));
	}
	ws.push(String.fromCharCode(0x3000));
	return ws;
}

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

Deno.test('Multiple values', () => {
	{
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<plist version="1.0">',
				'<true/>',
				'<false/>',
				'</plist>',
				'',
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data),
			SyntaxError,
			'Invalid XML on line 5',
		);
	}
	{
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<plist version="1.0">',
				'<plist>',
				'<true/>',
				'<false/>',
				'</plist>',
				'</plist>',
				'',
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data),
			SyntaxError,
			'Invalid XML on line 6',
		);
	}
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

Deno.test('XML: Bad Open', () => {
	{
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<>',
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data),
			SyntaxError,
			'Invalid XML on line 3',
		);
	}
	{
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'< >',
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data),
			SyntaxError,
			'Invalid XML on line 3',
		);
	}
	{
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'</>',
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data),
			SyntaxError,
			'Invalid XML on line 3',
		);
	}
	{
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'< />',
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data),
			SyntaxError,
			'Invalid XML on line 3',
		);
	}
});

Deno.test('XML: Bad Close', () => {
	{
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'</plist>',
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data),
			SyntaxError,
			'Invalid XML on line 3',
		);
	}
	{
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<plist version="1.0">',
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data),
			SyntaxError,
			'Invalid end on line 3',
		);
	}
	{
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<plist version="1.0">',
				'<true/>',
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data),
			SyntaxError,
			'Invalid end on line 4',
		);
	}
	{
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<plist version="1.0">',
				'<true/>X',
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data),
			SyntaxError,
			'Invalid XML on line 4',
		);
	}
	{
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<plist version="1.0">',
				'<true/>',
				'<',
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data),
			SyntaxError,
			'Invalid end on line 5',
		);
	}
	{
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<plist version="1.0">',
				'<true/>',
				'</',
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data),
			SyntaxError,
			'Invalid end on line 5',
		);
	}
	{
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<plist version="1.0">',
				'<string><',
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data),
			SyntaxError,
			'Invalid end on line 4',
		);
	}
	{
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<plist version="1.0">',
				'<string></',
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data),
			SyntaxError,
			'Invalid end on line 4',
		);
	}
	{
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<plist version="1.0">',
				'<string></x',
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data),
			SyntaxError,
			'Invalid XML on line 4',
		);
	}
	{
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<plist version="1.0">',
				'<string></string',
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data),
			SyntaxError,
			'Invalid end on line 4',
		);
	}
	{
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<plist version="1.0">',
				'<string></string ',
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data),
			SyntaxError,
			'Invalid end on line 4',
		);
	}
	{
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<plist version="1.0">',
				'<array></array _',
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data),
			SyntaxError,
			'Invalid XML on line 4',
		);
	}
	{
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<plist version="1.0">',
				'<array></array _',
				'</plist>',
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data),
			SyntaxError,
			'Invalid XML on line 4',
		);
	}
	{
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<plist version="1.0">',
				'<string></string _',
				'</plist>',
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data),
			SyntaxError,
			'Invalid XML on line 4',
		);
	}
	{
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<plist version="1.0">',
				'<string></string _',
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data),
			SyntaxError,
			'Invalid XML on line 4',
		);
	}
	{
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<plist version="1.0">',
				'<dict>',
				'<key>extra</key>',
				'</dict>',
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data),
			SyntaxError,
			'Invalid XML on line 6',
		);
	}
	{
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<plist version="1.0">',
				'<dict>',
				'<key>A</key>',
				'<string>Apple</string>',
				'<key>extra</key>',
				'</dict>',
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data),
			SyntaxError,
			'Invalid XML on line 8',
		);
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

Deno.test('Integers: Good', () => {
	for (
		const [s, int64] of [
			['0', true],
			['00', true],
			['1', true],
			['01', true],
			['0x0', true],
			['0X00', true],
			['0x0', true],
			['0X00', true],
			['0x1', true],
			['0X01', true],
			['0xffffffffffffffff', true],
			['-0x8000000000000000', true],
			['0x10000000000000000', false],
			['-0x8000000000000001', false],
			[
				'0x7fffffffffffffffffffffffffffffff',
				false,
			],
			[
				'-0x80000000000000000000000000000000',
				false,
			],
		] as const
	) {
		const tag = `${s} (int64:${int64})`;
		const e = s.startsWith('-')
			? -BigInt(s.slice(1))
			: BigInt(s.startsWith('+') ? s.slice(1) : s);
		const { format, plist } = decodeXml(
			TE.encode(
				[
					'<?xml version="1.0" encoding="UTF-8"?>',
					DOCTYPE,
					'<plist version="1.0">',
					`<integer>${s}</integer>`,
					'</plist>',
					'',
				].join('\n'),
			),
			{
				int64,
			},
		);
		assertEquals(format, FORMAT_XML_V1_0, tag);
		assertInstanceOf(plist, PLInteger, tag);
		assertEquals(plist.value, e, tag);
	}
	const spaces = ['', ' ', '\r', '\n', '\r\n', '\t'];
	for (const s1 of spaces) {
		for (const s2 of spaces) {
			const sp = `${s1}${s2}`;
			for (const si of ['', '-', '+']) {
				for (const n of ['12', '0x12', '0X12']) {
					const s = `${sp}${si}${sp}${n}`;
					const e = si === '-' ? -BigInt(+n) : BigInt(+n);
					const tag = JSON.stringify(s);
					const { format, plist } = decodeXml(
						TE.encode(
							[
								'<?xml version="1.0" encoding="UTF-8"?>',
								DOCTYPE,
								'<plist version="1.0">',
								`<integer>${s}</integer>`,
								'</plist>',
								'',
							].join('\n'),
						),
						{
							int64: true,
						},
					);
					assertEquals(format, FORMAT_XML_V1_0, tag);
					assertInstanceOf(plist, PLInteger, tag);
					assertEquals(plist.value, e, tag);
				}
			}
		}
	}
});

Deno.test('Integers: Bad', () => {
	for (
		const [s, int64] of [
			['42 ', true],
			['0x42 ', true],
			['', true],
			['A', true],
			['0x', true],
			['0xG', true],
			['0X', true],
			['0Xg', true],
			['0x10000000000000000', true],
			['-0x8000000000000001', true],
			['0x80000000000000000000000000000000', false],
			['-0x80000000000000000000000000000001', false],
		] as const
	) {
		const tag = `${s} (int64:${int64})`;
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<plist version="1.0">',
				`<integer>${s}</integer>`,
				'</plist>',
				'',
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data, { int64 }),
			SyntaxError,
			'Invalid XML on line 4',
			tag,
		);
	}
});

Deno.test('Integers: EOF', () => {
	for (
		const s of [
			'',
			'0x',
			'0X',
			'-',
			'+',
		] as const
	) {
		const tag = JSON.stringify(s);
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<plist version="1.0">',
				`<integer>${s}`,
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data, { int64: true }),
			SyntaxError,
			'Invalid end on line 4',
			tag,
		);
	}
});

Deno.test('Real: Good', () => {
	const ws = realWS();
	for (const c1 of ws) {
		for (const c2 of ws) {
			const s = `${c1}${c2}3.14`;
			const tag = JSON.stringify(s);
			const { format, plist } = decodeXml(
				TE.encode(
					[
						'<?xml version="1.0" encoding="UTF-8"?>',
						DOCTYPE,
						'<plist version="1.0">',
						`<real>${s}</real>`,
						'</plist>',
						'',
					].join('\n'),
				),
			);
			assertEquals(format, FORMAT_XML_V1_0, tag);
			assertInstanceOf(plist, PLReal, tag);
			assertEquals(plist.value, 3.14, tag);
			assertEquals(plist.bits, 64, tag);
		}
	}
});

Deno.test('Real: Bad', () => {
	const ws = realWS();
	for (const c of ws) {
		const s = `3.14${c}`;
		// Line number is the closing tag in the official parser.
		const line = /[\r\n]/.test(s) ? 5 : 4;
		const tag = JSON.stringify(s);
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<plist version="1.0">',
				`<real>${s}</real>`,
				'</plist>',
				'',
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data),
			SyntaxError,
			`Invalid XML on line ${line}`,
			tag,
		);
	}
	for (
		const s of [
			'',
			'e',
			'E',
			'.',
			'-',
			'+',
			'a',
			'A',
			'0x0',
			',',
			' nan',
			' inf',
			' +inf',
			' -inf',
			' infinity',
			' +infinity',
			' -infinity',
		]
	) {
		const tag = JSON.stringify(s);
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<plist version="1.0">',
				`<real>${s}</real>`,
				'</plist>',
				'',
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data),
			SyntaxError,
			'Invalid XML on line 4',
			tag,
		);
	}
});

Deno.test('Data: EOF', () => {
	for (
		const s of [
			'',
			'A',
			'AB',
			'ABC',
			'ABCD',
			'====',
			'A===',
			'AB==',
			'ABC=',
			'ABCD',
		] as const
	) {
		const tag = JSON.stringify(s);
		const data = TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				DOCTYPE,
				'<plist version="1.0">',
				`<data>${s}`,
			].join('\n'),
		);
		assertThrows(
			() => decodeXml(data, { int64: true }),
			SyntaxError,
			'Invalid end on line 4',
			tag,
		);
	}
});

Deno.test('spec: true', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('true', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLBoolean);
	assertEquals(plist.value, true);
});

Deno.test('spec: false', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('false', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLBoolean);
	assertEquals(plist.value, false);
});

Deno.test('spec: array-0', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('array-0', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 0);
});

Deno.test('spec: array-1', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('array-1', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 1);

	const entry = plist.get(0);
	assertInstanceOf(entry, PLString);
	assertEquals(entry.value, 'A');
});

Deno.test('spec: array-4', async () => {
	const aa = new Uint8Array([0x61, 0x61]);
	const bb = new Uint8Array([0x62, 0x62]);
	const { format, plist } = decodeXml(
		await fixturePlist('array-4', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 4);

	for (let i = 0; i < plist.length; i++) {
		const str = plist.get(i);
		assertInstanceOf(str, PLData);
		assertEquals(new Uint8Array(str.buffer), i % 2 ? bb : aa);
	}
});

Deno.test('spec: array-8', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('array-8', 'xml'),
		CF_STYLE,
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
		CF_STYLE,
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
		CF_STYLE,
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
	const { format, plist } = decodeXml(
		await fixturePlist('array-128', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 128);

	for (let i = 0; i < 128; i++) {
		const entry: PLType = plist.get(i)!;
		assertInstanceOf(entry, PLReal, `${i}`);
		assertEquals(entry.value, i % 2 ? 1 : 0, `${i}`);
	}
});

Deno.test('spec: array-255', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('array-255', 'xml'),
		CF_STYLE,
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
		CF_STYLE,
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
		CF_STYLE,
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
		CF_STYLE,
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
		CF_STYLE,
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
		CF_STYLE,
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

Deno.test('spec: data-0', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('data-0', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLData);
	assertEquals(plist.byteLength, 0);
});

Deno.test('spec: data-1', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('data-1', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLData);
	assertEquals(plist.byteLength, 1);
	assertEquals(
		new Uint8Array(plist.buffer),
		new Uint8Array([0x61]),
	);
});

Deno.test('spec: data-2', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('data-2', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLData);
	assertEquals(plist.byteLength, 2);
	assertEquals(
		new Uint8Array(plist.buffer),
		new Uint8Array([0x61, 0x62]),
	);
});

Deno.test('spec: data-3', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('data-3', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLData);
	assertEquals(plist.byteLength, 3);
	assertEquals(
		new Uint8Array(plist.buffer),
		new Uint8Array([0x61, 0x62, 0x63]),
	);
});

Deno.test('spec: data-4', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('data-4', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLData);
	assertEquals(plist.byteLength, 4);
	assertEquals(
		new Uint8Array(plist.buffer),
		new Uint8Array([0x61, 0x62, 0x63, 0x64]),
	);
});

Deno.test('spec: data-14', async () => {
	const chars = [...'abcdefghijklmn'].map((c) => c.charCodeAt(0));
	const { format, plist } = decodeXml(
		await fixturePlist('data-14', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLData);
	assertEquals(plist.byteLength, 14);
	assertEquals(
		new Uint8Array(plist.buffer),
		new Uint8Array(chars),
	);
});

Deno.test('spec: data-15', async () => {
	const chars = [...'abcdefghijklmno'].map((c) => c.charCodeAt(0));
	const { format, plist } = decodeXml(
		await fixturePlist('data-15', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
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
	const { format, plist } = decodeXml(
		await fixturePlist('data-255', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
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
	const { format, plist } = decodeXml(
		await fixturePlist('data-256', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLData);
	assertEquals(plist.byteLength, 256);
	assertEquals(
		new Uint8Array(plist.buffer),
		bytes,
	);
});

Deno.test('spec: date-0.0', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('date-0.0', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLDate);
	assertEquals(plist.time, 0);
});

Deno.test('spec: date-edge', async () => {
	const d = new Uint8Array(8);
	const dv = new DataView(d.buffer);

	const { format, plist } = decodeXml(
		await fixturePlist('date-edge', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
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
		let expected = dv.getFloat64(0);
		switch (expected) {
			case Infinity: {
				expected = +'67767975241660800';
				break;
			}
			case -Infinity: {
				expected = +'64074349346284800';
				break;
			}
			default: {
				expected = Math.floor(expected || 0);
			}
		}
		assertEquals(date.time, expected, tag);
		i++;
	}
});

Deno.test('spec: date-every-day-2001', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('date-every-day-2001', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
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
	const { format, plist } = decodeXml(
		await fixturePlist('date-every-day-2004', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
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
	const { format, plist } = decodeXml(
		await fixturePlist('date-reuse', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 2);

	const a = plist.get(0);
	assertInstanceOf(a, PLDate);

	const b = plist.get(1);
	assertInstanceOf(b, PLDate);

	assertEquals(a.time, b.time);
	assertNotStrictEquals(a, b);
});

Deno.test('spec: dict-empties', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('dict-empties', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
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
	const { format, plist } = decodeXml(
		await fixturePlist('dict-26', 'xml'),
		CF_STYLE,
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
		CF_STYLE,
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
		CF_STYLE,
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
		CF_STYLE,
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
		CF_STYLE,
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
		CF_STYLE,
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
	const expected = [
		['A', '11'],
		['B', '21'],
		['B', '22'],
		['C', '32'],
		['C', '31'],
		['C', '33'],
	];
	const { format, plist } = decodeXml(
		await fixturePlist('dict-repeat', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 6);

	for (const [i, [k, v]] of [...plist].entries()) {
		assertInstanceOf(v, PLString);
		assertEquals(k.value, expected[i][0]);
		assertEquals(v.value, expected[i][1]);
	}
});

Deno.test('spec: string-empty', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('string-empty', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, '');
});

Deno.test('spec: string-ascii', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('string-ascii', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, 'ASCII');
});

Deno.test('spec: string-chars', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('string-chars', 'xml'),
		CF_STYLE,
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
		if (code < 0xD800 || code >= 0xE000) {
			assertEquals(v.value, String.fromCharCode(code), k.value);
		} else {
			assertEquals(v.value, '', k.value);
		}
		i++;
	}
});

Deno.test('spec: string-unicode', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('string-unicode', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, 'UTF\u20138');
});

Deno.test('spec: string-long-unicode', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('string-long-unicode', 'xml'),
		CF_STYLE,
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
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, '\u00f7');
});

Deno.test('spec: string-utf8-mb2-ohm', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('string-utf8-mb2-ohm', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, '\u03a9');
});

Deno.test('spec: string-utf8-mb3-check', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('string-utf8-mb3-check', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, '\u2705');
});

Deno.test('spec: string-utf8-mb3-plus', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('string-utf8-mb3-plus', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, '\uff0b');
});

Deno.test('spec: string-utf8-mb4-robot', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('string-utf8-mb4-robot', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, '\ud83e\udd16');
});

Deno.test('spec: integer-0', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('integer-0', 'xml'),
		CF_STYLE,
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
		() => decodeXml(data, CF_STYLE),
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
		all.set(name.value, value);
		i++;
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
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLInteger);
	assertEquals(plist.value, MIN64);
	assertEquals(plist.bits, 64);
});

Deno.test('spec: integer-negative', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('integer-negative', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLInteger);
	assertEquals(plist.value, -42n);
	assertEquals(plist.bits, 64);
});

Deno.test('spec: integer-reuse', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('integer-reuse', 'xml'),
		CF_STYLE,
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
		CF_STYLE,
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

Deno.test('spec: real-double-p0.0', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('real-double-p0.0', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLReal);
	assertEquals(plist.value, 0);
	assertEquals(plist.bits, 64);
});

Deno.test('spec: real-float-p0.0', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('real-float-p0.0', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLReal);
	assertEquals(plist.value, 0);
	assertEquals(plist.bits, 64);
});

Deno.test('spec: real-reuse', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('real-reuse', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);

	const a = plist.get(0)!;
	assertInstanceOf(a, PLReal);
	assertEquals(a.value, 3.14);
	assertEquals(a.bits, 64);

	const b = plist.get(1)!;
	assertInstanceOf(b, PLReal);
	assertEquals(b.value, 3.14);
	assertEquals(b.bits, 64);

	assertNotStrictEquals(a, b);
});

Deno.test('spec: real-sizes', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('real-sizes', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
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

		const v: PLType = plist.get(i)!;
		assertInstanceOf(v, PLReal, tag);
		assertEquals(v.bits, 64);
		let [type, hex] = k.value.split(' ');

		// Official encoder encodes -0.0 as 0.0.
		switch (hex) {
			case '80000000': {
				hex = '00000000';
				break;
			}
			case '8000000000000000': {
				hex = '0000000000000000';
				break;
			}
		}

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
	const { format, plist } = decodeXml(
		await fixturePlist('uid-42', 'xml'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLUID);
	assertEquals(plist.value, 42n);
});

Deno.test('spec: uid-reuse', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('uid-reuse', 'xml'),
		CF_STYLE,
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
		CF_STYLE,
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

Deno.test('spec: xml-edge array-attrs-close', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'array-attrs-close'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 0);
});

Deno.test('spec: xml-edge bad-attr', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'bad-attr'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLBoolean);
	assertEquals(plist.value, true);
});

Deno.test('spec: xml-edge cdata', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'cdata'),
		CF_STYLE,
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
		CF_STYLE,
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
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'data-attrs'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLData);
	assertEquals(plist.byteLength, 0);
});

Deno.test('spec: xml-edge data-chunks', async () => {
	const expected = new Uint8Array(21).fill(0x41);
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'data-chunks'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLData);
	assertEquals(plist.byteLength, expected.length);
	assertEquals(new Uint8Array(plist.buffer), expected);
});

Deno.test('spec: xml-edge data-close', async () => {
	const data = await fixturePlist('xml-edge', 'data-close');
	assertThrows(
		() => decodeXml(data, CF_STYLE),
		SyntaxError,
		'Invalid XML on line 4',
	);
});

Deno.test('spec: xml-edge data-edge', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'data-edge'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 32);

	for (let i = 0; i < plist.length;) {
		const k: PLType = plist.get(i)!;
		assertInstanceOf(k, PLString, `${i}`);
		const tag = k.value;
		i++;

		const v: PLType = plist.get(i)!;
		assertInstanceOf(v, PLData, `${i}`);
		const hex = k.value.split('|')[1];
		const expected = new Uint8Array(hex.length / 2);
		for (let j = 0; j < hex.length / 2; j++) {
			expected[j] = parseInt(hex.slice(j * 2, j * 2 + 2), 16);
		}
		assertEquals(new Uint8Array(v.buffer), expected, tag);
		i++;
	}
});

Deno.test('spec: xml-edge data-junk', async () => {
	const expected = new Uint8Array(3).fill(0x41);
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'data-junk'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 32);

	for (let i = 0; i < plist.length; i++) {
		const k: PLType = plist.get(i)!;
		assertInstanceOf(k, PLData, `${i}`);
		assertEquals(new Uint8Array(k.buffer), expected, `${i}`);
	}
});

Deno.test('spec: xml-edge data-long', async () => {
	const expected = new Uint8Array(100).fill(0x41);
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'data-long'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLData);
	assertEquals(plist.byteLength, expected.length);
	assertEquals(new Uint8Array(plist.buffer), expected);
});

Deno.test('spec: xml-edge data-padding', async () => {
	const e0 = new Uint8Array(0);
	const e3 = new Uint8Array(3).fill(0x41);
	const e6 = new Uint8Array(6).fill(0x41);
	const expected = [e0, e0, e3, e3, e3, e6];
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'data-padding'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, expected.length);

	for (let i = 0; i < plist.length; i++) {
		const k: PLType = plist.get(i)!;
		assertInstanceOf(k, PLData, `${i}`);
		assertEquals(new Uint8Array(k.buffer), expected[i], `${i}`);
	}
});

Deno.test('spec: xml-edge data-whitespace', async () => {
	const expected = new Uint8Array(100).fill(0x41);
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'data-whitespace'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLData);
	assertEquals(plist.byteLength, expected.length);
	assertEquals(new Uint8Array(plist.buffer), expected);
});

Deno.test('spec: xml-edge date-attrs', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'date-attrs'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLDate);
	assertEquals(plist.time, 0);
});

Deno.test('spec: xml-edge date-edge', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'date-edge'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLDict);

	{
		const d = plist.find('leapyear');
		assertInstanceOf(d, PLDate);
		assertEquals(d.toISOString(), '2008-02-29T00:00:00.000Z');
		assertEquals(
			d.time - PLDate.UNIX_EPOCH,
			Date.parse('2008-02-29T00:00:00.000Z') / 1000,
		);
	}
	{
		const d = plist.find('year 999');
		assertInstanceOf(d, PLDate);
		assertEquals(d.toISOString(), '0999-01-01T00:00:00.000Z');
	}
	{
		const d = plist.find('year 99');
		assertInstanceOf(d, PLDate);
		assertEquals(d.toISOString(), '0099-01-01T00:00:00.000Z');
	}
	{
		const d = plist.find('year 9');
		assertInstanceOf(d, PLDate);
		assertEquals(d.toISOString(), '0009-01-01T00:00:00.000Z');
	}
	{
		const d = plist.find('year 1');
		assertInstanceOf(d, PLDate);
		assertEquals(d.toISOString(), '0001-01-01T00:00:00.000Z');
	}
	{
		const d = plist.find('limit');
		assertInstanceOf(d, PLDate);
		// TODO
	}
	{
		const d = plist.find('overflow');
		assertInstanceOf(d, PLDate);
		// TODO
	}
	{
		const d = plist.find('underflow');
		assertInstanceOf(d, PLDate);
		// TODO
	}
	{
		const d = plist.find('rollover s 60');
		assertInstanceOf(d, PLDate);
		assertEquals(d.toISOString(), '2010-01-01T00:01:00.000Z');
	}
	{
		const d = plist.find('rollover s 99');
		assertInstanceOf(d, PLDate);
		assertEquals(d.toISOString(), '2010-01-01T00:01:39.000Z');
	}
	{
		const d = plist.find('rollover m 60');
		assertInstanceOf(d, PLDate);
		assertEquals(d.toISOString(), '2010-01-01T01:00:00.000Z');
	}
	{
		const d = plist.find('rollover m 99');
		assertInstanceOf(d, PLDate);
		assertEquals(d.toISOString(), '2010-01-01T01:39:00.000Z');
	}
	{
		const d = plist.find('rollover h 24');
		assertInstanceOf(d, PLDate);
		assertEquals(d.toISOString(), '2010-01-02T00:00:00.000Z');
	}
	{
		const d = plist.find('rollover h 99');
		assertInstanceOf(d, PLDate);
		assertEquals(d.toISOString(), '2010-01-05T03:00:00.000Z');
	}
	{
		const d = plist.find('rollover d 00');
		assertInstanceOf(d, PLDate);
		assertEquals(d.toISOString(), '2009-12-31T00:00:00.000Z');
	}
	{
		const d = plist.find('rollover d 32');
		assertInstanceOf(d, PLDate);
		assertEquals(d.toISOString(), '2010-02-01T00:00:00.000Z');
	}
	{
		const d = plist.find('rollover m 00');
		assertInstanceOf(d, PLDate);
		assertEquals(d.toISOString(), '2010-01-01T00:00:00.000Z');
	}
	{
		const d = plist.find('rollover m 13');
		assertInstanceOf(d, PLDate);
		assertEquals(d.toISOString(), '2011-01-01T00:00:00.000Z');
	}
	{
		const d = plist.find('rollover feb 29');
		assertInstanceOf(d, PLDate);
		assertEquals(d.toISOString(), '2010-03-01T00:00:00.000Z');
	}
});

Deno.test('spec: xml-edge date-empty-year', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'date-empty-year'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLDate);
	assertEquals(plist.toISOString(), '0000-01-01T00:00:00.000Z');
});

Deno.test('spec: xml-edge date-over-under', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'date-over-under'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLDict);

	for (const [k, v] of plist) {
		const [tag, date, time] = k.value.split(' ');
		assertInstanceOf(v, PLDate, tag);
		const expected = `${date}T${time}.000Z`;
		assertEquals(v.toISOString(), expected);
	}
});

Deno.test('spec: xml-edge date-year-0000', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'date-year-0000'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLDate);
	assertEquals(plist.toISOString(), '0000-01-01T00:00:00.000Z');
});

Deno.test('spec: xml-edge dict-attrs-close', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'dict-attrs-close'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 0);
});

Deno.test('spec: xml-edge doctype-internal-subset', async () => {
	const data = await fixturePlist('xml-edge', 'doctype-internal-subset');
	assertThrows(
		() => decodeXml(data, CF_STYLE),
		SyntaxError,
		'Invalid XML on line 2',
	);
});

Deno.test('spec: xml-edge doctype-lowercase', async () => {
	const data = await fixturePlist('xml-edge', 'doctype-lowercase');
	assertThrows(
		() => decodeXml(data, CF_STYLE),
		SyntaxError,
		'Invalid XML on line 2',
	);
});

Deno.test('spec: xml-edge empty', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'empty'),
		CF_STYLE,
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
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLBoolean);
	assertEquals(plist.value, false);
});

Deno.test('spec: xml-edge integer-attrs', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'integer-attrs'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLInteger);
	assertEquals(plist.value, 0n);
	assertEquals(plist.bits, 64);
});

Deno.test('spec: xml-edge integer-edge', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'integer-edge'),
		CF_STYLE,
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
		CF_STYLE,
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
		CF_STYLE,
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
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, 'string-like');
});

Deno.test('spec: xml-edge legacy-10.0-0.9-1-null', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'legacy-10.0-0.9-1-null'),
		CF_STYLE,
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
		CF_STYLE,
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
		() => decodeXml(data, CF_STYLE),
		SyntaxError,
		'Invalid XML on line 4',
	);
});

Deno.test('spec: xml-edge plist-none-array', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'plist-none-array'),
		CF_STYLE,
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
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLBoolean);
	assertEquals(plist.value, true);
});

Deno.test('spec: xml-edge plist-none-uid', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'plist-none-uid'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLUID);
	assertEquals(plist.value, 42n);
});

Deno.test('spec: xml-edge plist-tags-array', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'plist-tags-array'),
		CF_STYLE,
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
		CF_STYLE,
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

Deno.test('spec: plist-tags-uid', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'plist-tags-uid'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLUID);
	assertEquals(plist.value, 42n);
});

Deno.test('spec: xml-edge processing-instructions', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'processing-instructions'),
		CF_STYLE,
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
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'real-attrs'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLReal);
	assertEquals(plist.value, 0);
	assertEquals(plist.bits, 64);
});

Deno.test('spec: xml-edge real-edge', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'real-edge'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 12);

	for (let i = 0; i < 12;) {
		const k: PLType = plist.get(i)!;
		assertInstanceOf(k, PLString, `${i}`);
		const tag: string = k.value;
		i++;

		const v: PLType = plist.get(i)!;
		assertInstanceOf(v, PLReal, tag);
		assertEquals(v.bits, 64);
		const e = +k.value.split('|')[1];
		assertEquals(v.value, e, tag);
		i++;
	}
});

Deno.test('spec: xml-edge self-closed', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'self-closed'),
		CF_STYLE,
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
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, '');
});

Deno.test('spec: string-entity-dec', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'string-entity-dec'),
		CF_STYLE,
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
		CF_STYLE,
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
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, '>');
});

Deno.test('spec: xml-edge trailer-close', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'trailer-close'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLBoolean);
	assertEquals(plist.value, true);
});

Deno.test('spec: xml-edge trailer-plist', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'trailer-plist'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLBoolean);
	assertEquals(plist.value, true);
});

Deno.test('spec: xml-edge true-attrs-close', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'true-attrs-close'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLBoolean);
	assertEquals(plist.value, true);
});

Deno.test('spec: xml-edge uid-attrs', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'uid-attrs'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLUID);
	assertEquals(plist.value, 42n);
});

Deno.test('spec: xml-edge uid-negative', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'uid-negative'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 3);

	for (const [k, v] of plist) {
		const tag = k.value;
		assertInstanceOf(v, PLUID, tag);
		const expected = BigInt(k.value.split('|')[1]);
		assertEquals(v.value, expected, tag);
	}
});

Deno.test('spec: xml-edge uid-not', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'uid-not'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 2);

	const a = plist.find('CF$UID');
	assertInstanceOf(a, PLInteger);
	assertEquals(a.value, 42n);

	const b = plist.find('other');
	assertInstanceOf(b, PLInteger);
	assertEquals(b.value, 123n);
});

Deno.test('spec: xml-edge uid-over', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'uid-over'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 4);

	for (const [k, v] of plist) {
		const tag = k.value;
		assertInstanceOf(v, PLUID, tag);
		const expected = BigInt(k.value.split('|')[1]);
		assertEquals(v.value, expected, tag);
	}
});

Deno.test('spec: xml-edge uid-real-nan', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'uid-real-nan'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLUID);
	assertEquals(plist.value, 0n);
});

Deno.test('spec: xml-edge uid-real-negative', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'uid-real-negative'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLUID);
	assertEquals(plist.value, 0xfffffffdn);
});

Deno.test('spec: xml-edge uid-real-ninf', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'uid-real-ninf'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLUID);
	assertEquals(plist.value, 0x80000000n);
});

Deno.test('spec: xml-edge uid-real-pinf', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'uid-real-pinf'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLUID);
	assertEquals(plist.value, 0x7fffffffn);
});

Deno.test('spec: xml-edge uid-real-positive', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'uid-real-positive'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLUID);
	assertEquals(plist.value, 3n);
});

Deno.test('spec: xml-edge uid-string', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'uid-string'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 1);

	const a = plist.find('CF$UID');
	assertInstanceOf(a, PLString);
	assertEquals(a.value, '42');
});

Deno.test('spec: xml-edge version-0.0', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'version-0.0'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, 'Version 0.0');
});

Deno.test('spec: xml-edge version-1.9', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'version-1.9'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, 'Version 1.9');
});

Deno.test('spec: xml-edge version-9', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'version-9'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, 'Version 9');
});

Deno.test('spec: xml-edge version-empty', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'version-empty'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, 'Version empty');
});

Deno.test('spec: xml-edge version-none', async () => {
	const { format, plist } = decodeXml(
		await fixturePlist('xml-edge', 'version-none'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, 'Version none');
});
