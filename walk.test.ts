import { assertEquals, assertStrictEquals } from '@std/assert';
import { PLArray, PLTYPE_ARRAY } from './array.ts';
import { PLBoolean, PLTYPE_BOOLEAN } from './boolean.ts';
import { PLData, PLTYPE_DATA } from './data.ts';
import { PLDate, PLTYPE_DATE } from './date.ts';
import { PLDict, PLTYPE_DICT } from './dict.ts';
import { PLInteger, PLTYPE_INTEGER } from './integer.ts';
import { PLNull, PLTYPE_NULL } from './null.ts';
import { PLReal, PLTYPE_REAL } from './real.ts';
import { PLSet, PLTYPE_SET } from './set.ts';
import { PLString, PLTYPE_STRING } from './string.ts';
import type { PLType } from './type.ts';
import { PLTYPE_UID, PLUID } from './uid.ts';
import { walk, type WalkParent } from './walk.ts';

interface Visited {
	method: string;
	visit: PLType;
	depth: number;
	key: PLType | number | null;
	parent: WalkParent;
}

interface DepthVisit {
	value: PLArray | PLDict | PLSet;
	depth: number;
	parent: PLType | null;
}

const visit = (
	method: string,
	visit: PLType,
	depth: number,
	key: PLType | number | null,
	parent: WalkParent,
): Visited => ({
	method,
	visit,
	depth,
	key,
	parent,
});

Deno.test('walk: default', () => {
	for (
		const plist of [
			new PLArray(),
			new PLBoolean(),
			new PLData(),
			new PLDate(),
			new PLDict(),
			new PLInteger(),
			new PLNull(),
			new PLReal(),
			new PLSet(),
			new PLString(),
			new PLUID(),
		]
	) {
		const tag = plist.type;
		let visit: PLType | null = null;
		let leave: PLType | null = null;
		walk(
			plist,
			{
				default(v, d, k, p): void {
					visit = v;
					assertEquals(d, 0, tag);
					assertStrictEquals(k, null, tag);
					assertStrictEquals(p, null, tag);
				},
			},
			{
				default(v, d, k, p): void {
					leave = v;
					assertEquals(d, 0, tag);
					assertStrictEquals(k, null, tag);
					assertStrictEquals(p, null, tag);
				},
			},
		);
		assertStrictEquals(visit, plist, tag);
		if (PLArray.is(visit) || PLDict.is(visit) || PLSet.is(visit)) {
			assertStrictEquals(leave, plist, tag);
		} else {
			assertStrictEquals(leave, null, tag);
		}

		const collection = new PLArray([plist]);
		visit = null;
		leave = null;
		walk(
			collection,
			{
				default(v, d, k, p): void {
					if (v !== collection) {
						visit = v;
						assertEquals(d, 1, tag);
						assertStrictEquals(k, 0, tag);
						assertStrictEquals(p, collection, tag);
					}
				},
			},
			{
				default(v, d, k, p): void {
					if (v !== collection) {
						leave = v;
						assertEquals(d, 1, tag);
						assertStrictEquals(k, 0, tag);
						assertStrictEquals(p, collection, tag);
					}
				},
			},
		);
		assertStrictEquals(visit, plist, tag);
		if (PLArray.is(visit) || PLDict.is(visit) || PLSet.is(visit)) {
			assertStrictEquals(leave, plist, tag);
		} else {
			assertStrictEquals(leave, null, tag);
		}
	}
});

