/**
 * @module
 *
 * Property list walker.
 */

import { type PLArray, PLTYPE_ARRAY } from './array.ts';
import type { PLBoolean, PLTYPE_BOOLEAN } from './boolean.ts';
import type { PLData, PLTYPE_DATA } from './data.ts';
import type { PLDate, PLTYPE_DATE } from './date.ts';
import { type PLDictionary, PLTYPE_DICTIONARY } from './dictionary.ts';
import type { PLInteger, PLTYPE_INTEGER } from './integer.ts';
import type { PLNull, PLTYPE_NULL } from './null.ts';
import type { PLReal, PLTYPE_REAL } from './real.ts';
import { type PLSet, PLTYPE_SET } from './set.ts';
import type { PLString, PLTYPE_STRING } from './string.ts';
import type { PLType } from './type.ts';
import type { PLTYPE_UID, PLUID } from './uid.ts';

const noop = () => {};

/**
 * Iterate root.
 *
 * @param root The root element.
 */
function* rootValue(root: PLType): Generator<[null, PLType]> {
	yield [null, root];
}

/**
 * Iterate dictionary in pairs.
 *
 * @param dict Dictionary to iterate.
 */
function* dictPairs(
	dict: PLDictionary,
): Generator<[null | PLType, PLType]> {
	let k, v;
	for (k of dict.keys()) {
		yield [null, k];
		if ((v = dict.get(k))) {
			yield [k, v];
		}
	}
}

/**
 * Iterate dictionary keys, then values.
 *
 * @param dict Dictionary to iterate.
 */
function* dictKeysFirst(
	dict: PLDictionary,
): Generator<[null | PLType, PLType]> {
	let k, v;
	const keys = new Set<PLType>();
	for (k of dict.keys()) {
		yield [null, k];
		keys.add(k);
	}
	for (k of keys) {
		if ((v = dict.get(k))) {
			yield [k, v];
		}
	}
}

/**
 * Linked list node type.
 */
interface Node {
	/**
	 * Parent of the generator, null for root.
	 */
	p: PLArray | PLDictionary | PLSet | null;

	/**
	 * Key of the generator, null for root.
	 */
	k: PLType | number | null;

	/**
	 * Key value generator.
	 */
	g: {
		/**
		 * Next key value pair.
		 */
		next(): {
			/**
			 * Generator done flag.
			 */
			done?: boolean;

			/**
			 * Key value pair.
			 */
			value?: [PLType | number | null, PLType];
		};
	};

	/**
	 * Next node.
	 */
	n: Node | null;
}

/**
 * Walk parent.
 */
export type WalkParent = PLArray | PLDictionary | PLSet | null;

/**
 * Walk visitor.
 *
 * @param visit Key or value visited.
 * @param depth Depth visited.
 * @param key Key of visited value, or null for key.
 * @param parent Parent collection or null for root node.
 * @returns False to stop, true to skip children, nullish to continue.
 */
export type WalkVisitor<
	T extends PLType = PLType,
	P extends WalkParent = WalkParent,
> = (
	visit: T,
	depth: number,
	key: PLType | number | null,
	parent: P,
) => boolean | null | void;

/**
 * Walk visit.
 */
export interface WalkVisit {
	/**
	 * PLArray visit.
	 */
	[PLTYPE_ARRAY]?: WalkVisitor<PLArray>;

	/**
	 * PLBoolean visit.
	 */
	[PLTYPE_BOOLEAN]?: WalkVisitor<PLBoolean>;

	/**
	 * PLData visit.
	 */
	[PLTYPE_DATA]?: WalkVisitor<PLData>;

	/**
	 * PLDate visit.
	 */
	[PLTYPE_DATE]?: WalkVisitor<PLDate>;

	/**
	 * PLDictionary close visitor.
	 */
	[PLTYPE_DICTIONARY]?: WalkVisitor<PLDictionary>;

	/**
	 * PLInteger visit.
	 */
	[PLTYPE_INTEGER]?: WalkVisitor<PLInteger>;

