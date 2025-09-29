import {
	assert,
	assertEquals,
	assertInstanceOf,
	assertNotStrictEquals,
	assertStrictEquals,
	assertThrows,
} from '@std/assert';
import { fixtureNextStepLatin, fixturePlist } from '../spec/fixture.ts';
import { PLArray } from '../array.ts';
import { PLDict } from '../dict.ts';
import { FORMAT_OPENSTEP, FORMAT_STRINGS } from '../format.ts';
import { unquoted } from '../pri/openstep.ts';
import { PLString } from '../string.ts';
import type { PLType } from '../type.ts';
import { decodeOpenStep, type DecodeOpenStepOptions } from './openstep.ts';
import { PLData } from '../data.ts';

const CF_STYLE = {
	// Intel and ARM are little endian, PPC was big endian.
	utf16le: true,
} as const satisfies DecodeOpenStepOptions;

const TE = new TextEncoder();
const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);

function kp(value: string): (key: PLString) => boolean {
	return (key: PLString) => key.value === value;
}

Deno.test('Empty', () => {
	const te = new TextEncoder();
	const empties = [
		'',
		' ',
		'\r',
		'\n',
		'\r\n',
		'\n\r',
		'\t',
		'\x0B',
		'\f',
		'//',
		'// comment',
		'/**/',
		'/* comment */',
		...[
			'\r',
			'\n',
			'\r\n',
			'\n\r',
			LS,
			PS,
			'*',
			'//',
		].map((s) => `/* ${s} */`),
		LS,
		PS,
	];

	for (const a of empties) {
		for (const b of empties) {
			if (
				a.startsWith('//') && b.startsWith('/*') &&
				(
					b.includes('\r') ||
					b.includes('\n') ||
					b.includes(LS) ||
					b.includes(PS)
				)
			) {
				continue;
			}
			const str = `${a}${b}`;
			const tag = JSON.stringify(str);
			const { format, plist } = decodeOpenStep(te.encode(str));
			assertEquals(format, FORMAT_STRINGS, tag);
			assert(PLDict.is(plist), tag);
			assertEquals(plist.size, 0, tag);
		}
	}
});

Deno.test('Top-level invalid token', () => {
	const data = TE.encode('!INVALID');
	assertThrows(
		() => decodeOpenStep(data),
		SyntaxError,
		'Invalid token on line 1',
	);
});

Deno.test('String EOF', () => {
	const data = TE.encode('"Incomplete');
	assertThrows(
		() => decodeOpenStep(data),
		SyntaxError,
		'Invalid end on line 1',
	);
});

Deno.test('Array invalid token', () => {
	const data = TE.encode('(\n!INVALID\n)');
	assertThrows(
		() => decodeOpenStep(data),
		SyntaxError,
		'Invalid token on line 2',
	);
});

Deno.test('Array invalid delimiter', () => {
	const data = TE.encode('(\nA,B;\n)');
	assertThrows(
		() => decodeOpenStep(data),
		SyntaxError,
		'Invalid token on line 2',
	);
});

Deno.test('Array EOF', () => {
	const data = TE.encode('(\nA,B');
	assertThrows(
		() => decodeOpenStep(data),
		SyntaxError,
		'Invalid end on line 2',
	);
});

Deno.test('Dict invalid token', () => {
	const data = TE.encode('{\n! = 1;\n}');
	assertThrows(
		() => decodeOpenStep(data),
		SyntaxError,
		'Invalid token on line 2',
	);
});

Deno.test('Dict invalid equal', () => {
	const data = TE.encode('{\nA : 1\n;}');
	assertThrows(
		() => decodeOpenStep(data),
		SyntaxError,
		'Invalid token on line 2',
	);
});

Deno.test('Dict EOF before equal', () => {
	const data = TE.encode('{\nA ');
	assertThrows(
		() => decodeOpenStep(data),
		SyntaxError,
		'Invalid end on line 2',
	);
});

Deno.test('Dict EOF after equal', () => {
	const data = TE.encode('{\nA = ');
	assertThrows(
		() => decodeOpenStep(data),
		SyntaxError,
		'Invalid end on line 2',
	);
});

Deno.test('Dict EOF after semi-colon', () => {
	const data = TE.encode('{\nA = 1;');
	assertThrows(
		() => decodeOpenStep(data),
		SyntaxError,
		'Invalid end on line 2',
	);
});