Deno.test('walk: all', () => {
	const plist = new PLDict();

	const int0 = new PLInteger(1n);
	const int1 = new PLInteger(2n);
	const int2 = new PLInteger(3n);
	const kArray = new PLString('Array');
	const vArray = new PLArray([int0, int1, int2]);
	plist.set(kArray, vArray);

	const kData = new PLString('Data');
	const vData = new PLData(8);
	plist.set(kData, vData);

	const kDate = new PLString('Date');
	const vDate = new PLDate(0);
	plist.set(kDate, vDate);

	const kDict = new PLString('Dict');
	const vDict = new PLDict();
	const kTrue = new PLString('TRUE');
	const vTrue = new PLBoolean(true);
	vDict.set(kTrue, vTrue);
	const kFalse = new PLString('FALSE');
	const vFalse = new PLBoolean(false);
	vDict.set(kFalse, vFalse);
	plist.set(kDict, vDict);

	const kReal = new PLString('Real');
	const vReal = new PLReal(3.14);
	plist.set(kReal, vReal);

	const kString = new PLString('String');
	const vString = new PLString('Hello world!');
	plist.set(kString, vString);

	const kUID = new PLString('UID');
	const vUID = new PLUID(42n);
	plist.set(kUID, vUID);

	const kNull = new PLString('Null');
	const vNull = new PLNull();
	plist.set(kNull, vNull);

	const kSet = new PLString('Set');
	const vSet = new PLSet([int0, int1, int2]);
	plist.set(kSet, vSet);

	const visited: Visited[] = [];
	const visiter = (method: string) => {
		return (
			visit: PLType,
			depth: number,
			key: PLType | number | null,
			parent: WalkParent,
		) => {
			visited.push({
				method,
				visit,
				depth,
				key,
				parent,
			});
		};
	};
	walk(
		plist,
		{
			[PLTYPE_ARRAY]: visiter(`visit.${PLTYPE_ARRAY}`),
			[PLTYPE_BOOLEAN]: visiter(`visit.${PLTYPE_BOOLEAN}`),
			[PLTYPE_DATA]: visiter(`visit.${PLTYPE_DATA}`),
			[PLTYPE_DATE]: visiter(`visit.${PLTYPE_DATE}`),
			[PLTYPE_DICT]: visiter(`visit.${PLTYPE_DICT}`),
			[PLTYPE_INTEGER]: visiter(`visit.${PLTYPE_INTEGER}`),
			[PLTYPE_NULL]: visiter(`visit.${PLTYPE_NULL}`),
			[PLTYPE_REAL]: visiter(`visit.${PLTYPE_REAL}`),
			[PLTYPE_SET]: visiter(`visit.${PLTYPE_SET}`),
			[PLTYPE_STRING]: visiter(`visit.${PLTYPE_STRING}`),
			[PLTYPE_UID]: visiter(`visit.${PLTYPE_UID}`),
			default: visiter('visit.default'),
		},
		{
			[PLTYPE_ARRAY]: visiter(`leave.${PLTYPE_ARRAY}`),
			[PLTYPE_DICT]: visiter(`leave.${PLTYPE_DICT}`),
			[PLTYPE_SET]: visiter(`leave.${PLTYPE_SET}`),
			default: visiter('leave.default'),
		},
	);

	const expected: typeof visited = [
		visit(`visit.${PLTYPE_DICT}`, plist, 0, null, null),

		visit(`visit.${PLTYPE_STRING}`, kArray, 1, null, plist),
		// =
		visit(`visit.${PLTYPE_ARRAY}`, vArray, 1, kArray, plist),
		visit(`visit.${PLTYPE_INTEGER}`, int0, 2, 0, vArray),
		visit(`visit.${PLTYPE_INTEGER}`, int1, 2, 1, vArray),
		visit(`visit.${PLTYPE_INTEGER}`, int2, 2, 2, vArray),
		visit(`leave.${PLTYPE_ARRAY}`, vArray, 1, kArray, plist),

		visit(`visit.${PLTYPE_STRING}`, kData, 1, null, plist),
		// =
		visit(`visit.${PLTYPE_DATA}`, vData, 1, kData, plist),

		visit(`visit.${PLTYPE_STRING}`, kDate, 1, null, plist),
		// =
		visit(`visit.${PLTYPE_DATE}`, vDate, 1, kDate, plist),

		visit(`visit.${PLTYPE_STRING}`, kDict, 1, null, plist),
		// =
		visit(`visit.${PLTYPE_DICT}`, vDict, 1, kDict, plist),
		visit(`visit.${PLTYPE_STRING}`, kTrue, 2, null, vDict),
		visit(`visit.${PLTYPE_BOOLEAN}`, vTrue, 2, kTrue, vDict),
		visit(`visit.${PLTYPE_STRING}`, kFalse, 2, null, vDict),
		visit(`visit.${PLTYPE_BOOLEAN}`, vFalse, 2, kFalse, vDict),
		visit(`leave.${PLTYPE_DICT}`, vDict, 1, kDict, plist),

		visit(`visit.${PLTYPE_STRING}`, kReal, 1, null, plist),
		// =
		visit(`visit.${PLTYPE_REAL}`, vReal, 1, kReal, plist),

		visit(`visit.${PLTYPE_STRING}`, kString, 1, null, plist),
		// =
		visit(`visit.${PLTYPE_STRING}`, vString, 1, kString, plist),

		visit(`visit.${PLTYPE_STRING}`, kUID, 1, null, plist),
		// =
		visit(`visit.${PLTYPE_UID}`, vUID, 1, kUID, plist),

		visit(`visit.${PLTYPE_STRING}`, kNull, 1, null, plist),
		// =
		visit(`visit.${PLTYPE_NULL}`, vNull, 1, kNull, plist),

		visit(`visit.${PLTYPE_STRING}`, kSet, 1, null, plist),
		// =
		visit(`visit.${PLTYPE_SET}`, vSet, 1, kSet, plist),
		visit(`visit.${PLTYPE_INTEGER}`, int0, 2, int0, vSet),
		visit(`visit.${PLTYPE_INTEGER}`, int1, 2, int1, vSet),
		visit(`visit.${PLTYPE_INTEGER}`, int2, 2, int2, vSet),
		visit(`leave.${PLTYPE_SET}`, vSet, 1, kSet, plist),

		visit(`leave.${PLTYPE_DICT}`, plist, 0, null, null),
	];
	for (let i = 0; i < expected.length; i++) {
		assertStrictEquals(visited[i].method, expected[i].method, `[${i}]`);
		assertStrictEquals(visited[i].visit, expected[i].visit, `[${i}]`);
		assertStrictEquals(visited[i].depth, expected[i].depth, `[${i}]`);
		assertStrictEquals(visited[i].key, expected[i].key, `[${i}]`);
		assertStrictEquals(visited[i].parent, expected[i].parent, `[${i}]`);
	}
	assertEquals(visited.length, expected.length);
});

