/**
 * @module
 *
 * XML decoding.
 */

import { PLArray } from '../array.ts';
import { PLBoolean } from '../boolean.ts';
import { PLData } from '../data.ts';
import { PLDate } from '../date.ts';
import { PLDict } from '../dict.ts';
import { FORMAT_XML_V0_9, FORMAT_XML_V1_0 } from '../format.ts';
import { PLInteger, PLTYPE_INTEGER } from '../integer.ts';
import { b16d, b64d } from '../pri/base.ts';
import { bytes } from '../pri/data.ts';
import { getTime } from '../pri/date.ts';
import {
	utf8,
	utf8Decode,
	utf8Encoded,
	utf8ErrorEnd,
	utf8ErrorXML,
	utf8Length,
} from '../pri/utf8.ts';
import { PLReal, PLTYPE_REAL } from '../real.ts';
import { PLString } from '../string.ts';
import type { PLType } from '../type.ts';
import { PLUID } from '../uid.ts';

const rUTF8 = /^(x-mac-)?utf-8$/i;
const rREAL = /^[\de.+-]+$/i;
const rRLWS = /^[\0-\x20\x7F-\xA0\u2000-\u200B\u3000]+/;

/**
 * Check if whitespace character.
 *
 * @param c Character.
 * @returns True if whitespace.
 */
const ws = (c: number) => c === 9 || c === 10 || c === 13 || c === 32;

/**
 * Plist wrapper.
 */
interface Plist {
	/**
	 * Key when inside dict.
	 */
	k: PLString | null;

	/**
	 * Single value.
	 */
	v: PLType | null;
}

/**
 * Linked list node type.
 */
interface Node {
	/**
	 * First character.
	 */
	a: number;

	/**
	 * Open tag name position.
	 */
	t: number;

	/**
	 * Size of tag name.
	 */
	s: number;

	/**
	 * Plist object.
	 */
	p: PLArray | PLDict | Plist;

	/**
	 * Next node.
	 */
	n: Node | null;
}

/**
 * Get XML encoding from XML header.
 *
 * @param d Data.
 * @returns Encoding.
 */
function encoding(d: Uint8Array): string | null {
	let i = 0, j, l, c;
	if (
		d[i++] === 60 &&
		d[i++] === 63 &&
		d[i++] === 120 &&
		d[i++] === 109 &&
		d[i++] === 108
	) {
		for (l = d.length; i < l;) {
			c = d[i++];
			if (c === 63 || c === 62) {
				return null;
			}
			if (
				c === 101 &&
				d[i++] === 110 &&
				d[i++] === 99 &&
				d[i++] === 111 &&
				d[i++] === 100 &&
				d[i++] === 105 &&
				d[i++] === 110 &&
				d[i++] === 103 &&
				d[i++] === 61
			) {
				c = d[i++];
				if (c === 39 || c === 34) {
					for (j = i; i < l; j++) {
						if (d[j] === c) {
							return String.fromCharCode(...d.subarray(i, j));
						}
					}
				}
				return null;
			}
		}
		throw new SyntaxError(utf8ErrorEnd(d));
	}
	return null;
}

/**
 * Skip over whitespace characters.
 *
 * @param d Data.
 * @param i Offset.
 * @returns After offset.
 */
function whitespace(d: Uint8Array, i: number): number {
	for (; ws(d[i]); i++);
	return i;
}

/**
 * Skip over a comment.
 *
 * @param d Data.
 * @param i Offset.
 * @param l Length.
 * @returns After offset.
 */
function comment(d: Uint8Array, i: number, l: number): number {
	for (let a, b, c; i < l;) {
		a = b;
		b = c;
		c = d[i++];
		if (c === 62 && b === 45 && a === 45) {
			return i;
		}
	}
	throw new SyntaxError(utf8ErrorEnd(d));
}

/**
 * Skip over processing instruction.
 *
 * @param d Data.
 * @param i Offset.
 * @param l Length.
 * @returns After offset.
 */
function instruction(d: Uint8Array, i: number, l: number): number {
	for (let a, b; i < l;) {
		a = b;
		b = d[i++];
		if (b === 62 && a === 63) {
			return i;
		}
	}
	throw new SyntaxError(utf8ErrorEnd(d));
}

