/**
 * @module
 *
 * Property list array.
 */

import type { PLType } from './type.ts';

let arrays: WeakMap<PLArray, Array<PLType>>;

/**
 * PLArray type.
 */
export const PLTYPE_ARRAY = 'PLArray' as const;

/**
 * Property list array type.
 *
 * @template T Value type.
 */
export class PLArray<T extends PLType = PLType> {
	declare public readonly [Symbol.toStringTag]: typeof PLTYPE_ARRAY;

	/**
	 * Variable type.
	 */
	declare public readonly type: typeof PLTYPE_ARRAY;

	/**
	 * Create property list array reference.
	 *
	 * @param entries Entries.
	 */
	constructor(entries: Iterable<T> | ArrayLike<T> | null = null) {
		arrays ??= new WeakMap();
		arrays.set(this, entries ? Array.from(entries) : []);
	}

	/**
	 * Get length.
	 *
	 * @returns Array length.
	 */
	public get length(): number {
		return (arrays.get(this) as T[]).length;
	}

	/**
	 * Get value at index.
	 *
	 * @param index Array index.
	 * @returns Value at index or undefined.
	 */
	public get(index: number): T | undefined {
		return (arrays.get(this) as T[])[(+index || 0) - (index % 1 || 0)];
	}

	/**
	 * Set value at index.
	 *
	 * @param index Array index.
	 * @param value Value to set.
	 */
	public set(index: number, value: T): void {
		(arrays.get(this) as T[])[(+index || 0) - (index % 1 || 0)] = value;
	}

	/**
	 * Get value at index.
	 *
	 * @param index Array index, optionally negative.
	 * @returns Value at index or undefined.
	 */
	public at(index: number): T | undefined {
		return (arrays.get(this) as T[]).at(index);
	}

	/**
	 * Push values to array.
	 *
	 * @param values Values to push.
	 * @returns New length.
	 */
	public push(...values: T[]): number {
		return (arrays.get(this) as T[]).push(...values);
	}

	/**
	 * Pop value from array.
	 *
	 * @returns Popped value or undefined.
	 */
	public pop(): T | undefined {
		return (arrays.get(this) as T[]).pop();
	}

	/**
	 * Unshift values to array.
	 *
	 * @param values Values to unshift.
	 * @returns New length.
	 */
	public unshift(...values: T[]): number {
		return (arrays.get(this) as T[]).unshift(...values);
	}

	/**
	 * Shift value from array.
	 *
	 * @returns Shifted value or undefined.
	 */
	public shift(): T | undefined {
		return (arrays.get(this) as T[]).shift();
	}

	/**
	 * Slice array.
	 *
	 * @param start Start index.
	 * @param end End index.
	 * @returns Sliced values.
	 */
	public slice(start?: number, end?: number): PLArray<T> {
		return new PLArray((arrays.get(this) as T[]).slice(start, end));
	}

	/**
	 * Splice values from array.
	 *
	 * @param start Start index.
	 * @param deleteCount Delete count.
	 * @param items Values to insert.
	 * @returns Removed values.
	 */
	public splice(start: number, deleteCount = 0, ...items: T[]): T[] {
		return (arrays.get(this) as T[]).splice(start, deleteCount, ...items);
	}

	/**
	 * Reverse array.
	 */
	public reverse(): void {
		(arrays.get(this) as T[]).reverse();
	}

	/**
	 * Find index of value.
	 *
	 * @param value Value to find.
	 * @returns Index of value or -1.
	 */
	public indexOf(value: T): number {
		return (arrays.get(this) as T[]).indexOf(value);
	}

	/**
	 * Find last index of value.
	 *
	 * @param value Value to find.
	 * @returns Last index of value or -1.
	 */
	public lastIndexOf(value: T): number {
		return (arrays.get(this) as T[]).lastIndexOf(value);
	}

	/**
	 * Find value.
	 *
	 * @param callback Find callback.
	 * @param thisArg Callback context.
	 * @returns Found value or undefined.
	 */
	public find(
		callback: (value: T, index: number, array: this) => boolean,
		thisArg?: unknown,
	): T | undefined {
		return (arrays.get(this) as T[]).find(
			(value, index) => callback.call(thisArg, value, index, this),
		);
	}

