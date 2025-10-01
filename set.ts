/**
 * @module
 *
 * Property list set.
 */

import type { PLType } from './type.ts';

const sets: WeakMap<PLSet, Set<PLType>> = new WeakMap();

/**
 * PLSet type.
 */
export const PLTYPE_SET = 'PLSet' as const;

/**
 * Property list set type.
 */
export class PLSet<T extends PLType = PLType> {
	declare public readonly [Symbol.toStringTag]: typeof PLTYPE_SET;

	/**
	 * Variable type.
	 */
	declare public readonly type: typeof PLTYPE_SET;

	/**
	 * Create property list set reference.
	 *
	 * @param itter Property list values.
	 */
	constructor(itter: Iterable<T> | null = null) {
		sets.set(this, new Set(itter));
	}

	/**
	 * Get size.
	 *
	 * @returns Set size.
	 */
	public get size(): number {
		return (sets.get(this) as Set<T>).size;
	}

	/**
	 * Check if set has value.
	 *
	 * @param value Value.
	 * @returns Has.
	 */
	public has(value: T): boolean {
		return (sets.get(this) as Set<T>).has(value);
	}

	/**
	 * Add value.
	 *
	 * @param value Value.
	 */
	public add(value: T): void {
		(sets.get(this) as Set<T>).add(value);
	}

	/**
	 * Delete value.
	 *
	 * @param value Value.
	 * @returns Deleted.
	 */
	public delete(value: T): boolean {
		return (sets.get(this) as Set<T>).delete(value);
	}

	/**
	 * Clear set.
	 *
	 * @returns Set.
	 */
	public clear(): void {
		(sets.get(this) as Set<T>).clear();
	}

	/**
	 * Find value for predicate.
	 *
	 * @param predicate Value search predicate.
	 * @param thisArg Callback context.
	 * @returns Value or undefined.
	 */
	public find(
		predicate: (value: T, set: this) => boolean,
		thisArg?: unknown,
	): T | undefined {
		for (const v of (sets.get(this) as Set<T>)) {
			if (predicate.call(thisArg, v, this)) {
				return v;
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
		predicate: (value: T, set: this) => boolean,
		thisArg?: unknown,
	): T | undefined {
		for (
			let c = sets.get(this) as Set<T>,
				a = [...c],
				i = a.length,
				v: T;
			i;
		) {
			if ((c.has(v = a[--i])) && predicate.call(thisArg, v, this)) {
				return v;
			}
		}
	}

	/**
	 * Get set entries.
	 *
	 * @returns Set entries.
	 */
	public entries(): IterableIterator<[T, T]> {
		return (sets.get(this) as Set<T>).entries();
	}

	/**
	 * Get set keys.
	 *
	 * @returns Set keys.
	 */
	public keys(): IterableIterator<T> {
		return (sets.get(this) as Set<T>).keys();
	}

	/**
	 * Get set values.
	 *
	 * @returns Set values.
	 */
	public values(): IterableIterator<T> {
		return (sets.get(this) as Set<T>).values();
	}

	/**
	 * Get set iterator.
	 *
	 * @returns Set iterator.
	 */
	public [Symbol.iterator](): IterableIterator<T> {
		return (sets.get(this) as Set<T>)[Symbol.iterator]();
	}

	/**
	 * Get as set.
	 *
	 * @returns Set.
	 */
	public toSet(): Set<T> {
		return new Set(sets.get(this) as Set<T>);
	}

	/**
	 * Get value set.
	 *
	 * @returns Value set.
	 */
	public toValueSet(): Set<ReturnType<T['valueOf']>> {
		const r = new Set<ReturnType<T['valueOf']>>();
		for (const v of sets.get(this) as Set<T>) {
			r.add(v.valueOf() as ReturnType<T['valueOf']>);
		}
		return r;
	}

	/**
	 * Value getter.
	 *
	 * @returns Set values.
	 */
	public valueOf(): Set<T> {
		return new Set(sets.get(this) as Set<T>);
	}

	/**
	 * Check if set type.
	 *
	 * @param arg Variable.
	 * @returns Is set type.
	 */
	public static is(arg: unknown): arg is PLSet {
		return (arg as PLType | null)?.[Symbol.toStringTag] === PLTYPE_SET;
	}

	static {
		const value = { value: PLTYPE_SET } as const;
		Object.defineProperty(this.prototype, Symbol.toStringTag, value);
		Object.defineProperty(this.prototype, 'type', value);
	}
}