/**
 * Skip over DTD.
 *
 * @param d Data.
 * @param i Offset.
 * @param l Length.
 * @returns After offset.
 */
function doctype(d: Uint8Array, i: number, l: number): number {
	if (
		d[i] === 68 &&
		d[i + 1] === 79 &&
		d[i + 2] === 67 &&
		d[i + 3] === 84 &&
		d[i + 4] === 89 &&
		d[i + 5] === 80 &&
		d[i + 6] === 69
	) {
		for (i = whitespace(d, i + 7); i < l; i++) {
			const c = d[i];
			if (c === 62) {
				return i + 1;
			}
			if (c === 91) {
				// Inline DTD parsing is absent or broken in official parsers.
				throw new SyntaxError(utf8ErrorXML(d, i));
			}
		}
		throw new SyntaxError(utf8ErrorEnd(d));
	}
	throw new SyntaxError(utf8ErrorXML(d, i));
}

/**
 * Read date.
 *
 * @param d Data.
 * @param p Offset pointer.
 * @param l Length.
 * @returns Date.
 */
function date(d: Uint8Array, p: [number], l: number): PLDate {
	let [i] = p;
	let c = d[i];
	let n;
	let Y = 0;
	let M;
	let D;
	let h;
	let m;
	let s;
	for (;;) {
		if ((n = c === 45)) {
			c = d[++i];
		}
		for (; c > 47 && c < 58; c = d[++i]) {
			Y = Y * 10 + c - 48 | 0;
		}
		if (c !== 45) {
			break;
		}
		c = d[++i];
		if (c < 48 || c > 57) {
			break;
		}
		M = c - 48;
		c = d[++i];
		if (c < 48 || c > 57) {
			break;
		}
		M = M * 10 + c - 48;
		c = d[++i];
		if (c !== 45) {
			break;
		}
		c = d[++i];
		if (c < 48 || c > 57) {
			break;
		}
		D = c - 48;
		c = d[++i];
		if (c < 48 || c > 57) {
			break;
		}
		D = D * 10 + c - 48;
		c = d[++i];
		if (c !== 84) {
			break;
		}
		c = d[++i];
		if (c < 48 || c > 57) {
			break;
		}
		h = c - 48;
		c = d[++i];
		if (c < 48 || c > 57) {
			break;
		}
		h = h * 10 + c - 48;
		c = d[++i];
		if (c !== 58) {
			break;
		}
		c = d[++i];
		if (c < 48 || c > 57) {
			break;
		}
		m = c - 48;
		c = d[++i];
		if (c < 48 || c > 57) {
			break;
		}
		m = m * 10 + c - 48;
		c = d[++i];
		if (c !== 58) {
			break;
		}
		c = d[++i];
		if (c < 48 || c > 57) {
			break;
		}
		s = c - 48;
		c = d[++i];
		if (c < 48 || c > 57) {
			break;
		}
		s = s * 10 + c - 48;
		if (d[++i] !== 90 || d[++i] !== 60) {
			break;
		}
		p[0] = i;
		return new PLDate(getTime(n ? (-Y) | 0 : Y, M, D, h, m, s));
	}
	throw new SyntaxError(i < l ? utf8ErrorXML(d, i) : utf8ErrorEnd(d));
}

/**
 * Read data.
 *
 * @param d Data.
 * @param p Offset pointer.
 * @param l Length.
 * @returns Data.
 */
function data(d: Uint8Array, p: [number], l: number): PLData {
	for (
		let [i] = p, a = 0, e = 0, s = 0, t = 0, h = i, b, c, o, r;
		i < l;
		i++
	) {
		c = d[i];
		if (c > 42 && c < 123) {
			if ((b64d[c - 43] + c - 80) < 0) {
				if (c !== 61) {
					e = 0;
					if (c !== 60) {
						continue;
					}
					r = new PLData(s);
					o = new Uint8Array(r.buffer);
					for (a = s = t = 0, i = h;; i++) {
						c = d[i];
						if (c > 42 && c < 123) {
							b = b64d[c - 43] + c - 80;
							if (b < 0) {
								if (c !== 61) {
									e = 0;
									if (c !== 60) {
										continue;
									}
									p[0] = i;
									return r!;
								}
								e++;
								b = 0;
							} else {
								e = 0;
							}
							a = a << 6 | b;
							if (++t & 4) {
								o[s++] = a >> 16 & 255;
								if (e < 2) {
									o[s++] = a >> 8 & 255;
									if (!e) {
										o[s++] = a & 255;
									}
								}
								t = 0;
							}
						} else if (!ws(c)) {
							e = 0;
						}
					}
				}
				e++;
			} else {
				e = 0;
			}
			if (++t & 4) {
				s += e < 2 ? 3 - e : 1;
				t = 0;
			}
		} else if (!ws(c)) {
			e = 0;
		}
	}
	throw new SyntaxError(utf8ErrorEnd(d));
}

