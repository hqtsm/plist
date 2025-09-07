import { assertEquals, assertLess } from '@std/assert';
import { b16d, b64d, b64e } from './base.ts';

const hex = '0123456789abcdef';
const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

Deno.test('b16d', () => {
	for (let c = 0; c < 256; c++) {
		const s = String.fromCharCode(c);
		const tag = `${c}: ${JSON.stringify(s)}`;
		const e = hex.indexOf(s.toLowerCase());
		assertEquals(b16d(c), e, tag);
	}
});

Deno.test('b64e', () => {
	for (let i = 0; i < 64; i++) {
		const e = b64.charCodeAt(i);
		assertEquals(b64e[i] + i - 19, e, `${i}`);
	}
});

Deno.test('b64d', () => {
	const expected = new Array(256).fill(-1);
	for (let i = 0; i < 64; i++) {
		expected[b64.charCodeAt(i)] = i;
	}
	for (let i = 0; i < 256; i++) {
		const e = expected[i];
		const d = i > 42 && i < 123 ? b64d[i - 43] + i - 80 : -1;
		if (e < 0) {
			assertLess(d, 0, `${i}`);
		} else {
			assertEquals(d, e, `${i}`);
		}
	}
});
