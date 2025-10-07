import { assertEquals, assertInstanceOf, assertThrows } from '@std/assert';
import { fixturePlist } from '../spec/fixture.ts';
import { PLArray } from '../array.ts';
import { PLBoolean } from '../boolean.ts';
import { PLDict } from '../dict.ts';
import {
	FORMAT_BINARY_V1_0,
	FORMAT_OPENSTEP,
	FORMAT_STRINGS,
	FORMAT_XML_V0_9,
	FORMAT_XML_V1_0,
} from '../format.ts';
import { PLInteger } from '../integer.ts';
import { binaryError } from '../pri/data.ts';
import { PLString } from '../string.ts';
import type { PLType } from '../type.ts';
import { decode } from './mod.ts';

const TE = new TextEncoder();
const TDASCII = new TextDecoder('ascii', { fatal: true });
const ascii2utf8 = (data: Uint8Array) => TE.encode(TDASCII.decode(data));

const DOCTYPE =
	'<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">';

function kp(value: string): (_: PLType, key: PLType) => boolean {
	return (_: PLType, key: PLType) => PLString.is(key) && key.value === value;
}

Deno.test('Invalid', () => {
	const data = new Uint8Array([...'bplist00='].map((c) => c.charCodeAt(0)));
	assertThrows(
		() => decode(data),
		SyntaxError,
		binaryError(8),
	);
});

Deno.test('XML Option: decoded', () => {
	const combos = [
		undefined,
		{ decoded: true },
		{ decoded: false },
		{ decoded: true, int64: true },
		{ decoded: false, int64: true },
		{ decoded: true, utf16le: true },
		{ decoded: true, utf16le: false },
		{ decoded: false, utf16le: true },
		{ decoded: false, utf16le: false },
	];
	for (const xml of combos) {
		for (const openstep of combos) {
			const tag = JSON.stringify({ xml, openstep });
			const { format, plist } = decode(
				TE.encode(
					[
						xml?.decoded ? '' : '\uFEFF',
						DOCTYPE,
						'<plist version="1.0">',
						'<true/>',
						'</plist>',
						'',
					].join('\n'),
				),
				{
					xml,
					openstep,
				},
			);
			assertEquals(format, FORMAT_XML_V1_0, tag);
			assertInstanceOf(plist, PLBoolean, tag);
			assertEquals(plist.value, true, tag);
		}
	}
});

Deno.test('XML encoding: custom', () => {
	let count = 0;
	const options = {
		xml: {
			decoder(
				encoding: string,
				data: Uint8Array,
			): Uint8Array | null {
				count++;
				return encoding === 'ascii' ? ascii2utf8(data) : null;
			},
		},
	};

	{
		const { format, plist } = decode(
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
		assertThrows(
			() =>
				decode(
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
				),
			RangeError,
			'Unsupported encoding: invalid',
		);
		assertEquals(count, 2);
	}
	{
		assertThrows(
			() =>
				decode(
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
				),
			SyntaxError,
			'Invalid end on line 6',
		);
		assertEquals(count, 3);
	}
});

Deno.test('spec: dict-26: binary', async () => {
	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const { format, plist } = decode(
		await fixturePlist('dict-26', 'binary'),
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 26);

	for (let i = 0; i < plist.size; i++) {
		const str = plist.find(kp(alphabet[i]));
		assertInstanceOf(str, PLString);
		assertEquals(str.value, alphabet[i].toLowerCase());
	}
});

Deno.test('spec: dict-26: xml', async () => {
	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const { format, plist } = decode(
		await fixturePlist('dict-26', 'xml'),
	);
	assertEquals(format, FORMAT_XML_V1_0);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 26);

	for (let i = 0; i < plist.size; i++) {
		const str = plist.find(kp(alphabet[i]));
		assertInstanceOf(str, PLString);
		assertEquals(str.value, alphabet[i].toLowerCase());
	}
});

Deno.test('spec: dict-26: openstep', async () => {
	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const { format, plist } = decode(
		await fixturePlist('dict-26', 'openstep'),
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 26);

	for (let i = 0; i < plist.size; i++) {
		const str = plist.find(kp(alphabet[i]));
		assertInstanceOf(str, PLString);
		assertEquals(str.value, alphabet[i].toLowerCase());
	}
});

Deno.test('spec: dict-26: strings', async () => {
	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const { format, plist } = decode(
		await fixturePlist('dict-26', 'strings'),
	);
	assertEquals(format, FORMAT_STRINGS);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 26);

	for (let i = 0; i < plist.size; i++) {
		const str = plist.find(kp(alphabet[i]));
		assertInstanceOf(str, PLString);
		assertEquals(str.value, alphabet[i].toLowerCase());
	}
});

