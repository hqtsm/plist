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
	let objectC;
	let tableI;
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
	const intC = d[l - 26];
	const refC = d[l - 25];
	objectC = v.getBigUint64(l - 24);
	top = v.getBigUint64(l - 16);
	tableI = v.getBigUint64(l - 8);
	if (objectC > I64_MAX) {
		throw new SyntaxError(binaryError(l - 24));
	}
	if (tableI > I64_MAX) {
		throw new SyntaxError(binaryError(l - 8));
	}
	if (!objectC || top >= objectC) {
		throw new SyntaxError(binaryError(l - 24));
	}
	if (tableI < 9 || tableI > l - 32) {
		throw new SyntaxError(binaryError(l - 8));
	}
	if (!intC) {
		throw new SyntaxError(binaryError(l - 26));
	}
	if (!refC) {
		throw new SyntaxError(binaryError(l - 25));
	}
	x = objectC * BigInt(intC);
	if (x > U64_MAX || Number(tableI + x) + 32 !== l) {
		throw new SyntaxError(binaryError(l - 24));
	}
	if (refC < 8 && (1n << BigInt(refC * 8)) <= objectC) {
		throw new SyntaxError(binaryError(l - 25));
	}
	if (intC < 8 && (1n << BigInt(intC * 8)) <= tableI) {
		throw new SyntaxError(binaryError(l - 26));
	}
	for (
		x = tableI = Number(tableI), l = objectC = Number(objectC);
		l--;
		x += intC
	) {
		if (getU(d, x, intC) >= tableI) {
			throw new SyntaxError(binaryError(x));
		}
	}
	const objects = new Map<number, PLType>();
	const walk = function* (
		refs: Iterable<number>,
		push: (p: PLType) => unknown,
		next?: Next,
	): Next {
		let c;
		let i: number;
		let p: PLType | undefined;
		let ref: number | string | Map<number, PLString>;
		let marker: number;
		for (ref of refs) {
			i = Number(getU(d, x = tableI + ref * intC, intC));
			if (i > 7) {
				if ((p = objects.get(i))) {
					push(p);
					continue;
				}
				marker = d[x = i++];
				switch (marker >> 4) {
					case 0: {
						switch (marker) {
							case 8: {
								objects.set(x, p = new PLBoolean(false));
								push(p);
								continue;
							}
							case 9: {
								objects.set(x, p = new PLBoolean(true));
								push(p);
								continue;
							}
						}
						break;
					}
					case 1: {
						c = 1 << (marker & 15);
						if (i + c > tableI) {
							break;
						}
						objects.set(
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
								if (i + 4 > tableI) {
									break;
								}
								objects.set(
									x,
									p = new PLReal(v.getFloat32(i), 32),
								);
								push(p);
								continue;
							}
							case 3: {
								if (i + 8 > tableI) {
									break;
								}
								objects.set(
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
						if (marker !== 51 || i + 8 > tableI) {
							break;
						}
						objects.set(x, p = new PLDate(v.getFloat64(i)));
						push(p);
						continue;
					}
					case 4: {
						c = marker & 15;
						if (c === 15) {
							if (
								i > tableI ||
								((ref = d[i++]) & 0xf0) !== 16 ||
								i + (ref = 1 << (ref & 15)) > tableI
							) {
								break;
							}
							c = Number(getU(d, i, ref));
							i += ref;
						}
						if (i + c > tableI) {
							break;
						}
						objects.set(x, p = new PLData(c));
						new Uint8Array(p.buffer).set(d.subarray(i, i + c));
						push(p);
						continue;
					}
					case 5: {
						c = marker & 15;
						if (c === 15) {
							if (
								i > tableI ||
								((ref = d[i++]) & 0xf0) !== 16 ||
								i + (ref = 1 << (ref & 15)) > tableI
							) {
								break;
							}
							c = Number(getU(d, i, ref));
							i += ref;
						}
						if (i + c > tableI) {
							break;
						}
						ref = '';
						for (; c--;) {
							ref += String.fromCharCode(d[i++]);
						}
						objects.set(x, p = new PLString(ref));
						push(p);
						continue;
					}
					case 6: {
						c = marker & 15;
						if (c === 15) {
							if (
								i > tableI ||
								((ref = d[i++]) & 0xf0) !== 16 ||
								i + (ref = 1 << (ref & 15)) > tableI
							) {
								break;
							}
							c = Number(getU(d, i, ref));
							i += ref;
						}
						if (i + c * 2 > tableI) {
							break;
						}
						ref = '';
						for (; c--; i += 2) {
							ref += String.fromCharCode(v.getUint16(i));
						}
						objects.set(x, p = new PLString(ref));
						push(p);
						continue;
					}
					case 8: {
						c = (marker & 15) + 1;
						if (i + c > tableI || (c = getU(d, i, c)) > U32_MAX) {
							break;
						}
						objects.set(x, p = new PLUID(c));
						push(p);
						continue;
					}
					case 10: {
						c = marker & 15;
						if (c === 15) {
							if (
								i > tableI ||
								((ref = d[i++]) & 0xf0) !== 16 ||
								i + (ref = 1 << (ref & 15)) > tableI
							) {
								break;
							}
							c = Number(getU(d, i, ref));
							i += ref;
						}
						if (i + c * refC > tableI) {
							break;
						}
						objects.set(x, p = new PLArray());
						if (c) {
							yield walk(
								getRefs(d, i, refC, c),
								p.push.bind(p),
								top as Next,
							);
						}
						push(p);
						continue;
					}
					case 13: {
						c = marker & 15;
						if (c === 15) {
							if (
								i > tableI ||
								((ref = d[i++]) & 0xf0) !== 16 ||
								i + (ref = 1 << (ref & 15)) > tableI
							) {
								break;
							}
							c = Number(getU(d, i, ref));
							i += ref;
						}
						if (i + c * 2 * refC > tableI) {
							break;
						}
						objects.set(x, p = new PLDict());
						if (c) {
							ref = new Map<number, PLString>();
							marker = 0;
							yield walk(
								getRefs(d, i, refC, c),
								(o) => {
									if (
										o[Symbol.toStringTag] !== PLTYPE_STRING
									) {
										throw new SyntaxError(
											binaryError(i + marker * refC),
										);
									}
									(ref as Map<number, PLString>).set(
										marker++,
										o as PLString,
									);
								},
								top as Next,
							);
							marker = 0;
							yield walk(
								getRefs(d, i + c * refC, refC, c),
								(o) => {
									(p as PLDict).set(
										(ref as Map<number, PLString>).get(
											marker++,
										)!,
										o,
									);
								},
								top as Next,
							);
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