Deno.test('walk: keys', () => {
	const plist = new PLDict();

	const int0 = new PLInteger(1n);
	const int1 = new PLInteger(2n);

	const kArray = new PLArray([int0, int1]);
	const vArray = new PLString('Array');
	plist.set(kArray, vArray);

	const kDict = new PLDict();
	const kTrue = new PLBoolean(true);
	const vTrue = new PLString('TRUE');
	kDict.set(kTrue, vTrue);
	const kFalse = new PLBoolean(false);
	const vFalse = new PLString('FALSE');
	kDict.set(kFalse, vFalse);
	const vDict = new PLString('Dict');
	plist.set(kDict, vDict);

	const kSet = new PLSet([int0, int1]);
	const vSet = new PLString('Set');
	plist.set(kSet, vSet);

	const visited: Visited[] = [];
	const visiter = (method: string) => {
		return (
			visit: PLType,
			depth: number,
			key: PLType | number | null,
			parent: WalkParent,
		) => {
			visited.push({
				method,
				visit,
				depth,
				key,
				parent,
			});
		};
	};
	walk(
		plist,
		{
			[PLTYPE_ARRAY]: visiter(`visit.${PLTYPE_ARRAY}`),
			[PLTYPE_BOOLEAN]: visiter(`visit.${PLTYPE_BOOLEAN}`),
			[PLTYPE_DICT]: visiter(`visit.${PLTYPE_DICT}`),
			[PLTYPE_INTEGER]: visiter(`visit.${PLTYPE_INTEGER}`),
			[PLTYPE_SET]: visiter(`visit.${PLTYPE_SET}`),
			[PLTYPE_STRING]: visiter(`visit.${PLTYPE_STRING}`),
			default: visiter('visit.default'),
		},
		{
			[PLTYPE_ARRAY]: visiter(`leave.${PLTYPE_ARRAY}`),
			[PLTYPE_DICT]: visiter(`leave.${PLTYPE_DICT}`),
			[PLTYPE_SET]: visiter(`leave.${PLTYPE_SET}`),
			default: visiter('leave.default'),
		},
	);

	const expected: typeof visited = [
		visit(`visit.${PLTYPE_DICT}`, plist, 0, null, null),

		visit(`visit.${PLTYPE_ARRAY}`, kArray, 1, null, plist),
		visit(`visit.${PLTYPE_INTEGER}`, int0, 2, 0, kArray),
		visit(`visit.${PLTYPE_INTEGER}`, int1, 2, 1, kArray),
		visit(`leave.${PLTYPE_ARRAY}`, kArray, 1, null, plist),
		// =
		visit(`visit.${PLTYPE_STRING}`, vArray, 1, kArray, plist),

		visit(`visit.${PLTYPE_DICT}`, kDict, 1, null, plist),
		visit(`visit.${PLTYPE_BOOLEAN}`, kTrue, 2, null, kDict),
		visit(`visit.${PLTYPE_STRING}`, vTrue, 2, kTrue, kDict),
		visit(`visit.${PLTYPE_BOOLEAN}`, kFalse, 2, null, kDict),
		visit(`visit.${PLTYPE_STRING}`, vFalse, 2, kFalse, kDict),
		visit(`leave.${PLTYPE_DICT}`, kDict, 1, null, plist),
		// =
		visit(`visit.${PLTYPE_STRING}`, vDict, 1, kDict, plist),

		visit(`visit.${PLTYPE_SET}`, kSet, 1, null, plist),
		visit(`visit.${PLTYPE_INTEGER}`, int0, 2, int0, kSet),
		visit(`visit.${PLTYPE_INTEGER}`, int1, 2, int1, kSet),
		visit(`leave.${PLTYPE_SET}`, kSet, 1, null, plist),
		// =
		visit(`visit.${PLTYPE_STRING}`, vSet, 1, kSet, plist),

		visit(`leave.${PLTYPE_DICT}`, plist, 0, null, null),
	];
	for (let i = 0; i < expected.length; i++) {
		assertStrictEquals(visited[i].method, expected[i].method, `[${i}]`);
		assertStrictEquals(visited[i].visit, expected[i].visit, `[${i}]`);
		assertStrictEquals(visited[i].depth, expected[i].depth, `[${i}]`);
		assertStrictEquals(visited[i].key, expected[i].key, `[${i}]`);
		assertStrictEquals(visited[i].parent, expected[i].parent, `[${i}]`);
	}
	assertEquals(visited.length, expected.length);
});

