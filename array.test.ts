import { assertEquals } from '@std/assert';
import { PLArray } from './array.ts';
import { PLBoolean } from './boolean.ts';
import { PLInteger } from './integer.ts';

/**
 * Iterator result values.
 *
 * @param ir Iterator result.
 * @returns Iterator values.
 */
function irv<T>(ir: IteratorResult<T>): [boolean, T | undefined] {
	return [ir.done, ir.value] as [boolean, T | undefined];
}

Deno.test('initial value', () => {
	assertEquals(new PLArray().length, 0);
	assertEquals(new PLArray([]).length, 0);
	const arr = [new PLBoolean(false), new PLBoolean(true)];
	const array = new PLArray(arr);
	assertEquals(array.length, 2);
	arr.pop();
	assertEquals(array.length, 2);
});

Deno.test('get', () => {
	const kFalse = new PLBoolean(false);
	const kTrue = new PLBoolean(true);
	const array = new PLArray([kFalse, kTrue]);
	assertEquals(array.get(0), kFalse);
	assertEquals(array.get(1), kTrue);
	assertEquals(array.get(2), undefined);
	assertEquals(array.get(-1), undefined);
});

Deno.test('set', () => {
	const kFalse = new PLBoolean(false);
	const kTrue = new PLBoolean(true);
	const array = new PLArray([kFalse]);
	array.set(0, kTrue);
	assertEquals(array.length, 1);
	array.set(1, kFalse);
	assertEquals(array.length, 2);
	assertEquals(array.get(0), kTrue);
	assertEquals(array.get(1), kFalse);
});

Deno.test('at', () => {
	const kFalse = new PLBoolean(false);
	const kTrue = new PLBoolean(true);
	const array = new PLArray([kFalse, kTrue]);
	assertEquals(array.at(0), kFalse);
	assertEquals(array.at(1), kTrue);
	assertEquals(array.at(2), undefined);
	assertEquals(array.at(-1), kTrue);
	assertEquals(array.at(-2), kFalse);
	assertEquals(array.at(-3), undefined);
});

Deno.test('push', () => {
	const a = new PLInteger(0n);
	const b = new PLInteger(1n);
	const c = new PLInteger(2n);
	const d = new PLInteger(3n);
	const array = new PLArray([a]);
	array.push(b);
	assertEquals(array.length, 2);
	assertEquals(array.get(1), b);
	array.push(c, d);
	assertEquals(array.length, 4);
	assertEquals(array.get(2), c);
	assertEquals(array.get(3), d);
	assertEquals(array.get(4), undefined);
});

Deno.test('pop', () => {
	const a = new PLInteger(0n);
	const b = new PLInteger(1n);
	const c = new PLInteger(2n);
	const d = new PLInteger(3n);
	const array = new PLArray([a, b, c, d]);
	assertEquals(array.pop(), d);
	assertEquals(array.length, 3);
	assertEquals(array.get(2), c);
	assertEquals(array.pop(), c);
	assertEquals(array.length, 2);
	assertEquals(array.get(1), b);
	assertEquals(array.pop(), b);
	assertEquals(array.length, 1);
	assertEquals(array.get(0), a);
	assertEquals(array.pop(), a);
	assertEquals(array.length, 0);
	assertEquals(array.get(0), undefined);
	assertEquals(array.pop(), undefined);
	assertEquals(array.length, 0);
});

Deno.test('unshift', () => {
	const a = new PLInteger(0n);
	const b = new PLInteger(1n);
	const c = new PLInteger(2n);
	const d = new PLInteger(3n);
	const array = new PLArray([a, b]);
	array.unshift(c);
	assertEquals(array.length, 3);
	assertEquals(array.get(0), c);
	assertEquals(array.get(1), a);
	assertEquals(array.get(2), b);
	array.unshift(d);
	assertEquals(array.length, 4);
	assertEquals(array.get(0), d);
	assertEquals(array.get(1), c);
	assertEquals(array.get(2), a);
	assertEquals(array.get(3), b);
});

