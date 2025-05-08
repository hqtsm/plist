import type { PLString } from './string.ts';
import type { PLType } from './type.ts';

let maps: WeakMap<PLDict, Map<PLString, PLType>>;

const type = 'PLDict';

/**
 * Property list dict type.
 */
export class PLDict<T extends PLType = PLType> implements PLType {
	declare public readonly [Symbol.toStringTag]: string;

	/**
	 * Create property list dict reference.
	 *
	 * @param itter Property list key value pairs.
	 */
	constructor(itter: Iterable<readonly [PLString, T]> | null = null) {
		(maps ??= new WeakMap()).set(this, new Map(itter));
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
	 * Check if type is dict type.
	 *
	 * @param arg Property list type.
	 * @returns Is type dict type.
	 */
	public static is(arg: PLType): arg is PLDict {
		return arg[Symbol.toStringTag] === type;
	}

	static {
		Object.defineProperty(this.prototype, Symbol.toStringTag, {
			value: type,
			configurable: true,
		});
	}
}
