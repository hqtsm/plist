import { type PLArray, PLTYPE_ARRAY } from './array.ts';
import type { PLBoolean, PLTYPE_BOOLEAN } from './boolean.ts';
import type { PLData, PLTYPE_DATA } from './data.ts';
import type { PLDate, PLTYPE_DATE } from './date.ts';
import { type PLDict, PLTYPE_DICT } from './dict.ts';
import type { PLInteger, PLTYPE_INTEGER } from './integer.ts';
import type { PLNull, PLTYPE_NULL } from './null.ts';
import type { PLReal, PLTYPE_REAL } from './real.ts';
import { type PLSet, PLTYPE_SET } from './set.ts';
import type { PLString, PLTYPE_STRING } from './string.ts';
import type { PLType } from './type.ts';
import type { PLTYPE_UID, PLUID } from './uid.ts';

const noop = () => {};

/**
 * Itterate root.
 *
 * @param root The root element.
 */
function* root(root: PLType): Generator<[null, PLType]> {
	yield [null, root];
}

/**
 * Itterate dict.
 *
 * @param dict Dict to itterate.
 */
function* dict(dict: PLDict): Generator<[null | PLType, PLType]> {
	let v;
	for (const k of dict.keys()) {
		yield [null, k];
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
	 * Parent of the itter, null for root.
	 */
	p: PLArray | PLDict | PLSet | null;

	/**
	 * Key of the itter, null for root.
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
export type WalkParent = PLArray | PLDict | PLSet | null;

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
	 * PLDict close visitor.
	 */
	[PLTYPE_DICT]?: WalkVisitor<PLDict>;

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
	 * Default close visitor.
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
	 * PLDict leave.
	 */
	[PLTYPE_DICT]?: WalkVisitor<PLDict>;

	/**
	 * PLSet leave.
	 */
	[PLTYPE_SET]?: WalkVisitor<PLSet>;

	/**
	 * Default leave.
	 */
	default?: WalkVisitor<PLArray | PLDict>;
}

/**
 * Wall through a plist.
 *
 * @param plist Plist object.
 * @param visit Visit callbacks.
 * @param leave Leave callbacks.
 */
export function walk(
	plist: PLType,
	visit: Readonly<WalkVisit> = {},
	leave: Readonly<WalkVisit> = {},
): void {
	const vd = visit.default ?? noop;
	const ld = leave.default ?? noop;
	let x;
	let next;
	let depth = 0;
	let k: PLType | number | null = null;
	let v: PLType;
	let p: WalkParent = null;
	let node: Node | null = { p, k, g: root(plist), n: p };
	// deno-lint-ignore no-explicit-any
	let wv: WalkVisitor<any, any>;
	do {
		next = node.g.next();
		if (next.done) {
			if (!p) {
				return;
			}
			k = node.k;
			node = node.n!;
			wv = leave[p[Symbol.toStringTag]] ?? ld;
			if (wv(p, --depth, k, p = node.p) === false) {
				return;
			}
		} else {
			[k, v] = next.value!;
			wv = visit[x = v[Symbol.toStringTag]] ?? vd;
			next = wv(v, depth, k, p);
			if (next === false) {
				return;
			}
			if (next !== true) {
				switch (x) {
					case PLTYPE_DICT: {
						node = {
							p: (p = v as PLDict),
							k,
							g: dict(v as PLDict),
							n: node,
						} satisfies Node;
						depth++;
						break;
					}
					case PLTYPE_ARRAY:
					case PLTYPE_SET: {
						node = {
							p: (p = v as PLArray | PLSet),
							k,
							g: (v as PLArray | PLSet).entries(),
							n: node,
						} satisfies Node;
						depth++;
						break;
					}
				}
			}
		}
	} while (node);
}
