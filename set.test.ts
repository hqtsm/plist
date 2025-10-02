import { assert, assertEquals, assertStrictEquals } from '@std/assert';
import { PLSet, PLTYPE_SET } from './set.ts';
import { PLString } from './string.ts';

function irv<T>(
	ir: { done?: boolean; value?: T },
): [boolean | undefined, T | undefined] {
	return [ir.done, ir.value];
}

function vp(value: string): (v: PLString) => boolean {
	return (v: PLString) => v.value === value;
}

Deno.test('initial value', () => {
	const a = new PLString('a');
	const b = new PLString('b');
	assertEquals(new PLSet().size, 0);
	assertEquals(new PLSet([]).size, 0);
	assertEquals(new PLSet([a]).size, 1);
	assertEquals(new PLSet([a, a]).size, 1);
	assertEquals(new PLSet([a, b]).size, 2);
	assertEquals(
		new PLSet(new Set([a, b])).size,
		2,
	);
});

Deno.test('has', () => {
	const a = new PLString('a');
	const b = new PLString('b');
	const set = new PLSet([a]);
	assertEquals(set.has(a), true);
	assertEquals(set.has(b), false);
});

Deno.test('add', () => {
	const a = new PLString('a');
	const b = new PLString('b');
	const set = new PLSet();
	assertEquals(set.has(a), false);
	assertEquals(set.has(b), false);
	set.add(a);
	assertEquals(set.has(a), true);
	assertEquals(set.has(b), false);
	set.add(b);
	assertEquals(set.has(a), true);
	assertEquals(set.has(b), true);
});

Deno.test('delete', () => {
	const a = new PLString('a');
	const b = new PLString('b');
	const set = new PLSet([a, b]);
	assertEquals(set.size, 2);
	assertEquals(set.delete(a), true);
	assertEquals(set.delete(a), false);
	assertEquals(set.size, 1);
	assertEquals(set.has(a), false);
	assertEquals(set.delete(b), true);
	assertEquals(set.delete(b), false);
	assertEquals(set.size, 0);
	assertEquals(set.has(b), false);
});

Deno.test('clear', () => {
	const a = new PLString('a');
	const b = new PLString('b');
	const set = new PLSet([a, b]);
	assertEquals(set.size, 2);
	set.clear();
	assertEquals(set.size, 0);
	assertEquals(set.has(a), false);
	assertEquals(set.has(b), false);
});

Deno.test('find', () => {
	const a = new PLString('repeat');
	const b = new PLString('repeat');
	const values = [a, b] as const;
	const set = new PLSet(values);

	const that = {};
	let index = 0;
	set.find(function (this: typeof that, v, d): boolean {
		const tag = v.toString();
		assertStrictEquals(this, that, tag);
		assertStrictEquals(v, values[index], tag);
		assertStrictEquals(d, set, tag);
		index++;
		return false;
	}, that);

	assertStrictEquals(set.find(vp('repeat')), a);
	set.delete(a);
	assertStrictEquals(set.find(vp('repeat')), b);
	set.delete(b);
	assertEquals(set.find(vp('repeat')), undefined);
});

Deno.test('findLast', () => {
	const a = new PLString('repeat');
	const b = new PLString('repeat');
	const values = [a, b] as const;
	const set = new PLSet(values);

	const that = {};
	let index = values.length - 1;
	set.findLast(function (this: typeof that, v, d): boolean {
		const tag = v.toString();
		assertStrictEquals(this, that, tag);
		assertStrictEquals(v, values[index], tag);
		assertStrictEquals(d, set, tag);
		index--;
		return false;
	}, that);

	assertStrictEquals(set.findLast(vp('repeat')), b);
	set.delete(b);
	assertStrictEquals(set.findLast(vp('repeat')), a);
	set.delete(a);
	assertEquals(set.find(vp('repeat')), undefined);
});

Deno.test('entries', () => {
	const a = new PLString('a');
	const b = new PLString('b');
	const set = new PLSet([a, b]);
	const entries = set.entries();
	assertEquals(irv(entries.next()), [false, [a, a]]);
	assertEquals(irv(entries.next()), [false, [b, b]]);
	assertEquals(irv(entries.next()), [true, undefined]);
});

Deno.test('keys', () => {
	const a = new PLString('a');
	const b = new PLString('b');
	const set = new PLSet([a, b]);
	const keys = set.keys();
	assertEquals(irv(keys.next()), [false, a]);
	assertEquals(irv(keys.next()), [false, b]);
	assertEquals(irv(keys.next()), [true, undefined]);
});

Deno.test('values', () => {
	const a = new PLString('a');
	const b = new PLString('b');
	const set = new PLSet([a, b]);
	const values = set.values();
	assertEquals(irv(values.next()), [false, a]);
	assertEquals(irv(values.next()), [false, b]);
	assertEquals(irv(values.next()), [true, undefined]);
});

