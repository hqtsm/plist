/**
 * @module
 *
 * OpenStep encoding.
 */

import { PLDict } from '../dict.ts';
import { FORMAT_OPENSTEP, FORMAT_STRINGS } from '../format.ts';
import type { PLType } from '../type.ts';
import { walk } from '../walk.ts';

const abtnvfr = 'abtnvfr';
const rIndent = /^[\t ]*$/;

/**
 * Check if a character is unquoted.
 *
 * @param chr Character code.
 * @returns True if in: a-zA-Z0-9:_$/.-
 */
const unquoted = (chr: number) =>
	chr < 123 && (
		chr > 96 ||
		(chr < 91 && (chr > 64 || (chr < 59 && (chr > 44 || chr === 36)))) ||
		chr === 95
	);

/**
 * Calculate string encode size.
 *
 * @param str String.
 * @param quote Quote.
 * @param quoted Quoted.
 * @returns Size.
 */
function stringLength(str: string, quote: 34 | 39, quoted: boolean): number {
	let i = str.length;
	let total = i;
	let next = 0;
	let chr: number;
	while (i--) {
		if (!unquoted(chr = str.charCodeAt(i))) {
			quoted = true;
			total += chr < 32
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
				dest[start++] = abtnvfr.charCodeAt(chr - 7);
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
	}: EncodeOpenStepOptions = {},
): Uint8Array {
	let base = 0;
	let i = 1;
	let dict = false;
	let x;

	switch (format) {
		case FORMAT_OPENSTEP: {
			break;
		}
		case FORMAT_STRINGS: {
			if (PLDict.is(plist)) {
				base--;
				break;
			}
			throw new TypeError('Invalid strings root type');
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

	const q = quote.charCodeAt(0) as 34 | 39;
	const ancestors = new Set<PLType>();
	const indentSize = x = indent.length;
	const indentData = new Uint8Array(indentSize);
	while (x--) {
		indentData[x] = indent.charCodeAt(x);
	}

	walk(plist, {
		enter: {
			PLArray(visit, depth): number | void {
				if ((x = visit.length)) {
					if (ancestors.has(visit)) {
						throw new TypeError('Circular reference');
					}
					ancestors.add(visit);
					depth += base;
					i += 2 + depth++ * indentSize +
						(depth * indentSize + 2) * x;
					return;
				}
				i += 2;
				return 1;
			},
			PLDict(visit, depth): number | void {
				depth += base + 1;
				if ((x = visit.size)) {
					if (ancestors.has(visit)) {
						throw new TypeError('Circular reference');
					}
					ancestors.add(visit);
					i += x * (depth * indentSize + 5) + (
						depth ? (depth - 1) * indentSize + 3 : -1
					);
					return;
				}
				if (depth) {
					i += 2;
				}
				return 1;
			},
		},
		key: {
			PLDict(visit): void {
				i += stringLength(visit.value, q, quoted);
			},
		},
		value: {
			PLData(visit): void {
				x = visit.byteLength;
				i += x ? 2 + x + x + (x - (x % 4 || 4)) / 4 : 2;
			},
			PLString(visit): void {
				i += stringLength(visit.value, q, quoted);
			},
			default(): void {
				throw new TypeError('Invalid OpenStep value type');
			},
		},
		leave: {
			default(visit): void {
				ancestors.delete(visit);
			},
		},
	});

	const r = new Uint8Array(i);
	i = 0;

	walk(plist, {
		enter: {
			PLArray(visit): number | void {
				r[i++] = 40;
				if (visit.length) {
					dict = false;
					return;
				}
				r[i++] = 41;
				if (dict) {
					r[i++] = 59;
				}
				return 1;
			},
			PLDict(visit, depth): number | void {
				if ((depth += base + 1)) {
					r[i++] = 123;
				}
				if (visit.size) {
					dict = true;
					return;
				}
				if (depth) {
					r[i++] = 125;
					if (dict) {
						r[i++] = 59;
					}
				}
				return 1;
			},
		},
		key: {
			PLArray(visit, depth): void {
				if (visit) {
					r[i++] = 44;
				}
				r[i++] = 10;
				for (depth += base; depth--; i += indentSize) {
					r.set(indentData, i);
				}
			},
			PLDict(visit, depth): void {
				if (i) {
					r[i++] = 10;
					for (depth += base; depth--; i += indentSize) {
						r.set(indentData, i);
					}
				}
				i = stringEncode(visit.value, r, i, q, quoted);
				r[i++] = 32;
				r[i++] = 61;
				r[i++] = 32;
			},
		},
		value: {
			PLData(visit): void {
				i = dataEncode(new Uint8Array(visit.buffer), r, i);
				if (dict) {
					r[i++] = 59;
				}
			},
			PLString(visit): void {
				i = stringEncode(visit.value, r, i, q, quoted);
				if (dict) {
					r[i++] = 59;
				}
			},
		},
		leave: {
			PLArray(_, depth, parent): void {
				if ((depth += base + 1)) {
					r[i++] = 10;
					for (; --depth; i += indentSize) {
						r.set(indentData, i);
					}
					r[i++] = 41;
					if ((dict = PLDict.is(parent))) {
						r[i++] = 59;
					}
				}
			},
			PLDict(_, depth, parent): void {
				if ((depth += base + 1)) {
					r[i++] = 10;
					for (; --depth; i += indentSize) {
						r.set(indentData, i);
					}
					r[i++] = 125;
					if ((dict = PLDict.is(parent))) {
						r[i++] = 59;
					}
				}
			},
		},
	});

	r[i] = 10;
	return r;
}