/**
 * Read integer.
 *
 * @param d Data.
 * @param p Offset pointer.
 * @param l Length.
 * @param z Truthy to limit to 64-bit signed or unsigned.
 * @returns Integer.
 */
function integer(
	d: Uint8Array,
	p: [number],
	l: number,
	m: boolean | number | bigint,
): bigint {
	let x;
	let n;
	let r = 0n;
	let i = whitespace(d, p[0]);
	let c = d[i];
	c = c === 45
		? d[n = i = whitespace(d, i + 1)]
		: c === 43
		? d[i = whitespace(d, i + 1)]
		: c;
	m = (1n << (m ? n ? 63n : 64n : 127n)) - (n ? r : 1n);
	if ((x = c === 48) && ((c = d[++i]) === 120 || c === 88)) {
		c = d[++i];
		do {
			x = b16d(c);
			if (x < 0 || (r = r << 4n | BigInt(x)) > m) {
				throw new SyntaxError(
					i < l ? utf8ErrorXML(d, i) : utf8ErrorEnd(d),
				);
			}
		} while ((c = d[++i]) !== 60);
	} else if (c !== 60 || !x) {
		do {
			if (!(c > 47 && c < 58) || (r = r * 10n + BigInt(c - 48)) > m) {
				throw new SyntaxError(
					i < l ? utf8ErrorXML(d, i) : utf8ErrorEnd(d),
				);
			}
		} while ((c = d[++i]) !== 60);
	}
	p[0] = i;
	return n ? -r : r;
}

/**
 * Read real.
 *
 * @param d Data.
 * @param p Offset pointer.
 * @param l Length.
 * @returns Real.
 */
function real(d: Uint8Array, p: [number], l: number): number {
	let s = string(d, p, l);
	switch (s.toLowerCase()) {
		case 'nan': {
			return NaN;
		}
		case 'inf':
		case '+inf':
		case 'infinity':
		case '+infinity': {
			return Infinity;
		}
		case '-inf':
		case '-infinity': {
			return -Infinity;
		}
	}
	if (!rREAL.test(s = s.replace(rRLWS, '')) || (l = +s) !== l) {
		throw new SyntaxError(utf8ErrorXML(d, p[0]));
	}
	return l;
}

/**
 * Read string.
 *
 * @param d Data.
 * @param p Offset pointer.
 * @param l Length.
 * @returns String.
 */