Deno.test('walk: skip: key', () => {
	const int = new PLInteger();
	const uid = new PLUID();
	const real = new PLReal();

	const plist = new PLDict();

	const kInt = new PLArray([int]);
	const vInt = new PLString('int');
	plist.set(kInt, vInt);

	const kUID = new PLArray([uid]);
	const vUID = new PLString('uid');
	plist.set(kUID, vUID);

	const kReal = new PLArray([real]);
	const vReal = new PLString('real');
	plist.set(kReal, vReal);

	const arrays: PLArray[] = [];
	const uids: PLUID[] = [];
	const reals: PLReal[] = [];
	const strings: PLString[] = [];
	walk(
		plist,
		{
			[PLTYPE_ARRAY](value): boolean | void {
				arrays.push(value);
				if (value === kInt) {
					return true;
				}
			},
			[PLTYPE_INTEGER](): void {
				throw new Error('should not be called');
			},
			[PLTYPE_UID](value): void {
				uids.push(value);
			},
			[PLTYPE_REAL](value): void {
				reals.push(value);
			},
			[PLTYPE_STRING](value): void {
				strings.push(value);
			},
		},
	);

	assertEquals(arrays.length, 3);
	assertStrictEquals(arrays[0], kInt);
	assertStrictEquals(arrays[1], kUID);
	assertStrictEquals(arrays[2], kReal);

	assertEquals(uids.length, 1);
	assertStrictEquals(uids[0], uid);

	assertEquals(reals.length, 1);
	assertStrictEquals(reals[0], real);

	assertEquals(strings.length, 3);
	assertStrictEquals(strings[0], vInt);
	assertStrictEquals(strings[1], vUID);
	assertStrictEquals(strings[2], vReal);
});

