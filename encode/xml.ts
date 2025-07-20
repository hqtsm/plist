/**
 * @module
 *
 * XML encoding.
 */

import { PLArray } from '../array.ts';
import { PLBoolean } from '../boolean.ts';
import { PLData } from '../data.ts';
import { PLDate } from '../date.ts';
import { PLDict } from '../dict.ts';
import { FORMAT_XML_V1_0 } from '../format.ts';
import { PLInteger } from '../integer.ts';
import { PLReal } from '../real.ts';
import { PLString } from '../string.ts';
import type { PLType } from '../type.ts';
import { PLUID } from '../uid.ts';

const close = Symbol();
const rIndent = /^[\t ]*$/;
const rDateY4 = /^(-)0*(\d{3}-)|\+?0*(\d{4,}-)/;
const rRealTrim = /\.?0+$/;
const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Public doctype 1.0.
 */
export const XML_DOCTYPE_PUBLIC_V1_0 =
	'<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">';

/**
 * System doctype.
 * Known to pair with version '0.9'.
 */
export const XML_DOCTYPE_SYSTEM =
	'<!DOCTYPE plist SYSTEM "file://localhost/System/Library/DTDs/PropertyList.dtd">';

/**
 * XML version 1.0.
 */
export const XML_VERSION_V1_0 = '1.0';

/**
 * Calculate string encode size.
 *
 * @param str String.
 * @param encode XML encode (0: none, 1: text, 2: attr).
 * @returns Size.
 */
function stringLength(str: string, encode: 0 | 1 | 2 = 0): number {
	let len = 0;
	for (let l = str.length, i = 0, hi = 0, chr; i < l;) {
		if ((chr = str.charCodeAt(i++)) < 128) {
			len++;
			if (encode) {
				if (chr === 38) {
					len += 4;
				} else if (chr === 60 || chr === 62) {
					len += 3;
				} else if (encode === 2 && chr === 34) {
					len += 5;
				}
			}
			hi = 0;
		} else if (chr < 2048) {
			len += 2;
			hi = 0;
		} else if (chr > 55295) {
			if (chr < 57344) {
				if (chr < 56320) {
					hi = 4;
				} else {
					len += hi;
					hi = 0;
				}
			} else {
				len += 3;
				hi = 0;
			}
		} else {
			len += 3;
			hi = 0;
		}
	}
	return len;
}

/**
 * Encode string into buffer.
 *
 * @param str String.
 * @param dest Buffer.
 * @param start Offset.
 * @param encode XML encode (0: none, 1: text, 2: attr).
 * @returns End.
 */
function stringEncode(
	str: string,
	dest: Uint8Array,
	start: number,
	encode: 0 | 1 | 2 = 0,
): number {
	for (let l = str.length, i = 0, hi = 0, chr; i < l;) {
		if ((chr = str.charCodeAt(i++)) < 128) {
			if (encode) {
				if (chr === 38) {
					dest[start++] = 38;
					dest[start++] = 97;
					dest[start++] = 109;
					dest[start++] = 112;
					dest[start++] = 59;
				} else if (chr === 60) {
					dest[start++] = 38;
					dest[start++] = 108;
					dest[start++] = 116;
					dest[start++] = 59;
				} else if (chr === 62) {
					dest[start++] = 38;
					dest[start++] = 103;
					dest[start++] = 116;
					dest[start++] = 59;
				} else if (encode === 2 && chr === 34) {
					dest[start++] = 38;
					dest[start++] = 113;
					dest[start++] = 117;
					dest[start++] = 111;
					dest[start++] = 116;
					dest[start++] = 59;
				} else {
					dest[start++] = chr;
				}
			} else {
				dest[start++] = chr;
			}
			hi = 0;
		} else if (chr < 2048) {
			dest[start++] = 192 | (chr >> 6);
			dest[start++] = 128 | (chr & 63);
			hi = 0;
		} else if (chr > 55295) {
			if (chr < 57344) {
				if (chr < 56320) {
					hi = chr;
				} else if (hi) {
					chr += ((hi - 55296) << 10) + 9216;
					dest[start++] = 240 | (chr >> 18);
					dest[start++] = 128 | ((chr >> 12) & 63);
					dest[start++] = 128 | ((chr >> 6) & 63);
					dest[start++] = 128 | (chr & 63);
					hi = 0;
				}
			} else {
				dest[start++] = 224 | (chr >> 12);
				dest[start++] = 128 | ((chr >> 6) & 63);
				dest[start++] = 128 | (chr & 63);
				hi = 0;
			}
		} else {
			dest[start++] = 224 | (chr >> 12);
			dest[start++] = 128 | ((chr >> 6) & 63);
			dest[start++] = 128 | (chr & 63);
			hi = 0;
		}
	}
	return start;
}

