/**
 * @module
 *
 * UTF-8 utils.
 */

/**
 * Calculate string encode size.
 *
 * @param str String.
 * @param encode XML encode (0: none, 1: text, 2: attr).
 * @returns Size.
 */
export function utf8Length(str: string, encode: 0 | 1 | 2 = 0): number {
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
 * Error messages for end of data.
 *
 * @param d Data.
 * @returns Error message.
 */
export function utf8ErrorEnd(d: Uint8Array): string {
	// TODO
	void d;
	return 'Unexpected end';
}

/**
 * Error messages for unexpected character data.
 *
 * @param d Data.
 * @param p Position.
 * @returns Error message.
 */
export function utf8ErrorChr(d: Uint8Array, p: number): string {
	// TODO
	void d, p;
	return 'Unexpected character';
}
