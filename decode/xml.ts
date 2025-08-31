import { PLDict } from '../dict.ts';
import { FORMAT_XML_V1_0 } from '../format.ts';
import { utf8Encoded, utf8ErrorXML } from '../pri/utf8.ts';
import type { PLType } from '../type.ts';

const rUTF8 = /^(X-MAC-)?UTF-8$/i;

/**
 * XML decoder.
 *
 * @param encoding Encoding.
 * @param data Data.
 * @returns Data converted to UTF-8 or null if unsupported.
 */
export type DecodeXmlDecoder = (
	encoding: string,
	data: Uint8Array,
) => Uint8Array | null;

/**
 * Decode XML plist options.
 */
export interface DecodeXmlOptions {
	/**
	 * Optonal decoder for converting to UTF-8.
	 */
	decoder?: DecodeXmlDecoder;

	/**
	 * Optional UTF-16 endian flag.
	 * Defaults to auto detect.
	 */
	utf16le?: boolean;
}

/**
 * Decode XML plist result.
 */
export interface DecodeXmlResult {
	/**
	 * Encoded format.
	 */
	format: typeof FORMAT_XML_V1_0;

	/**
	 * Decoded plist.
	 */
	plist: PLType;

	/**
	 * XML doctype.
	 */
	doctype?: string;

	/**
	 * Plist version.
	 */
	version?: string;
}

/**
 * Get XML encoding from XML header.
 *
 * @param d Data.
 * @returns Encoding.
 */
function xmlEncoding(d: Uint8Array): string {
	let i = 0, j, l, c;
	if (
		d[i++] === 60 &&
		d[i++] === 63 &&
		d[i++] === 120 &&
		d[i++] === 109 &&
		d[i++] === 108
	) {
		for (l = d.length; i < l;) {
			c = d[i++];
			if (c === 63 || c === 62) {
				break;
			}
			if (i + 9 > l) {
				throw new SyntaxError(utf8ErrorXML(d, 0));
			}
			if (
				c === 101 &&
				d[i++] === 110 &&
				d[i++] === 99 &&
				d[i++] === 111 &&
				d[i++] === 100 &&
				d[i++] === 105 &&
				d[i++] === 110 &&
				d[i++] === 103 &&
				d[i++] === 61
			) {
				c = d[i++];
				if (c === 39 || c === 34) {
					for (j = i; i < l; j++) {
						if (d[j] === c) {
							return String.fromCharCode(...d.subarray(i, j));
						}
					}
				}
				break;
			}
		}
	}
	return 'UTF-8';
}

/**
 * Decode OpenStep encoded plist.
 *
 * @param encoded OpenStep plist encoded data.
 * @param options Decoding options.
 * @returns Decoded plist.
 */
export function decodeXml(
	encoded: Uint8Array,
	{ decoder, utf16le }: DecodeXmlOptions = {},
): DecodeXmlResult {
	const format = FORMAT_XML_V1_0;
	let x;
	let d: Uint8Array | null | undefined = utf8Encoded(encoded, utf16le);
	if (
		!d &&
		!rUTF8.test(x = xmlEncoding(encoded)) &&
		!(d = decoder?.(x, encoded))
	) {
		throw new RangeError(`Unsupported encoding: ${x}`);
	}
	d ||= encoded;
	return { format, plist: new PLDict() };
}
