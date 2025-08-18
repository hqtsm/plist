/**
 * @module
 *
 * OpenStep decoding.
 */

import type { PLArray } from '../array.ts';
import type { PLData } from '../data.ts';
import { PLDict } from '../dict.ts';
import { FORMAT_OPENSTEP, FORMAT_STRINGS } from '../format.ts';
import { PLString } from '../string.ts';

/**
 * Parse context.
 */
interface Parse {
	/**
	 * Data to parse.
	 */
	readonly d: Uint8Array;

	/**
	 * Length of data.
	 */
	readonly l: number;

	/**
	 * Current offset.
	 */
	i: number;
}

/**
 * Advance to next non-whitespace, non-comment, character.
 *
 * @param p Parse context.
 * @returns Next char, or -1 for end.
 */
function next(p: Parse): number {
	let { d, i, l } = p;
	for (let c, x; i < l;) {
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
				c = d[i + 1];
				if (c === 47) {
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
				} else if (c === 42) {
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
		p.i = i;
		return c;
	}
	p.i = i;
	return -1;
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
 * @returns Decoded plist.
 */
export function decodeOpenStep(encoded: Uint8Array): DecodeOpenStepResult {
	const l = encoded.length;
	const p: Parse = { d: encoded, l, i: 0 };
	const c = next(p);
	if (c < 0) {
		return {
			format: FORMAT_STRINGS,
			plist: new PLDict(),
		};
	}
	return {
		format: FORMAT_OPENSTEP,
		plist: new PLString('TODO'),
	};
}