Deno.test('Data whitespace', () => {
	const spaces = ['', ' ', '\r', '\n', '\r\n', '\t', LS, PS];
	const data = new Uint8Array([0x12, 0x34]);
	for (const a of spaces) {
		for (const b of spaces) {
			const str = `<12${a}${b}34>`;
			const tag = JSON.stringify(str);
			const { format, plist } = decodeOpenStep(TE.encode(str));
			assertEquals(format, FORMAT_OPENSTEP, tag);
			assertInstanceOf(plist, PLData);
			assertEquals(new Uint8Array(plist.buffer), data);
		}
	}
});

Deno.test('Data unbalanced', () => {
	const data = TE.encode('<12 345 6>');
	assertThrows(
		() => decodeOpenStep(data),
		SyntaxError,
		'Invalid token on line 1',
	);
});

Deno.test('Data non-hex', () => {
	const data = TE.encode('<12 34 GG>');
	assertThrows(
		() => decodeOpenStep(data),
		SyntaxError,
		'Invalid token on line 1',
	);
});

Deno.test('Data EOF', () => {
	const data = TE.encode('<12 34');
	assertThrows(
		() => decodeOpenStep(data),
		SyntaxError,
		'Invalid end on line 1',
	);
});

Deno.test('Option: decoded', () => {
	const data = new Uint8Array([...'ABC123'].map((c) => c.charCodeAt(0)));
	const { format, plist } = decodeOpenStep(data, { decoded: true });
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, 'ABC123');
});

Deno.test('Option: utf16le: UTF-16BE NO-BOM', () => {
	const _ = ' '.charCodeAt(0);
	const A = 'A'.charCodeAt(0);
	const d = new Uint8Array([0x00, _, 0x00, A]);
	{
		const { format, plist } = decodeOpenStep(d);
		assertEquals(format, FORMAT_OPENSTEP);
		assertInstanceOf(plist, PLString);
		assertEquals(plist.value, 'A');
	}
	{
		const { format, plist } = decodeOpenStep(d, { utf16le: false });
		assertEquals(format, FORMAT_OPENSTEP);
		assertInstanceOf(plist, PLString);
		assertEquals(plist.value, 'A');
	}
	{
		assertThrows(
			() => decodeOpenStep(d, { utf16le: true }),
			SyntaxError,
			'Invalid token on line 1',
		);
	}
});

Deno.test('Option: utf16le: UTF-16LE NO-BOM', () => {
	const _ = ' '.charCodeAt(0);
	const A = 'A'.charCodeAt(0);
	const d = new Uint8Array([_, 0x00, A, 0x00]);
	{
		const { format, plist } = decodeOpenStep(d);
		assertEquals(format, FORMAT_OPENSTEP);
		assertInstanceOf(plist, PLString);
		assertEquals(plist.value, 'A');
	}
	{
		const { format, plist } = decodeOpenStep(d, { utf16le: true });
		assertEquals(format, FORMAT_OPENSTEP);
		assertInstanceOf(plist, PLString);
		assertEquals(plist.value, 'A');
	}
	{
		assertThrows(
			() => decodeOpenStep(d, { utf16le: false }),
			SyntaxError,
			'Invalid token on line 1',
		);
	}
});

Deno.test('spec: array-0', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('array-0', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 0);
});

Deno.test('spec: array-1', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('array-1', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 1);

	const str = plist.get(0);
	assertInstanceOf(str, PLString);
	assertEquals(str.value, 'A');
});

Deno.test('spec: array-4', async () => {
	const aa = new Uint8Array([0x61, 0x61]);
	const bb = new Uint8Array([0x62, 0x62]);
	const { format, plist } = decodeOpenStep(
		await fixturePlist('array-4', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 4);

	for (let i = 0; i < plist.length; i++) {
		const str = plist.get(i);
		assertInstanceOf(str, PLData);
		assertEquals(new Uint8Array(str.buffer), i % 2 ? bb : aa);
	}
});

Deno.test('spec: array-8', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('array-8', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 8);

	const all = new Set<PLString>();
	for (let i = 0; i < plist.length; i++) {
		const str = plist.get(i);
		assertInstanceOf(str, PLString);
		assertEquals(str.value, i % 2 ? 'B' : 'A');
		all.add(str);
	}

	assertEquals(all.size, 8);
});