Deno.test('walk: skip: value', () => {
	const int = new PLInteger();
	const uid = new PLUID();
	const real = new PLReal();

	const plist = new PLDict();

	const kInt = new PLString('int');
	const vInt = new PLArray([int]);
	plist.set(kInt, vInt);

	const kUID = new PLString('uid');
	const vUID = new PLArray([uid]);
	plist.set(kUID, vUID);

	const kReal = new PLString('real');
	const vReal = new PLArray([real]);
	plist.set(kReal, vReal);

	const arrays: PLArray[] = [];
	const uids: PLUID[] = [];
	const reals: PLReal[] = [];
	const strings: PLString[] = [];
	walk(
		plist,
		{
			[PLTYPE_ARRAY](value): boolean | void {
				arrays.push(value);
				if (value === vInt) {
					return true;
				}
			},
			[PLTYPE_INTEGER](): void {
				throw new Error('should not be called');
			},
			[PLTYPE_UID](value): boolean {
				uids.push(value);

				// Ignored for this type.
				return true;
			},
			[PLTYPE_REAL](value): void {
				reals.push(value);
			},
			[PLTYPE_STRING](value): boolean {
				strings.push(value);

				// Ignored for this type.
				return true;
			},
		},
	);

	assertEquals(arrays.length, 3);
	assertStrictEquals(arrays[0], vInt);
	assertStrictEquals(arrays[1], vUID);
	assertStrictEquals(arrays[2], vReal);

	assertEquals(uids.length, 1);
	assertStrictEquals(uids[0], uid);

	assertEquals(reals.length, 1);
	assertStrictEquals(reals[0], real);

	assertEquals(strings.length, 3);
	assertStrictEquals(strings[0], kInt);
	assertStrictEquals(strings[1], kUID);
	assertStrictEquals(strings[2], kReal);
});

Deno.test('walk: stop: key', () => {
	const plist = new PLDict();

	const kA = new PLString('A');
	const vA = new PLString('Alpha');
	plist.set(kA, vA);

	const kB = new PLString('B');
	const vB = new PLString('Beta');
	plist.set(kB, vB);

	const kG = new PLString('G');
	const vG = new PLString('Gamma');
	plist.set(kG, vG);

	const strings: PLString[] = [];
	walk(
		plist,
		{
			[PLTYPE_STRING](value): boolean | void {
				strings.push(value);
				if (value === kB) {
					return false;
				}
			},
		},
	);

	assertEquals(strings.length, 3);
	assertStrictEquals(strings[0], kA);
	assertStrictEquals(strings[1], vA);
	assertStrictEquals(strings[2], kB);
});

Deno.test('walk: stop: value', () => {
	const plist = new PLDict();

	const kA = new PLString('A');
	const vA = new PLString('Alpha');
	plist.set(kA, vA);

	const kB = new PLString('B');
	const vB = new PLString('Beta');
	plist.set(kB, vB);

	const kG = new PLString('G');
	const vG = new PLString('Gamma');
	plist.set(kG, vG);

	const strings: PLString[] = [];
	walk(
		plist,
		{
			[PLTYPE_STRING](value): boolean | void {
				strings.push(value);
				if (value === vB) {
					return false;
				}
			},
		},
	);

	assertEquals(strings.length, 4);
	assertStrictEquals(strings[0], kA);
	assertStrictEquals(strings[1], vA);
	assertStrictEquals(strings[2], kB);
	assertStrictEquals(strings[3], vB);
});

Deno.test('walk: stop: leave', () => {
	const plist = new PLDict();

	const kA = new PLString('A');
	const vA = new PLDict();
	plist.set(kA, vA);

	const kB = new PLString('B');
	const vB = new PLDict();
	plist.set(kB, vB);

	const kG = new PLString('G');
	const vG = new PLDict();
	plist.set(kG, vG);

	const leave: PLDict[] = [];
	walk(
		plist,
		{},
		{
			[PLTYPE_DICT](value): boolean | void {
				leave.push(value);
				if (value === vB) {
					return false;
				}

				// Ignored for leave callback (too late to skip).
				return true;
			},
		},
	);

	assertEquals(leave.length, 2);
	assertStrictEquals(leave[0], vA);
	assertStrictEquals(leave[1], vB);
});

