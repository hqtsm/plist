/**
 * @module
 *
 * Binary decoding.
 */

import { PLBoolean } from '../boolean.ts';
import { PLDate } from '../date.ts';
import { FORMAT_BINARY_V1_0 } from '../format.ts';
import { PLInteger } from '../integer.ts';
import { binaryError, bytes } from '../pri/data.ts';
import { PLReal } from '../real.ts';
import type { PLType } from '../type.ts';

type Next = Generator<Next, Next | undefined>;

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
	let q: Next | undefined;
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
	const top = v.getBigUint64(l - 16);
	objects = v.getBigUint64(l - 24);
	table = v.getBigUint64(l - 8);
	if (I64_MAX < objects) {
		throw new SyntaxError(binaryError(l - 24));
	}
	if (I64_MAX < table) {
		throw new SyntaxError(binaryError(l - 8));
	}
	if (!objects || objects <= top) {
		throw new SyntaxError(binaryError(l - 24));
	}
	if (table < 9 || table > l - 32) {
		throw new SyntaxError(binaryError(l - 8));
	}
	if (!intC) {
		throw new SyntaxError(binaryError(l - 26));
	}
	if (!refC) {
		throw new SyntaxError(binaryError(l - 25));
	}
	x = objects * BigInt(intC);
	if (x > U64_MAX || Number(table + x) + 32 !== l) {
		throw new SyntaxError(binaryError(l - 24));
	}
	if (refC < 8 && (1n << BigInt(refC * 8)) <= objects) {
		throw new SyntaxError(binaryError(l - 25));
	}
	if (intC < 8 && (1n << BigInt(intC * 8)) <= table) {
		throw new SyntaxError(binaryError(l - 26));
	}
	for (
		x = table = Number(table), l = objects = Number(objects);
		l--;
		x += intC
	) {
		if (table <= getU(d, x, intC)) {
			throw new SyntaxError(binaryError(x));
		}
	}
	const tabled = new Map<number, PLType>();
	// deno-lint-ignore require-yield
	const walk = function* (
		refs: Iterable<number>,
		push: (p: PLType) => unknown,
		next?: Next,
	): Next {
		let c;
		let i;
		let p;
		let ref;
		let marker;
		for (ref of refs) {
			if ((p = tabled.get(ref))) {
				push(p);
				continue;
			}
			i = Number(getU(d, x = table + ref * intC, intC));
			if (i < 8) {
				throw new SyntaxError(binaryError(x));
			}
			marker = d[x = i++];
			switch (marker & 240) {
				case 0: {
					switch (marker) {
						case 8: {
							tabled.set(ref, p = new PLBoolean(false));
							push(p);
							continue;
						}
						case 9: {
							tabled.set(ref, p = new PLBoolean(true));
							push(p);
							continue;
						}
					}
					break;
				}
				case 16: {
					c = 1 << (marker & 15);
					if (table < i + c) {
						break;
					}
					tabled.set(
						ref,
						p = new PLInteger(
							int64 ? getU(d, i, c) : getUU(d, i, c),
							c > 8 ? 128 : 64,
						),
					);
					push(p);
					continue;
				}
				case 32: {
					switch (marker & 15) {
						case 2: {
							if (table < i + 4) {
								break;
							}
							tabled.set(
								ref,
								p = new PLReal(v.getFloat32(i), 32),
							);
							push(p);
							continue;
						}
						case 3: {
							if (table < i + 8) {
								break;
							}
							tabled.set(
								ref,
								p = new PLReal(v.getFloat64(i), 64),
							);
							push(p);
							continue;
						}
					}
					break;
				}
				case 48: {
					if (marker !== 51 || table < i + 8) {
						break;
					}
					tabled.set(ref, p = new PLDate(v.getFloat64(i)));
					push(p);
					continue;
				}
			}
			throw new SyntaxError(binaryError(x));
		}
		return next;
	};
	for (
		q = walk([Number(top)], (p: PLType) => plist = p);
		(q = q.next().value);
	);
	return { plist: plist!, format: FORMAT_BINARY_V1_0 };
}
