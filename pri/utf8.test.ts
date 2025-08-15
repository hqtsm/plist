import { assertEquals } from '@std/assert';
import { utf8Encode, utf8Length } from './utf8.ts';

Deno.test('utf8Length', () => {
	const te = new TextEncoder();
	for (
		const s of [
			'',
			'A',
			'AB',
			'ABC',
			'\u2013',
			'\u00f7',
			'\u03a9',
			'\u2705',
			'\uff0b',
			'\ud83e\udd16',
		]
	) {
		const l = te.encode(s).length;
		assertEquals(utf8Length(s), l, JSON.stringify(s));
		assertEquals(utf8Length(`${s}${s}`), l + l, JSON.stringify(`${s}${s}`));
	}
	assertEquals(utf8Length('\ud83e'), 0);
	assertEquals(utf8Length('\ud83e\ud83e'), 0);
	assertEquals(utf8Length('\ud83eA'), 1);
	assertEquals(utf8Length('\ud83e\ud83eA'), 1);
});

Deno.test('utf8Encode', () => {
	const te = new TextEncoder();
	for (
		const s of [
			'',
			'A',
			'AB',
			'ABC',
			'\u2013',
			'\u00f7',
			'\u03a9',
			'\u2705',
			'\uff0b',
			'\ud83e\udd16',
		]
	) {
		const a1 = te.encode(s);
		const a2 = new Uint8Array(a1.length);
		assertEquals(utf8Encode(s, a2, 0), a1.length);
		assertEquals(a1, a2, JSON.stringify(s));
		const b1 = te.encode(`${s}${s}`);
		const b2 = new Uint8Array(b1.length);
		assertEquals(utf8Encode(`${s}${s}`, b2, 0), b1.length);
		assertEquals(b1, b2, JSON.stringify(`${s}${s}`));
	}
	const a = new Uint8Array(1);
	assertEquals(utf8Encode('\ud83e', a, 0), 0);
	assertEquals(utf8Encode('\ud83e\ud83e', a, 0), 0);
	assertEquals(utf8Encode('\ud83eA', a, 0), 1);
	assertEquals(a[0], 'A'.charCodeAt(0));
	a[0] = 0;
	assertEquals(utf8Encode('\ud83e\ud83eA', a, 0), 1);
	assertEquals(a[0], 'A'.charCodeAt(0));
});
