import {
	assertEquals,
	assertNotStrictEquals,
	assertStrictEquals,
} from '@std/assert';
import { bytes } from './data.ts';

Deno.test('bytes', () => {
	const ab = new ArrayBuffer(10);
	{
		const b = bytes(ab);
		assertStrictEquals(b.buffer, ab);
		assertEquals(b.byteOffset, 0);
		assertEquals(b.byteLength, ab.byteLength);
	}
	{
		const a = new Uint8Array(ab);
		const b = bytes(a);
		assertStrictEquals(b.buffer, ab);
		assertEquals(b.byteOffset, 0);
		assertEquals(b.byteLength, ab.byteLength);
		assertNotStrictEquals(b, a);
	}
	{
		const a = new Uint8Array(ab, 2, 6);
		const b = bytes(a);
		assertStrictEquals(b.buffer, ab);
		assertEquals(b.byteOffset, 2);
		assertEquals(b.byteLength, 6);
	}
});
