/**
 * @module
 *
 * UTF-8 utils.
 */

/**
 * Char codes interface.
 */
export interface CharCodes {
	/**
	 * Length.
	 */
	readonly length: number;

	/**
	 * Get char code.
	 *
	 * @param index Index.
	 * @returns Char code.
	 */
	charCodeAt(index: number): number;
}

/**
 * Get string encode size.
 *
 * @param str String.
 * @returns Size.
 */
export function utf8Size(str: CharCodes): number {
	let len = 0;
	for (let l = str.length, i = 0, hi = 0, chr; i < l;) {
		if ((chr = str.charCodeAt(i++)) < 128) {
			len++;
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
 * @returns End.
 */
export function utf8Encode(
	str: CharCodes,
	dest: Uint8Array,
	start: number,
): number {
	for (let l = str.length, i = 0, hi = 0, chr; i < l;) {
		if ((chr = str.charCodeAt(i++)) < 128) {
			dest[start++] = chr;
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
	let r = 0, b, c, i, m, n;
	for (; start < end; start += n, r++) {
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
				r++;
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
	return r;
}

/**
 * Get string decode length.
 *
 * @param data Data.
 * @param start Offset.
 * @param end End.
 */
export function utf8Decode(
	data: Uint8Array,
	start = 0,
	end = data.length,
): string {
	let r = '', b, c, i, m, n;
	for (; start < end; start += n, r += String.fromCharCode(c)) {
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
			if (n === 4) {
				c -= 65536;
				r += String.fromCharCode(c >> 10 | 55296);
				c = c & 1023 | 56320;
			}
		}
	}
	return r;
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