Deno.test('spec: array-26', async () => {
	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const { format, plist } = decodeOpenStep(
		await fixturePlist('array-26', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 26);

	for (let i = 0; i < plist.length; i++) {
		const str = plist.get(i);
		assertInstanceOf(str, PLString);
		assertEquals(str.value, alphabet[i]);
	}
});

Deno.test('spec: array-reuse', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('array-reuse', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
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
	const { format, plist } = decodeOpenStep(
		await fixturePlist('data-0', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLData);
	assertEquals(plist.byteLength, 0);
});

Deno.test('spec: data-1', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('data-1', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLData);
	assertEquals(plist.byteLength, 1);
	assertEquals(
		new Uint8Array(plist.buffer),
		new Uint8Array([0x61]),
	);
});

Deno.test('spec: data-2', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('data-2', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLData);
	assertEquals(plist.byteLength, 2);
	assertEquals(
		new Uint8Array(plist.buffer),
		new Uint8Array([0x61, 0x62]),
	);
});

Deno.test('spec: data-3', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('data-3', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLData);
	assertEquals(plist.byteLength, 3);
	assertEquals(
		new Uint8Array(plist.buffer),
		new Uint8Array([0x61, 0x62, 0x63]),
	);
});

Deno.test('spec: data-4', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('data-4', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLData);
	assertEquals(plist.byteLength, 4);
	assertEquals(
		new Uint8Array(plist.buffer),
		new Uint8Array([0x61, 0x62, 0x63, 0x64]),
	);
});