Deno.test('shift', () => {
	const a = new PLInteger(0n);
	const b = new PLInteger(1n);
	const c = new PLInteger(2n);
	const d = new PLInteger(3n);
	const array = new PLArray([a, b, c, d]);
	assertEquals(array.shift(), a);
	assertEquals(array.length, 3);
	assertEquals(array.get(0), b);
	assertEquals(array.shift(), b);
	assertEquals(array.length, 2);
	assertEquals(array.get(0), c);
	assertEquals(array.shift(), c);
	assertEquals(array.length, 1);
	assertEquals(array.get(0), d);
	assertEquals(array.shift(), d);
	assertEquals(array.length, 0);
	assertEquals(array.get(0), undefined);
	assertEquals(array.shift(), undefined);
	assertEquals(array.length, 0);
});

Deno.test('slice', () => {
	const a = new PLInteger(0n);
	const b = new PLInteger(1n);
	const c = new PLInteger(2n);
	const d = new PLInteger(3n);
	const array = new PLArray([a, b, c, d]);
	assertEquals(array.slice(0), [a, b, c, d]);
	assertEquals(array.slice(1), [b, c, d]);
	assertEquals(array.slice(2), [c, d]);
	assertEquals(array.slice(3), [d]);
	assertEquals(array.slice(4), []);
	assertEquals(array.slice(-1), [d]);
	assertEquals(array.slice(-2), [c, d]);
	assertEquals(array.slice(-3), [b, c, d]);
	assertEquals(array.slice(-4), [a, b, c, d]);
	assertEquals(array.slice(-5), [a, b, c, d]);
	assertEquals(array.slice(0, 1), [a]);
	assertEquals(array.slice(0, 2), [a, b]);
	assertEquals(array.slice(0, 3), [a, b, c]);
	assertEquals(array.slice(0, 4), [a, b, c, d]);
	assertEquals(array.slice(0, 5), [a, b, c, d]);
	assertEquals(array.slice(1, 2), [b]);
	assertEquals(array.slice(1, 3), [b, c]);
	assertEquals(array.slice(1, 4), [b, c, d]);
	assertEquals(array.slice(1, 5), [b, c, d]);
	assertEquals(array.slice(1, -1), [b, c]);
});

Deno.test('splice', () => {
	const a = new PLInteger(0n);
	const b = new PLInteger(1n);
	const c = new PLInteger(2n);
	const d = new PLInteger(3n);
	const array = new PLArray([a, b, c, d]);
	assertEquals(array.splice(0, 1), [a]);
	assertEquals(array.length, 3);
	assertEquals(array.get(0), b);
	assertEquals(array.get(1), c);
	assertEquals(array.get(2), d);
	assertEquals(array.splice(0, 2), [b, c]);
	assertEquals(array.length, 1);
	assertEquals(array.get(0), d);
	assertEquals(array.splice(0, 1), [d]);
	assertEquals(array.length, 0);
	assertEquals(array.get(0), undefined);
	assertEquals(array.splice(0, 1), []);
	assertEquals(array.length, 0);
	assertEquals(array.get(0), undefined);
	array.push(a, c, d);
	assertEquals(array.splice(1, 1, b), [c]);
	assertEquals(array.length, 3);
	assertEquals(array.get(0), a);
	assertEquals(array.get(1), b);
	assertEquals(array.get(2), d);
	assertEquals(array.splice(2, 0, c), []);
	assertEquals(array.length, 4);
	assertEquals(array.get(0), a);
	assertEquals(array.get(1), b);
	assertEquals(array.get(2), c);
	assertEquals(array.get(3), d);
});

Deno.test('reverse', () => {
	const a = new PLInteger(0n);
	const b = new PLInteger(1n);
	const c = new PLInteger(2n);
	const d = new PLInteger(3n);
	const array = new PLArray([a, b, c, d]);
	array.reverse();
	assertEquals(array.length, 4);
	assertEquals(array.get(0), d);
	assertEquals(array.get(1), c);
	assertEquals(array.get(2), b);
	assertEquals(array.get(3), a);
});

