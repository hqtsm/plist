import type { PLType } from './type.ts';

let arrays: WeakMap<PLArray, Array<PLType>>;

const type = 'PLArray';

/**
 * Property list array type.
 */
export class PLArray<T extends PLType = PLType> implements PLType {
	declare public readonly [Symbol.toStringTag]: string;

	/**
	 * Create property list array reference.
	 *
	 * @param itter Property list values.
	 */
	constructor(itter?: Iterable<T> | ArrayLike<T>) {
		(arrays ??= new WeakMap()).set(
			this,
			itter === undefined ? [] : Array.from(itter),
		);
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
	public slice(start: number, end?: number): T[] {
		return (arrays.get(this) as T[]).slice(start, end);
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
	 * @returns Found value or undefined.
	 */
	public find(callback: (value: T) => boolean): T | undefined {
		return (arrays.get(this) as T[]).find(callback);
	}

	/**
	 * Find index of value.
	 *
	 * @param callback Find callback.
	 * @returns Found index or -1.
	 */
	public findIndex(callback: (value: T) => boolean): number {
		return (arrays.get(this) as T[]).findIndex(callback);
	}

	/**
	 * Find last value.
	 *
	 * @param callback Find callback.
	 * @returns Found value or undefined.
	 */
	public findLast(callback: (value: T) => boolean): T | undefined {
		return (arrays.get(this) as T[]).findLast(callback);
	}

	/**
	 * Find last index of value.
	 *
	 * @param callback Find callback.
	 * @returns Found index or -1.
	 */
	public findLastIndex(callback: (value: T) => boolean): number {
		return (arrays.get(this) as T[]).findLastIndex(callback);
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
	public entries(): ArrayIterator<[number, T]> {
		return (arrays.get(this) as T[]).entries();
	}

	/**
	 * Get array keys.
	 *
	 * @returns Array keys.
	 */
	public keys(): ArrayIterator<number> {
		return (arrays.get(this) as T[]).keys();
	}

	/**
	 * Get array values.
	 *
	 * @returns Array values.
	 */
	public values(): ArrayIterator<T> {
		return (arrays.get(this) as T[]).values();
	}

	/**
	 * Get array iterator.
	 *
	 * @returns Array iterator.
	 */
	public [Symbol.iterator](): ArrayIterator<T> {
		return (arrays.get(this) as T[])[Symbol.iterator]();
	}

	/**
	 * Check if type is array type.
	 *
	 * @param arg Property list type.
	 * @returns Is type array type.
	 */
	public static is(arg: PLType): arg is PLArray {
		return arg[Symbol.toStringTag] === type;
	}

	static {
		Object.defineProperty(this.prototype, Symbol.toStringTag, {
			value: type,
			configurable: true,
		});
	}
}
