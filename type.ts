/**
 * @module
 *
 * Property list types.
 */

import type { PLArray } from './array.ts';
import type { PLBoolean } from './boolean.ts';
import type { PLData } from './data.ts';
import type { PLDate } from './date.ts';
import type { PLDictionary } from './dictionary.ts';
import type { PLInteger } from './integer.ts';
import type { PLNull } from './null.ts';
import type { PLReal } from './real.ts';
import type { PLSet } from './set.ts';
import type { PLString } from './string.ts';
import type { PLUID } from './uid.ts';

/**
 * Every property list type.
 */
export type PLType =
	| PLArray
	| PLBoolean
	| PLData
	| PLDate
	| PLDictionary
	| PLInteger
	| PLNull
	| PLReal
	| PLSet
	| PLString
	| PLUID;

/**
 * Every property list type name.
 */
export type PLTypeName = PLType['type'];
