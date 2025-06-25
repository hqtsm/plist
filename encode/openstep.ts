import { PLArray } from '../array.ts';
import { PLData } from '../data.ts';
import { PLDict } from '../dict.ts';
import { FORMAT_OPENSTEP, FORMAT_STRINGS } from '../format.ts';
import { PLString } from '../string.ts';
import type { PLType } from '../type.ts';

const abtnvfr = 'abtnvfr';

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
 * @returns Size.
 */
function stringLength(str: string): number {
	let i = str.length;
	let total = i;
	let quote = 0;
	let next = 0;
	let chr: number;
	while (i--) {
		if (!unquoted(chr = str.charCodeAt(i))) {
			quote = 2;
			total += chr < 32
				? (
					chr > 13
						? (next < 56 && next > 47) as unknown as number + 2
						: (chr < 7 && next < 56 && next > 47 ? 3 : 1)
				)
				: (
					(chr === 34 || chr === 92) ||
					(chr > 126 && (chr === 127 ? 3 : 5))
				) as number;
		}
		next = chr;
	}
	return quote + total || 2;
}

/**
 * Encode string into buffer.
 *
 * @param str String.
 * @param dest Buffer.
 * @param start Offset.
 * @returns End.
 */
function stringEncode(str: string, dest: Uint8Array, start: number): number {
	const l = str.length;
	let q = !l;
	let i = 0;
	let next: number;
	let chr: number;
	let x: number;
	if (!q) {
		do {
			if (!unquoted(str.charCodeAt(i++))) {
				q = true;
				break;
			}
		} while (i < l);
		i = 0;
	}
	if (q) {
		dest[start++] = 34;
	}
	while (i < l) {
		if ((chr = str.charCodeAt(i++)) < 32) {
			dest[start++] = 92;
			if (chr < 7) {
				next = str.charCodeAt(i);
				if (next < 56 && next > 47) {
					dest[start++] = 48;
					dest[start++] = 48;
				}
				dest[start++] = 48 + chr;
			} else if (chr > 13) {
				next = str.charCodeAt(i);
				if (next < 56 && next > 47) {
					dest[start++] = 48;
				}
				dest[start++] = 48 + (chr - (x = chr % 8)) / 8;
				dest[start++] = 48 + x;
			} else {
				dest[start++] = abtnvfr.charCodeAt(chr - 7);
			}
		} else if (chr === 34) {
			dest[start++] = 92;
			dest[start++] = chr;
		} else if (chr === 92) {
			dest[start++] = chr;
			dest[start++] = chr;
		} else if (chr > 126) {
			dest[start++] = 92;
			if (chr === 127) {
				dest[start++] = 49;
				dest[start++] = dest[start++] = 55;
			} else {
				dest[start++] = 85;
				x = chr >> 12;
				dest[start++] = x + (x > 9 ? 87 : 48);
				x = chr >> 8 & 15;
				dest[start++] = x + (x > 9 ? 87 : 48);
				x = chr >> 4 & 15;
				dest[start++] = x + (x > 9 ? 87 : 48);
				x = chr & 15;
				dest[start++] = x + (x > 9 ? 87 : 48);
			}
		} else {
			dest[start++] = chr;
		}
	}
	if (q) {
		dest[start++] = 34;
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
	for (let i = 0, c = data.length, hi, lo; i < c; i++) {
		if (i && !(i % 4)) {
			dest[start++] = 32;
		}
		hi = data[i];
		lo = hi & 15;
		hi >>= 4;
		dest[start++] = hi + (hi > 9 ? 87 : 48);
		dest[start++] = lo + (lo > 9 ? 87 : 48);
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
	{ format = FORMAT_OPENSTEP, indent = '\t' }: EncodeOpenStepOptions = {},
): Uint8Array {
	let depth = 0;
	let size = 1;
	let i = 0;
	let l = 1;
	let e: PLType | typeof close;
	let x: number;
	let inDict = 0;
	let inArray = 0;

	switch (format) {
		case FORMAT_OPENSTEP: {
			break;
		}
		case FORMAT_STRINGS: {
			if (PLDict.is(plist)) {
				depth--;
				break;
			}
			throw new TypeError(`Invalid strings root type: ${String(plist)}`);
		}
		default: {
			throw new RangeError(`Unknown format: ${String(format)}`);
		}
	}

	if (!/^[\t ]*$/.test(indent = String(indent))) {
		throw new RangeError(`Invalid indent: ${JSON.stringify(indent)}`);
	}

	const close = Symbol();
	const q: (PLType | typeof close)[] = [plist];
	const ancestors = new Set<PLType>();
	const stack: (PLArray | PLDict)[] = [];
	const indentSize = indent.length;
	const indentData = new Uint8Array(indentSize);
	for (let i = indentSize; i--;) {
		indentData[i] = indent.charCodeAt(i);
	}

	while (i < l) {
		e = q[i++];

		if (e === close) {
			if (--depth !== -1) {
				ancestors.delete(stack.pop()!);
			}
		} else if (PLString.is(e)) {
			size += stringLength(e.value);
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
				for (const [k, v] of e) {
					q[x++] = k;
					q[x++] = v;
				}
				q[x] = close;
				ancestors.add(e);
				stack.push(e);
				depth++;
			} else if (depth !== -1) {
				size += 2;
			}
		} else if (PLArray.is(e)) {
			if ((x = e.length)) {
				if (ancestors.has(e)) {
					throw new TypeError('Circular reference');
				}
				size += 2 + ((depth + 1) * indentSize + 2) * x++ +
					depth * indentSize;
				q.length = l += x;
				q.copyWithin(i + x, i);
				x = i;
				for (const v of e) {
					q[x++] = v;
				}
				q[x] = close;
				ancestors.add(e);
				stack.push(e);
				depth++;
			} else {
				size += 2;
			}
		} else {
			throw new TypeError(`Invalid type: ${String(e)}`);
		}
	}

	const encode = new Uint8Array(size);
	size = i = 0;

	while (i < l) {
		e = q[i++];

		if (inDict === 2) {
			encode[size++] = 59;
		} else if (inDict) {
			inDict = 2;
		}

		if (e === close) {
			if (--depth !== -1) {
				encode[size++] = 10;
				for (let i = depth; i--;) {
					encode.set(indentData, size);
					size += indentSize;
				}
				encode[size++] = inDict ? 125 : 41;
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
					encode[size++] = 10;
					for (let i = depth; i--;) {
						encode.set(indentData, size);
						size += indentSize;
					}
				}
				size = stringEncode((e as PLString).value, encode, size);
				encode[size++] = 32;
				encode[size++] = 61;
				encode[size++] = 32;
				e = q[i++];
			} else if (inArray) {
				if (inArray === 2) {
					encode[size++] = 44;
				} else {
					inArray = 2;
				}
				encode[size++] = 10;
				for (let i = depth; i--;) {
					encode.set(indentData, size);
					size += indentSize;
				}
			}

			if (PLString.is(e)) {
				size = stringEncode(e.value, encode, size);
			} else if (PLData.is(e)) {
				size = dataEncode(new Uint8Array(e.buffer), encode, size);
			} else if (PLDict.is(e)) {
				if (e.size) {
					if (depth !== -1) {
						encode[size++] = 123;
					}
					stack.push(e);
					depth++;
					inDict = 1;
					inArray = 0;
				} else if (depth !== -1) {
					encode[size++] = 123;
					encode[size++] = 125;
				}
			} else {
				if ((e as PLArray).length) {
					encode[size++] = 40;
					stack.push(e as PLArray);
					depth++;
					inArray = 1;
					inDict = 0;
				} else {
					encode[size++] = 40;
					encode[size++] = 41;
				}
			}
		}
	}

	encode[size] = 10;
	return encode;
}
