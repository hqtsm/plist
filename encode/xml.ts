/**
 * @module
 *
 * XML encoding.
 */

import type { PLDate } from '../date.ts';
import { utf8Encode, utf8Size } from '../pri/utf8.ts';
import { FORMAT_XML_V0_9, FORMAT_XML_V1_0 } from '../format.ts';
import { b64e } from '../pri/base.ts';
import type { PLType } from '../type.ts';
import { walk } from '../walk.ts';

const rIndent = /^[\t ]*$/;
const rDateY4 = /^(-)0*(\d{3}-)|\+?0*(\d{4,}-)/;
const rRealTrim = /\.?0+$/;
const rEnt = /[&<>]/g;
const ents = { '&': '&amp;', '<': '&lt;', '>': '&gt;' } as const;
const ent = (s: string) => ents[s as keyof typeof ents];

/**
 * Encode integer to string.
 *
 * @param i Integer value.
 * @param mz Encode smallest 128-bit integer as -0.
 * @returns Integer string.
 */
function integer(i: bigint, mz: boolean): string {
	// Weird bug encodes smallest 128-bit as negative zero.
	return mz && i === -0x80000000000000000000000000000000n
		? '-0'
		: i.toString();
}

/**
 * Encode real to string.
 *
 * @param real Real value.
 * @param uz Unsign zero.
 * @returns Real string.
 */