Deno.test('walk: keysFirst', () => {
	const plist = new PLDict();

	const kA = new PLString('A');
	const vA = new PLString('Alpha');
	plist.set(kA, vA);

	const kB = new PLString('B');
	const vB = new PLString('Beta');
	plist.set(kB, vB);

	const kG = new PLString('G');
	const vG = new PLString('Gamma');
	plist.set(kG, vG);

	const leave: PLString[] = [];
	walk(
		plist,
		{
			[PLTYPE_STRING](value): void {
				leave.push(value);
			},
		},
		{},
		{ keysFirst: true },
	);

	assertEquals(leave.length, 6);

	assertStrictEquals(leave[0], kA);
	assertStrictEquals(leave[1], kB);
	assertStrictEquals(leave[2], kG);
	assertStrictEquals(leave[3], vA);
	assertStrictEquals(leave[4], vB);
	assertStrictEquals(leave[5], vG);
});

Deno.test('walk: depth: 3+', () => {
	const D6 = new PLArray();
	const D5 = new PLArray([D6]);
	const D4 = new PLArray([D5]);
	const D3 = new PLArray([D4]);
	const D2 = new PLArray([D3]);
	const D1 = new PLArray([D2]);
	const D0 = new PLArray([D1]);

	const visit: DepthVisit[] = [];
	const leave: DepthVisit[] = [];
	walk(
		D0,
		{
			[PLTYPE_ARRAY](value, depth, _, parent): void {
				visit.push({ value, depth, parent });
			},
		},
		{
			[PLTYPE_ARRAY](value, depth, _, parent): void {
				leave.push({ value, depth, parent });
			},
		},
		{ min: 3 },
	);

	assertEquals(visit.length, 4);

	assertStrictEquals(visit[0].value, D3);
	assertStrictEquals(visit[0].depth, 3);
	assertStrictEquals(visit[0].parent, D2);

	assertStrictEquals(visit[1].value, D4);
	assertStrictEquals(visit[1].depth, 4);
	assertStrictEquals(visit[1].parent, D3);

	assertStrictEquals(visit[2].value, D5);
	assertStrictEquals(visit[2].depth, 5);
	assertStrictEquals(visit[2].parent, D4);

	assertStrictEquals(visit[3].value, D6);
	assertStrictEquals(visit[3].depth, 6);
	assertStrictEquals(visit[3].parent, D5);

	assertEquals(leave.length, 4);

	assertStrictEquals(leave[0].value, D6);
	assertStrictEquals(leave[0].depth, 6);
	assertStrictEquals(leave[0].parent, D5);

	assertStrictEquals(leave[1].value, D5);
	assertStrictEquals(leave[1].depth, 5);
	assertStrictEquals(leave[1].parent, D4);

	assertStrictEquals(leave[2].value, D4);
	assertStrictEquals(leave[2].depth, 4);
	assertStrictEquals(leave[2].parent, D3);

	assertStrictEquals(leave[3].value, D3);
	assertStrictEquals(leave[3].depth, 3);
	assertStrictEquals(leave[3].parent, D2);
});

Deno.test('walk: depth: 6+', () => {
	const D6 = new PLArray();
	const D5 = new PLArray([D6]);
	const D4 = new PLArray([D5]);
	const D3 = new PLArray([D4]);
	const D2 = new PLArray([D3]);
	const D1 = new PLArray([D2]);
	const D0 = new PLArray([D1]);

	const visit: DepthVisit[] = [];
	const leave: DepthVisit[] = [];
	walk(
		D0,
		{
			[PLTYPE_ARRAY](value, depth, _, parent): void {
				visit.push({ value, depth, parent });
			},
		},
		{
			[PLTYPE_ARRAY](value, depth, _, parent): void {
				leave.push({ value, depth, parent });
			},
		},
		{ min: 6 },
	);

	assertEquals(visit.length, 1);

	assertStrictEquals(visit[0].value, D6);
	assertStrictEquals(visit[0].depth, 6);
	assertStrictEquals(visit[0].parent, D5);

	assertEquals(leave.length, 1);

	assertStrictEquals(leave[0].value, D6);
	assertStrictEquals(leave[0].depth, 6);
	assertStrictEquals(leave[0].parent, D5);
});

