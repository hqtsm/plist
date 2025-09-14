/**
 * @module
 *
 * OpenStep decoding.
 */

import { PLArray } from '../array.ts';
import { PLData } from '../data.ts';
import { PLDict } from '../dict.ts';
import { FORMAT_OPENSTEP, FORMAT_STRINGS } from '../format.ts';
import { b16d } from '../pri/base.ts';
import { bytes } from '../pri/data.ts';
import { latin, unesc, unquoted } from '../pri/openstep.ts';
import {
	utf8,
	utf8Decode,
	utf8Encoded,
	utf8ErrorEnd,
	utf8ErrorToken,
	utf8Length,
} from '../pri/utf8.ts';
import { PLString } from '../string.ts';
import type { PLType } from '../type.ts';

/**
 * Linked list node type.
 */
interface Node {
	/**
	 * Plist object.
	 */
	o: PLArray | PLDict;

	/**
	 * End character.
	 */
	e: number;

	/**
	 * Next node.
	 */
	n: Node | null;
}

/**
 * Advance to next non-whitespace, non-comment, character.
 *
 * @param d Data.
 * @param p Position.
 * @returns Next char, or -1 for end.
 */
function next(d: Uint8Array, p: [number]): number {
	let [i] = p;
	for (let c, x, l = d.length; i < l;) {
		c = d[i];
		if (c > 8) {
			if (c < 14 || c === 32) {
				i++;
				continue;
			}
			if (c === 226 && d[i + 1] === 128 && d[i + 2] >> 1 === 84) {
				i += 3;
				continue;
			}
			if (c === 47) {
				x = d[i + 1];
				if (x === 47) {
					for (i += 2; i < l;) {
						c = d[i++];
						if (c === 10 || c === 13) {
							break;
						}
						if (c === 226 && d[i] === 128 && d[i + 1] >> 1 === 84) {
							i += 2;
							break;
						}
					}
					continue;
				} else if (x === 42) {
					for (i += x = 2; i < l; x = c) {
						c = d[i++];
						if (x === 42 && c === 47) {
							break;
						}
					}
					continue;
				}
			}
		}
		p[0] = i;
		return c;
	}
	p[0] = i;
	return -1;
}

/**
 * Decode data.
 *
 * @param d Data.
 * @param p Parse context.
 * @returns Decoded data.
 */
function decodeData(d: Uint8Array, p: [number]): PLData {
	for (let i = p[0] + 1, b = i, c, s = 0, r, l = d.length; i < l;) {
		if (b16d(c = d[i]) < 0) {
			if (c === 62) {
				r = new PLData(s);
				c = new Uint8Array(r.buffer);
				for (s = 0; b < i;) {
					l = b16d(d[b++]);
					if (~l) {
						c[s++] = l << 4 | b16d(d[b++]);
					}
				}
				p[0] = i + 1;
				return r;
			}
			if (c === 32 || c === 10 || c === 13 || c === 9) {
				i++;
				continue;
			}
			if (c === 226 && d[i + 1] === 128 && d[i + 2] >> 1 === 84) {
				i += 3;
				continue;
			}
			throw new SyntaxError(utf8ErrorToken(d, i));
		}
		if (++i < l) {
			if (b16d(d[i]) < 0) {
				throw new SyntaxError(utf8ErrorToken(d, i));
			}
			i++;
			s++;
			continue;
		}
	}
	throw new SyntaxError(utf8ErrorEnd(d));
}

/**
 * Decode quoted string.
 *
 * @param d Data.
 * @param p Position.
 * @param q Quote character.
 * @returns Decoded string.
 */
function decodeStrQ(d: Uint8Array, p: [number], q: number): PLString {
	for (let [i] = p, b, c, n, s = '', l = d.length; ++i < l;) {
		c = d[i];
		if (c === q) {
			p[0] = i + 1;
			return new PLString(s);
		}
		if (c === 92) {
			c = d[++i];
			if (c >> 3 === 6) {
				c &= 7;
				b = d[i + 1];
				if (b >> 3 === 6) {
					c = c << 3 | b & 7;
					b = d[++i + 1];
					if (b >> 3 === 6) {
						c = (c & 31) << 3 | b & 7;
						++i;
					}
				}
				if (c < 128) {
					s += String.fromCharCode(c);
				} else if (c < 254) {
					s += String.fromCharCode(latin[c - 128] + c);
				}
				continue;
			}
			if (c === 85) {
				for (c = 0, n = 4; n--; i++) {
					if ((b = b16d(d[i + 1])) < 0) {
						break;
					}
					c = c << 4 | b;
				}
				s += String.fromCharCode(c);
				continue;
			}
			if (c > 96 && c < 119) {
				s += unesc.charAt(c - 97);
				continue;
			}
		}
		s += c & 128
			? utf8Decode(d, i, i += c & 32 ? c & 16 ? 3 : 2 : 1)
			: String.fromCharCode(c);
	}
	throw new SyntaxError(utf8ErrorEnd(d));
}

/**
 * Decode unquoted string.
 *
 * @param d Data.
 * @param p Position.
 * @returns Decoded string.
 */
function decodeStrU(d: Uint8Array, p: [number]): PLString {
	let [i] = p;
	let c;
	let s = String.fromCharCode(d[i]);
	for (; unquoted(c = d[++i]); s += String.fromCharCode(c));
	p[0] = i;
	return new PLString(s);
}