Deno.test('spec: data-14', async () => {
	const chars = [...'abcdefghijklmn'].map((c) => c.charCodeAt(0));
	const { format, plist } = decodeOpenStep(
		await fixturePlist('data-14', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLData);
	assertEquals(plist.byteLength, 14);
	assertEquals(
		new Uint8Array(plist.buffer),
		new Uint8Array(chars),
	);
});

Deno.test('spec: data-15', async () => {
	const chars = [...'abcdefghijklmno'].map((c) => c.charCodeAt(0));
	const { format, plist } = decodeOpenStep(
		await fixturePlist('data-15', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
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
	const { format, plist } = decodeOpenStep(
		await fixturePlist('data-255', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
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
	const { format, plist } = decodeOpenStep(
		await fixturePlist('data-256', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLData);
	assertEquals(plist.byteLength, 256);
	assertEquals(
		new Uint8Array(plist.buffer),
		bytes,
	);
});

Deno.test('spec: dict-empty', async () => {
	{
		const { format, plist } = decodeOpenStep(
			await fixturePlist('dict-empty', 'openstep'),
			CF_STYLE,
		);
		assertEquals(format, FORMAT_OPENSTEP);
		assertInstanceOf(plist, PLDict);
		assertEquals(plist.size, 0);
	}
	{
		const { format, plist } = decodeOpenStep(
			await fixturePlist('dict-empty', 'strings'),
			CF_STYLE,
		);
		assertEquals(format, FORMAT_STRINGS);
		assertInstanceOf(plist, PLDict);
		assertEquals(plist.size, 0);
	}
});

Deno.test('spec: dict-empties', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('dict-empties', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 2);

	const array = plist.find(kp('array'));
	assertInstanceOf(array, PLArray);
	assertEquals(array.length, 0);

	const dict = plist.find(kp('dict'));
	assertInstanceOf(dict, PLDict);
	assertEquals(dict.size, 0);
});

Deno.test('spec: dict-26', async () => {
	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const { format, plist } = decodeOpenStep(
		await fixturePlist('dict-26', 'openstep'),
		CF_STYLE,
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

Deno.test('spec: dict-long-key', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('dict-long-key', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 1);

	const str = plist.find(
		kp('ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789'),
	);
	assertInstanceOf(str, PLString);
	assertEquals(str.value, '64');
});

Deno.test('spec: dict-unicode-key', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('dict-unicode-key', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 1);

	const str = plist.find(kp('UTF\u20138'));
	assertInstanceOf(str, PLString);
	assertEquals(str.value, 'utf-8');
});

Deno.test('spec: dict-nesting', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('dict-nesting', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 2);

	const A = plist.find(kp('A'));
	assertInstanceOf(A, PLDict);
	assertEquals(A.size, 2);

	const AA = A.find(kp('AA'));
	assertInstanceOf(AA, PLDict);
	assertEquals(AA.size, 2);

	const AAA = AA.find(kp('AAA'));
	assertInstanceOf(AAA, PLString);
	assertEquals(AAA.value, 'aaa');

	const AAB = AA.find(kp('AAB'));
	assertInstanceOf(AAB, PLString);
	assertEquals(AAB.value, 'aab');

	const AB = A.find(kp('AB'));
	assertInstanceOf(AB, PLDict);
	assertEquals(AB.size, 2);

	const ABA = AB.find(kp('ABA'));
	assertInstanceOf(ABA, PLString);
	assertEquals(ABA.value, 'aba');

	const ABB = AB.find(kp('ABB'));
	assertInstanceOf(ABB, PLString);
	assertEquals(ABB.value, 'abb');

	const B = plist.find(kp('B'));
	assertInstanceOf(B, PLDict);
	assertEquals(B.size, 2);

	const BA = B.find(kp('BA'));
	assertInstanceOf(BA, PLDict);
	assertEquals(BA.size, 2);

	const BAA = BA.find(kp('BAA'));
	assertInstanceOf(BAA, PLString);
	assertEquals(BAA.value, 'baa');

	const BAB = BA.find(kp('BAB'));
	assertInstanceOf(BAB, PLString);
	assertEquals(BAB.value, 'bab');

	const BB = B.find(kp('BB'));
	assertInstanceOf(BB, PLDict);
	assertEquals(BB.size, 2);

	const BBA = BB.find(kp('BBA'));
	assertInstanceOf(BBA, PLString);
	assertEquals(BBA.value, 'bba');

	const BBB = BB.find(kp('BBB'));
	assertInstanceOf(BBB, PLString);
	assertEquals(BBB.value, 'bbb');
});

Deno.test('spec: dict-order', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('dict-order', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 7);

	const empty = plist.find(kp(''));
	assertInstanceOf(empty, PLString);
	assertEquals(empty.value, '0');

	const a = plist.find(kp('a'));
	assertInstanceOf(a, PLString);
	assertEquals(a.value, '1');

	const aa = plist.find(kp('aa'));
	assertInstanceOf(aa, PLString);
	assertEquals(aa.value, '2');

	const aaa = plist.find(kp('aaa'));
	assertInstanceOf(aaa, PLString);
	assertEquals(aaa.value, '3');

	const ab = plist.find(kp('ab'));
	assertInstanceOf(ab, PLString);
	assertEquals(ab.value, '4');

	const abb = plist.find(kp('abb'));
	assertInstanceOf(abb, PLString);
	assertEquals(abb.value, '5');

	const ac = plist.find(kp('ac'));
	assertInstanceOf(ac, PLString);
	assertEquals(ac.value, '6');
});

Deno.test('spec: dict-reuse', async () => {
	{
		const { format, plist } = decodeOpenStep(
			await fixturePlist('dict-reuse', 'openstep'),
			CF_STYLE,
		);
		assertEquals(format, FORMAT_OPENSTEP);
		assertInstanceOf(plist, PLArray);
		assertEquals(plist.length, 2);

		const A = plist.get(0);
		assertInstanceOf(A, PLDict);
		{
			const AAAA = A.find(kp('AAAA'));
			assertInstanceOf(AAAA, PLString);
			assertEquals(AAAA.value, '1111');
			const BBBB = A.find(kp('BBBB'));
			assertInstanceOf(BBBB, PLString);
			assertEquals(BBBB.value, '2222');
		}

		const B = plist.get(1);
		assertInstanceOf(B, PLDict);
		{
			const AAAA = B.find(kp('AAAA'));
			assertInstanceOf(AAAA, PLString);
			assertEquals(AAAA.value, '1111');
			const BBBB = B.find(kp('BBBB'));
			assertInstanceOf(BBBB, PLString);
			assertEquals(BBBB.value, '2222');
		}

		assertNotStrictEquals(A, B);
	}
	{
		const { format, plist } = decodeOpenStep(
			await fixturePlist('dict-reuse', 'strings'),
			CF_STYLE,
		);
		assertEquals(format, FORMAT_STRINGS);
		assertInstanceOf(plist, PLDict);
		assertEquals(plist.size, 2);

		const A = plist.find(kp('A'));
		assertInstanceOf(A, PLDict);
		{
			const AAAA = A.find(kp('AAAA'));
			assertInstanceOf(AAAA, PLString);
			assertEquals(AAAA.value, '1111');
			const BBBB = A.find(kp('BBBB'));
			assertInstanceOf(BBBB, PLString);
			assertEquals(BBBB.value, '2222');
		}

		const B = plist.find(kp('B'));
		assertInstanceOf(B, PLDict);
		{
			const AAAA = B.find(kp('AAAA'));
			assertInstanceOf(AAAA, PLString);
			assertEquals(AAAA.value, '1111');
			const BBBB = B.find(kp('BBBB'));
			assertInstanceOf(BBBB, PLString);
			assertEquals(BBBB.value, '2222');
		}

		assertNotStrictEquals(A, B);
	}
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
	const { format, plist } = decodeOpenStep(
		await fixturePlist('dict-repeat', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 6);

	for (const [i, [k, v]] of [...plist].entries()) {
		assertInstanceOf(v, PLString);
		assertEquals(k.value, expected[i][0], `key: ${i}`);
		assertEquals(v.value, expected[i][1], `value: ${i}`);
	}
});

Deno.test('spec: string-empty', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('string-empty', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, '');
});

Deno.test('spec: string-ascii', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('string-ascii', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, 'ASCII');
});

Deno.test('spec: string-chars', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('string-chars', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLDict);
	for (const [k, v] of plist) {
		const key = k.value;
		assertInstanceOf(v, PLString, key);
		const str = String.fromCharCode(+key);
		assertEquals(v.value, str, key);
	}
});

Deno.test('spec: string-unicode', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('string-unicode', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, 'UTF\u20138');
});

Deno.test('spec: string-long-unicode', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('string-long-unicode', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLString);
	assertEquals(
		plist.value,
		new Array(8).fill('UTF\u20138').join(' '),
	);
});

