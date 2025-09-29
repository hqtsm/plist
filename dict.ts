/**
 * @module
 *
 * Property list dict.
 */

import type { PLString } from './string.ts';
import type { PLType } from './type.ts';

const maps: WeakMap<PLDict, Map<PLString, PLType>> = new WeakMap();

/**
 * PLDict type.
 */
export const PLTYPE_DICT = 'PLDict' as const;

/**
 * Property list dict type.
 */
export class PLDict<T extends PLType = PLType> {
	declare public readonly [Symbol.toStringTag]: typeof PLTYPE_DICT;

	/**
	 * Variable type.
	 */
	declare public readonly type: typeof PLTYPE_DICT;

	/**
	 * Create property list dict reference.
	 *
	 * @param itter Property list key value pairs.
	 */
	constructor(itter: Iterable<readonly [PLString, T]> | null = null) {
		maps.set(this, new Map(itter));
	}

	/**
	 * Get size.
	 *
	 * @returns Dict size.
	 */
	public get size(): number {
		return (maps.get(this) as Map<PLString, T>).size;
	}

	/**
	 * Check if dict has key.
	 *
	 * @param key Key.
	 * @returns Has.
	 */
	public has(key: PLString): boolean {
		return (maps.get(this) as Map<PLString, T>).has(key);
	}

	/**
	 * Get value for key.
	 *
	 * @param key Key.
	 * @returns Value or undefined.
	 */
	public get(key: PLString): T | undefined {
		return (maps.get(this) as Map<PLString, T>).get(key);
	}

	/**
	 * Set value for key.
	 *
	 * @param key Key.
	 * @param value Value.
	 */
	public set(key: PLString, value: T): void {
		(maps.get(this) as Map<PLString, T>).set(key, value);
	}

	/**
	 * Delete key.
	 *
	 * @param key Key.
	 * @returns Deleted.
	 */
	public delete(key: PLString): boolean {
		return (maps.get(this) as Map<PLString, T>).delete(key);
	}

	/**
	 * Clear dict.
	 *
	 * @returns Dict.
	 */
	public clear(): void {
		(maps.get(this) as Map<PLString, T>).clear();
	}

	/**
	 * Find value for first key of value.
	 *
	 * @param key Key value.
	 * @returns Value or undefined.
	 */
	public find(key: string): T | undefined {
		for (const [k, v] of (maps.get(this) as Map<PLString, T>)) {
			if (k.value === key) {
				return v;
			}
		}
	}

	/**
	 * Find first key of value.
	 *
	 * @param key Key value.
	 * @returns Key or undefined.
	 */
	public findKey(key: string): PLString | undefined {
		for (const [k] of (maps.get(this) as Map<PLString, T>)) {
			if (k.value === key) {
				return k;
			}
		}
	}

	/**
	 * Find value for last key of value.
	 *
	 * @param key Key value.
	 * @returns Value or undefined.
	 */
	public findLast(key: string): T | undefined {
		let r: T | undefined;
		for (const [k, v] of (maps.get(this) as Map<PLString, T>)) {
			if (k.value === key) {
				r = v;
			}
		}
		return r;
	}

	/**
	 * Find last key of value.
	 *
	 * @param key Key value.
	 * @returns Key or undefined.
	 */
	public findLastKey(key: string): PLString | undefined {
		let r;
		for (const [k] of (maps.get(this) as Map<PLString, T>)) {
			if (k.value === key) {
				r = k;
			}
		}
		return r;
	}

	/**
	 * Get dict entries.
	 *
	 * @returns Dict entries.
	 */
	public entries(): IterableIterator<[PLString, T]> {
		return (maps.get(this) as Map<PLString, T>).entries();
	}

	/**
	 * Get dict keys.
	 *
	 * @returns Dict keys.
	 */
	public keys(): IterableIterator<PLString> {
		return (maps.get(this) as Map<PLString, T>).keys();
	}

	/**
	 * Get dict values.
	 *
	 * @returns Dict values.
	 */
	public values(): IterableIterator<T> {
		return (maps.get(this) as Map<PLString, T>).values();
	}

	/**
	 * Get dict iterator.
	 *
	 * @returns Dict iterator.
	 */
	public [Symbol.iterator](): IterableIterator<[PLString, T]> {
		return (maps.get(this) as Map<PLString, T>)[Symbol.iterator]();
	}

	/**
	 * Get as map.
	 *
	 * @returns Map.
	 */
	public toMap(): Map<PLString, T> {
		return new Map(maps.get(this) as Map<PLString, T>);
	}

	/**
	 * Get key value map.
	 *
	 * @param first On duplicate, use the first key.
	 * @returns Value map.
	 */
	public toValueMap(first = false): Map<string, T> {
		const r = new Map();
		if (first) {
			for (const [k, v] of maps.get(this) as Map<PLString, T>) {
				const { value } = k;
				if (!r.has(value)) {
					r.set(value, v);
				}
			}
		} else {
			for (const [k, v] of maps.get(this) as Map<PLString, T>) {
				r.set(k.value, v);
			}
		}
		return r;
	}

	/**
	 * Value getter.
	 *
	 * @returns Dict values.
	 */
	public valueOf(): Map<PLString, T> {
		return new Map(maps.get(this) as Map<PLString, T>);
	}

	/**
	 * Check if dict type.
	 *
	 * @param arg Variable.
	 * @returns Is dict type.
	 */
	public static is(arg: unknown): arg is PLDict {
		return (arg as PLType | null)?.[Symbol.toStringTag] === PLTYPE_DICT;
	}

	static {
		const value = { value: PLTYPE_DICT } as const;
		Object.defineProperty(this.prototype, Symbol.toStringTag, value);
		Object.defineProperty(this.prototype, 'type', value);
	}
}
