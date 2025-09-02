import { assertEquals, assertInstanceOf, assertThrows } from '@std/assert';
import { PLBoolean } from '../boolean.ts';
import { FORMAT_XML_V1_0 } from '../format.ts';
import { fixturePlist } from '../spec/fixture.ts';
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
