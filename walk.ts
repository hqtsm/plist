import { type PLArray, PLTYPE_ARRAY } from './array.ts';
import type { PLBoolean, PLTYPE_BOOLEAN } from './boolean.ts';
import type { PLData, PLTYPE_DATA } from './data.ts';
import type { PLDate, PLTYPE_DATE } from './date.ts';
import { type PLDict, PLTYPE_DICT } from './dict.ts';
import type { PLInteger, PLTYPE_INTEGER } from './integer.ts';
import type { PLReal, PLTYPE_REAL } from './real.ts';
import type { PLString, PLTYPE_STRING } from './string.ts';
import type { PLType } from './type.ts';
import type { PLTYPE_UID, PLUID } from './uid.ts';

const noop = () => {};

/**
 * Linked list node type.
 */
interface Node {
	/**
	 * Parent of the itter, null for root.
	 */
	p: PLArray | PLDict | null;

	/**
	 * Key of the itter, null for root.
	 */
	k: PLString | number | null;

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
			value?: [PLString | number, PLType];
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
export type WalkParent = PLArray | PLDict | null;

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
	key: PLString | number | null,
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
	 * PLReal visit.
	 */
	[PLTYPE_REAL]?: WalkVisitor<PLReal>;

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
	let k: PLString | number | null = null;
	let v: PLType;
	let p: WalkParent = null;
	let t;
	let node: Node | null = { p, k, g: [plist].entries(), n: p };
	// deno-lint-ignore no-explicit-any
	let visitor: WalkVisitor<any, any>;
	do {
		next = node.g.next();
		if (next.done) {
			if (!p) {
				return;
			}
			k = node.k;
			node = node.n!;
			visitor = leave[p[Symbol.toStringTag]] ?? ld;
			if (visitor(p, --depth, k, p = node.p) === false) {
				return;
			}
			t = p?.[Symbol.toStringTag];
		} else {
			if (p) {
				[k, v] = next.value!;
				if (t !== PLTYPE_ARRAY) {
					visitor = visit[(k as PLType)[Symbol.toStringTag]] ?? vd;
					if (visitor(k as PLType, depth, null, p) === false) {
						return;
					}
				}
			} else {
				v = next.value![1];
			}
			visitor = visit[x = v[Symbol.toStringTag]] ?? vd;
			next = visitor(v, depth, k, p);
			if (next === false) {
				return;
			}
			if (next !== true) {
				switch (x) {
					case PLTYPE_ARRAY:
					case PLTYPE_DICT: {
						node = {
							p: (p = v as PLArray | PLDict),
							k,
							g: (v as PLArray | PLDict).entries(),
							n: node,
						} satisfies Node;
						depth++;
						t = x;
					}
				}
			}
		}
	} while (node);
}