Deno.test('indexOf', () => {
	const a = new PLInteger(0n);
	const b = new PLInteger(1n);
	const c = new PLInteger(2n);
	const d = new PLInteger(3n);
	const array = new PLArray([a, a, b, b, c, c, d, d]);
	assertEquals(array.indexOf(a), 0);
	assertEquals(array.indexOf(b), 2);
	assertEquals(array.indexOf(c), 4);
	assertEquals(array.indexOf(d), 6);
	assertEquals(array.indexOf(new PLInteger(0n)), -1);
});

Deno.test('lastIndexOf', () => {
	const a = new PLInteger(0n);
	const b = new PLInteger(1n);
	const c = new PLInteger(2n);
	const d = new PLInteger(3n);
	const array = new PLArray([a, a, b, b, c, c, d, d]);
	assertEquals(array.lastIndexOf(a), 1);
	assertEquals(array.lastIndexOf(b), 3);
	assertEquals(array.lastIndexOf(c), 5);
	assertEquals(array.lastIndexOf(d), 7);
	assertEquals(array.lastIndexOf(new PLInteger(0n)), -1);
});

Deno.test('find', () => {
	const a = new PLInteger(0n);
	const b = new PLInteger(1n);
	const c = new PLInteger(2n);
	const d = new PLInteger(3n);
	const array = new PLArray([a, a, b, b, c, c, d, d]);
	assertEquals(array.find((v) => v.value === 0n), a);
	assertEquals(array.find((v) => v.value === 1n), b);
	assertEquals(array.find((v) => v.value === 2n), c);
	assertEquals(array.find((v) => v.value === 3n), d);
	assertEquals(array.find((v) => v.value === 4n), undefined);
});

Deno.test('findIndex', () => {
	const a = new PLInteger(0n);
	const b = new PLInteger(1n);
	const c = new PLInteger(2n);
	const d = new PLInteger(3n);
	const array = new PLArray([a, a, b, b, c, c, d, d]);
	assertEquals(array.findIndex((v) => v.value === 0n), 0);
	assertEquals(array.findIndex((v) => v.value === 1n), 2);
	assertEquals(array.findIndex((v) => v.value === 2n), 4);
	assertEquals(array.findIndex((v) => v.value === 3n), 6);
	assertEquals(array.findIndex((v) => v.value === 4n), -1);
});

Deno.test('findLast', () => {
	const a = new PLInteger(0n);
	const b = new PLInteger(1n);
	const c = new PLInteger(2n);
	const d = new PLInteger(3n);
	const array = new PLArray([a, a, b, b, c, c, d, d]);
	assertEquals(array.findLast((v) => v.value === 0n), a);
	assertEquals(array.findLast((v) => v.value === 1n), b);
	assertEquals(array.findLast((v) => v.value === 2n), c);
	assertEquals(array.findLast((v) => v.value === 3n), d);
	assertEquals(array.findLast((v) => v.value === 4n), undefined);
});

Deno.test('findLastIndex', () => {
	const a = new PLInteger(0n);
	const b = new PLInteger(1n);
	const c = new PLInteger(2n);
	const d = new PLInteger(3n);
	const array = new PLArray([a, a, b, b, c, c, d, d]);
	assertEquals(array.findLastIndex((v) => v.value === 0n), 1);
	assertEquals(array.findLastIndex((v) => v.value === 1n), 3);
	assertEquals(array.findLastIndex((v) => v.value === 2n), 5);
	assertEquals(array.findLastIndex((v) => v.value === 3n), 7);
	assertEquals(array.findLastIndex((v) => v.value === 4n), -1);
});

Deno.test('includes', () => {
	const a = new PLInteger(0n);
	const b = new PLInteger(1n);
	const c = new PLInteger(2n);
	const d = new PLInteger(3n);
	const array = new PLArray([a, a, b, b, c, c, d, d]);
	assertEquals(array.includes(a), true);
	assertEquals(array.includes(b), true);
	assertEquals(array.includes(c), true);
	assertEquals(array.includes(d), true);
	assertEquals(array.includes(new PLInteger(0n)), false);
});