/**
 * Encode real to string.
 *
 * @param real Real value.
 * @returns Real string.
 */
function realString(real: number): string {
	// No trailing zeros except on 0, negative 0 drops sign.
	switch (real) {
		case 0:
			return '0.0';
		case Infinity:
			return '+infinity';
		case -Infinity:
			return '-infinity';
	}
	// deno-lint-ignore no-self-compare
	return real === real ? real.toPrecision(17).replace(rRealTrim, '') : 'nan';
}

/**
 * Convert date to string.
 *
 * @param date Date.
 * @returns Date string.
 */
function dateString(date: PLDate): string {
	// No decimal seconds, 4+ characters for year, no leading plus.
	return `${date.toISOString().slice(0, -5).replace(rDateY4, '$1$2$3')}Z`;
}

/**
 * Encoding options for XML.
 */
export interface EncodeXmlOptions {
	/**
	 * Encoding format.
	 *
	 * @default FORMAT_XML_V1_0
	 */
	format?: typeof FORMAT_XML_V1_0;

	/**
	 * Indentation characters.
	 *
	 * @default '\t'
	 */
	indent?: string;

	/**
	 * XML doctype.
	 *
	 * @default string Matches format.
	 */
	doctype?: string;

	/**
	 * Plist version attribute value.
	 *
	 * @default string Matches format.
	 */
	version?: string;
}

/**
 * Encode plist, XML format.
 *
 * @param plist Plist object.
 * @param options Encoding options.
 * @returns Encoded plist.
 */
