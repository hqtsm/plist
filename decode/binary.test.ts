import { assertEquals, assertInstanceOf } from '@std/assert';
import { PLBoolean } from '../boolean.ts';
import { FORMAT_BINARY_V1_0 } from '../format.ts';
import { fixturePlist } from '../spec/fixture.ts';
import { decodeBinary, type DecodeBinaryOptions } from './binary.ts';

const CF_STYLE = {} as const satisfies DecodeBinaryOptions;

Deno.test('spec: true', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('true', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLBoolean);
	assertEquals(plist.value, true);
});

Deno.test('spec: false', async () => {
	const { format, plist } = decodeBinary(
		await fixturePlist('false', 'binary'),
		CF_STYLE,
	);
	assertEquals(format, FORMAT_BINARY_V1_0);
	assertInstanceOf(plist, PLBoolean);
	assertEquals(plist.value, false);
});
