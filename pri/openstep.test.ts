import { assertEquals } from '@std/assert';
import { unquoted } from './openstep.ts';

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
