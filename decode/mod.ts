/**
 * @module
 *
 * Plist decoding.
 */

export * from './binary.ts';
export * from './openstep.ts';
export * from './xml.ts';

import type { Format } from '../format.ts';
import { bytes } from '../pri/data.ts';
import { utf8Encoded } from '../pri/utf8.ts';
import type { PLType } from '../type.ts';
import { decodeBinary, type DecodeBinaryOptions } from './binary.ts';
import { decodeOpenStep, type DecodeOpenStepOptions } from './openstep.ts';
import { decodeXml, type DecodeXmlOptions } from './xml.ts';

/**
 * Decoding options.
 */
export type DecodeOptions =
	& DecodeBinaryOptions
	& DecodeOpenStepOptions
	& DecodeXmlOptions;

/**
 * Decode plist result.
 */
export interface DecodeResult {
	/**
	 * Encoded format.
	 */
	format: Format;

	/**
	 * Decoded plist.
	 */
	plist: PLType;
}

/**
 * Decode plist.
 *
 * @param encoded Encoded plist.
 * @param options Decoding options.
 * @returns Decoded plist and format.
 */
export function decode(
	encoded: ArrayBufferView | ArrayBuffer,
	options: Readonly<DecodeOptions> = {},
): DecodeResult {
	let d;
	d = bytes(encoded);
	if (
		d.length < 8 ||
		d[0] !== 98 ||
		d[1] !== 112 ||
		d[2] !== 108 ||
		d[3] !== 105 ||
		d[4] !== 115 ||
		d[5] !== 116 ||
		d[6] !== 48
	) {
		if (
			!options.decoded &&
			(d = utf8Encoded(d, options.utf16le))
		) {
			options = {
				int64: options.int64,
				allowMissingSemi: options.allowMissingSemi,
				decoded: true,
			};
			encoded = d;
		}
		d = decodeXml;
	} else {
		d = decodeBinary;
	}
	try {
		return d(encoded, options);
	} catch (err) {
		try {
			return decodeOpenStep(encoded, options);
		} catch {
			throw err;
		}
	}
}
