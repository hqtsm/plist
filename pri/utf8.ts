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
 * Already know UTF-8 bytes.
 */
export const utf8 = new Set<Uint8Array>();

/**
 * Get string encode size, from UTF-16.
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
 * Get string encode size, from UTF-32.
 *
 * @param str String.
 * @returns Size.
 */
export function utf8Size32(str: CharCodes): number {
	let len = 0;
	for (let l = str.length, i = 0, chr; i < l; i++) {
		if ((chr = str.charCodeAt(i)) < 128) {
			len++;
		} else if (chr < 2048) {
			len += 2;
		} else if (chr < 65536) {
			if (chr > 55295 && chr < 57344) {
				throw new TypeError(errorCharCode(str, i));
			}
			len += 3;
		} else if (chr > 1114111) {
			throw new TypeError(errorCharCode(str, i));
		} else {
			len += 4;
		}
	}
	return len;
}

/**
 * Encode string into buffer, from UTF-16.
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
 * Encode string into buffer, from UTF-32.
 *
 * @param str String.
 * @param dest Buffer.
 * @param start Offset.
 * @returns End.
 */
export function utf8Encode32(
	str: CharCodes,
	dest: Uint8Array,
	start: number,
): number {
	for (let l = str.length, i = 0, chr; i < l; i++) {
		if ((chr = str.charCodeAt(i)) < 128) {
			dest[start++] = chr;
		} else if (chr < 2048) {
			dest[start++] = 192 | (chr >> 6);
			dest[start++] = 128 | (chr & 63);
		} else if (chr < 65536) {
			if (chr > 55295 && chr < 57344) {
				throw new TypeError(errorCharCode(str, i));
			}
			dest[start++] = 224 | (chr >> 12);
			dest[start++] = 128 | ((chr >> 6) & 63);
			dest[start++] = 128 | (chr & 63);
		} else if (chr > 1114111) {
			throw new TypeError(errorCharCode(str, i));
		} else {
			dest[start++] = 240 | (chr >> 18);
			dest[start++] = 128 | ((chr >> 12) & 63);
			dest[start++] = 128 | ((chr >> 6) & 63);
			dest[start++] = 128 | (chr & 63);
		}
	}
	return start;
}

/**
 * Get string decode length, to UTF-16.
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
 * Get string decode length, to UTF-16.
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
 * Convert UTF-32 to UTF-8.
 *
 * @param data UTF-32 data with BOM.
 * @param littleEndian Endian flag.
 * @returns UTF-8 data.
 */
function utf8Encoded32(data: Uint8Array, littleEndian: boolean): Uint8Array {
	const { length } = data;
	const o = {
		length: (length - 4 - length % 4) / 4,
		charCodeAt: littleEndian
			? (i: number) =>
				data[i = i * 4 + 4] |
				data[++i] << 8 |
				data[++i] << 16 |
				data[i + 1] << 24
			: (i: number) =>
				data[i = i * 4 + 4] << 24 |
				data[++i] << 16 |
				data[++i] << 8 |
				data[i + 1],
	};
	const r = new Uint8Array(utf8Size32(o));
	utf8Encode32(o, r, 0);
	return r;
}

/**
 * Convert UTF-16 to UTF-8.
 *
 * @param data UTF-16 data with BOM.
 * @param littleEndian Endian flag.
 * @returns UTF-8 data.
 */
function utf8Encoded16(data: Uint8Array, littleEndian: boolean): Uint8Array {
	const { length } = data;
	const o = {
		length: (length - 2 - length % 2) / 2,
		charCodeAt: littleEndian
			? (i: number) => data[i = i * 2 + 2] | data[i + 1] << 8
			: (i: number) => data[i = i * 2 + 2] << 8 | data[i + 1],
	};
	const r = new Uint8Array(utf8Size(o));
	utf8Encode(o, r, 0);
	return r;
}

/**
 * Get UTF-8 encoded form of unicode data based on any BOM present.
 * UTF-8 is subviewed while UTF-16 and UTF-32 data are converted.
 *
 * @param data Data potentially including BOM.
 * @param utf16le Default UTF-16 endian flag when BOM is invalid.
 * @returns UTF-8 encoded data or null if no BOM.
 */
export function utf8Encoded(
	data: Uint8Array,
	utf16le?: boolean,
): Uint8Array | null {
	const [a, b, c, d] = data;
	if (a === 239 && b === 187 && c === 191) {
		return data.subarray(3);
	}
	if (a === 0) {
		return (b === 0 && c === 254 && d === 255)
			? utf8Encoded32(data, false)
			: utf8Encoded16(data, utf16le ?? false);
	}
	if (a === 255) {
		if (b === 254) {
			return (c === 0 && d === 0)
				? utf8Encoded32(data, true)
				: utf8Encoded16(data, true);
		}
	} else if (a === 254) {
		if (b === 255) {
			return utf8Encoded16(data, false);
		}
	}
	return b === 0 ? utf8Encoded16(data, utf16le ?? true) : null;
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
 * Find the line number of offset.
 *
 * @param data Data.
 * @param offset Offset.
 * @returns Line number.
 */
function lineNumberChars(data: CharCodes, offset: number): number {
	let line = 1, i = 0, c, p;
	for (; i < offset; i++) {
		c = data.charCodeAt(i);
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
function errorCharCode(data: CharCodes, offset: number): string {
	return `Invalid code point on line ${lineNumberChars(data, offset)}`;
}

/**
 * Error message for invalid data.
 *
 * @param data Data.
 * @param offset Offset.
 * @returns Error message.
 */
export function utf8ErrorEncoded(data: Uint8Array, offset: number): string {
	return `Invalid code point on line ${lineNumber(data, offset)}`;
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
	return `Invalid end on line ${lineNumber(data, data.length)}`;
}

/**
 * Error message for invalid XML.
 *
 * @param data Data.
 * @param offset Offset.
 * @returns Error message.
 */
export function utf8ErrorXML(data: Uint8Array, offset: number): string {
	return `Invalid XML on line ${lineNumber(data, offset)}`;
}
