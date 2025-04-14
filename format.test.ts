import { assertEquals } from '@std/assert';
import * as FORMAT from './format.ts';

const regCFPLF = /^kCFPropertyList.*Format.*/;

Deno.test('format constants', () => {
	const keys = Object.keys(FORMAT).filter((s) => regCFPLF.test(s)).sort();
	assertEquals(keys, [
		'kCFPropertyListBinaryFormat_v1_0',
		'kCFPropertyListOpenStepFormat',
		'kCFPropertyListXMLFormat_v1_0',
	]);

	for (const key of keys) {
		assertEquals(
			typeof (FORMAT as { [key: string]: unknown })[key],
			'number',
			key,
		);
	}
});
