import { PLArray } from '../array.ts';
import { PLBoolean } from '../boolean.ts';
import { PLData } from '../data.ts';
import { PLDate } from '../date.ts';
import { PLDict } from '../dict.ts';
import { FORMAT_XML_V1_0 } from '../format.ts';
import { PLInteger } from '../integer.ts';
import { utf8Encoded, utf8ErrorEnd, utf8ErrorXML } from '../pri/utf8.ts';
import { PLReal } from '../real.ts';
import { PLString } from '../string.ts';
import type { PLType } from '../type.ts';

const rUTF8 = /^(x-mac-)?UTF-8$/i;

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
function xmlEncoding(d: Uint8Array): string | null {
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
				return null;
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
				return null;
			}
		}
		throw new SyntaxError(utf8ErrorEnd(d));
	}
	return null;
}

/**
 * Skip over whitespace characters.
 *
 * @param d Data.
 * @param i Offset.
 * @returns After offset.
 */
function skipWS(d: Uint8Array, i: number): number {
	for (let c; (c = d[i]) === 9 || c === 10 || c === 13 || c === 32; i++);
	return i;
}

/**
 * Skip over a comment.
 *
 * @param d Data.
 * @param i Offset.
 * @param l Length.
 * @returns After offset.
 */
function skipC(d: Uint8Array, i: number, l: number): number {
	for (let a, b, c; i < l;) {
		a = b;
		b = c;
		c = d[i++];
		if (c === 62 && b === 45 && a === 45) {
			return i;
		}
	}
	throw new SyntaxError(utf8ErrorEnd(d));
}

/**
 * Skip over processing instruction.
 *
 * @param d Data.
 * @param i Offset.
 * @param l Length.
 * @returns After offset.
 */
function skipPI(d: Uint8Array, i: number, l: number): number {
	for (let a, b; i < l;) {
		a = b;
		b = d[i++];
		if (b === 62 && a === 63) {
			return i;
		}
	}
	throw new SyntaxError(utf8ErrorEnd(d));
}

/**
 * Skip over DTD.
 *
 * @param d Data.
 * @param i Offset.
 * @param l Length.
 * @returns After offset.
 */
function skipDTD(
	d: Uint8Array,
	i: number,
	l: number,
): number {
	if (
		d[i] === 68 &&
		d[i + 1] === 79 &&
		d[i + 2] === 67 &&
		d[i + 3] === 84 &&
		d[i + 4] === 89 &&
		d[i + 5] === 80 &&
		d[i + 6] === 69
	) {
		for (i = skipWS(d, i + 7); i < l; i++) {
			const c = d[i];
			if (c === 62) {
				return i + 1;
			}
			if (c === 91) {
				// Inline DTD parsing is absent or broken in official parsers.
				throw new SyntaxError(utf8ErrorXML(d, i));
			}
		}
		throw new SyntaxError(utf8ErrorEnd(d));
	}
	throw new SyntaxError(utf8ErrorXML(d, i));
}

/**
 * Decode OpenStep encoded plist.
 *
 * @param encoded OpenStep plist encoded data.
 * @param options Decoding options.
 * @returns Decode result.
 */
export function decodeXml(
	encoded: Uint8Array,
	{ decoder, utf16le }: DecodeXmlOptions = {},
): DecodeXmlResult {
	let x;
	let d: Uint8Array | null | undefined = utf8Encoded(encoded, utf16le);
	if (
		!d &&
		(x = xmlEncoding(encoded)) !== null &&
		!rUTF8.test(x) &&
		!(d = decoder?.(x, encoded))
	) {
		throw new RangeError(`Unsupported encoding: ${x}`);
	}
	d ||= encoded;
	const l = d.length;
	let b;
	let c;
	let f;
	let i = 0;
	let p;
	let s;
	let t;
	for (;;) {
		c = d[i = skipWS(d, i)];
		if (c !== 60) {
			throw new SyntaxError(i < l ? utf8ErrorXML(d, i) : utf8ErrorEnd(d));
		}
		c = d[i + 1];
		if (c === 33) {
			i = d[i + 2] === 45 && d[i + 3] === 45
				? skipC(d, i + 4, l)
				: skipDTD(d, i + 2, l);
		} else if (c === 63) {
			i = skipPI(d, i + 2, l);
		} else {
			break;
		}
	}
	i++;
	do {
		if (c === 47) {
			throw new Error('TODO: XML closing tag');
		} else {
			for (f = s = -1, t = i; i < l && (b = d[i]) !== 60; f = b, i++) {
				if (s < 0 && (b === 32 || b === 9 || b === 10 || b === 13)) {
					s = i - t;
				}
			}
			if (i >= l) {
				throw new SyntaxError(utf8ErrorEnd(d));
			}
			f = f === 47;
			if (s < 0) {
				s = i - t - (f as unknown as number);
			}
			if ((p = !s)) {
				throw new SyntaxError(utf8ErrorXML(d, t));
			}
			i++;
			switch (c) {
				case 97: {
					if (
						d[t + 1] === 114 &&
						d[t + 2] === 114 &&
						d[t + 3] === 97 &&
						d[t + 4] === 121
					) {
						p = new PLArray();
					}
					break;
				}
				case 100: {
					c = d[t + 1];
					if (c === 105) {
						if (d[t + 2] === 99 && d[t + 3] === 116) {
							p = new PLDict();
						}
					} else if (c === 97 && d[t + 2] === 116) {
						if (d[t + 3] === 97) {
							p = new PLData();
						} else if (d[t + 3] === 101) {
							p = new PLDate();
						}
					}
					break;
				}
				case 102: {
					if (
						d[t + 1] === 97 &&
						d[t + 2] === 108 &&
						d[t + 3] === 115 &&
						d[t + 4] === 101
					) {
						p = new PLBoolean();
					}
					break;
				}
				case 105: {
					if (
						d[t + 1] === 110 &&
						d[t + 2] === 116 &&
						d[t + 3] === 101 &&
						d[t + 4] === 103 &&
						d[t + 5] === 101
					) {
						p = new PLInteger();
					}
					break;
				}
				case 107: {
					if (d[t + 1] === 101 && d[t + 2] === 121) {
						p = new PLString();
					}
					break;
				}
				case 112: {
					if (
						d[t + 1] === 108 &&
						d[t + 2] === 105 &&
						d[t + 3] === 115 &&
						d[t + 4] === 116
					) {
						p = [null];
					}
					break;
				}
				case 114: {
					if (
						d[t + 1] === 101 &&
						d[t + 2] === 97 &&
						d[t + 3] === 108
					) {
						p = new PLReal();
					}
					break;
				}
				case 115: {
					if (
						d[t + 1] === 116 &&
						d[t + 2] === 114 &&
						d[t + 3] === 105 &&
						d[t + 4] === 110 &&
						d[t + 5] === 103
					) {
						p = new PLString();
					}
					break;
				}
				case 116: {
					if (
						d[t + 1] === 114 &&
						d[t + 2] === 117 &&
						d[t + 3] === 101
					) {
						p = new PLBoolean(true);
					}
					break;
				}
			}
			if (!p) {
				throw new SyntaxError(utf8ErrorXML(d, t));
			}
		}
	} while (false);
	return { format: FORMAT_XML_V1_0, plist: new PLDict() };
}
