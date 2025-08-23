import { assertEquals, assertFalse } from '@std/assert';
import { esc, unesc, unquoted } from './openstep.ts';

const escapes: Record<string, string> = {
	a: '\x07',
	b: '\b',
	f: '\f',
	n: '\n',
	r: '\r',
	t: '\t',
	v: '\v',
};

Deno.test('esc + unesc', () => {
	for (const c of esc) {
		assertFalse(unesc.includes(c), JSON.stringify(c));
	}
	for (const c of unesc) {
		assertFalse(esc.includes(c), JSON.stringify(c));
	}
	for (let i = 0; i < unesc.length; i++) {
		const c = unesc[i];
		const literal = String.fromCharCode(i + 'a'.charCodeAt(0));
		if (esc.includes(literal)) {
			assertEquals(c, escapes[literal], JSON.stringify(c));
		} else {
			assertEquals(c, literal, JSON.stringify(c));
		}
	}
});

Deno.test('unquoted', () => {
	const expected = new Set(
		[
			'abcdefghijklmnopqrstuvwxyz',
			'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
			'0123456789',
			':_$/.-',
		].join('').split('').map((s) => s.charCodeAt(0)),
	);
	for (let i = 0; i <= 0xffff; i++) {
		const c = String.fromCharCode(i);
		assertEquals(
			unquoted(i),
			expected.has(i),
			`${i}: ${JSON.stringify(c)}`,
		);
	}
});