Deno.test('spec: string-utf8-mb2-divide', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('string-utf8-mb2-divide', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, '\u00f7');
});

Deno.test('spec: string-utf8-mb2-ohm', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('string-utf8-mb2-ohm', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, '\u03a9');
});

Deno.test('spec: string-utf8-mb3-check', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('string-utf8-mb3-check', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, '\u2705');
});

Deno.test('spec: string-utf8-mb3-plus', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('string-utf8-mb3-plus', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, '\uff0b');
});

Deno.test('spec: string-utf8-mb4-robot', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('string-utf8-mb4-robot', 'openstep'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, '\ud83e\udd16');
});

Deno.test('spec: openstep-edge all-types', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'all-types'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 4);

	const STRING = plist.find(kp('STRING'));
	assertInstanceOf(STRING, PLString);
	assertEquals(STRING.value, 'Example');

	const DICT = plist.find(kp('DICT'));
	assertInstanceOf(DICT, PLDict);
	assertEquals(DICT.size, 2);

	const A = DICT.find(kp('A'));
	assertInstanceOf(A, PLString);
	assertEquals(A.value, 'a');

	const B = DICT.find(kp('B'));
	assertInstanceOf(B, PLString);
	assertEquals(B.value, 'b');

	const ARRAY = plist.find(kp('ARRAY'));
	assertInstanceOf(ARRAY, PLArray);
	assertEquals(ARRAY.length, 3);
	for (let i = 0; i < ARRAY.length; i++) {
		const str: PLType = ARRAY.get(i)!;
		assertInstanceOf(str, PLString);
		assertEquals(str.value, `${i + 1}`, `ARRAY[${i}]`);
	}

	const DATA = plist.find(kp('DATA'));
	assertInstanceOf(DATA, PLData);
	assertEquals(
		new Uint8Array(DATA.buffer),
		new Uint8Array([0x01, 0x23, 0x45, 0x67]),
	);
});

Deno.test('spec: openstep-edge array-comments-block', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'array-comments-block'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 2);

	const A = plist.get(0);
	assertInstanceOf(A, PLString);
	assertEquals(A.value, 'A');

	const B = plist.get(1);
	assertInstanceOf(B, PLString);
	assertEquals(B.value, 'B');
});

Deno.test('spec: openstep-edge array-comments-line', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'array-comments-line'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 2);

	const A = plist.get(0);
	assertInstanceOf(A, PLString);
	assertEquals(A.value, 'A');

	const B = plist.get(1);
	assertInstanceOf(B, PLString);
	assertEquals(B.value, 'B');
});

Deno.test('spec: openstep-edge array-junk-error', async () => {
	const data = await fixturePlist('openstep-edge', 'array-junk-error');
	assertThrows(
		() => decodeOpenStep(data, CF_STYLE),
		SyntaxError,
		'Invalid token on line 2',
	);
});

Deno.test('spec: openstep-edge array-trailing-comma', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'array-trailing-comma'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 2);

	const A = plist.get(0);
	assertInstanceOf(A, PLString);
	assertEquals(A.value, 'A');

	const B = plist.get(1);
	assertInstanceOf(B, PLString);
	assertEquals(B.value, 'B');
});