	/**
	 * PLNull visit.
	 */
	[PLTYPE_NULL]?: WalkVisitor<PLNull>;

	/**
	 * PLReal visit.
	 */
	[PLTYPE_REAL]?: WalkVisitor<PLReal>;

	/**
	 * PLSet visit.
	 */
	[PLTYPE_SET]?: WalkVisitor<PLSet>;

	/**
	 * PLString visit.
	 */
	[PLTYPE_STRING]?: WalkVisitor<PLString>;

	/**
	 * PLUID visit.
	 */
	[PLTYPE_UID]?: WalkVisitor<PLUID>;

	/**
	 * Default visit.
	 */
	default?: WalkVisitor<PLType>;
}

/**
 * Walk leave.
 */
export interface WalkLeave {
	/**
	 * PLArray leave.
	 */
	[PLTYPE_ARRAY]?: WalkVisitor<PLArray>;

	/**
	 * PLDictionary leave.
	 */
	[PLTYPE_DICTIONARY]?: WalkVisitor<PLDictionary>;

	/**
	 * PLSet leave.
	 */
	[PLTYPE_SET]?: WalkVisitor<PLSet>;

	/**
	 * Default leave.
	 */
	default?: WalkVisitor<PLArray | PLDictionary>;
}

/**
 * Walk options.
 */
export interface WalkOptions {
	/**
	 * Maximum depth, negative for no limit.
	 *
	 * @default -1
	 */
	max?: number;

	/**
	 * Minimum depth, 1 to skip root.
	 *
	 * @default 0
	 */
	min?: number;

	/**
	 * Visit dictionary keys first, then values.
	 *
	 * @default false
	 */
	keysFirst?: boolean;
}

/**
 * Wall through a plist.
 *
 * @param plist Plist object.
 * @param visit Visit callbacks.
 * @param leave Leave callbacks.
 * @param options Walk options.
 */
export function walk(
	plist: PLType,
	visit: Readonly<WalkVisit> = {},
	leave: Readonly<WalkVisit> = {},
	{ max = -1, min = 0, keysFirst = false }: Readonly<WalkOptions> = {},
): void {
	const vd = visit.default ?? noop;
	const ld = leave.default ?? noop;
	const g = rootValue(plist);
	let next;
	let depth = 0;
	let t;
	let k: PLType | number | null = null;
	let v: PLType;
	let p: WalkParent = null;
	let n: Node | null = {
		p,
		k,
		g,
		n: p,
	};
	let wv: WalkVisitor;
	do {
		next = n.g.next();
		if (next.done) {
			if (!p) {
				return;
			}
			k = n.k;
			n = n.n!;
			if (--depth < min) {
				p = n.p;
			} else {
				wv = (leave[p[Symbol.toStringTag]] ?? ld) as WalkVisitor;
				if (wv(p, depth, k, p = n.p) === false) {
					return;
				}
			}
		} else {
			[k, v] = next.value!;
			t = v[Symbol.toStringTag];
			if (!(depth < min)) {
				wv = (visit[t] ?? vd) as WalkVisitor;
				next = wv(v, depth, k, p);
				if (next === false) {
					return;
				}
				if (next === true) {
					continue;
				}
			}
			switch (t) {
				case PLTYPE_DICTIONARY: {
					n = {
						p: (p = v as PLDictionary),
						k,
						g: (max < 0 || depth < max)
							? keysFirst
								? dictKeysFirst(v as PLDictionary)
								: dictPairs(v as PLDictionary)
							: g,
						n,
					};
					depth++;
					break;
				}
				case PLTYPE_ARRAY:
				case PLTYPE_SET: {
					n = {
						p: (p = v as PLArray | PLSet),
						k,
						g: (max < 0 || depth < max)
							? (v as PLArray | PLSet).entries()
							: g,
						n,
					};
					depth++;
					break;
				}
			}
		}
	} while (n);
}
