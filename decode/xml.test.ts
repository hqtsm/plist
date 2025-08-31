import { assertEquals, assertThrows } from '@std/assert';
import { XML_DOCTYPE_PUBLIC_V1_0, XML_VERSION_V1_0 } from '../encode/xml.ts';
import { decodeXml } from './xml.ts';

const TE = new TextEncoder();
const TDASCII = new TextDecoder('ascii', { fatal: true });
const ascii2utf8 = (data: Uint8Array) => TE.encode(TDASCII.decode(data));

Deno.test('XML encoding default', () => {
	const options = {
		decoder(encoding: string): Uint8Array | null {
			throw new Error(`Called for: ${encoding}`);
		},
	};
	decodeXml(
		TE.encode(
			[
				XML_DOCTYPE_PUBLIC_V1_0,
				`<plist version="${XML_VERSION_V1_0}">`,
				'<true/>',
				'</plist>',
				'',
			].join('\n'),
		),
		options,
	);
	decodeXml(
		TE.encode(
			[
				'<?xml version="1.0"?>',
				XML_DOCTYPE_PUBLIC_V1_0,
				`<plist version="${XML_VERSION_V1_0}">`,
				'<true/>',
				'</plist>',
				'',
			].join('\n'),
		),
		options,
	);
	decodeXml(
		TE.encode(
			[
				'<?xml version="1.0" encoding=BAD?>',
				XML_DOCTYPE_PUBLIC_V1_0,
				`<plist version="${XML_VERSION_V1_0}">`,
				'<true/>',
				'</plist>',
				'',
			].join('\n'),
		),
		options,
	);
});

Deno.test('XML encoding: UTF-8', () => {
	const options = {
		decoder(encoding: string): Uint8Array | null {
			throw new Error(`Called for: ${encoding}`);
		},
	};
	decodeXml(
		TE.encode(
			[
				'<?xml version="1.0" encoding="UTF-8"?>',
				XML_DOCTYPE_PUBLIC_V1_0,
				`<plist version="${XML_VERSION_V1_0}">`,
				'<true/>',
				'</plist>',
				'',
			].join('\n'),
		),
		options,
	);
	decodeXml(
		TE.encode(
			[
				"<?xml version='1.0' encoding='x-mac-utf-8'?>",
				XML_DOCTYPE_PUBLIC_V1_0,
				`<plist version="${XML_VERSION_V1_0}">`,
				'<true/>',
				'</plist>',
				'',
			].join('\n'),
		),
		options,
	);
});

Deno.test('XML encoding: Error EOF', () => {
	assertThrows(
		() => decodeXml(TE.encode('<?xml version="1.0"')),
		SyntaxError,
		'Invalid XML on line 1',
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

	decodeXml(
		TE.encode(
			[
				'<?xml version="1.0" encoding="ascii"?>',
				XML_DOCTYPE_PUBLIC_V1_0,
				`<plist version="${XML_VERSION_V1_0}">`,
				'<true/>',
				'</plist>',
				'',
			].join('\n'),
		),
		options,
	);
	assertEquals(count, 1);

	assertThrows(() =>
		decodeXml(
			TE.encode(
				[
					'<?xml version="1.0" encoding="invalid"?>',
					XML_DOCTYPE_PUBLIC_V1_0,
					`<plist version="${XML_VERSION_V1_0}">`,
					'<true/>',
					'</plist>',
					'',
				].join('\n'),
			),
			options,
		)
	);
	assertEquals(count, 2);

	assertThrows(() =>
		decodeXml(
			TE.encode(
				[
					'<?xml version="1.0" encoding="ascii">',
					XML_DOCTYPE_PUBLIC_V1_0,
					`<plist version="${XML_VERSION_V1_0}">`,
					'<true/>',
					'</plist>',
					'',
				].join('\n'),
			),
			options,
		)
	);
	assertEquals(count, 3);
});