	/**
	 * Find index of value.
	 *
	 * @param callback Find callback.
	 * @param thisArg Callback context.
	 * @returns Found index or -1.
	 */
	public findIndex(
		callback: (value: T, index: number, array: this) => boolean,
		thisArg?: unknown,
	): number {
		return (arrays.get(this) as T[]).findIndex((value, index) =>
			callback.call(thisArg, value, index, this)
		);
	}

	/**
	 * Find last value.
	 *
	 * @param callback Find callback.
	 * @param thisArg Callback context.
	 * @returns Found value or undefined.
	 */
	public findLast(
		callback: (value: T, index: number, array: this) => boolean,
		thisArg?: unknown,
	): T | undefined {
		return (arrays.get(this) as T[]).findLast((value, index) =>
			callback.call(thisArg, value, index, this)
		);
	}

	/**
	 * Find last index of value.
	 *
	 * @param callback Find callback.
	 * @param thisArg Callback context.
	 * @returns Found index or -1.
	 */
	public findLastIndex(
		callback: (value: T, index: number, array: this) => boolean,
		thisArg?: unknown,
	): number {
		return (arrays.get(this) as T[]).findLastIndex((value, index) =>
			callback.call(thisArg, value, index, this)
		);
	}

	/**
	 * Check if array includes value.
	 *
	 * @param value Value to check.
	 * @returns True if value is in array.
	 */
	public includes(value: T): boolean {
		return (arrays.get(this) as T[]).includes(value);
	}

	/**
	 * Fill array with value.
	 *
	 * @param value Value to fill.
	 * @param start Start index.
	 * @param end End index.
	 */
	public fill(value: T, start?: number, end?: number): void {
		(arrays.get(this) as T[]).fill(value, start, end);
	}

	/**
	 * Copy values within array.
	 *
	 * @param target Target index.
	 * @param start Start index.
	 * @param end End index.
	 */
	public copyWithin(target: number, start: number, end?: number): void {
		(arrays.get(this) as T[]).copyWithin(target, start, end);
	}

	/**
	 * Clear array.
	 */
	public clear(): void {
		(arrays.get(this) as T[]).length = 0;
	}

	/**
	 * Get array entries.
	 *
	 * @returns Array entries.
	 */
	public entries(): ReturnType<Array<T>['entries']> {
		return (arrays.get(this) as T[]).entries();
	}

	/**
	 * Get array keys.
	 *
	 * @returns Array keys.
	 */
	public keys(): ReturnType<Array<T>['keys']> {
		return (arrays.get(this) as T[]).keys();
	}

	/**
	 * Get array values.
	 *
	 * @returns Array values.
	 */
	public values(): ReturnType<Array<T>['values']> {
		return (arrays.get(this) as T[]).values();
	}

	/**
	 * Get array iterator.
	 *
	 * @returns Array iterator.
	 */
	public [Symbol.iterator](): ReturnType<Array<T>[typeof Symbol.iterator]> {
		return (arrays.get(this) as T[])[Symbol.iterator]();
	}

	/**
	 * To array, optionally slice.
	 *
	 * @param start Start index.
	 * @param end End index.
	 * @returns Sliced values.
	 */
	public toArray(start?: number, end?: number): T[] {
		return (arrays.get(this) as T[]).slice(start, end);
	}

	/**
	 * Value getter.
	 *
	 * @returns Array values.
	 */
	public valueOf(): T[] {
		return (arrays.get(this) as T[]).slice();
	}

	/**
	 * Check if array type.
	 *
	 * @param arg Variable.
	 * @returns Is array type.
	 */
	public static is(arg: unknown): arg is PLArray {
		return (arg as PLType | null)?.[Symbol.toStringTag] === PLTYPE_ARRAY;
	}

	static {
		const value = { value: PLTYPE_ARRAY } as const;
		Object.defineProperty(this.prototype, Symbol.toStringTag, value);
		Object.defineProperty(this.prototype, 'type', value);
	}
}
