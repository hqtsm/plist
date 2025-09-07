import { assertEquals, assertLess } from '@std/assert';
import { b16d, b64d, b64e } from './base.ts';

const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

Deno.test('b16d', () => {
	for (let c = 0; c < 256; c++) {
		const s = String.fromCharCode(c);
		const tag = `${c}: ${JSON.stringify(s)}`;
		switch (s.toLowerCase()) {
			case '0': {
				assertEquals(b16d(c), 0, tag);
				break;
			}
			case '1': {
				assertEquals(b16d(c), 1, tag);
				break;
			}
			case '2': {
				assertEquals(b16d(c), 2, tag);
				break;
			}
			case '3': {
				assertEquals(b16d(c), 3, tag);
				break;
			}
			case '4': {
				assertEquals(b16d(c), 4, tag);
				break;
			}
			case '5': {
				assertEquals(b16d(c), 5, tag);
				break;
			}
			case '6': {
				assertEquals(b16d(c), 6, tag);
				break;
			}
			case '7': {
				assertEquals(b16d(c), 7, tag);
				break;
			}
			case '8': {
				assertEquals(b16d(c), 8, tag);
				break;
			}
			case '9': {
				assertEquals(b16d(c), 9, tag);
				break;
			}
			case 'a': {
				assertEquals(b16d(c), 10, tag);
				break;
			}
			case 'b': {
				assertEquals(b16d(c), 11, tag);
				break;
			}
			case 'c': {
				assertEquals(b16d(c), 12, tag);
				break;
			}
			case 'd': {
				assertEquals(b16d(c), 13, tag);
				break;
			}
			case 'e': {
				assertEquals(b16d(c), 14, tag);
				break;
			}
			case 'f': {
				assertEquals(b16d(c), 15, tag);
				break;
			}
			default: {
				assertEquals(b16d(c), -1, tag);
				break;
			}
		}
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
			assertLess(d, 0);
		} else {
			assertEquals(d, e);
		}
	}
});
