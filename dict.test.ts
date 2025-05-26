import { assertEquals, assertStrictEquals } from '@std/assert';
import { PLDict } from './dict.ts';
import { PLString } from './string.ts';

/**
 * Iterator result values.
 *
 * @param ir Iterator result.
 * @returns Iterator values.
 */
function irv<T>(
	ir: { done?: boolean; value?: T },
): [boolean | undefined, T | undefined] {
	return [ir.done, ir.value];
}

Deno.test('initial value', () => {
	const a = new PLString('a');
	const b = new PLString('b');
	assertEquals(new PLDict().size, 0);
	assertEquals(new PLDict([]).size, 0);
	assertEquals(new PLDict([[a, b]]).size, 1);
	assertEquals(new PLDict([[a, a], [a, b]]).size, 1);
	assertEquals(new PLDict([[a, b], [b, a]]).size, 2);
	assertEquals(
		new PLDict(
			new Map([
				[a, a],
				[b, b],
			]),
		).size,
		2,
	);
});

Deno.test('has', () => {
	const a = new PLString('a');
	const b = new PLString('b');
	const dict = new PLDict([[a, b]]);
	assertEquals(dict.has(a), true);
	assertEquals(dict.has(b), false);
});

Deno.test('get', () => {
	const a = new PLString('a');
	const b = new PLString('b');
	const dict = new PLDict([[a, b]]);
	assertStrictEquals(dict.get(a), b);
	assertEquals(dict.get(b), undefined);
});

Deno.test('set', () => {
	const a = new PLString('a');
	const b = new PLString('b');
	const dict = new PLDict([[a, a]]);
	assertStrictEquals(dict.get(a), a);
	dict.set(a, b);
	assertEquals(dict.size, 1);
	assertStrictEquals(dict.get(a), b);
	dict.set(b, a);
	assertEquals(dict.size, 2);
	assertStrictEquals(dict.get(b), a);
});

Deno.test('delete', () => {
	const a = new PLString('a');
	const b = new PLString('b');
	const dict = new PLDict([[a, a], [b, b]]);
	assertEquals(dict.size, 2);
	assertEquals(dict.delete(a), true);
	assertEquals(dict.delete(a), false);
	assertEquals(dict.size, 1);
	assertEquals(dict.get(a), undefined);
	assertStrictEquals(dict.get(b), b);
	assertEquals(dict.delete(b), true);
	assertEquals(dict.delete(b), false);
	assertEquals(dict.size, 0);
	assertEquals(dict.get(a), undefined);
	assertEquals(dict.get(b), undefined);
});

Deno.test('clear', () => {
	const a = new PLString('a');
	const b = new PLString('b');
	const dict = new PLDict([[a, a], [b, b]]);
	assertEquals(dict.size, 2);
	dict.clear();
	assertEquals(dict.size, 0);
	assertEquals(dict.get(a), undefined);
	assertEquals(dict.get(b), undefined);
});

Deno.test('find', () => {
	const aKey = new PLString('repeat');
	const aValue = new PLString('A');
	const bKey = new PLString('repeat');
	const bValue = new PLString('B');
	const dict = new PLDict([[aKey, aValue], [bKey, bValue]]);
	assertStrictEquals(dict.find('repeat'), aValue);
	dict.delete(aKey);
	assertStrictEquals(dict.find('repeat'), bValue);
	dict.delete(bKey);
	assertEquals(dict.find('repeat'), undefined);
});

Deno.test('findKey', () => {
	const aKey = new PLString('repeat');
	const aValue = new PLString('A');
	const bKey = new PLString('repeat');
	const bValue = new PLString('B');
	const dict = new PLDict([[aKey, aValue], [bKey, bValue]]);
	assertStrictEquals(dict.findKey('repeat'), aKey);
	dict.delete(aKey);
	assertStrictEquals(dict.findKey('repeat'), bKey);
	dict.delete(bKey);
	assertEquals(dict.findKey('repeat'), undefined);
});

Deno.test('findLast', () => {
	const aKey = new PLString('repeat');
	const aValue = new PLString('A');
	const bKey = new PLString('repeat');
	const bValue = new PLString('B');
	const dict = new PLDict([[aKey, aValue], [bKey, bValue]]);
	assertStrictEquals(dict.findLast('repeat'), bValue);
	dict.delete(bKey);
	assertStrictEquals(dict.findLast('repeat'), aValue);
	dict.delete(aKey);
	assertEquals(dict.findLast('repeat'), undefined);
});

Deno.test('findLastKey', () => {
	const aKey = new PLString('repeat');
	const aValue = new PLString('A');
	const bKey = new PLString('repeat');
	const bValue = new PLString('B');
	const dict = new PLDict([[aKey, aValue], [bKey, bValue]]);
	assertStrictEquals(dict.findLastKey('repeat'), bKey);
	dict.delete(bKey);
	assertStrictEquals(dict.findLastKey('repeat'), aKey);
	dict.delete(aKey);
	assertEquals(dict.findLastKey('repeat'), undefined);
});

Deno.test('entries', () => {
	const a = new PLString('a');
	const b = new PLString('b');
	const dict = new PLDict([[a, a], [b, b]]);
	const entries = dict.entries();
	assertEquals(irv(entries.next()), [false, [a, a]]);
	assertEquals(irv(entries.next()), [false, [b, b]]);
	assertEquals(irv(entries.next()), [true, undefined]);
});

Deno.test('keys', () => {
	const a = new PLString('a');
	const b = new PLString('b');
	const dict = new PLDict([[a, a], [b, b]]);
	const keys = dict.keys();
	assertEquals(irv(keys.next()), [false, a]);
	assertEquals(irv(keys.next()), [false, b]);
	assertEquals(irv(keys.next()), [true, undefined]);
});

Deno.test('values', () => {
	const a = new PLString('a');
	const b = new PLString('b');
	const dict = new PLDict([[a, a], [b, b]]);
	const values = dict.values();
	assertEquals(irv(values.next()), [false, a]);
	assertEquals(irv(values.next()), [false, b]);
	assertEquals(irv(values.next()), [true, undefined]);
});

Deno.test('Symbol.iterator', () => {
	const a = new PLString('a');
	const b = new PLString('b');
	const values = new Map([
		[a, a],
		[b, b],
	]);
	const dict = new PLDict(values);
	for (const [k, v] of dict) {
		assertStrictEquals(v, values.get(k));
	}
});

Deno.test('is type', () => {
	assertEquals(PLDict.is(new PLDict()), true);
	assertEquals(PLDict.is(new PLString()), false);
	assertEquals(PLDict.is({}), false);
	assertEquals(PLDict.is(null), false);

	for (const v of [new PLDict(), new PLString(), {}, null]) {
		if (PLDict.is(v)) {
			assertEquals(v.size, 0);
		}
	}
});