Deno.test('spec: openstep-edge data-caps', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'data-caps'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLDict);

	const ALL = plist.find(kp('ALL'));
	assertInstanceOf(ALL, PLData);
	assertEquals(
		new Uint8Array(ALL.buffer),
		new Uint8Array([
			0x01,
			0x23,
			0x45,
			0x67,
			0x89,
			0xab,
			0xcd,
			0xef,
			0xab,
			0xcd,
			0xef,
		]),
	);
});

Deno.test('spec: openstep-edge data-comments-block', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'data-comments-block'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLData);
	assertEquals(new Uint8Array(plist.buffer), new Uint8Array([0x42]));
});

Deno.test('spec: openstep-edge data-comments-line', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'data-comments-line'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLData);
	assertEquals(new Uint8Array(plist.buffer), new Uint8Array([0x42]));
});

Deno.test('spec: openstep-edge data-spacing', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'data-spacing'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLDict);

	for (let i = 0; i++ < 4;) {
		const d = plist.find(kp(`${i}`));
		assertInstanceOf(d, PLData);
		assertEquals(new Uint8Array(d.buffer), new Uint8Array(i));
	}
});

Deno.test('spec: openstep-edge dict-comments-block', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'dict-comments-block'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 2);

	const A = plist.find(kp('A'));
	assertInstanceOf(A, PLString);
	assertEquals(A.value, 'A');

	const B = plist.find(kp('B'));
	assertInstanceOf(B, PLString);
	assertEquals(B.value, 'B');
});

Deno.test('spec: openstep-edge dict-comments-line', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'dict-comments-line'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 2);

	const A = plist.find(kp('A'));
	assertInstanceOf(A, PLString);
	assertEquals(A.value, 'A');

	const B = plist.find(kp('B'));
	assertInstanceOf(B, PLString);
	assertEquals(B.value, 'B');
});

Deno.test('spec: openstep-edge dict-spacing', async () => {
	const chars = 'ABCDEFG';
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'dict-spacing'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, chars.length);

	for (const char of chars) {
		const tag = `char: ${char}`;
		const s = plist.find(kp(char));
		assertInstanceOf(s, PLString, tag);
		assertEquals(s.value, char, tag);
	}
});

Deno.test('spec: openstep-edge escapes-octal', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'escapes-octal'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 4);

	const null0 = plist.find(kp('null-0'));
	assertInstanceOf(null0, PLString);
	assertEquals(null0.value, '\x000');

	const null8 = plist.find(kp('null-8'));
	assertInstanceOf(null8, PLString);
	assertEquals(null8.value, '\x008');

	const oct16 = plist.find(kp('oct16'));
	assertInstanceOf(oct16, PLString);
	assertEquals(oct16.value, '\x0E');

	const oct167 = plist.find(kp('oct16-7'));
	assertInstanceOf(oct167, PLString);
	assertEquals(oct167.value, '\x0E7');
});

Deno.test('spec: openstep-edge escapes-repeat', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'escapes-repeat'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLDict);

	for (const [k, v] of [...plist]) {
		const tag = k.value;
		assertInstanceOf(v, PLString, tag);

		const hex = k.value.split(' ')[1];
		const chr = JSON.parse(`"\\u${hex.padStart(4, '0')}"`);
		assertEquals(v.value, chr, tag);
	}
});

Deno.test('spec: openstep-edge escapes-all-octal', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'escapes-all-octal'),
		CF_STYLE,
	);
	const nsl = await fixtureNextStepLatin();
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLDict);

	for (const [k, v] of [...plist]) {
		const key = k.value;
		assertInstanceOf(v, PLString, key);

		const index = (+key[0] << 6 | +key[1] << 3 | +key[2]) & 0xFF;
		const str = String.fromCharCode(...(nsl.get(index) || []));
		assertEquals([v.value], [str], `${key} ${index}`);
	}
});

Deno.test('spec: openstep-edge escapes-single', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'escapes-single'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLDict);

	for (const [k, v] of plist) {
		const key = k.value;
		assertInstanceOf(v, PLString, key);

		let [value, hex] = key.split(' ');
		if (hex) {
			value = String.fromCharCode(parseInt(hex, 16));
		}
		assertEquals(v.value, value, key);
	}
});