Deno.test('fill', () => {
	const a = new PLInteger(0n);
	const b = new PLInteger(1n);
	const c = new PLInteger(2n);
	const d = new PLInteger(3n);
	const array = new PLArray([a, a, a, a]);
	array.fill(b);
	assertEquals(array.length, 4);
	assertEquals(array.get(0), b);
	assertEquals(array.get(1), b);
	assertEquals(array.get(2), b);
	assertEquals(array.get(3), b);
	array.fill(c, 1, 3);
	assertEquals(array.length, 4);
	assertEquals(array.get(0), b);
	assertEquals(array.get(1), c);
	assertEquals(array.get(2), c);
	assertEquals(array.get(3), b);
	array.fill(d, 3, 6);
	assertEquals(array.length, 4);
	assertEquals(array.get(0), b);
	assertEquals(array.get(1), c);
	assertEquals(array.get(2), c);
	assertEquals(array.get(3), d);
});

Deno.test('copyWithin', () => {
	const a = new PLInteger(0n);
	const b = new PLInteger(1n);
	const c = new PLInteger(2n);
	const d = new PLInteger(3n);
	const array = new PLArray([a, b, c, d]);
	array.copyWithin(2, 1, 3);
	assertEquals(array.length, 4);
	assertEquals(array.get(0), a);
	assertEquals(array.get(1), b);
	assertEquals(array.get(2), b);
	assertEquals(array.get(3), c);
});

Deno.test('clear', () => {
	const array = new PLArray([new PLInteger(0n), new PLInteger(1n)]);
	array.clear();
	assertEquals(array.length, 0);
	assertEquals(array.get(0), undefined);
	assertEquals(array.get(1), undefined);
});

Deno.test('entries', () => {
	const a = new PLInteger(0n);
	const b = new PLInteger(1n);
	const c = new PLInteger(2n);
	const d = new PLInteger(3n);
	const array = new PLArray([a, b, c, d]);
	const entries = array.entries();
	assertEquals(irv(entries.next()), [false, [0, a]]);
	assertEquals(irv(entries.next()), [false, [1, b]]);
	assertEquals(irv(entries.next()), [false, [2, c]]);
	assertEquals(irv(entries.next()), [false, [3, d]]);
	assertEquals(irv(entries.next()), [true, undefined]);
});

Deno.test('keys', () => {
	const a = new PLInteger(0n);
	const b = new PLInteger(1n);
	const c = new PLInteger(2n);
	const d = new PLInteger(3n);
	const array = new PLArray([a, b, c, d]);
	const keys = array.keys();
	assertEquals(irv(keys.next()), [false, 0]);
	assertEquals(irv(keys.next()), [false, 1]);
	assertEquals(irv(keys.next()), [false, 2]);
	assertEquals(irv(keys.next()), [false, 3]);
	assertEquals(irv(keys.next()), [true, undefined]);
});

Deno.test('values', () => {
	const a = new PLInteger(0n);
	const b = new PLInteger(1n);
	const c = new PLInteger(2n);
	const d = new PLInteger(3n);
	const array = new PLArray([a, b, c, d]);
	const values = array.values();
	assertEquals(irv(values.next()), [false, a]);
	assertEquals(irv(values.next()), [false, b]);
	assertEquals(irv(values.next()), [false, c]);
	assertEquals(irv(values.next()), [false, d]);
	assertEquals(irv(values.next()), [true, undefined]);
});

Deno.test('Symbol.iterator', () => {
	const values = [
		new PLInteger(0n),
		new PLInteger(1n),
		new PLInteger(2n),
		new PLInteger(3n),
	];
	const array = new PLArray(values);
	let i = 0;
	for (const value of array) {
		assertEquals(value, values[i++]);
	}
});

Deno.test('is type', () => {
	assertEquals(PLArray.is(new PLArray()), true);
	assertEquals(PLArray.is(new PLInteger()), false);
	assertEquals(PLArray.is({}), false);
	assertEquals(PLArray.is(null), false);

	for (const v of [new PLArray(), new PLInteger(), {}, null]) {
		if (PLArray.is(v)) {
			assertEquals(v.length, 0);
		}
	}
});
