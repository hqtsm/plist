/**
 * @module
 *
 * Binary encoding.
 */

import { type PLArray, PLTYPE_ARRAY } from '../array.ts';
import { type PLBoolean, PLTYPE_BOOLEAN } from '../boolean.ts';
import { type PLData, PLTYPE_DATA } from '../data.ts';
import { type PLDate, PLTYPE_DATE } from '../date.ts';
import { type PLDict, PLTYPE_DICT } from '../dict.ts';
import { FORMAT_BINARY_V1_0 } from '../format.ts';
import { type PLInteger, PLTYPE_INTEGER } from '../integer.ts';
import { PLTYPE_NULL } from '../null.ts';
import { type PLReal, PLTYPE_REAL } from '../real.ts';
import { type PLSet, PLTYPE_SET } from '../set.ts';
import { type PLString, PLTYPE_STRING } from '../string.ts';
import type { PLType } from '../type.ts';
import { PLTYPE_UID, type PLUID } from '../uid.ts';
import { walk } from '../walk.ts';

const rUni = /[^\0-\x7F]/;

/**
 * Number of bytes needed to encode integer.
 *
 * @param v Unsigned integer.
 * @returns Byte count.
 */
const byteCount = (v: number | bigint): 1 | 2 | 4 | 8 =>
	v > 65535 ? (v > 4294967295 ? 8 : 4) : (v > 255 ? 2 : 1);

/**
 * Set integer value by byte count.
 *
 * @param d Data view.
 * @param i Offset.
 * @param c Byte count.
 * @param v Unsigned integer.
 */
const setInt = (
	d: DataView,
	i: number,
	c: 1 | 2 | 4 | 8,
	v: number | bigint,
): void => {
	if (c > 2) {
		if (c > 4) {
			d.setBigInt64(i, BigInt(v));
		} else {
			d.setInt32(i, Number(v));
		}
	} else if (c > 1) {
		d.setInt16(i, Number(v));
	} else {
		d.setInt8(i, Number(v));
	}
};

/**
 * Encode integer.
 *
 * @param d Data view.
 * @param i Offset.
 * @param v Integer.
 * @returns Unsigned integer.
 */
const encodeInt = (d: DataView, i: number, v: bigint | number): number => {
	const c = byteCount(v);
	d.setInt8(i++, c > 2 ? (c > 4 ? 19 : 18) : (c > 1 ? 17 : 16));
	setInt(d, i, c, v);
	return i + c;
};

/**
 * Encoding options for binary.
 */
export interface EncodeBinaryOptions {
	/**
	 * Encoding format.
	 *
	 * @default FORMAT_BINARY_V1_0
	 */
	format?: typeof FORMAT_BINARY_V1_0;

	/**
	 * Types to be duplicated.
	 *
	 * @default [] Empty list.
	 */
	duplicates?: Iterable<string | PLType>;
}

/**
 * Encode plist, BINARY format.
 *
 * @param plist Plist object.
 * @param options Encoding options.
 * @returns Encoded plist.
 */
