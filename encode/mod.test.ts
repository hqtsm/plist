import {
	assertEquals,
	assertGreater,
	assertStringIncludes,
	assertThrows,
} from '@std/assert';
import { PLBoolean, PLTYPE_BOOLEAN } from '../boolean.ts';
import { PLDict } from '../dict.ts';
import {
	FORMAT_BINARY_V1_0,
	FORMAT_OPENSTEP,
	FORMAT_STRINGS,
	FORMAT_XML_V0_9,
	FORMAT_XML_V1_0,
} from '../format.ts';
import { PLString } from '../string.ts';
import { encode, type EncodeOptions } from './mod.ts';

Deno.test('Format: FORMAT_OPENSTEP', () => {
	const plist = new PLDict([
		[new PLString('Key'), new PLString('Value')],
	]);
	const enc = encode(plist, {
		format: FORMAT_OPENSTEP,
		quoted: true,
	});
	const str = new TextDecoder().decode(enc);
	assertEquals(
		str,
		[
			'{',
			'\t"Key" = "Value";',
			'}',
			'',
		].join('\n'),
	);
});

Deno.test('Format: FORMAT_STRINGS', () => {
	const plist = new PLDict([
		[new PLString('Key'), new PLString('Value')],
	]);
	const enc = encode(plist, {
		format: FORMAT_STRINGS,
		quoted: true,
	});
	const str = new TextDecoder().decode(enc);
	assertEquals(
		str,
		[
			'"Key" = "Value";',
			'',
		].join('\n'),
	);
});

Deno.test('Format: FORMAT_XML_V1_0', () => {
	const plist = new PLString('Hello world!');
	const enc = encode(plist, {
		format: FORMAT_XML_V1_0,
	});
	const str = new TextDecoder().decode(enc);
	assertStringIncludes(
		str,
		'<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
	);
	assertStringIncludes(str, '<plist version="1.0">');
	assertStringIncludes(str, 'Hello world!');
});

Deno.test('Format: FORMAT_XML_V0_9', () => {
	const plist = new PLString('Hello world!');
	const enc = encode(plist, {
		format: FORMAT_XML_V0_9,
	});
	const str = new TextDecoder().decode(enc);
	assertStringIncludes(
		str,
		'<!DOCTYPE plist SYSTEM "file://localhost/System/Library/DTDs/PropertyList.dtd">',
	);
	assertStringIncludes(str, '<plist version="0.9">');
	assertStringIncludes(str, 'Hello world!');
});

Deno.test('Format: FORMAT_BINARY_V1_0', () => {
	const TRUE = new PLBoolean(true);
	const dict = new PLDict([
		[new PLString('Dictionary Key 1'), TRUE],
		[new PLString('Dictionary Key 2'), TRUE],
	]);
	const enc = encode(dict, {
		format: FORMAT_BINARY_V1_0,
	});
	const str = String.fromCharCode(...enc.subarray(0, 8));
	assertEquals(str, 'bplist00');
	const encDup = encode(dict, {
		format: FORMAT_BINARY_V1_0,
		duplicates: [PLTYPE_BOOLEAN],
	});
	assertGreater(encDup.byteLength, enc.byteLength);
});

Deno.test('Format: Invalid', () => {
	const plist = new PLString('Hello world!');
	assertThrows(
		() => {
			encode(plist, {
				format: 'INVALID' as EncodeOptions['format'],
			});
		},
		RangeError,
		'Invalid format',
	);
});
