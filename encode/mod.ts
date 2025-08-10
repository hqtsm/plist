/**
 * @module
 *
 * Plist encoding.
 */

export * from './openstep.ts';
export * from './xml.ts';
export * from './binary.ts';

import {
	type Format,
	FORMAT_BINARY_V1_0,
	FORMAT_OPENSTEP,
	FORMAT_STRINGS,
	FORMAT_XML_V1_0,
} from '../format.ts';
import type { PLType } from '../type.ts';
import { encodeOpenStep, type EncodeOpenStepOptions } from './openstep.ts';
import { encodeXml, type EncodeXmlOptions } from './xml.ts';
import { encodeBinary, type EncodeBinaryOptions } from './binary.ts';

/**
 * Encoding options.
 */
export type EncodeOptions =
	& (EncodeBinaryOptions | EncodeXmlOptions | EncodeOpenStepOptions)
	& {
		format: Format;
	};

/**
 * Encode plist.
 *
 * @param plist Plist object.
 * @param options Encoding options.
 * @returns Encoded plist.
 */
export function encode(plist: PLType, options: EncodeOptions): Uint8Array {
	switch (options.format) {
		case FORMAT_BINARY_V1_0: {
			return encodeBinary(plist, options);
		}
		case FORMAT_XML_V1_0: {
			return encodeXml(plist, options);
		}
		case FORMAT_OPENSTEP:
		case FORMAT_STRINGS: {
			return encodeOpenStep(plist, options);
		}
		default: {
			throw new RangeError('Invalid format');
		}
	}
}