function string(d: Uint8Array, p: [number], l: number): string {
	let r = '', [i] = p, j = i, a, b, c;
	for (; i < l; i++) {
		c = d[i];
		if (c === 60) {
			c = d[i + 1];
			if (c === 47) {
				r += utf8Decode(d, j, i);
				p[0] = i;
				return r;
			}
			if (
				c === 33 &&
				d[i + 2] === 91 &&
				d[i + 3] === 67 &&
				d[i + 4] === 68 &&
				d[i + 5] === 65 &&
				d[i + 6] === 84 &&
				d[i + 7] === 65 &&
				d[i + 8] === 91
			) {
				r += utf8Decode(d, j, i);
				for (j = i += 9; i < l; i++) {
					a = b;
					b = c;
					c = d[i];
					if (c === 62 && b === 93 && a === 93) {
						r += utf8Decode(d, j, i - 2);
						j = i + 1;
						break;
					}
				}
				if (i < l) {
					continue;
				}
			}
			utf8Length(d, j, i);
			throw new SyntaxError(
				++i < l ? utf8ErrorXML(d, i) : utf8ErrorEnd(d),
			);
		} else if (c === 38) {
			r += utf8Decode(d, j, i);
			c = d[++i];
			b = -1;
			if (c === 97) {
				c = d[++i];
				if (c === 109) {
					if (d[++i] === 112 && d[++i] === 59) {
						b = 38;
					}
				} else if (
					c === 112 &&
					d[++i] === 111 &&
					d[++i] === 115 &&
					d[++i] === 59
				) {
					b = 39;
				}
			} else if (c === 103) {
				if (d[++i] === 116 && d[++i] === 59) {
					b = 62;
				}
			} else if (c === 108) {
				if (d[++i] === 116 && d[++i] === 59) {
					b = 60;
				}
			} else if (c === 113) {
				if (
					d[++i] === 117 &&
					d[++i] === 111 &&
					d[++i] === 116 &&
					d[++i] === 59
				) {
					b = 34;
				}
			} else if (c === 35) {
				a = 0;
				c = d[++i];
				if (c === 120) {
					for (c = d[++i]; i < l; c = d[++i]) {
						if (c > 47) {
							if (c < 58) {
								a = (a << 4) + c - 48 & 65535;
								continue;
							}
							if (c > 64) {
								if (c < 71) {
									a = (a << 4) + c - 55 & 65535;
									continue;
								}
								if (c > 96 && c < 103) {
									a = (a << 4) + c - 87 & 65535;
									continue;
								}
							}
						}
						break;
					}
				} else {
					for (; i < l; c = d[++i]) {
						if (c < 48 || c > 57) {
							break;
						}
						a = a * 10 + c - 48 & 65535;
					}
				}
				if (c === 59 && !(a > 55295 && a < 57344)) {
					b = a;
				}
			}
			if (b < 0) {
				throw new SyntaxError(
					i < l ? utf8ErrorXML(d, i) : utf8ErrorEnd(d),
				);
			}
			r += String.fromCharCode(b);
			j = i + 1;
		}
	}
	utf8Length(d, j, l);
	throw new SyntaxError(utf8ErrorEnd(d));
}

/**
 * XML decoder.
 *
 * @param encoding Encoding.
 * @param data Data.
 * @returns Data converted to UTF-8 or null if unsupported.
 */
export type DecodeXmlDecoder = (
	encoding: string,
	data: Uint8Array,
) => ArrayBufferView | ArrayBuffer | null | void;

/**
 * Decode XML plist options.
 */
export interface DecodeXmlOptions {
	/**
	 * Optonal decoder for converting to UTF-8.
	 */
	decoder?: DecodeXmlDecoder;

	/**
	 * Optional UTF-16 endian flag.
	 * Defaults to auto detect.
	 */
	utf16le?: boolean;

	/**
	 * Optionally limit integers to 64-bit signed or unsigned values.
	 *
	 * @default false
	 */
	int64?: boolean;
}

/**
 * Decode XML plist result.
 */