Deno.test('walk: depth: 7+', () => {
	const D6 = new PLArray();
	const D5 = new PLArray([D6]);
	const D4 = new PLArray([D5]);
	const D3 = new PLArray([D4]);
	const D2 = new PLArray([D3]);
	const D1 = new PLArray([D2]);
	const D0 = new PLArray([D1]);

	const visit: DepthVisit[] = [];
	const leave: DepthVisit[] = [];
	walk(
		D0,
		{
			[PLTYPE_ARRAY](value, depth, _, parent): void {
				visit.push({ value, depth, parent });
			},
		},
		{
			[PLTYPE_ARRAY](value, depth, _, parent): void {
				leave.push({ value, depth, parent });
			},
		},
		{ min: 7 },
	);

	assertEquals(visit.length, 0);

	assertEquals(leave.length, 0);
});

Deno.test('walk: depth: 0-3', () => {
	const D6 = new PLSet();
	const D5 = new PLSet([D6]);
	const D4 = new PLSet([D5]);
	const D3 = new PLSet([D4]);
	const D2 = new PLSet([D3]);
	const D1 = new PLSet([D2]);
	const D0 = new PLSet([D1]);

	const visit: DepthVisit[] = [];
	const leave: DepthVisit[] = [];
	walk(
		D0,
		{
			[PLTYPE_SET](value, depth, _, parent): void {
				visit.push({ value, depth, parent });
			},
		},
		{
			[PLTYPE_SET](value, depth, _, parent): void {
				leave.push({ value, depth, parent });
			},
		},
		{ max: 3 },
	);

	assertEquals(visit.length, 4);

	assertStrictEquals(visit[0].value, D0);
	assertStrictEquals(visit[0].depth, 0);
	assertStrictEquals(visit[0].parent, null);

	assertStrictEquals(visit[1].value, D1);
	assertStrictEquals(visit[1].depth, 1);
	assertStrictEquals(visit[1].parent, D0);

	assertStrictEquals(visit[2].value, D2);
	assertStrictEquals(visit[2].depth, 2);
	assertStrictEquals(visit[2].parent, D1);

	assertStrictEquals(visit[3].value, D3);
	assertStrictEquals(visit[3].depth, 3);
	assertStrictEquals(visit[3].parent, D2);

	assertEquals(leave.length, 4);

	assertStrictEquals(leave[0].value, D3);
	assertStrictEquals(leave[0].depth, 3);
	assertStrictEquals(leave[0].parent, D2);

	assertStrictEquals(leave[1].value, D2);
	assertStrictEquals(leave[1].depth, 2);
	assertStrictEquals(leave[1].parent, D1);

	assertStrictEquals(leave[2].value, D1);
	assertStrictEquals(leave[2].depth, 1);
	assertStrictEquals(leave[2].parent, D0);

	assertStrictEquals(leave[3].value, D0);
	assertStrictEquals(leave[3].depth, 0);
	assertStrictEquals(leave[3].parent, null);
});

Deno.test('walk: depth: 0', () => {
	const D6 = new PLArray();
	const D5 = new PLArray([D6]);
	const D4 = new PLArray([D5]);
	const D3 = new PLArray([D4]);
	const D2 = new PLArray([D3]);
	const D1 = new PLArray([D2]);
	const D0 = new PLArray([D1]);

	const visit: DepthVisit[] = [];
	const leave: DepthVisit[] = [];
	walk(
		D0,
		{
			[PLTYPE_ARRAY](value, depth, _, parent): void {
				visit.push({ value, depth, parent });
			},
		},
		{
			[PLTYPE_ARRAY](value, depth, _, parent): void {
				leave.push({ value, depth, parent });
			},
		},
		{ max: 0 },
	);

	assertEquals(visit.length, 1);

	assertStrictEquals(visit[0].value, D0);
	assertStrictEquals(visit[0].depth, 0);
	assertStrictEquals(visit[0].parent, null);

	assertEquals(leave.length, 1);

	assertStrictEquals(leave[0].value, D0);
	assertStrictEquals(leave[0].depth, 0);
	assertStrictEquals(leave[0].parent, null);
});