/**
 * Decode OpenStep plist options.
 */
export interface DecodeOpenStepOptions {
	/**
	 * Allow missing semicolon on the last dict item.
	 *
	 * @default false
	 */
	allowMissingSemi?: boolean;

	/**
	 * Optional UTF-16 endian flag.
	 * Defaults to auto detect.
	 */
	utf16le?: boolean;
}

/**
 * Decode OpenStep plist result.
 */
export interface DecodeOpenStepResult {
	/**
	 * Encoded format.
	 */
	format: typeof FORMAT_OPENSTEP | typeof FORMAT_STRINGS;

	/**
	 * Decoded plist.
	 */
	plist: PLType;
}

/**
 * Decode OpenStep encoded plist.
 *
 * @param encoded OpenStep plist encoded data.
 * @param options Decoding options.
 * @returns Decode result.
 */
export function decodeOpenStep(
	encoded: ArrayBufferView | ArrayBuffer,
	{
		allowMissingSemi = false,
		utf16le,
	}: Readonly<DecodeOpenStepOptions> = {},
): DecodeOpenStepResult {
	let d;
	let p: [number];
	let format: DecodeOpenStepResult['format'] = FORMAT_OPENSTEP;
	let n: Node | null = null;
	let s;
	let e;
	let plist;
	let c = (
		utf8Length(
			d = utf8.has(encoded as Uint8Array)
				? encoded as Uint8Array
				: utf8Encoded(d = bytes(encoded), utf16le) || d,
		), next(d, p = [0])
	);
	if (c < 0) {
		return { format: FORMAT_STRINGS, plist: new PLDict() };
	}
	if (c === 34 || c === 39) {
		plist = decodeStrQ(d, p, c);
	} else if (unquoted(c)) {
		plist = decodeStrU(d, p);
	}
	if (plist) {
		c = next(d, p);
		if (c < 0) {
			return { format, plist };
		}
		if (c === 59 || c === 61) {
			n = { o: plist = new PLDict(), e: e = -1, n };
			p[0] = 0;
			format = FORMAT_STRINGS;
		}
	} else if (c === 60) {
		plist = decodeData(d, p);
	} else if (c === 123) {
		n = { o: plist = new PLDict(), e: e = 125, n };
		p[0]++;
	} else if (c === 40) {
		n = { o: plist = new PLArray(), e: e = 41, n };
		p[0]++;
	} else {
		throw new SyntaxError(utf8ErrorToken(d, p[0]));
	}
	while (n) {
		if (s) {
			c = next(d, p);
			if (e === 41) {
				if (c === 44) {
					p[0]++;
				} else {
					s = c === 41;
				}
			} else {
				if (c === 59) {
					p[0]++;
				} else if (c === 125) {
					s = allowMissingSemi;
				} else if ((s = allowMissingSemi && e! < 0)) {
					return { format, plist };
				}
			}
			if (!s) {
				if (c < 0) {
					throw new SyntaxError(utf8ErrorEnd(d));
				}
				throw new SyntaxError(utf8ErrorToken(d, p[0]));
			}
		}
		c = next(d, p);
		if ((s = c < 0)) {
			if (e! < 0) {
				return { format, plist };
			}
			throw new SyntaxError(utf8ErrorEnd(d));
		}
		if (c === e) {
			p[0]++;
			if ((n = n.n)) {
				s = plist = n.o;
				e = n.e;
			}
			continue;
		}
		let k;
		let v;
		if (e !== 41) {
			if (c === 34 || c === 39) {
				k = decodeStrQ(d, p, c);
			} else if (unquoted(c)) {
				k = decodeStrU(d, p);
			} else if (e! < 0) {
				return { format, plist };
			} else {
				throw new SyntaxError(utf8ErrorToken(d, p[0]));
			}
			c = next(d, p);
			if (c !== 61) {
				if (c < 0) {
					throw new SyntaxError(utf8ErrorEnd(d));
				}
				if (c === 59) {
					(plist as PLDict).set(k, k);
					p[0]++;
					continue;
				}
				throw new SyntaxError(utf8ErrorToken(d, p[0]));
			}
			p[0]++;
			c = next(d, p);
			if (c < 0) {
				throw new SyntaxError(utf8ErrorEnd(d));
			}
		}
		if (c === 34 || c === 39) {
			s = v = decodeStrQ(d, p, c);
		} else if (unquoted(c)) {
			s = v = decodeStrU(d, p);
		} else if (c === 60) {
			s = v = decodeData(d, p);
		} else if (c === 123) {
			n = { o: v = new PLDict(), e: e = 125, n };
			p[0]++;
		} else if (c === 40) {
			n = { o: v = new PLArray(), e: e = 41, n };
			p[0]++;
		} else {
			throw new SyntaxError(utf8ErrorToken(d, p[0]));
		}
		if (k) {
			(plist as PLDict).set(k, v);
		} else {
			(plist as PLArray).push(v);
		}
		if (!s) {
			plist = v;
		}
	}
	c = next(d, p);
	if (c < 0) {
		return { format, plist };
	}
	throw new SyntaxError(utf8ErrorToken(d, p[0]));
}
