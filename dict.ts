/**
 * @module
 *
 * Property list dict.
 */

import type { PLType } from './type.ts';

const maps: WeakMap<PLDict, Map<PLType, PLType>> = new WeakMap();

/**
 * PLDict type.
 */
export const PLTYPE_DICT = 'PLDict' as const;

/**
 * Property list dict type.
 */
export class PLDict<K extends PLType = PLType, V extends PLType = PLType> {
	declare public readonly [Symbol.toStringTag]: typeof PLTYPE_DICT;

	/**
	 * Variable type.
	 */
	declare public readonly type: typeof PLTYPE_DICT;

	/**
	 * Create property list dict reference.
	 *
	 * @param entries Key value pairs.
	 */
	constructor(entries: Iterable<readonly [K, V]> | null = null) {
		maps.set(this, new Map(entries));
	}

	/**
	 * Get size.
	 *
	 * @returns Dict size.
	 */
	public get size(): number {
		return (maps.get(this) as Map<K, V>).size;
	}

	/**
	 * Check if dict has key.
	 *
	 * @param key Key.
	 * @returns Has.
	 */
	public has(key: K): boolean {
		return (maps.get(this) as Map<K, V>).has(key);
	}

	/**
	 * Get value for key.
	 *
	 * @param key Key.
	 * @returns Value or undefined.
	 */
	public get(key: K): V | undefined {
		return (maps.get(this) as Map<K, V>).get(key);
	}

	/**
	 * Set value for key.
	 *
	 * @param key Key.
	 * @param value Value.
	 */
	public set(key: K, value: V): void {
		(maps.get(this) as Map<K, V>).set(key, value);
	}

	/**
	 * Delete key.
	 *
	 * @param key Key.
	 * @returns Deleted.
	 */
	public delete(key: K): boolean {
		return (maps.get(this) as Map<K, V>).delete(key);
	}

	/**
	 * Clear dict.
	 */
	public clear(): void {
		(maps.get(this) as Map<K, V>).clear();
	}

	/**
	 * Find first value for predicate.
	 *
	 * @param predicate Key search predicate.
	 * @param thisArg Callback context.
	 * @returns Value or undefined.
	 */
	public find(
		predicate: (value: V, key: K, dict: this) => boolean,
		thisArg?: unknown,
	): V | undefined {
		for (const [k, v] of (maps.get(this) as Map<K, V>)) {
			if (predicate.call(thisArg, v, k, this)) {
				return v;
			}
		}
	}

	/**
	 * Find first key for predicate.
	 *
	 * @param predicate Key search predicate.
	 * @param thisArg Callback context.
	 * @returns Key or undefined.
	 */
	public findKey(
		predicate: (value: V, key: K, dict: this) => boolean,
		thisArg?: unknown,
	): K | undefined {
		for (const [k, v] of (maps.get(this) as Map<K, V>)) {
			if (predicate.call(thisArg, v, k, this)) {
				return k;
			}
		}
	}

	/**
	 * Find last value for predicate.
	 *
	 * @param predicate Key search predicate.
	 * @param thisArg Callback context.
	 * @returns Value or undefined.
	 */
	public findLast(
		predicate: (value: V, key: K, dict: this) => boolean,
		thisArg?: unknown,
	): V | undefined {
		for (
			let c = maps.get(this) as Map<K, V>,
				a = [...c.keys()],
				i = a.length,
				k: K,
				v: V | undefined;
			i;
		) {
			if (
				(v = c.get(k = a[--i])) &&
				predicate.call(thisArg, v, k, this)
			) {
				return v;
			}
		}
	}

	/**
	 * Find last key for predicate.
	 *
	 * @param predicate Key search predicate.
	 * @param thisArg Callback context.
	 * @returns Key or undefined.
	 */
	public findLastKey(
		predicate: (value: V, key: K, dict: this) => boolean,
		thisArg?: unknown,
	): K | undefined {
		for (
			let c = maps.get(this) as Map<K, V>,
				a = [...c.keys()],
				i = a.length,
				k: K,
				v: V | undefined;
			i;
		) {
			if (
				(v = c.get(k = a[--i])) &&
				predicate.call(thisArg, v, k, this)
			) {
				return k;
			}
		}
	}

	/**
	 * Get dict entries.
	 *
	 * @returns Dict entries.
	 */
	public entries(): IterableIterator<[K, V]> {
		return (maps.get(this) as Map<K, V>).entries();
	}

	/**
	 * Get dict keys.
	 *
	 * @returns Dict keys.
	 */
	public keys(): IterableIterator<K> {
		return (maps.get(this) as Map<K, V>).keys();
	}

	/**
	 * Get dict values.
	 *
	 * @returns Dict values.
	 */
	public values(): IterableIterator<V> {
		return (maps.get(this) as Map<K, V>).values();
	}

	/**
	 * Get dict iterator.
	 *
	 * @returns Dict iterator.
	 */
	public [Symbol.iterator](): IterableIterator<[K, V]> {
		return (maps.get(this) as Map<K, V>)[Symbol.iterator]();
	}

	/**
	 * Get as map.
	 *
	 * @returns Map.
	 */
	public toMap(): Map<K, V> {
		return new Map(maps.get(this) as Map<K, V>);
	}

	/**
	 * Get key value map.
	 *
	 * @param first On duplicate, use the first key.
	 * @returns Value map.
	 */
	public toValueMap(first = false): Map<ReturnType<K['valueOf']>, V> {
		const r = new Map<ReturnType<K['valueOf']>, V>();
		if (first) {
			for (const [k, v] of maps.get(this) as Map<K, V>) {
				const value = k.valueOf() as ReturnType<K['valueOf']>;
				if (!r.has(value)) {
					r.set(value, v);
				}
			}
		} else {
			for (const [k, v] of maps.get(this) as Map<K, V>) {
				r.set(k.valueOf() as ReturnType<K['valueOf']>, v);
			}
		}
		return r;
	}

	/**
	 * Value getter.
	 *
	 * @returns Dict values.
	 */
	public valueOf(): Map<K, V> {
		return new Map(maps.get(this) as Map<K, V>);
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