Deno.test('walk: depth: 3', () => {
	const D6 = new PLArray();
	const D5 = new PLArray([D6]);
	const D4 = new PLArray([D5]);
	const D3 = new PLArray([D4]);
	const D2 = new PLArray([D3]);
	const D1 = new PLArray([D2]);
	const D0 = new PLArray([D1]);

	const visit: DepthVisit[] = [];
	const leave: DepthVisit[] = [];
	walk(
		D0,
		{
			[PLTYPE_ARRAY](value, depth, _, parent): void {
				visit.push({ value, depth, parent });
			},
		},
		{
			[PLTYPE_ARRAY](value, depth, _, parent): void {
				leave.push({ value, depth, parent });
			},
		},
		{ min: 3, max: 3 },
	);

	assertEquals(visit.length, 1);

	assertStrictEquals(visit[0].value, D3);
	assertStrictEquals(visit[0].depth, 3);
	assertStrictEquals(visit[0].parent, D2);

	assertEquals(leave.length, 1);

	assertStrictEquals(leave[0].value, D3);
	assertStrictEquals(leave[0].depth, 3);
	assertStrictEquals(leave[0].parent, D2);
});

Deno.test('walk: depth: 2-4', () => {
	const K = new PLString('K');
	const D6 = new PLDict();
	const D5 = new PLDict([[D6, K]]);
	const D4 = new PLDict([[K, D5]]);
	const D3 = new PLDict([[D4, K]]);
	const D2 = new PLDict([[K, D3]]);
	const D1 = new PLDict([[D2, K]]);
	const D0 = new PLDict([[K, D1]]);

	const visit: DepthVisit[] = [];
	const leave: DepthVisit[] = [];
	walk(
		D0,
		{
			[PLTYPE_DICT](value, depth, _, parent): void {
				visit.push({ value, depth, parent });
			},
		},
		{
			[PLTYPE_DICT](value, depth, _, parent): void {
				leave.push({ value, depth, parent });
			},
		},
		{ min: 2, max: 4 },
	);

	assertEquals(visit.length, 3);

	assertStrictEquals(visit[0].value, D2);
	assertStrictEquals(visit[0].depth, 2);
	assertStrictEquals(visit[0].parent, D1);

	assertStrictEquals(visit[1].value, D3);
	assertStrictEquals(visit[1].depth, 3);
	assertStrictEquals(visit[1].parent, D2);

	assertStrictEquals(visit[2].value, D4);
	assertStrictEquals(visit[2].depth, 4);
	assertStrictEquals(visit[2].parent, D3);

	assertEquals(leave.length, 3);

	assertStrictEquals(leave[0].value, D4);
	assertStrictEquals(leave[0].depth, 4);
	assertStrictEquals(leave[0].parent, D3);

	assertStrictEquals(leave[1].value, D3);
	assertStrictEquals(leave[1].depth, 3);
	assertStrictEquals(leave[1].parent, D2);

	assertStrictEquals(leave[2].value, D2);
	assertStrictEquals(leave[2].depth, 2);
	assertStrictEquals(leave[2].parent, D1);
});

Deno.test('walk: depth: 4-3', () => {
	const D6 = new PLArray();
	const D5 = new PLArray([D6]);
	const D4 = new PLArray([D5]);
	const D3 = new PLArray([D4]);
	const D2 = new PLArray([D3]);
	const D1 = new PLArray([D2]);
	const D0 = new PLArray([D1]);

	const visit: DepthVisit[] = [];
	const leave: DepthVisit[] = [];
	walk(
		D0,
		{
			[PLTYPE_ARRAY](value, depth, _, parent): void {
				visit.push({ value, depth, parent });
			},
		},
		{
			[PLTYPE_ARRAY](value, depth, _, parent): void {
				leave.push({ value, depth, parent });
			},
		},
		{ min: 4, max: 3 },
	);

	assertEquals(visit.length, 0);

	assertEquals(leave.length, 0);
});
