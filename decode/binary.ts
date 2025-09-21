/**
 * @module
 *
 * Binary decoding.
 */

import { PLArray } from '../array.ts';
import { PLBoolean } from '../boolean.ts';
import { PLData } from '../data.ts';
import { PLDate } from '../date.ts';
import { PLDict } from '../dict.ts';
import { FORMAT_BINARY_V1_0 } from '../format.ts';
import { PLInteger } from '../integer.ts';
import { binaryError, bytes } from '../pri/data.ts';
import { PLReal } from '../real.ts';
import { PLString, PLTYPE_STRING } from '../string.ts';
import type { PLType } from '../type.ts';
import { PLUID } from '../uid.ts';

/**
 * Queue next.
 */
type Next = Generator<Next, Next | undefined>;

const U32_MAX = 0xffffffff;
const I64_MAX = 0x7fffffffffffffffn;
const U64_MAX = 0xffffffffffffffffn;
const U128_MAX = 0xffffffffffffffffffffffffffffffffn;

/**
 * Get 64-bit uint of size.
 *
 * @param d Data.
 * @param i Offset.
 * @param c Byte count.
 * @returns Integer.
 */
function getU(d: Uint8Array, i: number, c: number): bigint {
	let r = 0n;
	for (; c--; r = r << 8n & U64_MAX | BigInt(d[i++]));
	return r;
}

/**
 * Get 128-bit uint of size.
 *
 * @param d Data.
 * @param i Offset.
 * @param c Byte count.
 * @returns Integer.
 */
function getUU(d: Uint8Array, i: number, c: number): bigint {
	let r = 0n;
	for (; c--; r = r << 8n & U128_MAX | BigInt(d[i++]));
	return r;
}

/**
 * Get references.
 *
 * @param d Data.
 * @param i Offset.
 * @param c Byte count.
 * @param l Length.
 * @yields Integer.
 */
function* getRefs(
	d: Uint8Array,
	i: number,
	c: number,
	l: number,
): Generator<number> {
	for (; l--; i += c) {
		yield Number(getU(d, i, c));
	}
}

/**
 * Decode binary plist options.
 */
export interface DecodeBinaryOptions {
	/**
	 * Optionally limit integers to 64-bit signed or unsigned values.
	 *
	 * @default false
	 */
	int64?: boolean;
}

/**
 * Decode binary plist result.
 */