Deno.test('spec: openstep-edge escapes-double', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'escapes-double'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLDict);

	for (const [k, v] of plist) {
		const key = k.value;
		assertInstanceOf(v, PLString, key);

		let [value, hex] = key.split(' ');
		if (hex) {
			value = String.fromCharCode(parseInt(hex, 16));
		}
		assertEquals(v.value, value, key);
	}
});

Deno.test('spec: openstep-edge escapes-unicode-partial', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'escapes-unicode-partial'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLDict);

	for (const [k, v] of plist) {
		const key = k.value;
		assertInstanceOf(v, PLString, key);

		let str = '';
		for (let [, hex] = key.split(' '); hex.length; hex = hex.slice(2)) {
			str += String.fromCharCode(parseInt(hex.slice(0, 2), 16));
		}
		assertEquals(v.value, str, key);
	}
});

Deno.test('spec: openstep-edge legacy-dict-opt-sc', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'legacy-dict-opt-sc'),
		{
			...CF_STYLE,
			allowMissingSemi: true,
		},
	);
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

Deno.test('spec: openstep-edge not-comment', async () => {
	const values = [
		'/',
		'A//',
		'A//B',
		'//',
		'//',
		'/*',
		'/*',
		'/* */',
		'/* */',
	];
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'not-comment'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, values.length);

	for (let i = 0; i < plist.length; i++) {
		const tag = `index: ${i}, value: ${values[i]}`;
		const str = plist.get(i);
		assertInstanceOf(str, PLString, tag);
		assertEquals(str.value, values[i], tag);
	}
});

Deno.test('spec: openstep-edge quotes', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'quotes'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLArray);
	assertEquals(plist.length, 2);

	const A = plist.get(0);
	assertInstanceOf(A, PLString);
	assertEquals(A.value, `_"_'_`);

	const B = plist.get(1);
	assertInstanceOf(B, PLString);
	assertEquals(B.value, `_"_'_`);
});

Deno.test('spec: openstep-edge shortcut', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'shortcut'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 5);

	const A = plist.findKey(kp('A'))!;
	assertNotStrictEquals(A, plist.get(A));

	const B = plist.findKey(kp('B'))!;
	assertStrictEquals(B, plist.get(B));

	const C = plist.findKey(kp('C'))!;
	assertNotStrictEquals(C, plist.get(C));

	const D = plist.findKey(kp('D'))!;
	assertNotStrictEquals(D, plist.get(D));

	const E = plist.findKey(kp('E'))!;
	assertStrictEquals(E, plist.get(E));
});

Deno.test('spec: openstep-edge string-junk-error', async () => {
	const data = await fixturePlist('openstep-edge', 'string-junk-error');
	assertThrows(
		() => decodeOpenStep(data, CF_STYLE),
		SyntaxError,
		'Invalid token on line 2',
	);
});

Deno.test('spec: openstep-edge string-multiline', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'string-multiline'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, 'Line 1\nLine 2\nLine 3\n');
});

Deno.test('spec: openstep-edge string-quoted-comments-block', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'string-quoted-comments-block'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, 'TEST');
});

Deno.test('spec: openstep-edge string-quoted-comments-line', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'string-quoted-comments-line'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, 'TEST');
});

Deno.test('spec: openstep-edge string-unquoted-comments-block', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'string-unquoted-comments-block'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, 'TEST');
});

Deno.test('spec: openstep-edge string-unquoted-comments-line', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'string-unquoted-comments-line'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, 'TEST');
});

Deno.test('spec: openstep-edge unescaped-ascii', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'unescaped-ascii'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLDict);

	for (let i = 0; i < 128; i++) {
		if (i === 92) {
			continue;
		}
		const char = String.fromCharCode(i);
		const tag = `char: ${i} (${JSON.stringify(char)})`;
		const v: PLType | undefined = plist.find(kp(char));
		assertInstanceOf(v, PLString, tag);
		assertEquals(v.value, `${i}`, tag);
	}
});

Deno.test('spec: openstep-edge unescaped-utf8', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'unescaped-utf8'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLDict);

	const divide = plist.find(kp('divide'));
	assertInstanceOf(divide, PLString);
	assertEquals(divide.value, '\u00f7');

	const ohm = plist.find(kp('ohm'));
	assertInstanceOf(ohm, PLString);
	assertEquals(ohm.value, '\u03a9');

	const check = plist.find(kp('check'));
	assertInstanceOf(check, PLString);
	assertEquals(check.value, '\u2705');

	const plus = plist.find(kp('plus'));
	assertInstanceOf(plus, PLString);
	assertEquals(plus.value, '\uff0b');

	const robot = plist.find(kp('robot'));
	assertInstanceOf(robot, PLString);
	assertEquals(robot.value, '\ud83e\udd16');
});