export interface DecodeXmlResult {
	/**
	 * Encoded format.
	 */
	format: typeof FORMAT_XML_V1_0 | typeof FORMAT_XML_V0_9;

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
export function decodeXml(
	encoded: ArrayBufferView | ArrayBuffer,
	{
		decoder,
		utf16le,
		int64 = false,
	}: Readonly<DecodeXmlOptions> = {},
): DecodeXmlResult {
	let x;
	let d;
	let u;
	if (utf8.has(encoded as Uint8Array)) {
		d = encoded as Uint8Array;
	} else {
		u = utf8Encoded(d = bytes(encoded), utf16le);
		if (
			!u &&
			(x = encoding(d)) !== null &&
			!rUTF8.test(x) &&
			!(u = decoder?.(x, d))
		) {
			throw new RangeError(`Unsupported encoding: ${x}`);
		}
		d = u ? bytes(u) : d;
	}
	const l = d.length;
	const j: [number] = [0];
	let a;
	let b;
	let c;
	let f;
	let i = 0;
	let k: PLString | null = null;
	let n: Node | null = null;
	let o: PLArray | PLDict | Plist;
	let p: typeof o;
	let q;
	let s;
	let t;
	let z;
	let format: DecodeXmlResult['format'] = FORMAT_XML_V1_0;
	u = new Map<PLDict, PLString>();
	for (;;) {
		c = d[i = whitespace(d, i)];
		if (c !== 60) {
			throw new SyntaxError(i < l ? utf8ErrorXML(d, i) : utf8ErrorEnd(d));
		}
		c = d[++i];
		if (c === 33) {
			i = d[++i] === 45 && d[i + 1] === 45
				? comment(d, i + 2, l)
				: doctype(d, i, l);
		} else if (c === 63) {
			i = instruction(d, i + 1, l);
		} else {
			break;
		}
	}
	for (;;) {
		if (c === 47) {
			if (!n || k) {
				throw new SyntaxError(utf8ErrorXML(d, i));
			}
			x = n as Node;
			t = ++i;
			for (f = n.t, s = x.s; s && d[i] === d[f++]; ++i, s--);
			if (s || d[i = whitespace(d, i)] !== 62) {
				throw new SyntaxError(
					i < l ? utf8ErrorXML(d, i) : utf8ErrorEnd(d),
				);
			}
			++i;
			n = x.n;
			f = x.a;
			if (f === 100) {
				f = q = x.p as PLDict;
				if (q.size === 1 && (x = q.find('CF$UID'))) {
					a = x[Symbol.toStringTag];
					if (a === PLTYPE_INTEGER) {
						q = new PLUID((x as PLInteger).value);
					} else if (a === PLTYPE_REAL) {
						a = (x as PLReal).value || 0;
						q = new PLUID(
							a === Infinity
								? 0x7FFFFFFFn
								: a === -Infinity
								? 0x80000000n
								: BigInt(a - a % 1),
						);
					}
				}
				if (!n) {
					return { format, plist: q };
				}
				a = n.a;
				p = n.p;
				if (f !== q) {
					if (a === 100) {
						(p as PLDict).set(u.get(f)!, q);
					} else if (a === 97) {
						(p as PLArray).set((p as PLArray).length - 1, q);
					} else if (a === 112) {
						(p as Plist).v = q;
					}
				}
				u.delete(f);
			} else if (f === 112) {
				x = x.p as Plist;
				q = x.v;
				if (!q) {
					throw new SyntaxError(utf8ErrorXML(d, t));
				}
				if (!n) {
					return { format, plist: q };
				}
				a = n.a;
				p = n.p;
				if (a === 100) {
					(p as PLDict).set(x.k!, q);
				} else if (a === 97) {
					(p as PLArray).push(q);
				} else if (a === 112) {
					(p as Plist).v = q;
				}
			} else if (n) {
				a = n.a;
				p = n.p;
			} else {
				return { format, plist: x.p as PLType };
			}
		} else {
			for (f = s = -1, t = i; i < l && (b = d[i]) !== 62; f = b, i++) {
				if (s < 0 && ws(b)) {
					s = i - t;
				}
			}
			if (i >= l) {
				throw new SyntaxError(utf8ErrorEnd(d));
			}
			f = f === 47;
			if (s < 0) {
				s = i - t - (f as unknown as number);
			}
			if ((q = !s)) {
				throw new SyntaxError(utf8ErrorXML(d, t));
			}
			x = i++;
			z = a!;
			o = p!;
			switch (c) {
				case 97: {
					if (
						d[t + 1] === 114 &&
						d[t + 2] === 114 &&
						d[t + 3] === 97 &&
						d[t + 4] === 121
					) {
						q = new PLArray();
						if (!f) {
							a = c;
							p = q;
							f = n = { a, t, s, p, n };
						}
					}
					break;
				}
				case 100: {
					x = d[t + 1];
					if (x === 105) {
						if (d[t + 2] === 99 && d[t + 3] === 116) {
							q = new PLDict();
							if (!f) {
								a = c;
								p = q;
								f = n = { a, t, s, p, n };
								if (k) {
									u.set(q, k);
								}
							}
						}
					} else if (!f && x === 97 && d[t + 2] === 116) {
						if (d[t + 3] === 97) {
							j[0] = i;
							q = data(d, j, l);
							i = j[0];
						} else if (d[t + 3] === 101) {
							j[0] = i;
							q = date(d, j, l);
							i = j[0];
						}
					}
					break;
				}
				case 102: {
					if (
						d[t + 1] === 97 &&
						d[t + 2] === 108 &&
						d[t + 3] === 115 &&
						d[t + 4] === 101
					) {
						q = new PLBoolean(false);
					}
					break;
				}
				case 105: {
					if (
						!f &&
						d[t + 1] === 110 &&
						d[t + 2] === 116 &&
						d[t + 3] === 101 &&
						d[t + 4] === 103 &&
						d[t + 5] === 101
					) {
						j[0] = i;
						q = new PLInteger(
							q = integer(d, j, l, int64),
							(q < 0 ? ~q : q) >> 63n ? 128 : 64,
						);
						i = j[0];
					}
					break;
				}
				case 107: {
					if (d[t + 1] === 101 && d[t + 2] === 121) {
						if (f) {
							q = '';
						} else {
							j[0] = i;
							q = string(d, j, l);
							i = j[0];
						}
						q = new PLString(q);
					}
					break;
				}
				case 112: {
					if (
						!f &&
						d[t + 1] === 108 &&
						d[t + 2] === 105 &&
						d[t + 3] === 115 &&
						d[t + 4] === 116
					) {
						if (!n) {
							for (f = t + s; f < x;) {
								if (ws(a = d[f++])) {
									if (
										d[f] === 118 &&
										d[++f] === 101 &&
										d[++f] === 114 &&
										d[++f] === 115 &&
										d[++f] === 105 &&
										d[++f] === 111 &&
										d[++f] === 110 &&
										d[++f] === 61
									) {
										a = d[++f];
										if (
											(a === 34 || a === 39) &&
											d[++f] === 48 &&
											d[++f] === 46 &&
											d[++f] === 57 &&
											d[++f] === a
										) {
											format = FORMAT_XML_V0_9;
										}
										break;
									}
								} else if (a === 34 || a === 39) {
									for (; f < x && d[f++] !== a;);
								}
							}
						}
						a = c;
						p = q = { k, v: null } satisfies Plist;
						f = n = { a, t, s, p, n };
					}
					break;
				}
				case 114: {
					if (
						!f &&
						d[t + 1] === 101 &&
						d[t + 2] === 97 &&
						d[t + 3] === 108
					) {
						j[0] = i;
						q = new PLReal(real(d, j, l));
						i = j[0];
					}
					break;
				}
				case 115: {
					if (
						d[t + 1] === 116 &&
						d[t + 2] === 114 &&
						d[t + 3] === 105 &&
						d[t + 4] === 110 &&
						d[t + 5] === 103
					) {
						if (f) {
							q = '';
						} else {
							j[0] = i;
							q = string(d, j, l);
							i = j[0];
						}
						q = new PLString(q);
					}
					break;
				}
				case 116: {
					if (
						d[t + 1] === 114 &&
						d[t + 2] === 117 &&
						d[t + 3] === 101
					) {
						q = new PLBoolean(true);
					}
					break;
				}
			}
			if (!q) {
				throw new SyntaxError(utf8ErrorXML(d, t));
			}
			if (!f) {
				if (d[i] === 60 && d[++i] === 47) {
					for (f = t, ++i; s && d[i] === d[f++]; ++i, s--);
				}
				if (s || d[i = whitespace(d, i)] !== 62) {
					throw new SyntaxError(
						i < l ? utf8ErrorXML(d, i) : utf8ErrorEnd(d),
					);
				}
				++i;
			}
			if (z === 100) {
				if (k) {
					if (c !== 112) {
						(o as PLDict).set(k, q as PLType);
					}
					k = null;
				} else if (c === 107) {
					k = q as PLString;
				} else {
					throw new SyntaxError(utf8ErrorXML(d, t));
				}
			} else if (z === 97) {
				if (c !== 112) {
					(o as PLArray).push(q as PLType);
				}
			} else if (z === 112) {
				if (c !== 112) {
					if ((o as Plist).v) {
						throw new SyntaxError(utf8ErrorXML(d, t));
					}
					(o as Plist).v = q as PLType;
				}
			} else if (!n) {
				return { format, plist: q as PLType };
			}
		}
		for (;;) {
			c = d[i = whitespace(d, i)];
			if (c !== 60) {
				throw new SyntaxError(
					i < l ? utf8ErrorXML(d, i) : utf8ErrorEnd(d),
				);
			}
			c = d[++i];
			if (c === 33) {
				if (d[i + 1] === 45 && d[i + 2] === 45) {
					i = comment(d, i + 3, l);
				}
			} else if (c === 63) {
				i = instruction(d, i + 1, l);
			} else {
				break;
			}
		}
	}
}