function real(real: number, uz: boolean): string {
	// No trailing zeros except on 0.
	switch (real) {
		case 0:
			return uz || 1 / real === Infinity ? '0.0' : '-0.0';
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
function date(date: PLDate): string {
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
	format?: typeof FORMAT_XML_V1_0 | typeof FORMAT_XML_V0_9;

	/**
	 * Indentation characters.
	 *
	 * @default '\t'
	 */
	indent?: string;

	/**
	 * Unsign zero real values.
	 *
	 * @default false
	 */
	unsignZero?: boolean;

	/**
	 * Encode smallest 128-bit integer as -0.
	 *
	 * @default false
	 */
	min128Zero?: boolean;
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
		unsignZero = false,
		min128Zero = false,
	}: Readonly<EncodeXmlOptions> = {},
): Uint8Array {
	let doctype: string;
	let version: string;
	let i: number;
	let x;

	switch (format) {
		case FORMAT_XML_V1_0: {
			doctype =
				'<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">';
			version = '1.0';
			i = 174;
			break;
		}
		case FORMAT_XML_V0_9: {
			doctype =
				'<!DOCTYPE plist SYSTEM "file://localhost/System/Library/DTDs/PropertyList.dtd">';
			version = '0.9';
			i = 151;
			break;
		}
		default: {
			throw new RangeError('Invalid format');
		}
	}

	if (!rIndent.test(indent)) {
		throw new RangeError('Invalid indent');
	}

	const ancestors = new Set<PLType>();
	const indentL = x = indent.length;
	const indentD = new Uint8Array(indentL);
	while (x--) {
		indentD[x] = indent.charCodeAt(x);
	}

	walk(
		plist,
		{
			PLArray(v, d, k): void {
				if (d && k === null) {
					throw new TypeError('Invalid XML key type');
				}
				if ((x = v.length)) {
					if (ancestors.has(v)) {
						throw new TypeError('Circular reference');
					}
					ancestors.add(v);
					i += 16 + d++ * indentL + (d * indentL + 1) * x;
				} else {
					i += 8;
				}
			},
			PLBoolean(v, d, k): void {
				if (d && k === null) {
					throw new TypeError('Invalid XML key type');
				}
				i += v.value ? 7 : 8;
			},
			PLData(v, d, k): void {
				if (d && k === null) {
					throw new TypeError('Invalid XML key type');
				}
				x = v.byteLength;
				x = ((x - (x % 3 || 3)) / 3 + 1) * 4;
				i += 13 + x +
					(d * indentL + 1) * ((x - (x % 76 || 76)) / 76 + 2);
			},
			PLDate(v, d, k): void {
				if (d && k === null) {
					throw new TypeError('Invalid XML key type');
				}
				i += 13 + date(v).length;
			},
			PLInteger(v, d, k): void {
				if (d && k === null) {
					throw new TypeError('Invalid XML key type');
				}
				i += 19 + integer(v.value, min128Zero).length;
			},
			PLReal(v, d, k): void {
				if (d && k === null) {
					throw new TypeError('Invalid XML key type');
				}
				i += 13 + real(v.value, unsignZero).length;
			},
			PLString(v, d, k): void {
				i += (d && k === null ? 11 : 17) +
					utf8Size(v.value.replace(rEnt, ent));
			},
			PLUID(v, d, k): void {
				if (d && k === null) {
					throw new TypeError('Invalid XML key type');
				}
				i += 52 + v.value.toString().length + d++ * indentL +
					d * indentL * 2;
			},
			PLDict(v, d, k): void {
				if (d && k === null) {
					throw new TypeError('Invalid XML key type');
				}
				if ((x = v.size)) {
					if (ancestors.has(v)) {
						throw new TypeError('Circular reference');
					}
					ancestors.add(v);
					i += 14 + d++ * indentL + (d * indentL + 1) * 2 * x;
				} else {
					i += 7;
				}
			},
			default(_, d, k): void {
				throw new TypeError(
					d && k === null
						? 'Invalid XML key type'
						: 'Invalid XML value type',
				);
			},
		},
		{
			default(v): void {
				ancestors.delete(v);
			},
		},
	);

	const r = new Uint8Array(i);
	i = utf8Encode('<?xml version="1.0" encoding="UTF-8"?>', r, 0);
	r[i++] = 10;
	i = utf8Encode(doctype, r, i);
	r[i++] = 10;
	i = utf8Encode(`<plist version="${version}">`, r, i);
	r[i++] = 10;

	walk(
		plist,
		{
			PLArray(v, d): void {
				for (; d--; i += indentL) {
					r.set(indentD, i);
				}
				i = utf8Encode(v.length ? '<array>' : '<array/>', r, i);
				r[i++] = 10;
			},
			PLBoolean(v, d): void {
				for (; d--; i += indentL) {
					r.set(indentD, i);
				}
				i = utf8Encode(v.value ? '<true/>' : '<false/>', r, i);
				r[i++] = 10;
			},
			PLData(v, d): void {
				for (x = d; x--; i += indentL) {
					r.set(indentD, i);
				}
				i = utf8Encode('<data>', r, i);
				r[i++] = 10;
				for (
					let u = new Uint8Array(v.buffer),
						l = u.length,
						l3 = l - (l % 3),
						b = 0,
						c,
						e;
					b < l;
				) {
					for (x = d; x--; i += indentL) {
						r.set(indentD, i);
					}
					for (x = 20; b < l3 && --x;) {
						e = u[b++];
						r[i++] = b64e[c = e >> 2] + c - 19;
						e = e << 8 | u[b++];
						r[i++] = b64e[c = e >> 4 & 63] + c - 19;
						e = e << 8 | u[b++];
						r[i++] = b64e[c = e >> 6 & 63] + c - 19;
						r[i++] = b64e[c = e & 63] + c - 19;
					}
					if (x && b < l) {
						e = u[b++];
						r[i++] = b64e[c = e >> 2] + c - 19;
						if (b < l) {
							e = e << 8 | u[b++];
							r[i++] = b64e[c = e >> 4 & 63] + c - 19;
							r[i++] = b64e[c = e << 2 & 63] + c - 19;
						} else {
							r[i++] = b64e[c = e << 4 & 63] + c - 19;
							r[i++] = 61;
						}
						r[i++] = 61;
					}
					r[i++] = 10;
				}
				for (; d--; i += indentL) {
					r.set(indentD, i);
				}
				i = utf8Encode('</data>', r, i);
				r[i++] = 10;
			},
			PLDate(v, d): void {
				for (; d--; i += indentL) {
					r.set(indentD, i);
				}
				i = utf8Encode('<date>', r, i);
				i = utf8Encode(date(v), r, i);
				i = utf8Encode('</date>', r, i);
				r[i++] = 10;
			},
			PLDict(v, d): void {
				for (; d--; i += indentL) {
					r.set(indentD, i);
				}
				i = utf8Encode(v.size ? '<dict>' : '<dict/>', r, i);
				r[i++] = 10;
			},
			PLInteger(v, d): void {
				for (; d--; i += indentL) {
					r.set(indentD, i);
				}
				i = utf8Encode('<integer>', r, i);
				i = utf8Encode(integer(v.value, min128Zero), r, i);
				i = utf8Encode('</integer>', r, i);
				r[i++] = 10;
			},
			PLReal(v, d): void {
				for (; d--; i += indentL) {
					r.set(indentD, i);
				}
				i = utf8Encode('<real>', r, i);
				i = utf8Encode(real(v.value, unsignZero), r, i);
				i = utf8Encode('</real>', r, i);
				r[i++] = 10;
			},
			PLString(v, d, k): void {
				x = d && k === null;
				for (; d--; i += indentL) {
					r.set(indentD, i);
				}
				i = utf8Encode(x ? '<key>' : '<string>', r, i);
				i = utf8Encode(v.value.replace(rEnt, ent), r, i);
				i = utf8Encode(x ? '</key>' : '</string>', r, i);
				r[i++] = 10;
			},
			PLUID(v, d): void {
				for (x = d++; x--; i += indentL) {
					r.set(indentD, i);
				}
				i = utf8Encode('<dict>', r, i);
				r[i++] = 10;
				for (x = d; x--; i += indentL) {
					r.set(indentD, i);
				}
				i = utf8Encode('<key>CF$UID</key>', r, i);
				r[i++] = 10;
				for (x = d--; x--; i += indentL) {
					r.set(indentD, i);
				}
				i = utf8Encode('<integer>', r, i);
				i = utf8Encode(v.value.toString(), r, i);
				i = utf8Encode('</integer>', r, i);
				r[i++] = 10;
				for (; d--; i += indentL) {
					r.set(indentD, i);
				}
				i = utf8Encode('</dict>', r, i);
				r[i++] = 10;
			},
		},
		{
			PLArray(v, d): void {
				if (v.length) {
					for (; d--; i += indentL) {
						r.set(indentD, i);
					}
					i = utf8Encode('</array>', r, i);
					r[i++] = 10;
				}
			},
			PLDict(v, d): void {
				if (v.size) {
					for (; d--; i += indentL) {
						r.set(indentD, i);
					}
					i = utf8Encode('</dict>', r, i);
					r[i++] = 10;
				}
			},
		},
	);

	r[utf8Encode('</plist>', r, i)] = 10;
	return r;
}