Deno.test('spec: xml-edge legacy-10.0-0.9-1-null', async () => {
	const { format, plist } = decode(
		await fixturePlist('xml-edge', 'legacy-10.0-0.9-1-null'),
	);
	assertEquals(format, FORMAT_XML_V0_9);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 1);

	const name = plist.find(kp('Name'));
	assertInstanceOf(name, PLString);
	assertEquals(name.value, 'John Smith');
});

Deno.test('spec: xml-encoding-utf', async () => {
	for (
		const file of [
			'utf-8',
			'utf-8-bom',
			'utf-8-default',
			'utf-8-headless',
			'utf-16be-bom',
			'utf-16be-space',
			'utf-16le-bom',
			'utf-16le-space',
			'utf-32be-bom',
			'utf-32le-bom',
			'x-mac-utf-8',
		]
	) {
		const { format, plist } = decode(
			// deno-lint-ignore no-await-in-loop
			await fixturePlist('xml-encoding-utf', file),
		);
		assertEquals(format, FORMAT_XML_V1_0, file);
		assertInstanceOf(plist, PLDict, file);
		assertEquals(plist.size, 5, file);

		const divide = plist.find(kp('divide'));
		assertInstanceOf(divide, PLString, file);
		assertEquals(divide.value, '\u00f7', file);

		const ohm = plist.find(kp('ohm'));
		assertInstanceOf(ohm, PLString, file);
		assertEquals(ohm.value, '\u03a9', file);

		const check = plist.find(kp('check'));
		assertInstanceOf(check, PLString, file);
		assertEquals(check.value, '\u2705', file);

		const plus = plist.find(kp('plus'));
		assertInstanceOf(plus, PLString, file);
		assertEquals(plus.value, '\uff0b', file);

		const robot = plist.find(kp('robot'));
		assertInstanceOf(robot, PLString, file);
		assertEquals(robot.value, '\ud83e\udd16', file);
	}
});

Deno.test('spec: strings-edge bplist00-string', async () => {
	const { format, plist } = decode(
		await fixturePlist('strings-edge', 'bplist00-string'),
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, 'bplist00');
});

Deno.test('spec: strings-edge bplist00-dict-opt-sc', async () => {
	const data = await fixturePlist('strings-edge', 'bplist00-dict-opt-sc');
	assertThrows(
		() => decode(data),
		SyntaxError,
		'Invalid XML on line 1',
	);

	const { format, plist } = decode(data, {
		openstep: {
			allowMissingSemi: true,
		},
	});
	assertEquals(format, FORMAT_STRINGS);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 2);

	const [[aK, aV], [bK, bV]] = [...plist.entries()];
	assertInstanceOf(aK, PLString);
	assertEquals(aK.value, 'bplist00');
	assertInstanceOf(aV, PLString);
	assertEquals(aV.value, 'One');
	assertInstanceOf(bK, PLString);
	assertEquals(bK.value, 'other');
	assertInstanceOf(bV, PLString);
	assertEquals(bV.value, 'Two');
});

Deno.test('spec: openstep-edge legacy-dict-opt-sc', async () => {
	const data = await fixturePlist('openstep-edge', 'legacy-dict-opt-sc');

	assertThrows(
		() => decode(data),
		SyntaxError,
		'Invalid XML on line 1',
	);

	const { format, plist } = decode(data, {
		openstep: { allowMissingSemi: true },
	});
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 2);

	const A = plist.find(kp('A'));
	assertInstanceOf(A, PLString);
	assertEquals(A.value, 'Alpha');

	const B = plist.find(kp('B'));
	assertInstanceOf(B, PLString);
	assertEquals(B.value, 'Beta');
});

Deno.test('spec: binary-edge infinite-recursion-array', async () => {
	const data = await fixturePlist('binary-edge', 'infinite-recursion-array');
	assertThrows(
		() => decode(data),
		SyntaxError,
		binaryError(8),
	);
});

Deno.test('spec: integer-big: xml', async () => {
	const MIN_128 = -0x8000000000000000_0000000000000000n;

	const data = await fixturePlist('integer-big', 'xml');

	// Not very compatible, created with a private API.
	assertThrows(
		() => decode(data, { xml: { int64: true } }),
		SyntaxError,
		'Invalid XML on line 6',
	);

	const { format, plist } = decode(data);
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

Deno.test('spec: integer-big: binary', async () => {
	const MIN_128 = -0x8000000000000000_0000000000000000n;
	const data = await fixturePlist('integer-big', 'binary');
	{
		const { format, plist } = decode(data, {
			binary: { int64: true },
		});
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
		const { format, plist } = decode(data, {
			binary: { int64: false },
		});
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
