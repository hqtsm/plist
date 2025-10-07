/**
 * @module
 *
 * OpenStep encoding.
 */

import { FORMAT_OPENSTEP, FORMAT_STRINGS } from '../format.ts';
import { esc, unquoted } from '../pri/openstep.ts';
import type { PLType } from '../type.ts';
import { walk } from '../walk.ts';

const rIndent = /^[\t ]*$/;

/**
 * Calculate string encode size.
 *
 * @param str String.
 * @param quote Quote.
 * @param quoted Quoted.
 * @returns Size.
 */
function stringLength(
	str: string,
	quote: 34 | 39,
	quoted: boolean | number,
): number {
	let i = str.length;
	let total = i;
	let next = 0;
	let chr: number;
	while (i--) {
		if (!unquoted(chr = str.charCodeAt(i))) {
			quoted = total += chr < 32
				? (
					chr > 13
						? (next < 56 && next > 47) as unknown as number + 2
						: (chr < 7 && next < 56 && next > 47 ? 3 : 1)
				)
				: (
					(chr === quote || chr === 92) ||
					(chr > 126 && (chr === 127 ? 3 : 5))
				) as number;
		}
		next = chr;
	}
	return quoted || !total ? total + 2 : total;
}

/**
 * Encode string into buffer.
 *
 * @param str String.
 * @param dest Buffer.
 * @param start Offset.
 * @param quote Quote.
 * @param quoted Quoted.
 * @returns End.
 */
function stringEncode(
	str: string,
	dest: Uint8Array,
	start: number,
	quote: 34 | 39,
	quoted: boolean,
): number {
	const l = str.length;
	let i = 0;
	let chr: number;
	let x: number;
	if (!(quoted ||= !l)) {
		while (!(quoted = !unquoted(str.charCodeAt(i++))) && i < l);
		i = 0;
	}
	if (quoted) {
		dest[start++] = quote;
	}
	while (i < l) {
		if ((chr = str.charCodeAt(i++)) < 32) {
			dest[start++] = 92;
			if (chr < 7) {
				if ((x = str.charCodeAt(i)) < 56 && x > 47) {
					dest[start++] = dest[start++] = 48;
				}
				dest[start++] = 48 + chr;
			} else if (chr > 13) {
				if ((x = str.charCodeAt(i)) < 56 && x > 47) {
					dest[start++] = 48;
				}
				dest[start++] = 48 + (chr - (x = chr % 8)) / 8;
				dest[start++] = 48 + x;
			} else {
				dest[start++] = esc.charCodeAt(chr - 7);
			}
		} else if (chr === quote || chr === 92) {
			dest[start++] = 92;
			dest[start++] = chr;
		} else if (chr > 126) {
			dest[start++] = 92;
			if (chr === 127) {
				dest[start++] = 49;
				dest[start++] = dest[start++] = 55;
			} else {
				dest[start++] = 85;
				dest[start++] = (x = chr >> 12) > 9 ? x + 87 : x + 48;
				dest[start++] = (x = chr >> 8 & 15) > 9 ? x + 87 : x + 48;
				dest[start++] = (x = chr >> 4 & 15) > 9 ? x + 87 : x + 48;
				dest[start++] = (x = chr & 15) > 9 ? x + 87 : x + 48;
			}
		} else {
			dest[start++] = chr;
		}
	}
	if (quoted) {
		dest[start++] = quote;
	}
	return start;
}

/**
 * Encode data into buffer.
 *
 * @param data Data.
 * @param dest Buffer.
 * @param start Offset.
 * @returns End.
 */
function dataEncode(
	data: Uint8Array,
	dest: Uint8Array,
	start: number,
): number {
	dest[start++] = 60;
	for (let i = 0, c = data.length, hi, lo; i < c;) {
		if (!(i % 4) && i) {
			dest[start++] = 32;
		}
		hi = data[i++];
		lo = hi & 15;
		dest[start++] = (hi >>= 4) > 9 ? hi + 87 : hi + 48;
		dest[start++] = lo > 9 ? lo + 87 : lo + 48;
	}
	dest[start++] = 62;
	return start;
}

/**
 * Encoding options for OpenStep.
 */
export interface EncodeOpenStepOptions {
	/**
	 * Encoding format.
	 *
	 * @default FORMAT_OPENSTEP
	 */
	format?: typeof FORMAT_OPENSTEP | typeof FORMAT_STRINGS;

	/**
	 * Indentation characters.
	 *
	 * @default '\t'
	 */
	indent?: string;

	/**
	 * Quote character.
	 *
	 * @default '"'
	 */
	quote?: '"' | "'";

	/**
	 * Always quote strings.
	 *
	 * @default false
	 */
	quoted?: boolean;

	/**
	 * Use shortcut format for matching keys and values.
	 *
	 * @default false
	 */
	shortcut?: boolean;
}

/**
 * Encode plist, OpenStep format.
 *
 * @param plist Plist object.
 * @param options Encoding options.
 * @returns Encoded plist.
 */