Deno.test('Symbol.iterator', () => {
	const a = new PLString('a');
	const b = new PLString('b');
	const values = [a, b] as const;
	const set = new PLSet(values);
	let index = 0;
	for (const v of set) {
		assertStrictEquals(v, values[index], `${index}`);
		index++;
	}
});

Deno.test('union', () => {
	const strA = new PLString('a');
	const strB = new PLString('b');
	const strC = new PLString('c');
	const strD = new PLString('d');

	const setA = new PLSet([strA, strB, strC]);
	const setB = new PLSet([strC, strD]);
	const set = setA.union(setB);
	const values = [...set];

	assertEquals(set.size, 4);
	assertStrictEquals(values[0], strA);
	assertStrictEquals(values[1], strB);
	assertStrictEquals(values[2], strC);
	assertStrictEquals(values[3], strD);
});

Deno.test('intersection', () => {
	const strA = new PLString('a');
	const strB = new PLString('b');
	const strC = new PLString('c');
	const strD = new PLString('d');

	const setA = new PLSet([strA, strB, strC]);
	const setB = new PLSet([strB, strC, strD]);
	const set = setA.intersection(setB);
	const values = [...set];

	assertEquals(set.size, 2);
	assertStrictEquals(values[0], strB);
	assertStrictEquals(values[1], strC);
});

Deno.test('difference', () => {
	const strA = new PLString('a');
	const strB = new PLString('b');
	const strC = new PLString('c');
	const strD = new PLString('d');

	const setA = new PLSet([strA, strB, strC]);
	const setB = new PLSet([strC, strD]);
	const set = setA.difference(setB);
	const values = [...set];

	assertEquals(set.size, 2);
	assertStrictEquals(values[0], strA);
	assertStrictEquals(values[1], strB);
});

Deno.test('symmetricDifference', () => {
	const strA = new PLString('a');
	const strB = new PLString('b');
	const strC = new PLString('c');
	const strD = new PLString('d');

	const setA = new PLSet([strA, strB, strC]);
	const setB = new PLSet([strB, strC, strD]);
	const set = setA.symmetricDifference(setB);
	const values = [...set];

	assertEquals(set.size, 2);
	assertStrictEquals(values[0], strA);
	assertStrictEquals(values[1], strD);
});

Deno.test('isSubsetOf', () => {
	const strA = new PLString('a');
	const strB = new PLString('b');
	const strC = new PLString('c');

	const setA = new PLSet([strA, strB]);
	const setB = new PLSet([strA, strB, strC]);
	assertEquals(setA.isSubsetOf(setB), true);
	assertEquals(setB.isSubsetOf(setA), false);
});

Deno.test('isSupersetOf', () => {
	const strA = new PLString('a');
	const strB = new PLString('b');
	const strC = new PLString('c');

	const setA = new PLSet([strA, strB]);
	const setB = new PLSet([strA, strB, strC]);
	assertEquals(setA.isSupersetOf(setB), false);
	assertEquals(setB.isSupersetOf(setA), true);
});

Deno.test('isDisjointFrom', () => {
	const strA = new PLString('a');
	const strB = new PLString('b');
	const strC = new PLString('c');
	const strD = new PLString('d');

	const setA = new PLSet([strA, strB]);
	const setB = new PLSet([strC, strD]);
	const setC = new PLSet([strA, strC]);

	assertEquals(setA.isDisjointFrom(setB), true);
	assertEquals(setB.isDisjointFrom(setA), true);
	assertEquals(setC.isDisjointFrom(setA), false);
	assertEquals(setC.isDisjointFrom(setB), false);
});

Deno.test('toSet', () => {
	const a = new PLString('a');
	const b = new PLString('b');
	const set = new PLSet([a, b]);
	const s = set.toSet();
	assertEquals(s.size, set.size);
	for (const v of s) {
		assert(set.has(v));
	}
});

Deno.test('toValueSet', () => {
	const a = new PLString('a');
	const b = new PLString('b');
	const set = new PLSet([a, b]);
	const s = set.toValueSet();
	assertEquals(s.size, set.size);
	assert(s.has(a.valueOf()));
	assert(s.has(b.valueOf()));
});

Deno.test('valueOf', () => {
	const a = new PLString('a');
	const b = new PLString('b');
	const set = new PLSet([a, b]);
	const s = set.valueOf();
	assertEquals(s.size, set.size);
	for (const v of s) {
		assert(set.has(v));
	}
});

Deno.test('is type', () => {
	assertEquals(new PLSet().type, PLTYPE_SET);
	assertEquals(new PLSet()[Symbol.toStringTag], PLTYPE_SET);
	assertEquals(
		Object.prototype.toString.call(new PLSet()),
		`[object ${PLTYPE_SET}]`,
	);

	assertEquals(PLSet.is(new PLSet()), true);
	assertEquals(PLSet.is(new PLString()), false);
	assertEquals(PLSet.is({}), false);
	assertEquals(PLSet.is(null), false);

	for (const v of [new PLSet(), new PLString(), {}, null]) {
		if (PLSet.is(v)) {
			assertEquals(v.size, 0);
		}
	}
});
