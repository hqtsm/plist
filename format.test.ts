import { assertEquals } from '@std/assert';
import * as FORMAT from './format.ts';

Deno.test('format constants', () => {
	const keys = Object.keys(FORMAT).filter((s) => s.startsWith('FORMAT_'));

	assertEquals(
		keys.sort(),
		[
			'FORMAT_OPEN_STEP',
			'FORMAT_XML_V1_0',
			'FORMAT_BINARY_V1_0',
		].sort(),
	);

	for (const key of keys) {
		assertEquals(
			typeof (FORMAT as { [key: string]: unknown })[key],
			'number',
			key,
		);
	}
});
