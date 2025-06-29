import { PLArray } from '../array.ts';
import { PLData } from '../data.ts';
import { PLDict } from '../dict.ts';
import { FORMAT_OPENSTEP, FORMAT_STRINGS } from '../format.ts';
import { PLString } from '../string.ts';
import type { PLType } from '../type.ts';

const abtnvfr = 'abtnvfr';
const close = Symbol();
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
	let depth = 0;
	let size = 1;
	let i = 0;
	let l = 1;
	let e;
	let x;
	let r;
	let inDict;
	let inArray;

	switch (format) {
		case FORMAT_OPENSTEP: {
			break;
		}
		case FORMAT_STRINGS: {
			if (PLDict.is(plist)) {
				depth--;
				break;
			}
			throw new TypeError(`Invalid strings root type: ${plist}`);
		}
		default: {
			throw new RangeError(`Unknown format: ${format}`);
		}
	}

	if (quote !== '"' && quote !== "'") {
		throw new RangeError(`Invalid quote: ${quote}`);
	}

	if (!rIndent.test(indent)) {
		throw new RangeError(`Invalid indent: ${JSON.stringify(indent)}`);
	}

	const qchar = quote.charCodeAt(0) as 34 | 39;
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
			if (depth--) {
				ancestors.delete(stack.pop()!);
			}
		} else if (PLString.is(e)) {
			size += stringLength(e.value, qchar, quoted);
		} else if (PLData.is(e)) {
			x = e.byteLength;
			size += x ? 2 + x + x + (x - (x % 4 || 4)) / 4 : 2;
		} else if (PLDict.is(e)) {
			if ((x = e.size)) {
				if (ancestors.has(e)) {
					throw new TypeError('Circular reference');
				}
				size += ((depth + 1) * indentSize + 5) * x +
					(depth !== -1 ? 3 + depth * indentSize : -1);
				q.length = l += x += x + 1;
				q.copyWithin(i + x, i);
				x = i;
				for (r of e) {
					q[x++] = r[0];
					q[x++] = r[1];
				}
				q[x] = close;
				ancestors.add(e);
				stack.push(e);
				depth++;
			} else if (depth !== -1) {
				size += 2;
			}
		} else if (PLArray.is(e)) {
			size += 2;
			if ((x = e.length)) {
				if (ancestors.has(e)) {
					throw new TypeError('Circular reference');
				}
				size += ((depth + 1) * indentSize + 2) * x++ +
					depth * indentSize;
				q.length = l += x;
				q.copyWithin(i + x, i);
				x = i;
				for (r of e) {
					q[x++] = r;
				}
				q[x] = close;
				ancestors.add(e);
				stack.push(e);
				depth++;
			}
		} else {
			throw new TypeError(`Invalid OpenStep value type: ${e}`);
		}
	} while (i < l);

	r = new Uint8Array(size);
	size = i = 0;

	while (i < l) {
		e = q[i++] as PLString | PLData | PLDict | PLArray | typeof close;

		if (inDict === 2) {
			r[size++] = 59;
		} else if (inDict) {
			inDict = 2;
		}

		if (e === close) {
			if (depth--) {
				r[size++] = 10;
				for (x = depth; x--;) {
					r.set(indentData, size);
					size += indentSize;
				}
				r[size++] = inDict ? 125 : 41;
			}
			if (PLDict.is(e = stack[--stack.length - 1])) {
				inDict = 2;
				inArray = 0;
			} else if (PLArray.is(e)) {
				inArray = 2;
				inDict = 0;
			}
		} else {
			if (inDict) {
				if (size) {
					r[size++] = 10;
					for (x = depth; x--;) {
						r.set(indentData, size);
						size += indentSize;
					}
				}
				size = stringEncode(
					(e as PLString).value,
					r,
					size,
					qchar,
					quoted,
				);
				r[size++] = 32;
				r[size++] = 61;
				r[size++] = 32;
				e = q[i++] as PLString | PLData | PLDict | PLArray;
			} else if (inArray) {
				if (inArray === 2) {
					r[size++] = 44;
				} else {
					inArray = 2;
				}
				r[size++] = 10;
				for (x = depth; x--;) {
					r.set(indentData, size);
					size += indentSize;
				}
			}

			if (PLString.is(e)) {
				size = stringEncode(
					e.value,
					r,
					size,
					qchar,
					quoted,
				);
			} else if (PLData.is(e)) {
				size = dataEncode(
					new Uint8Array(e.buffer),
					r,
					size,
				);
			} else if (PLDict.is(e)) {
				if ((x = depth !== -1)) {
					r[size++] = 123;
				}
				if (e.size) {
					stack.push(e);
					depth++;
					inDict = 1;
					inArray = 0;
				} else if (x) {
					r[size++] = 125;
				}
			} else {
				r[size++] = 40;
				if (e.length) {
					stack.push(e);
					depth++;
					inArray = 1;
					inDict = 0;
				} else {
					r[size++] = 41;
				}
			}
		}
	}

	r[size] = 10;
	return r;
}