export function encodeBinary(
	plist: PLType,
	{
		format = FORMAT_BINARY_V1_0,
		duplicates,
	}: Readonly<EncodeBinaryOptions> = {},
): Uint8Array {
	let e;
	let x;
	let i = 8;
	let table = 0;
	let l = 0;

	if (format !== FORMAT_BINARY_V1_0) {
		throw new RangeError('Invalid format');
	}

	const ancestors = new Set<PLType>();
	const dup = new Set(duplicates ?? []);
	const list = new Map<number, PLType>();
	const index = new Map<PLType, number>();
	const uni = new Map<PLType, boolean>();
	const add = <T extends PLType>(v: T) => {
		if (index.has(v)) {
			if (!dup.has(v) && !dup.has(v[Symbol.toStringTag])) {
				return;
			}
		} else {
			index.set(v, l);
		}
		list.set(l++, v);
		return true;
	};

	walk(
		plist,
		{
			PLArray(v, d, k): void {
				if (d && k === null) {
					throw new TypeError('Invalid binary key type');
				}
				if ((x = v.length)) {
					if (ancestors.has(v)) {
						throw new TypeError('Circular reference');
					}
					ancestors.add(v);
					if (add(v)) {
						i += x < 15 ? 1 : 2 + byteCount(x);
						table += x;
					}
				} else if (add(v)) {
					i++;
				}
			},
			PLBoolean(v, d, k): void {
				if (d && k === null) {
					throw new TypeError('Invalid binary key type');
				}
				if (add(v)) {
					i++;
				}
			},
			PLData(v, d, k): void {
				if (d && k === null) {
					throw new TypeError('Invalid binary key type');
				}
				if (add(v)) {
					x = v.byteLength;
					i += (x < 15 ? 1 : 2 + byteCount(x)) + x;
				}
			},
			PLDate(v, d, k): void {
				if (d && k === null) {
					throw new TypeError('Invalid binary key type');
				}
				if (add(v)) {
					i += 9;
				}
			},
			PLDict(v, d, k): void {
				if (d && k === null) {
					throw new TypeError('Invalid binary key type');
				}
				if ((x = v.size)) {
					if (ancestors.has(v)) {
						throw new TypeError('Circular reference');
					}
					ancestors.add(v);
					if (add(v)) {
						i += x < 15 ? 1 : 2 + byteCount(x);
						table += x + x;
					}
				} else if (add(v)) {
					i++;
				}
			},
			PLInteger(v, d, k): void {
				if (d && k === null) {
					throw new TypeError('Invalid binary key type');
				}
				if (add(v)) {
					i += 128 === v.bits
						? 17
						: (x = v.value) < 0
						? 9
						: 1 + byteCount(x);
				}
			},
			PLNull(v, d, k): void {
				if (d && k === null) {
					throw new TypeError('Invalid binary key type');
				}
				if (add(v)) {
					i++;
				}
			},
			PLReal(v, d, k): void {
				if (d && k === null) {
					throw new TypeError('Invalid binary key type');
				}
				if (add(v)) {
					i += v.bits === 32 ? 5 : 9;
				}
			},
			PLSet(v, d, k): void {
				if (d && k === null) {
					throw new TypeError('Invalid binary key type');
				}
				if ((x = v.size)) {
					if (ancestors.has(v)) {
						throw new TypeError('Circular reference');
					}
					ancestors.add(v);
					if (add(v)) {
						i += x < 15 ? 1 : 2 + byteCount(x);
						table += x;
					}
				} else if (add(v)) {
					i++;
				}
			},
			PLString(v): void {
				if (add(v)) {
					x = v.length;
					i += (x < 15 ? 1 : 2 + byteCount(x)) + (
						uni.get(v) ?? (uni.set(v, e = rUni.test(v.value)), e)
							? x + x
							: x
					);
				}
			},
			PLUID(v, d, k): void {
				if (d && k === null) {
					throw new TypeError('Invalid binary key type');
				}
				if (add(v)) {
					i += 1 + byteCount(v.value);
				}
			},
			default(_, d, k): void {
				throw new TypeError(
					d && k === null
						? 'Invalid binary key type'
						: 'Invalid binary value type',
				);
			},
		},
		{
			default(v): void {
				ancestors.delete(v);
			},
		},
		{
			keysFirst: true,
		},
	);

	const refC = byteCount(l);
	const intC = byteCount(table = i += refC * table);
	const d = new DataView(x = new ArrayBuffer((i += intC * l + 6) + 26));
	const r = new Uint8Array(x);
	r[i++] = intC;
	r[i++] = refC;
	d.setBigInt64(i, BigInt(l));
	d.setBigInt64(i + 16, BigInt(table));
	i = 0;
	r[i++] = 98;
	r[i++] = 112;
	r[i++] = 108;
	r[i++] = 105;
	r[i++] = 115;
	r[i++] = 116;
	r[i++] = 48;
	r[i++] = 48;

	for (e of list.values()) {
		setInt(d, table, intC, i);
		table += intC;
		switch (e?.[Symbol.toStringTag]) {
			case PLTYPE_ARRAY: {
				l = (e as PLArray).length;
				if (l < 15) {
					r[i++] = 160 | l;
				} else {
					r[i++] = 175;
					i = encodeInt(d, i, l);
				}
				for (x of (e as PLArray)) {
					setInt(d, i, refC, index.get(x)!);
					i += refC;
				}
				break;
			}
			case PLTYPE_DICT: {
				l = (e as PLDict).size;
				if (l < 15) {
					r[i++] = 208 | l;
				} else {
					r[i++] = 223;
					i = encodeInt(d, i, l);
				}
				for (x of (e as PLDict).keys()) {
					setInt(d, i, refC, index.get(x)!);
					i += refC;
				}
				for (x of (e as PLDict).values()) {
					setInt(d, i, refC, index.get(x)!);
					i += refC;
				}
				break;
			}
			case PLTYPE_BOOLEAN: {
				r[i++] = (e as PLBoolean).value ? 9 : 8;
				break;
			}
			case PLTYPE_DATA: {
				l = (e as PLData).byteLength;
				if (l < 15) {
					r[i++] = 64 | l;
				} else {
					r[i++] = 79;
					i = encodeInt(d, i, l);
				}
				r.set(new Uint8Array((e as PLData).buffer), i);
				i += l;
				break;
			}
			case PLTYPE_DATE: {
				r[i++] = 51;
				d.setFloat64(i, (e as PLDate).time);
				i += 8;
				break;
			}
			case PLTYPE_INTEGER: {
				x = (e as PLInteger).value;
				if ((e as PLInteger).bits === 128) {
					r[i++] = 20;
					d.setBigInt64(i, x >> 64n);
					d.setBigInt64(i += 8, x & 0xffffffffffffffffn);
					i += 8;
				} else if (x < 0) {
					r[i++] = 19;
					d.setBigInt64(i, x);
					i += 8;
				} else {
					i = encodeInt(d, i, x);
				}
				break;
			}
			case PLTYPE_NULL: {
				r[i++] = 0;
				break;
			}
			case PLTYPE_REAL: {
				if ((e as PLReal).bits === 32) {
					r[i++] = 34;
					d.setFloat32(i, (e as PLReal).value);
					i += 4;
				} else {
					r[i++] = 35;
					d.setFloat64(i, (e as PLReal).value);
					i += 8;
				}
				break;
			}
			case PLTYPE_SET: {
				l = (e as PLSet).size;
				if (l < 15) {
					r[i++] = 192 | l;
				} else {
					r[i++] = 207;
					i = encodeInt(d, i, l);
				}
				for (x of (e as PLSet)) {
					setInt(d, i, refC, index.get(x)!);
					i += refC;
				}
				break;
			}
			case PLTYPE_STRING: {
				x = uni.get(e);
				e = (e as PLString).value;
				l = e.length;
				if (l < 15) {
					r[i++] = (x ? 96 : 80) | l;
				} else {
					r[i++] = x ? 111 : 95;
					i = encodeInt(d, i, l);
				}
				if (x) {
					for (x = 0; x < l; i += 2) {
						d.setInt16(i, e.charCodeAt(x++));
					}
				} else {
					for (x = 0; x < l;) {
						r[i++] = e.charCodeAt(x++);
					}
				}
				break;
			}
			case PLTYPE_UID: {
				x = byteCount(e = (e as PLUID).value);
				r[i++] = 128 | x - 1;
				setInt(d, i, x, e);
				i += x;
				break;
			}
		}
	}
	return r;
}