Deno.test('spec: openstep-edge unquotables', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'unquotables'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLDict);

	for (let i = 0; i < 256; i++) {
		const char = String.fromCharCode(i);
		const tag = `char: ${i} (${JSON.stringify(char)})`;
		if (unquoted(i)) {
			const v: PLType | undefined = plist.find(kp(char));
			assertInstanceOf(v, PLString, tag);
			assertEquals(v.value, char, tag);
		} else {
			assertStrictEquals(plist.find(kp(char)), undefined, tag);
		}
	}
});

Deno.test('spec: openstep-edge utf-8-bom', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('openstep-edge', 'utf-8-bom'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_OPENSTEP);
	assertInstanceOf(plist, PLString);
	assertEquals(plist.value, 'TEST');
});

Deno.test('spec: strings-edge comments', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('strings-edge', 'comments'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_STRINGS);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 2);

	const A = plist.find(kp('A'));
	assertInstanceOf(A, PLString);
	assertEquals(A.value, '1');

	const B = plist.find(kp('B'));
	assertInstanceOf(B, PLString);
	assertEquals(B.value, '2');
});

Deno.test('spec: strings-edge shortcut', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('strings-edge', 'shortcut'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_STRINGS);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 5);

	const A = plist.findKey(kp('A'))!;
	assertNotStrictEquals(A, plist.get(A));

	const B = plist.findKey(kp('B'))!;
	assertStrictEquals(B, plist.get(B));

	const C = plist.findKey(kp('C'))!;
	assertNotStrictEquals(C, plist.get(C));

	const D = plist.findKey(kp('D'))!;
	assertNotStrictEquals(D, plist.get(D));

	const E = plist.findKey(kp('E'))!;
	assertStrictEquals(E, plist.get(E));
});

Deno.test('spec: strings-edge junk-data', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('strings-edge', 'junk-null'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_STRINGS);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 2);

	const A = plist.find(kp('A'));
	assertInstanceOf(A, PLString);
	assertEquals(A.value, 'Alpha');

	const B = plist.find(kp('B'));
	assertInstanceOf(B, PLString);
	assertEquals(B.value, 'Beta');
});

Deno.test('spec: strings-edge junk-em', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('strings-edge', 'junk-em'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_STRINGS);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 2);

	const A = plist.find(kp('A'));
	assertInstanceOf(A, PLString);
	assertEquals(A.value, 'Alpha');

	const B = plist.find(kp('B'));
	assertInstanceOf(B, PLString);
	assertEquals(B.value, 'Beta');
});

Deno.test('spec: strings-edge junk-null', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('strings-edge', 'junk-null'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_STRINGS);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 2);

	const A = plist.find(kp('A'));
	assertInstanceOf(A, PLString);
	assertEquals(A.value, 'Alpha');

	const B = plist.find(kp('B'));
	assertInstanceOf(B, PLString);
	assertEquals(B.value, 'Beta');
});

Deno.test('spec: strings-edge legacy-dict-opt-sc', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('strings-edge', 'legacy-dict-opt-sc'),
		{
			...CF_STYLE,
			allowMissingSemi: true,
		},
	);
	assertEquals(format, FORMAT_STRINGS);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 2);

	const A = plist.find(kp('A'));
	assertInstanceOf(A, PLString);
	assertEquals(A.value, 'Alpha');

	const B = plist.find(kp('B'));
	assertInstanceOf(B, PLString);
	assertEquals(B.value, 'Beta');
});

Deno.test('spec: strings-edge legacy-junk', async () => {
	const { format, plist } = decodeOpenStep(
		await fixturePlist('strings-edge', 'legacy-junk'),
		{
			...CF_STYLE,
			allowMissingSemi: true,
		},
	);
	assertEquals(format, FORMAT_STRINGS);
	assertInstanceOf(plist, PLDict);
	assertEquals(plist.size, 2);

	const A = plist.find(kp('A'));
	assertInstanceOf(A, PLString);
	assertEquals(A.value, 'Alpha');

	const B = plist.find(kp('B'));
	assertInstanceOf(B, PLString);
	assertEquals(B.value, 'Beta');
});
