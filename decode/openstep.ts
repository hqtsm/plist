/**
 * @module
 *
 * OpenStep decoding.
 */

import { PLArray } from '../array.ts';
import { PLData } from '../data.ts';
import { PLDict } from '../dict.ts';
import { FORMAT_OPENSTEP, FORMAT_STRINGS } from '../format.ts';
import { unquoted } from '../pri/openstep.ts';
import { utf8ErrorChr, utf8ErrorEnd } from '../pri/utf8.ts';
import { PLString } from '../string.ts';

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
	// TODO
	void d, p;
	return new PLData();
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
	for (let [i] = p, c, s = '', l = d.length; ++i < l;) {
		c = d[i];
		if (c === q) {
			p[0] = i + 1;
			return new PLString(s);
		}
		// TODO: Escapes characters and UTF-8.
		s += String.fromCharCode(c);
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
	while (unquoted(c = d[++i])) {
		s += String.fromCharCode(c);
	}
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
	plist: PLArray | PLData | PLDict | PLString;
}

/**
 * Decode OpenStep encoded plist.
 *
 * @param encoded OpenStep plist encoded data.
 * @param options Decoding options.
 * @returns Decoded plist.
 */
export function decodeOpenStep(
	encoded: Uint8Array,
	{ allowMissingSemi = false } = {},
): DecodeOpenStepResult {
	const p: [number] = [0];
	let format: DecodeOpenStepResult['format'] = FORMAT_OPENSTEP;
	let n: Node | null = null;
	let d;
	let e;
	let plist;
	let c = next(encoded, p);
	if (c < 0) {
		return { format: FORMAT_STRINGS, plist: new PLDict() };
	}
	if (c === 34 || c === 39) {
		plist = decodeStrQ(encoded, p, c);
	} else if (unquoted(c)) {
		plist = decodeStrU(encoded, p);
	}
	if (plist) {
		c = next(encoded, p);
		if (c < 0) {
			return { format, plist };
		}
		if (c === 59 || c === 61) {
			n = { o: plist = new PLDict(), e: e = -1, n };
			p[0] = 0;
			format = FORMAT_STRINGS;
		}
	} else if (c === 60) {
		plist = decodeData(encoded, p);
	} else if (c === 123) {
		n = { o: plist = new PLDict(), e: e = 125, n };
		p[0]++;
	} else if (c === 40) {
		n = { o: plist = new PLArray(), e: e = 41, n };
		p[0]++;
	} else {
		throw new SyntaxError(utf8ErrorChr(encoded, p[0]));
	}
	while (n) {
		if (d) {
			c = next(encoded, p);
			if (e === 41) {
				if (c === 44) {
					p[0]++;
				} else {
					d = c === 41;
				}
			} else {
				if (c === 59) {
					p[0]++;
				} else if (c === 125) {
					d = allowMissingSemi;
				} else if ((d = allowMissingSemi && e! < 0)) {
					return { format, plist };
				}
			}
			if (!d) {
				if (c < 0) {
					throw new SyntaxError(utf8ErrorEnd(encoded));
				}
				throw new SyntaxError(utf8ErrorChr(encoded, p[0]));
			}
		}
		c = next(encoded, p);
		if ((d = c < 0)) {
			if (e! < 0) {
				return { format, plist };
			}
			throw new SyntaxError(utf8ErrorEnd(encoded));
		}
		if (c === e) {
			p[0]++;
			if ((n = n.n)) {
				d = plist = n.o;
				e = n.e;
			}
			continue;
		}
		let k;
		let v;
		if (e !== 41) {
			if (c === 34 || c === 39) {
				k = decodeStrQ(encoded, p, c);
			} else if (unquoted(c)) {
				k = decodeStrU(encoded, p);
			} else if (e! < 0) {
				return { format, plist };
			} else {
				throw new SyntaxError(utf8ErrorChr(encoded, p[0]));
			}
			c = next(encoded, p);
			if (c !== 61) {
				if (c < 0) {
					throw new SyntaxError(utf8ErrorEnd(encoded));
				}
				if (c === 59) {
					(plist as PLDict).set(k, k);
					p[0]++;
					continue;
				}
				throw new SyntaxError(utf8ErrorChr(encoded, p[0]));
			}
			p[0]++;
			c = next(encoded, p);
			if (c < 0) {
				throw new SyntaxError(utf8ErrorEnd(encoded));
			}
		}
		if (c === 34 || c === 39) {
			d = v = decodeStrQ(encoded, p, c);
		} else if (unquoted(c)) {
			d = v = decodeStrU(encoded, p);
		} else if (c === 60) {
			d = v = decodeData(encoded, p);
		} else if (c === 123) {
			n = { o: v = new PLDict(), e: e = 125, n };
			p[0]++;
		} else if (c === 40) {
			n = { o: v = new PLArray(), e: e = 41, n };
			p[0]++;
		} else {
			throw new SyntaxError(utf8ErrorChr(encoded, p[0]));
		}
		if (k) {
			(plist as PLDict).set(k, v);
		} else {
			(plist as PLArray).push(v);
		}
		if (!d) {
			plist = v;
		}
	}
	c = next(encoded, p);
	if (c < 0) {
		return { format, plist };
	}
	throw new Error(utf8ErrorChr(encoded, p[0]));
}
