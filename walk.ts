import { type PLArray, PLTYPE_ARRAY } from './array.ts';
import { type PLBoolean, PLTYPE_BOOLEAN } from './boolean.ts';
import { type PLData, PLTYPE_DATA } from './data.ts';
import { type PLDate, PLTYPE_DATE } from './date.ts';
import { type PLDict, PLTYPE_DICT } from './dict.ts';
import { type PLInteger, PLTYPE_INTEGER } from './integer.ts';
import { type PLReal, PLTYPE_REAL } from './real.ts';
import { type PLString, PLTYPE_STRING } from './string.ts';
import type { PLType } from './type.ts';
import { PLTYPE_UID, type PLUID } from './uid.ts';

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
			value?: [number | PLString, PLType];
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
 * When skipping an enter, the leave callback is not called.
 * When skipping a key, no callbacks are called for value.
 * When skipping upwards, leave callbacks are called for each collection.
 * When stopping, leave callbacks are not called.
 *
 * @param visit Key or value visited.
 * @param depth Depth visited.
 * @param parent Parent collection or null for root node.
 * @returns Negative to stop, positive to skip, decimals ignored.
 */
export type WalkVisitor<T, P extends WalkParent = WalkParent> = (
	visit: T,
	depth: number,
	parent: P,
) => number | null | void;

/**
 * Walk visitors.
 */
export interface WalkVisitors {
	/**
	 * Enter visitors.
	 */
	enter?: {
		/**
		 * PLArray enter visitor.
		 */
		[PLTYPE_ARRAY]?: WalkVisitor<PLArray>;

		/**
		 * PLDict enter visitor.
		 */
		[PLTYPE_DICT]?: WalkVisitor<PLDict>;

		/**
		 * Default enter visitor.
		 */
		default?: WalkVisitor<PLArray | PLDict>;
	};

	/**
	 * Key visitors.
	 */
	key?: {
		/**
		 * PLArray key visitor.
		 */
		[PLTYPE_ARRAY]?: WalkVisitor<number, PLArray>;

		/**
		 * PLDict key visitor.
		 */
		[PLTYPE_DICT]?: WalkVisitor<PLString, PLDict>;

		/**
		 * Default key visitor.
		 */
		default?: WalkVisitor<number | PLString, PLArray | PLDict>;
	};

	/**
	 * Value visitors.
	 */
	value?: {
		/**
		 * PLBoolean value visitor.
		 */
		[PLTYPE_BOOLEAN]?: WalkVisitor<PLBoolean>;

		/**
		 * PLData value visitor.
		 */
		[PLTYPE_DATA]?: WalkVisitor<PLData>;

		/**
		 * PLDate value visitor.
		 */
		[PLTYPE_DATE]?: WalkVisitor<PLDate>;

		/**
		 * PLInteger value visitor.
		 */
		[PLTYPE_INTEGER]?: WalkVisitor<PLInteger>;

		/**
		 * PLReal value visitor.
		 */
		[PLTYPE_REAL]?: WalkVisitor<PLReal>;

		/**
		 * PLString value visitor.
		 */
		[PLTYPE_STRING]?: WalkVisitor<PLString>;

		/**
		 * PLUID value visitor.
		 */
		[PLTYPE_UID]?: WalkVisitor<PLUID>;

		/**
		 * Default value visitor.
		 */
		default?: WalkVisitor<PLType>;
	};

	/**
	 * Leave visitors.
	 */
	leave?: {
		/**
		 * PLArray close visitor.
		 */
		[PLTYPE_ARRAY]?: WalkVisitor<PLArray>;

		/**
		 * PLDict close visitor.
		 */
		[PLTYPE_DICT]?: WalkVisitor<PLDict>;

		/**
		 * Default close visitor.
		 */
		default?: WalkVisitor<PLArray | PLDict>;
	};
}

/**
 * Wall through a plist.
 *
 * @param plist Plist object.
 * @param visitors Visitors object.
 */