export function encodeOpenStep(
	plist: PLType,
	{
		format = FORMAT_OPENSTEP,
		indent = '\t',
		quote = '"',
		quoted = false,
		shortcut = false,
	}: Readonly<EncodeOpenStepOptions> = {},
): Uint8Array<ArrayBuffer> {
	let base = 0;
	let i: number;

	switch (format) {
		case FORMAT_STRINGS: {
			base--;
		}
		// Fall through.
		case FORMAT_OPENSTEP: {
			break;
		}
		default: {
			throw new RangeError('Invalid format');
		}
	}

	if (quote !== '"' && quote !== "'") {
		throw new RangeError('Invalid quote');
	}

	if (!rIndent.test(indent)) {
		throw new RangeError('Invalid indent');
	}

	const quoteC = quote.charCodeAt(0) as 34 | 39;
	const ancestors = new Set<PLType>();
	const indentL = i = indent.length;
	const indentD = new Uint8Array(indentL);
	while (i--) {
		indentD[i] = indent.charCodeAt(i);
	}
	i = 1;

	walk(
		plist,
		{
			PLArray(v, d, k): void {
				if (d) {
					if (k === null) {
						throw new TypeError('Invalid OpenStep key type');
					}
				} else if (base) {
					throw new TypeError('Invalid strings root type');
				}
				if (k && typeof k !== 'number') {
					i += 3;
				}
				if ((k = v.length)) {
					if (ancestors.has(v)) {
						throw new TypeError('Circular reference');
					}
					ancestors.add(v);
					d += base;
					i += 2 + d++ * indentL + (d * indentL + 2) * k;
				} else {
					i += 2;
				}
			},
			PLData(v, d, k): void {
				if (d) {
					if (k === null) {
						throw new TypeError('Invalid OpenStep key type');
					}
				} else if (base) {
					throw new TypeError('Invalid strings root type');
				}
				if (k && typeof k !== 'number') {
					i += 3;
				}
				k = v.byteLength;
				i += k ? 2 + k + k + (k - (k % 4 || 4)) / 4 : 2;
			},
			PLString(v, d, k): void {
				if (!d && base) {
					throw new TypeError('Invalid strings root type');
				}
				if (k && typeof k !== 'number') {
					if (!shortcut || v !== k) {
						i += 3 + stringLength(v.value, quoteC, quoted);
					}
				} else {
					i += stringLength(v.value, quoteC, quoted);
				}
			},
			PLDict(v, d, k): void {
				if (d && k === null) {
					throw new TypeError('Invalid OpenStep key type');
				}
				d += base + 1;
				if (k && typeof k !== 'number') {
					i += 3;
				}
				if ((k = v.size)) {
					if (ancestors.has(v)) {
						throw new TypeError('Circular reference');
					}
					ancestors.add(v);
					i += k * (d * indentL + 2) +
						(d ? (d - 1) * indentL + 3 : -1);
				} else if (d) {
					i += 2;
				}
			},
			default(_, d, k): void {
				throw new TypeError(
					d && k === null
						? 'Invalid OpenStep key type'
						: 'Invalid OpenStep value type',
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
	i = 0;

	walk(
		plist,
		{
			PLArray(v, d, k): void {
				if (typeof k === 'number') {
					if (k) {
						r[i++] = 44;
					}
					r[i++] = 10;
					for (d += base; d--; i += indentL) {
						r.set(indentD, i);
					}
					k = 0;
				} else if (k) {
					r[i++] = 32;
					r[i++] = 61;
					r[i++] = 32;
				}
				r[i++] = 40;
				if (!v.length) {
					r[i++] = 41;
					if (k) {
						r[i++] = 59;
					}
				}
			},
			PLData(v, d, k): void {
				if (typeof k === 'number') {
					if (k) {
						r[i++] = 44;
					}
					r[i++] = 10;
					for (d += base; d--; i += indentL) {
						r.set(indentD, i);
					}
					k = 0;
				} else if (k) {
					r[i++] = 32;
					r[i++] = 61;
					r[i++] = 32;
				}
				i = dataEncode(new Uint8Array(v.buffer), r, i);
				if (k) {
					r[i++] = 59;
				}
			},
			PLDict(v, d, k): void {
				d += base;
				if (typeof k === 'number') {
					if (k) {
						r[i++] = 44;
					}
					r[i++] = 10;
					for (k = d; k--; i += indentL) {
						r.set(indentD, i);
					}
					k = 0;
				} else if (k) {
					r[i++] = 32;
					r[i++] = 61;
					r[i++] = 32;
				}
				if (++d) {
					r[i++] = 123;
					if (!v.size) {
						r[i++] = 125;
						if (k) {
							r[i++] = 59;
						}
					}
				}
			},
			PLString(v, d, k): void {
				if (typeof k === 'number') {
					if (k) {
						r[i++] = 44;
					}
					r[i++] = 10;
					for (d += base; d--; i += indentL) {
						r.set(indentD, i);
					}
					i = stringEncode(v.value, r, i, quoteC, quoted);
				} else if (!k) {
					if (i) {
						r[i++] = 10;
						for (d += base; d--; i += indentL) {
							r.set(indentD, i);
						}
					}
					i = stringEncode(v.value, r, i, quoteC, quoted);
				} else {
					if (!shortcut || v !== k) {
						r[i++] = 32;
						r[i++] = 61;
						r[i++] = 32;
						i = stringEncode(v.value, r, i, quoteC, quoted);
					}
					r[i++] = 59;
				}
			},
		},
		{
			PLArray(v, d, k): void {
				if (v.length && (d += base + 1)) {
					r[i++] = 10;
					for (; --d; i += indentL) {
						r.set(indentD, i);
					}
					r[i++] = 41;
					if (k && typeof k !== 'number') {
						r[i++] = 59;
					}
				}
			},
			PLDict(v, d, k): void {
				if (v.size && (d += base + 1)) {
					r[i++] = 10;
					for (; --d; i += indentL) {
						r.set(indentD, i);
					}
					r[i++] = 125;
					if (k && typeof k !== 'number') {
						r[i++] = 59;
					}
				}
			},
		},
	);

	r[i] = 10;
	return r;
}
