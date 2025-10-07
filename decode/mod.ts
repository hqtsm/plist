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
export interface DecodeOptions {
	/**
	 * Binary decoding options.
	 */
	binary?: DecodeBinaryOptions;

	/**
	 * XML decoding options.
	 */
	xml?: DecodeXmlOptions;

	/**
	 * OpenStep decoding options.
	 */
	openstep?: DecodeOpenStepOptions;
}

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
	{ binary, xml, openstep }: Readonly<DecodeOptions> = {},
): DecodeResult {
	let x, d;
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
			(d = !xml?.decoded && !openstep?.decoded &&
				(x = xml?.utf16le) === openstep?.utf16le &&
				(utf8Encoded(d, x)))
		) {
			encoded = d;
			xml = {
				int64: xml?.int64,
				decoded: true,
			};
		}
		try {
			return decodeXml(encoded, xml);
		} catch (err) {
			if (d) {
				openstep = {
					allowMissingSemi: openstep?.allowMissingSemi,
					decoded: true,
				};
			}
			try {
				return decodeOpenStep(encoded, openstep);
			} catch {
				throw err;
			}
		}
	}
	try {
		return decodeBinary(encoded, binary);
	} catch (err) {
		try {
			return decodeOpenStep(encoded, openstep);
		} catch {
			throw err;
		}
	}
}
