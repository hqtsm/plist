/**
 * @module
 *
 * XML encoding.
 */

import type { PLDate } from '../date.ts';
import { FORMAT_XML_V1_0 } from '../format.ts';
import type { PLType } from '../type.ts';
import { walk } from '../walk.ts';

const rIndent = /^[\t ]*$/;
const rDateY4 = /^(-)0*(\d{3}-)|\+?0*(\d{4,}-)/;
const rRealTrim = /\.?0+$/;
const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Public doctype 1.0.
 */
export const XML_DOCPLTYPE_PUBLIC_V1_0 =
	'<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">';

/**
 * System doctype.
 * Known to pair with version '0.9'.
 */
export const XML_DOCPLTYPE_SYSTEM =
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
	let i = 68;
	let e;
	let x;

	switch (format) {
		case FORMAT_XML_V1_0: {
			doctype ??= XML_DOCPLTYPE_PUBLIC_V1_0;
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
		i += stringLength(doctype) + 1;
	}
	i += stringLength(version, 2);

	const a = new Set<PLType>();
	const il = x = indent.length;
	const id = new Uint8Array(il);
	while (x--) {
		id[x] = indent.charCodeAt(x);
	}

	walk(plist, {
		enter: {
			PLArray(v, d): number | void {
				if ((x = v.length)) {
					if (a.has(v)) {
						throw new TypeError('Circular reference');
					}
					a.add(v);
					i += 16 + d++ * il + (d * il + 1) * x;
					return;
				}
				i += 8;
				return 1;
			},
			PLDict(v, d): number | void {
				if ((x = v.size)) {
					if (a.has(v)) {
						throw new TypeError('Circular reference');
					}
					a.add(v);
					i += 14 + d++ * il + (d * il + 1) * 2 * x;
					return;
				}
				i += 7;
				return 1;
			},
		},
		key: {
			PLDict(v): void {
				i += 11 + stringLength(v.value, 1);
			},
		},
		value: {
			PLBoolean(v): void {
				i += v.value ? 7 : 8;
			},
			PLData(v, d): void {
				x = v.byteLength;
				x = ((x - (x % 3 || 3)) / 3 + 1) * 4;
				i += 13 + x + (d * il + 1) * ((x - (x % 76 || 76)) / 76 + 2);
			},
			PLDate(v): void {
				i += 13 + dateString(v).length;
			},
			PLInteger(v): void {
				i += 19 + v.value.toString().length;
			},
			PLReal(v): void {
				i += 13 + realString(v.value).length;
			},
			PLString(v): void {
				i += 17 + stringLength(v.value, 1);
			},
			PLUID(v, d): void {
				i += 52 + v.value.toString().length + d++ * il + d * il * 2;
			},
			default(): void {
				throw new TypeError('Invalid XML value type');
			},
		},
		leave: {
			default(v): void {
				a.delete(v);
			},
		},
	});

	const r = new Uint8Array(i);
	i = stringEncode(xmlHeader, r, 0);
	r[i++] = 10;
	i = stringEncode(doctype, r, i);
	r[i++] = 10;
	i = stringEncode('<plist version="', r, i);
	i = stringEncode(version, r, i, 2);
	i = stringEncode('">', r, i);
	r[i++] = 10;

	walk(plist, {
		enter: {
			PLArray(v, d): number | void {
				for (; d--; i += il) {
					r.set(id, i);
				}
				if (v.length) {
					i = stringEncode('<array>', r, i);
					r[i++] = 10;
					return;
				}
				i = stringEncode('<array/>', r, i);
				r[i++] = 10;
				return 1;
			},
			PLDict(v, d): number | void {
				for (; d--; i += il) {
					r.set(id, i);
				}
				if (v.size) {
					i = stringEncode('<dict>', r, i);
					r[i++] = 10;
					return;
				}
				i = stringEncode('<dict/>', r, i);
				r[i++] = 10;
				return 1;
			},
		},
		key: {
			PLDict(v, d): void {
				for (; d--; i += il) {
					r.set(id, i);
				}
				i = stringEncode('<key>', r, i);
				i = stringEncode(v.value, r, i, 1);
				i = stringEncode('</key>', r, i);
				r[i++] = 10;
			},
		},
		value: {
			PLBoolean(v, d): void {
				for (; d--; i += il) {
					r.set(id, i);
				}
				i = stringEncode(v.value ? '<true/>' : '<false/>', r, i);
				r[i++] = 10;
			},
			PLData(v, d): void {
				for (x = d; x--; i += il) {
					r.set(id, i);
				}
				i = stringEncode('<data>', r, i);
				r[i++] = 10;
				for (
					let u = new Uint8Array(v.buffer),
						l = u.length,
						l3 = l - (l % 3),
						b = 0;
					b < l;
				) {
					for (x = d; x--; i += il) {
						r.set(id, i);
					}
					for (x = 20; b < l3 && --x;) {
						e = u[b++];
						r[i++] = b64.charCodeAt(e >> 2);
						e = e << 8 | u[b++];
						r[i++] = b64.charCodeAt(e >> 4 & 63);
						e = e << 8 | u[b++];
						r[i++] = b64.charCodeAt(e >> 6 & 63);
						r[i++] = b64.charCodeAt(e & 63);
					}
					if (x && b < l) {
						e = u[b++];
						r[i++] = b64.charCodeAt(e >> 2);
						if (b < l) {
							e = e << 8 | u[b++];
							r[i++] = b64.charCodeAt(e >> 4 & 63);
							r[i++] = b64.charCodeAt(e << 2 & 63);
						} else {
							r[i++] = b64.charCodeAt(e << 4 & 63);
							r[i++] = 61;
						}
						r[i++] = 61;
					}
					r[i++] = 10;
				}
				for (; d--; i += il) {
					r.set(id, i);
				}
				i = stringEncode('</data>', r, i);
				r[i++] = 10;
			},
			PLDate(v, d): void {
				for (; d--; i += il) {
					r.set(id, i);
				}
				i = stringEncode('<date>', r, i);
				i = stringEncode(dateString(v), r, i);
				i = stringEncode('</date>', r, i);
				r[i++] = 10;
			},
			PLInteger(v, d): void {
				for (; d--; i += il) {
					r.set(id, i);
				}
				i = stringEncode('<integer>', r, i);
				i = stringEncode(v.value.toString(), r, i);
				i = stringEncode('</integer>', r, i);
				r[i++] = 10;
			},
			PLReal(v, d): void {
				for (; d--; i += il) {
					r.set(id, i);
				}
				i = stringEncode('<real>', r, i);
				i = stringEncode(realString(v.value), r, i);
				i = stringEncode('</real>', r, i);
				r[i++] = 10;
			},
			PLString(v, d): void {
				for (; d--; i += il) {
					r.set(id, i);
				}
				i = stringEncode('<string>', r, i);
				i = stringEncode(v.value, r, i, 1);
				i = stringEncode('</string>', r, i);
				r[i++] = 10;
			},
			PLUID(v, d): void {
				for (x = d++; x--; i += il) {
					r.set(id, i);
				}
				i = stringEncode('<dict>', r, i);
				r[i++] = 10;
				for (x = d; x--; i += il) {
					r.set(id, i);
				}
				i = stringEncode('<key>CF$UID</key>', r, i);
				r[i++] = 10;
				for (x = d--; x--; i += il) {
					r.set(id, i);
				}
				i = stringEncode('<integer>', r, i);
				i = stringEncode(v.value.toString(), r, i);
				i = stringEncode('</integer>', r, i);
				r[i++] = 10;
				for (; d--; i += il) {
					r.set(id, i);
				}
				i = stringEncode('</dict>', r, i);
				r[i++] = 10;
			},
		},
		leave: {
			PLArray(_, d): void {
				for (; d--; i += il) {
					r.set(id, i);
				}
				i = stringEncode('</array>', r, i);
				r[i++] = 10;
			},
			PLDict(_, d): void {
				for (; d--; i += il) {
					r.set(id, i);
				}
				i = stringEncode('</dict>', r, i);
				r[i++] = 10;
			},
		},
	});

	i = stringEncode('</plist>', r, i);
	r[i] = 10;
	return r;
}
