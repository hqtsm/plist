/**
 * @module
 *
 * UTF-8 utils.
 */

/**
 * Get string encode size.
 *
 * @param str String.
 * @param encode XML encode (0: none, 1: text, 2: attr).
 * @returns Size.
 */
export function utf8Size(str: string, encode: 0 | 1 | 2 = 0): number {
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
export function utf8Encode(
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
 * Get string decode length.
 *
 * @param data Data.
 * @param start Offset.
 * @param end End.
 */
export function utf8Length(
	data: Uint8Array,
	start = 0,
	end = data.length,
): number {
	let len = 0, b, c, i, m, n;
	for (; start < end; start += n, len++) {
		c = data[start];
		n = 1;
		m = 128;
		if (c & m) {
			if (!(c & 64)) {
				c = -1;
			} else if (!(c & 32)) {
				c &= 31;
				n = 2;
			} else if (!(c & 16)) {
				c &= 15;
				n = 3;
				m = 2048;
			} else if (!(c & 8)) {
				c &= 7;
				n = 4;
				m = 65536;
				len++;
			} else {
				c = -1;
			}
			for (i = 1; i < n;) {
				b = data[start + i++];
				c = b >> 6 === 2 ? c << 6 | b & 63 : -1;
			}
			if (c < m || c > 1114111) {
				throw new TypeError(utf8ErrorEncoded(data, start));
			}
		}
	}
	return len;
}

/**
 * Find the line number of offset.
 *
 * @param data Data.
 * @param offset Offset.
 * @returns Line number.
 */
function lineNumber(data: Uint8Array, offset: number): number {
	let line = 1, i = 0, c, p;
	for (; i < offset; i++) {
		c = data[i];
		line += (c === 10 ? p !== 13 : c === 13) as unknown as number;
		p = c;
	}
	return line;
}

/**
 * Error message for invalid data.
 *
 * @param data Data.
 * @param offset Offset.
 * @returns Error message.
 */
export function utf8ErrorEncoded(data: Uint8Array, offset: number): string {
	return `Invalid UTF-8 encoded text on line ${lineNumber(data, offset)}`;
}

/**
 * Error message for invalid token.
 *
 * @param data Data.
 * @param offset Offset.
 * @returns Error message.
 */
export function utf8ErrorToken(data: Uint8Array, offset: number): string {
	return `Invalid token on line ${lineNumber(data, offset)}`;
}

/**
 * Error message for end of input.
 *
 * @param data Data.
 * @returns Error message.
 */
export function utf8ErrorEnd(data: Uint8Array): string {
	return `End of input on line ${lineNumber(data, data.length)}`;
}
