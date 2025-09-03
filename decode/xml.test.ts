import {
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
import { fixturePlist } from '../spec/fixture.ts';
import { PLString } from '../string.ts';
import type { PLType } from '../type.ts';
import { decodeXml } from './xml.ts';

const DOCTYPE =
	'<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">';

const TE = new TextEncoder();
const TDASCII = new TextDecoder('ascii', { fatal: true });
const ascii2utf8 = (data: Uint8Array) => TE.encode(TDASCII.decode(data));

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
	// TODO
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