export function encodeXml(
	plist: PLType,
	{
		format = FORMAT_XML_V1_0,
		indent = '\t',
		doctype,
		version,
	}: EncodeXmlOptions = {},
): Uint8Array {
	let depth = 0;
	let size = 68;
	let i = 0;
	let l = 1;
	let e;
	let x;
	let r;
	let inDict;

	switch (format) {
		case FORMAT_XML_V1_0: {
			doctype ??= XML_DOCTYPE_PUBLIC_V1_0;
			version ??= XML_VERSION_V1_0;
			break;
		}
		default: {
			throw new RangeError('Invalid format');
		}
	}

	if (!rIndent.test(indent)) {
		throw new RangeError('Invalid indent');
	}

	if (doctype) {
		size += stringLength(doctype) + 1;
	}
	size += stringLength(version, 2);

	const q: (PLType | typeof close)[] = [plist];
	const ancestors = new Set<PLType>();
	const stack: (PLArray | PLDict)[] = [];
	const indentSize = x = indent.length;
	const indentData = new Uint8Array(indentSize);
	while (x--) {
		indentData[x] = indent.charCodeAt(x);
	}

	do {
		e = q[i++];

		if (e === close) {
			ancestors.delete(stack[depth--]);
		} else if (PLString.is(e)) {
			size += 17 + stringLength(e.value, 1);
		} else if (PLInteger.is(e)) {
			size += 19 + e.value.toString().length;
		} else if (PLReal.is(e)) {
			size += 13 + realString(e.value).length;
		} else if (PLBoolean.is(e)) {
			size += e.value ? 7 : 8;
		} else if (PLDate.is(e)) {
			size += 13 + dateString(e).length;
		} else if (PLData.is(e)) {
			x = e.byteLength;
			x = ((x - (x % 3 || 3)) / 3 + 1) * 4;
			size += 13 + x +
				(depth * indentSize + 1) * ((x - (x % 76 || 76)) / 76 + 2);
		} else if (PLUID.is(e)) {
			size += e.value.toString().length + 52 +
				(depth + 1) * indentSize * 2 + depth * indentSize;
		} else if (PLDict.is(e)) {
			if ((x = e.size)) {
				if (ancestors.has(e)) {
					throw new TypeError('Circular reference');
				}
				size += 14 + depth++ * indentSize +
					((depth * indentSize + 1) * 2 - 6) * x;
				ancestors.add(stack[depth] = e);
				q.length = l += x += x + 1;
				q.copyWithin(i + x, x = i);
				for (r of e) {
					q[x++] = r[0];
					q[x++] = r[1];
				}
				q[x] = close;
			} else {
				size += 7;
			}
		} else if (PLArray.is(e)) {
			if ((x = e.length)) {
				if (ancestors.has(e)) {
					throw new TypeError('Circular reference');
				}
				size += 16 + depth++ * indentSize +
					(depth * indentSize + 1) * x++;
				ancestors.add(stack[depth] = e);
				q.length = l += x;
				q.copyWithin(i + x, x = i);
				for (r of e) {
					q[x++] = r;
				}
				q[x] = close;
			} else {
				size += 8;
			}
		} else {
			throw new TypeError('Invalid XML value type');
		}
	} while (i < l);

	r = new Uint8Array(size);
	size = stringEncode(xmlHeader, r, i = 0);
	r[size++] = 10;
	size = stringEncode(doctype, r, size);
	r[size++] = 10;
	size = stringEncode('<plist version="', r, size);
	size = stringEncode(version, r, size, 2);
	size = stringEncode('">', r, size);
	r[size++] = 10;

	while (i < l) {
		e = q[i++];

		if (e === close) {
			for (x = --depth; x--;) {
				r.set(indentData, size);
				size += indentSize;
			}
			size = stringEncode(inDict ? '</dict>' : '</array>', r, size);
			inDict = PLDict.is(stack[depth]);
		} else {
			for (x = depth; x--;) {
				r.set(indentData, size);
				size += indentSize;
			}
			if (inDict) {
				size = stringEncode('<key>', r, size);
				size = stringEncode((e as PLString).value, r, size, 1);
				size = stringEncode('</key>', r, size);
				r[size++] = 10;
				for (x = depth; x--;) {
					r.set(indentData, size);
					size += indentSize;
				}
				e = q[i++] as PLType;
			}
			if (PLString.is(e)) {
				size = stringEncode('<string>', r, size);
				size = stringEncode(e.value, r, size, 1);
				size = stringEncode('</string>', r, size);
			} else if (PLInteger.is(e)) {
				size = stringEncode('<integer>', r, size);
				size = stringEncode(e.value.toString(), r, size);
				size = stringEncode('</integer>', r, size);
			} else if (PLReal.is(e)) {
				size = stringEncode('<real>', r, size);
				size = stringEncode(realString(e.value), r, size);
				size = stringEncode('</real>', r, size);
			} else if (PLBoolean.is(e)) {
				size = stringEncode(e.value ? '<true/>' : '<false/>', r, size);
			} else if (PLDate.is(e)) {
				size = stringEncode('<date>', r, size);
				size = stringEncode(dateString(e), r, size);
				size = stringEncode('</date>', r, size);
			} else if (PLData.is(e)) {
				size = stringEncode('<data>', r, size);
				r[size++] = 10;
				for (
					let d = new Uint8Array(e.buffer),
						l = d.length,
						l3 = l - (l % 3),
						i = 0;
					i < l;
				) {
					for (x = depth; x--;) {
						r.set(indentData, size);
						size += indentSize;
					}
					for (x = 20; i < l3 && --x;) {
						e = d[i++];
						r[size++] = b64.charCodeAt(e >> 2);
						e = e << 8 | d[i++];
						r[size++] = b64.charCodeAt(e >> 4 & 63);
						e = e << 8 | d[i++];
						r[size++] = b64.charCodeAt(e >> 6 & 63);
						r[size++] = b64.charCodeAt(e & 63);
					}
					if (x && i < l) {
						e = d[i++];
						r[size++] = b64.charCodeAt(e >> 2);
						if (i < l) {
							e = e << 8 | d[i++];
							r[size++] = b64.charCodeAt(e >> 4 & 63);
							r[size++] = b64.charCodeAt(e << 2 & 63);
						} else {
							r[size++] = b64.charCodeAt(e << 4 & 63);
							r[size++] = 61;
						}
						r[size++] = 61;
					}
					r[size++] = 10;
				}
				for (x = depth; x--;) {
					r.set(indentData, size);
					size += indentSize;
				}
				size = stringEncode('</data>', r, size);
			} else if (PLUID.is(e)) {
				size = stringEncode('<dict>', r, size);
				r[size++] = 10;
				for (x = depth + 1; x--;) {
					r.set(indentData, size);
					size += indentSize;
				}
				size = stringEncode('<key>CF$UID</key>', r, size);
				r[size++] = 10;
				for (x = depth + 1; x--;) {
					r.set(indentData, size);
					size += indentSize;
				}
				size = stringEncode('<integer>', r, size);
				size = stringEncode(e.value.toString(), r, size);
				size = stringEncode('</integer>', r, size);
				r[size++] = 10;
				for (x = depth; x--;) {
					r.set(indentData, size);
					size += indentSize;
				}
				size = stringEncode('</dict>', r, size);
			} else if (PLDict.is(e)) {
				if (e.size) {
					stack[depth++] = e;
					size = stringEncode('<dict>', r, size);
					inDict = true;
				} else {
					size = stringEncode('<dict/>', r, size);
				}
			} else {
				if (e.length) {
					stack[depth++] = e;
					size = stringEncode('<array>', r, size);
					inDict = false;
				} else {
					size = stringEncode('<array/>', r, size);
				}
			}
		}
		r[size++] = 10;
	}

	size = stringEncode('</plist>', r, size);
	r[size] = 10;
	return r;
}