export interface DecodeBinaryResult {
	/**
	 * Encoded format.
	 */
	format: typeof FORMAT_BINARY_V1_0;

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
export function decodeBinary(
	encoded: ArrayBufferView | ArrayBuffer,
	{ int64 = false }: Readonly<DecodeBinaryOptions> = {},
): DecodeBinaryResult {
	const d = bytes(encoded);
	let l = d.length;
	let plist: PLType;
	let objects;
	let table;
	let top: Next | bigint | undefined;
	let x;
	if (
		l < 8 ||
		d[0] !== 98 ||
		d[1] !== 112 ||
		d[2] !== 108 ||
		d[3] !== 105 ||
		d[4] !== 115 ||
		d[5] !== 116 ||
		d[6] !== 48
	) {
		throw new SyntaxError(binaryError(0));
	}
	if (l < 40) {
		throw new SyntaxError(binaryError(8));
	}
	const v = new DataView(d.buffer, d.byteOffset, d.byteLength);
	const intc = d[l - 26];
	const refc = d[l - 25];
	objects = v.getBigUint64(l - 24);
	top = v.getBigUint64(l - 16);
	table = v.getBigUint64(l - 8);
	if (objects > I64_MAX) {
		throw new SyntaxError(binaryError(l - 24));
	}
	if (table > I64_MAX) {
		throw new SyntaxError(binaryError(l - 8));
	}
	if (!objects) {
		throw new SyntaxError(binaryError(l - 24));
	}
	if (top >= objects) {
		throw new SyntaxError(binaryError(l - 16));
	}
	if (table < 9 || table > l - 32) {
		throw new SyntaxError(binaryError(l - 8));
	}
	if (!intc) {
		throw new SyntaxError(binaryError(l - 26));
	}
	if (!refc) {
		throw new SyntaxError(binaryError(l - 25));
	}
	x = objects * BigInt(intc);
	if (x > U64_MAX || Number(table + x) + 32 !== l) {
		throw new SyntaxError(binaryError(l - 24));
	}
	if (refc < 8 && (1n << BigInt(refc * 8)) <= objects) {
		throw new SyntaxError(binaryError(l - 25));
	}
	if (intc < 8 && (1n << BigInt(intc * 8)) <= table) {
		throw new SyntaxError(binaryError(l - 26));
	}
	for (
		x = table = Number(table), l = objects = Number(objects);
		l--;
		x += intc
	) {
		if (getU(d, x, intc) >= table) {
			throw new SyntaxError(binaryError(x));
		}
	}
	const ancestors = new Set<PLType>();
	const object = new Map<number, PLType>();
	const walk = function* (
		refs: Iterable<number>,
		push: (p: PLType) => unknown,
		next?: Next,
		anci?: number,
	): Next {
		let c;
		let i: number;
		let p: PLType | undefined;
		let ref: number | string | Map<number, PLString>;
		let marker: number;
		for (ref of refs) {
			i = Number(getU(d, x = table + ref * intc, intc));
			if (i > 7) {
				if ((p = object.get(i))) {
					if (ancestors.has(p)) {
						throw new SyntaxError(binaryError(anci!));
					}
					push(p);
					continue;
				}
				marker = d[x = i++];
				switch (marker >> 4) {
					case 0: {
						switch (marker) {
							case 8: {
								object.set(x, p = new PLBoolean(false));
								push(p);
								continue;
							}
							case 9: {
								object.set(x, p = new PLBoolean(true));
								push(p);
								continue;
							}
						}
						break;
					}
					case 1: {
						c = 1 << (marker & 15);
						if (i + c > table) {
							break;
						}
						object.set(
							x,
							p = new PLInteger(
								int64 ? getU(d, i, c) : getUU(d, i, c),
								c > 8 ? 128 : 64,
							),
						);
						push(p);
						continue;
					}
					case 2: {
						switch (marker & 15) {
							case 2: {
								if (i + 4 > table) {
									break;
								}
								object.set(
									x,
									p = new PLReal(v.getFloat32(i), 32),
								);
								push(p);
								continue;
							}
							case 3: {
								if (i + 8 > table) {
									break;
								}
								object.set(
									x,
									p = new PLReal(v.getFloat64(i), 64),
								);
								push(p);
								continue;
							}
						}
						break;
					}
					case 3: {
						if (marker !== 51 || i + 8 > table) {
							break;
						}
						object.set(x, p = new PLDate(v.getFloat64(i)));
						push(p);
						continue;
					}
					case 4: {
						c = marker & 15;
						if (c === 15) {
							if (
								i > table ||
								((ref = d[i++]) & 0xf0) !== 16 ||
								i + (ref = 1 << (ref & 15)) > table
							) {
								break;
							}
							c = Number(getU(d, i, ref));
							i += ref;
						}
						if (i + c > table) {
							break;
						}
						object.set(x, p = new PLData(c));
						new Uint8Array(p.buffer).set(d.subarray(i, i + c));
						push(p);
						continue;
					}
					case 5: {
						c = marker & 15;
						if (c === 15) {
							if (
								i > table ||
								((ref = d[i++]) & 0xf0) !== 16 ||
								i + (ref = 1 << (ref & 15)) > table
							) {
								break;
							}
							c = Number(getU(d, i, ref));
							i += ref;
						}
						if (i + c > table) {
							break;
						}
						ref = '';
						for (; c--;) {
							ref += String.fromCharCode(d[i++]);
						}
						object.set(x, p = new PLString(ref));
						push(p);
						continue;
					}
					case 6: {
						c = marker & 15;
						if (c === 15) {
							if (
								i > table ||
								((ref = d[i++]) & 0xf0) !== 16 ||
								i + (ref = 1 << (ref & 15)) > table
							) {
								break;
							}
							c = Number(getU(d, i, ref));
							i += ref;
						}
						if (i + c * 2 > table) {
							break;
						}
						ref = '';
						for (; c--; i += 2) {
							ref += String.fromCharCode(v.getUint16(i));
						}
						object.set(x, p = new PLString(ref));
						push(p);
						continue;
					}
					case 8: {
						c = (marker & 15) + 1;
						if (i + c > table || (c = getU(d, i, c)) > U32_MAX) {
							break;
						}
						object.set(x, p = new PLUID(c));
						push(p);
						continue;
					}
					case 10: {
						c = marker & 15;
						if (c === 15) {
							if (
								i > table ||
								((ref = d[i++]) & 0xf0) !== 16 ||
								i + (ref = 1 << (ref & 15)) > table
							) {
								break;
							}
							c = Number(getU(d, i, ref));
							i += ref;
						}
						if (i + c * refc > table) {
							break;
						}
						object.set(x, p = new PLArray());
						if (c) {
							ancestors.add(p);
							yield walk(
								getRefs(d, i, refc, c),
								p.push.bind(p),
								top as Next,
								x,
							);
							ancestors.delete(p);
						}
						push(p);
						continue;
					}
					case 13: {
						c = marker & 15;
						if (c === 15) {
							if (
								i > table ||
								((ref = d[i++]) & 0xf0) !== 16 ||
								i + (ref = 1 << (ref & 15)) > table
							) {
								break;
							}
							c = Number(getU(d, i, ref));
							i += ref;
						}
						if (i + c * 2 * refc > table) {
							break;
						}
						object.set(x, p = new PLDict());
						if (c) {
							ancestors.add(p);
							anci = x;
							ref = new Map<number, PLString>();
							marker = 0;
							yield walk(
								getRefs(d, i, refc, c),
								(o) => {
									if (
										o[Symbol.toStringTag] !== PLTYPE_STRING
									) {
										throw new SyntaxError(
											binaryError(i + marker * refc),
										);
									}
									(ref as Map<number, PLString>).set(
										marker++,
										o as PLString,
									);
								},
								top as Next,
								anci,
							);
							marker = 0;
							yield walk(
								getRefs(d, i + c * refc, refc, c),
								(o) =>
									(p as PLDict).set(
										(ref as Map<number, PLString>).get(
											marker++,
										)!,
										o,
									),
								top as Next,
								anci,
							);
							ancestors.delete(p);
						}
						push(p);
						continue;
					}
				}
			}
			throw new SyntaxError(binaryError(x));
		}
		return next;
	};
	for (
		top = walk([Number(top)], (p: PLType) => plist = p);
		(top = top.next().value);
	);
	return { plist: plist!, format: FORMAT_BINARY_V1_0 };
}
