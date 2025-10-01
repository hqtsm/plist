import {
	assertEquals,
	assertInstanceOf,
	assertNotStrictEquals,
	assertStrictEquals,
} from '@std/assert';
import { PLDict, PLTYPE_DICT } from './dict.ts';
import { PLString } from './string.ts';

function irv<T>(
	ir: { done?: boolean; value?: T },
): [boolean | undefined, T | undefined] {
	return [ir.done, ir.value];
}

function kp(value: string): (_: PLString, key: PLString) => boolean {
	return (_: PLString, key: PLString) => key.value === value;
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
	const values = [[aKey, aValue], [bKey, bValue]] as const;
	const dict = new PLDict(values);

	const that = {};
	let index = 0;
	dict.find(function (this: typeof that, v, k, d): boolean {
		const tag = `${k.toString()} => ${v.toString()}`;
		assertStrictEquals(this, that, tag);
		assertStrictEquals(v, values[index][1], tag);
		assertStrictEquals(k, values[index][0], tag);
		assertStrictEquals(d, dict, tag);
		index++;
		return false;
	}, that);

	assertStrictEquals(dict.find(kp('repeat')), aValue);
	dict.delete(aKey);
	assertStrictEquals(dict.find(kp('repeat')), bValue);
	dict.delete(bKey);
	assertEquals(dict.find(kp('repeat')), undefined);
});

Deno.test('findKey', () => {
	const aKey = new PLString('repeat');
	const aValue = new PLString('A');
	const bKey = new PLString('repeat');
	const bValue = new PLString('B');
	const values = [[aKey, aValue], [bKey, bValue]] as const;
	const dict = new PLDict(values);

	const that = {};
	let index = 0;
	dict.findKey(function (this: typeof that, v, k, d): boolean {
		const tag = `${k.toString()} => ${v.toString()}`;
		assertStrictEquals(this, that, tag);
		assertStrictEquals(v, values[index][1], tag);
		assertStrictEquals(k, values[index][0], tag);
		assertStrictEquals(d, dict, tag);
		index++;
		return false;
	}, that);

	assertStrictEquals(dict.findKey(kp('repeat')), aKey);
	dict.delete(aKey);
	assertStrictEquals(dict.findKey(kp('repeat')), bKey);
	dict.delete(bKey);
	assertEquals(dict.findKey(kp('repeat')), undefined);
});

Deno.test('findLast', () => {
	const aKey = new PLString('repeat');
	const aValue = new PLString('A');
	const bKey = new PLString('repeat');
	const bValue = new PLString('B');
	const values = [[aKey, aValue], [bKey, bValue]] as const;
	const dict = new PLDict(values);

	const that = {};
	let index = values.length - 1;
	dict.findLast(function (this: typeof that, v, k, d): boolean {
		const tag = `${k.toString()} => ${v.toString()}`;
		assertStrictEquals(this, that, tag);
		assertStrictEquals(v, values[index][1], tag);
		assertStrictEquals(k, values[index][0], tag);
		assertStrictEquals(d, dict, tag);
		index--;
		return false;
	}, that);

	assertStrictEquals(dict.findLast(kp('repeat')), bValue);
	dict.delete(bKey);
	assertStrictEquals(dict.findLast(kp('repeat')), aValue);
	dict.delete(aKey);
	assertEquals(dict.findLast(kp('repeat')), undefined);
});

Deno.test('findLastKey', () => {
	const aKey = new PLString('repeat');
	const aValue = new PLString('A');
	const bKey = new PLString('repeat');
	const bValue = new PLString('B');
	const values = [[aKey, aValue], [bKey, bValue]] as const;
	const dict = new PLDict(values);

	const that = {};
	let index = values.length - 1;
	dict.findLastKey(function (this: typeof that, v, k, d): boolean {
		const tag = `${k.toString()} => ${v.toString()}`;
		assertStrictEquals(this, that, tag);
		assertStrictEquals(v, values[index][1], tag);
		assertStrictEquals(k, values[index][0], tag);
		assertStrictEquals(d, dict, tag);
		index--;
		return false;
	}, that);

	assertStrictEquals(dict.findLastKey(kp('repeat')), bKey);
	dict.delete(bKey);
	assertStrictEquals(dict.findLastKey(kp('repeat')), aKey);
	dict.delete(aKey);
	assertEquals(dict.findLastKey(kp('repeat')), undefined);
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

Deno.test('toMap', () => {
	const a = new PLString('a');
	const b = new PLString('b');
	const values = new Map([
		[a, a],
		[b, b],
	]);
	const dict = new PLDict(values);
	const map = dict.toMap();
	assertEquals(map.size, values.size);
	for (const [k, v] of map) {
		assertStrictEquals(v, values.get(k));
	}
});

Deno.test('toValueMap', () => {
	const a = new PLString('a');
	const A1 = new PLString('A');
	const A2 = new PLString('A');
	const b = new PLString('b');
	const B1 = new PLString('B');
	const dict = new PLDict([
		[A1, a],
		[A2, b],
		[B1, b],
	]);
	let map = dict.toValueMap();
	assertEquals(map.size, 2);
	assertStrictEquals(map.get('A'), b);
	assertStrictEquals(map.get('B'), b);
	map = dict.toValueMap(false);
	assertEquals(map.size, 2);
	assertStrictEquals(map.get('A'), b);
	assertStrictEquals(map.get('B'), b);
	map = dict.toValueMap(true);
	assertEquals(map.size, 2);
	assertStrictEquals(map.get('A'), a);
	assertStrictEquals(map.get('B'), b);
});

Deno.test('valueOf', () => {
	const A = new PLString('A');
	const B = new PLString('B');
	const map = new Map([[A, B], [B, A]]);
	const dict = new PLDict(map);
	const value = dict.valueOf();
	assertInstanceOf(value, Map);
	assertNotStrictEquals(value, map);
	assertEquals(value.size, map.size);
	for (const [k, v] of map) {
		assertStrictEquals(map.get(k), v, k.value);
	}
});

Deno.test('is type', () => {
	assertEquals(new PLDict().type, PLTYPE_DICT);
	assertEquals(new PLDict()[Symbol.toStringTag], PLTYPE_DICT);
	assertEquals(
		Object.prototype.toString.call(new PLDict()),
		`[object ${PLTYPE_DICT}]`,
	);

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
