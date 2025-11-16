/**
 * @module
 *
 * Property list dictionary.
 */

import type { PLType } from './type.ts';

let maps: WeakMap<PLDictionary, Map<PLType, PLType>>;

/**
 * PLDictionary type.
 */
export const PLTYPE_DICTIONARY = 'PLDictionary' as const;

/**
 * Property list dictionary type.
 *
 * @template K Key type.
 * @template V Value type.
 */
export class PLDictionary<
	K extends PLType = PLType,
	V extends PLType = PLType,
> {
	declare public readonly [Symbol.toStringTag]: typeof PLTYPE_DICTIONARY;

	/**
	 * Variable type.
	 */
	declare public readonly type: typeof PLTYPE_DICTIONARY;

	/**
	 * Create property list dictionary reference.
	 *
	 * @param entries Key value pairs.
	 */
	constructor(entries: Iterable<readonly [K, V]> | null = null) {
		maps ??= new WeakMap();
		maps.set(this, new Map(entries));
	}

	/**
	 * Get size.
	 *
	 * @returns Dictionary size.
	 */
	public get size(): number {
		return (maps.get(this) as Map<K, V>).size;
	}

	/**
	 * Check if dictionary has key.
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
	 * Clear dictionary.
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
		predicate: (value: V, key: K, dictionary: this) => boolean,
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
		predicate: (value: V, key: K, dictionary: this) => boolean,
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
		predicate: (value: V, key: K, dictionary: this) => boolean,
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
		predicate: (value: V, key: K, dictionary: this) => boolean,
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
	 * Get dictionary entries.
	 *
	 * @returns Dictionary entries.
	 */
	public entries(): IterableIterator<[K, V]> {
		return (maps.get(this) as Map<K, V>).entries();
	}

	/**
	 * Get dictionary keys.
	 *
	 * @returns Dictionary keys.
	 */
	public keys(): IterableIterator<K> {
		return (maps.get(this) as Map<K, V>).keys();
	}

	/**
	 * Get dictionary values.
	 *
	 * @returns Dictionary values.
	 */
	public values(): IterableIterator<V> {
		return (maps.get(this) as Map<K, V>).values();
	}

	/**
	 * Get dictionary iterator.
	 *
	 * @returns Dictionary iterator.
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
	 * @returns Dictionary values.
	 */
	public valueOf(): Map<K, V> {
		return new Map(maps.get(this) as Map<K, V>);
	}

	/**
	 * Check if dictionary type.
	 *
	 * @param arg Variable.
	 * @returns Is dictionary type.
	 */
	public static is(arg: unknown): arg is PLDictionary {
		return (arg as PLType | null)?.[Symbol.toStringTag] ===
			PLTYPE_DICTIONARY;
	}

	static {
		const value = {
			value: PLTYPE_DICTIONARY,
			configurable: false,
			enumerable: false,
			writable: false,
		} as const;
		Object.defineProperty(this.prototype, Symbol.toStringTag, value);
		Object.defineProperty(this.prototype, 'type', value);
	}
}