export function walk(
	plist: PLType,
	{ enter, key, value, leave }: WalkVisitors,
): void {
	const enterDefault = enter?.default ?? noop;
	const enterArray = enter?.[PLTYPE_ARRAY] ?? enterDefault;
	const enterDict = enter?.[PLTYPE_DICT] ?? enterDefault;
	const keyDefault = key?.default ?? noop;
	const keyArray = key?.[PLTYPE_ARRAY] ?? keyDefault;
	const keyDict = key?.[PLTYPE_DICT] ?? keyDefault;
	const valueDefault = value?.default ?? noop;
	const valueBoolean = value?.[PLTYPE_BOOLEAN] ?? valueDefault;
	const valueData = value?.[PLTYPE_DATA] ?? valueDefault;
	const valueDate = value?.[PLTYPE_DATE] ?? valueDefault;
	const valueInteger = value?.[PLTYPE_INTEGER] ?? valueDefault;
	const valueReal = value?.[PLTYPE_REAL] ?? valueDefault;
	const valueString = value?.[PLTYPE_STRING] ?? valueDefault;
	const valueUID = value?.[PLTYPE_UID] ?? valueDefault;
	const leaveDefault = leave?.default ?? noop;
	const leaveArray = leave?.[PLTYPE_ARRAY] ?? leaveDefault;
	const leaveDict = leave?.[PLTYPE_DICT] ?? leaveDefault;
	const g = [plist].entries();
	let each;
	let next;
	let depth = 0;
	let p: WalkParent = null;
	let node: Node | null = { p, g, n: p };
	// deno-lint-ignore no-explicit-any
	let visitor: WalkVisitor<any, any>;
	do {
		next = node.g.next();
		if (next.done) {
			if (!p) {
				return;
			}
			node = node.n!;
			visitor = leaveDefault;
			switch (p[Symbol.toStringTag]) {
				case PLTYPE_ARRAY: {
					visitor = leaveArray;
					break;
				}
				case PLTYPE_DICT: {
					visitor = leaveDict;
					break;
				}
			}
			each = visitor(p, --depth, p = node.p) || 0;
			if (each <= -1) {
				return;
			}
			if (each >= 1) {
				each = --each < depth ? each - each % 1 : depth;
				for (let n = node; each--; n = n.n!) {
					n.g = g;
				}
			}
		} else {
			next = next.value!;
			if (p) {
				visitor = keyDefault;
				switch (p[Symbol.toStringTag]) {
					case PLTYPE_ARRAY: {
						visitor = keyArray;
						break;
					}
					case PLTYPE_DICT: {
						visitor = keyDict;
						break;
					}
				}
				each = visitor(next[0], depth, p) || 0;
				if (each <= -1) {
					return;
				}
				if (each >= 1) {
					each = --each < depth ? each - each % 1 : depth;
					for (let n = node; each--; n = n.n!) {
						n.g = g;
					}
					continue;
				}
			}
			each = next[1];
			next = null;
			visitor = valueDefault;
			switch (each?.[Symbol.toStringTag]) {
				case PLTYPE_ARRAY: {
					next = each as PLArray;
					visitor = enterArray;
					break;
				}
				case PLTYPE_BOOLEAN: {
					visitor = valueBoolean;
					break;
				}
				case PLTYPE_DATA: {
					visitor = valueData;
					break;
				}
				case PLTYPE_DATE: {
					visitor = valueDate;
					break;
				}
				case PLTYPE_DICT: {
					next = each as PLDict;
					visitor = enterDict;
					break;
				}
				case PLTYPE_INTEGER: {
					visitor = valueInteger;
					break;
				}
				case PLTYPE_REAL: {
					visitor = valueReal;
					break;
				}
				case PLTYPE_STRING: {
					visitor = valueString;
					break;
				}
				case PLTYPE_UID: {
					visitor = valueUID;
					break;
				}
			}
			each = visitor(each, depth, p) || 0;
			if (each <= -1) {
				return;
			}
			if (each >= 1) {
				each = --each < depth ? each - each % 1 : depth;
				for (let n = node; each--; n = n.n!) {
					n.g = g;
				}
				continue;
			}
			if (next) {
				node = {
					p: p = next,
					g: next.entries(),
					n: node,
				} as Node;
				depth++;
			}
		}
	} while (node);
}
