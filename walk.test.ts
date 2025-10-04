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

	const visited: [
		string,
		PLType,
		number,
		PLType | number | null,
		WalkParent,
	][] = [];
	const visiter = (method: string) => {
		return (
			visit: PLType,
			depth: number,
			key: PLType | number | null,
			parent: WalkParent,
		) => {
			visited.push([
				method,
				visit,
				depth,
				key,
				parent,
			]);
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
		[`visit.${PLTYPE_DICT}`, plist, 0, null, null],

		[`visit.${PLTYPE_STRING}`, kArray, 1, null, plist],
		// =
		[`visit.${PLTYPE_ARRAY}`, vArray, 1, kArray, plist],
		[`visit.${PLTYPE_INTEGER}`, int0, 2, 0, vArray],
		[`visit.${PLTYPE_INTEGER}`, int1, 2, 1, vArray],
		[`visit.${PLTYPE_INTEGER}`, int2, 2, 2, vArray],
		[`leave.${PLTYPE_ARRAY}`, vArray, 1, kArray, plist],

		[`visit.${PLTYPE_STRING}`, kData, 1, null, plist],
		// =
		[`visit.${PLTYPE_DATA}`, vData, 1, kData, plist],

		[`visit.${PLTYPE_STRING}`, kDate, 1, null, plist],
		// =
		[`visit.${PLTYPE_DATE}`, vDate, 1, kDate, plist],

		[`visit.${PLTYPE_STRING}`, kDict, 1, null, plist],
		// =
		[`visit.${PLTYPE_DICT}`, vDict, 1, kDict, plist],
		[`visit.${PLTYPE_STRING}`, kTrue, 2, null, vDict],
		[`visit.${PLTYPE_BOOLEAN}`, vTrue, 2, kTrue, vDict],
		[`visit.${PLTYPE_STRING}`, kFalse, 2, null, vDict],
		[`visit.${PLTYPE_BOOLEAN}`, vFalse, 2, kFalse, vDict],
		[`leave.${PLTYPE_DICT}`, vDict, 1, kDict, plist],

		[`visit.${PLTYPE_STRING}`, kReal, 1, null, plist],
		// =
		[`visit.${PLTYPE_REAL}`, vReal, 1, kReal, plist],

		[`visit.${PLTYPE_STRING}`, kString, 1, null, plist],
		// =
		[`visit.${PLTYPE_STRING}`, vString, 1, kString, plist],

		[`visit.${PLTYPE_STRING}`, kUID, 1, null, plist],
		// =
		[`visit.${PLTYPE_UID}`, vUID, 1, kUID, plist],

		[`visit.${PLTYPE_STRING}`, kNull, 1, null, plist],
		// =
		[`visit.${PLTYPE_NULL}`, vNull, 1, kNull, plist],

		[`visit.${PLTYPE_STRING}`, kSet, 1, null, plist],
		// =
		[`visit.${PLTYPE_SET}`, vSet, 1, kSet, plist],
		[`visit.${PLTYPE_INTEGER}`, int0, 2, int0, vSet],
		[`visit.${PLTYPE_INTEGER}`, int1, 2, int1, vSet],
		[`visit.${PLTYPE_INTEGER}`, int2, 2, int2, vSet],
		[`leave.${PLTYPE_SET}`, vSet, 1, kSet, plist],

		[`leave.${PLTYPE_DICT}`, plist, 0, null, null],
	];
	for (let i = 0; i < expected.length; i++) {
		assertStrictEquals(visited[i][0], expected[i][0], `[${i}]: method`);
		assertStrictEquals(visited[i][1], expected[i][1], `[${i}]: visit`);
		assertStrictEquals(visited[i][2], expected[i][2], `[${i}]: depth`);
		assertStrictEquals(visited[i][3], expected[i][3], `[${i}]: key`);
		assertStrictEquals(visited[i][4], expected[i][4], `[${i}]: parent`);
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

	const visited: [
		string,
		PLType,
		number,
		PLType | number | null,
		WalkParent,
	][] = [];
	const visiter = (method: string) => {
		return (
			visit: PLType,
			depth: number,
			key: PLType | number | null,
			parent: WalkParent,
		) => {
			visited.push([
				method,
				visit,
				depth,
				key,
				parent,
			]);
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
		[`visit.${PLTYPE_DICT}`, plist, 0, null, null],

		[`visit.${PLTYPE_ARRAY}`, kArray, 1, null, plist],
		[`visit.${PLTYPE_INTEGER}`, int0, 2, 0, kArray],
		[`visit.${PLTYPE_INTEGER}`, int1, 2, 1, kArray],
		[`leave.${PLTYPE_ARRAY}`, kArray, 1, null, plist],
		// =
		[`visit.${PLTYPE_STRING}`, vArray, 1, kArray, plist],

		[`visit.${PLTYPE_DICT}`, kDict, 1, null, plist],
		[`visit.${PLTYPE_BOOLEAN}`, kTrue, 2, null, kDict],
		[`visit.${PLTYPE_STRING}`, vTrue, 2, kTrue, kDict],
		[`visit.${PLTYPE_BOOLEAN}`, kFalse, 2, null, kDict],
		[`visit.${PLTYPE_STRING}`, vFalse, 2, kFalse, kDict],
		[`leave.${PLTYPE_DICT}`, kDict, 1, null, plist],
		// =
		[`visit.${PLTYPE_STRING}`, vDict, 1, kDict, plist],

		[`visit.${PLTYPE_SET}`, kSet, 1, null, plist],
		[`visit.${PLTYPE_INTEGER}`, int0, 2, int0, kSet],
		[`visit.${PLTYPE_INTEGER}`, int1, 2, int1, kSet],
		[`leave.${PLTYPE_SET}`, kSet, 1, null, plist],
		// =
		[`visit.${PLTYPE_STRING}`, vSet, 1, kSet, plist],

		[`leave.${PLTYPE_DICT}`, plist, 0, null, null],
	];
	for (let i = 0; i < expected.length; i++) {
		assertStrictEquals(visited[i][0], expected[i][0], `[${i}]: method`);
		assertStrictEquals(visited[i][1], expected[i][1], `[${i}]: visit`);
		assertStrictEquals(visited[i][2], expected[i][2], `[${i}]: depth`);
		assertStrictEquals(visited[i][3], expected[i][3], `[${i}]: key`);
		assertStrictEquals(visited[i][4], expected[i][4], `[${i}]: parent`);
	}
	assertEquals(visited.length, expected.length);
});

Deno.test('walk: skip: value', () => {
	const int = new PLInteger();
	const uid = new PLUID();
	const real = new PLReal();

	const plist = new PLDict();

	const kInt = new PLString('int');
	const aInt = new PLArray([int]);
	plist.set(kInt, aInt);

	const kUID = new PLString('uid');
	const aUID = new PLArray([uid]);
	plist.set(kUID, aUID);

	const kReal = new PLString('real');
	const aReal = new PLArray([real]);
	plist.set(kReal, aReal);

	const arrays: PLArray[] = [];
	const uids: PLUID[] = [];
	const reals: PLReal[] = [];
	walk(
		plist,
		{
			[PLTYPE_ARRAY](value): boolean | void {
				arrays.push(value);
				if (value === aInt) {
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
		},
	);

	assertEquals(arrays.length, 3);
	assertStrictEquals(arrays[0], aInt);
	assertStrictEquals(arrays[1], aUID);
	assertStrictEquals(arrays[2], aReal);

	assertEquals(uids.length, 1);
	assertStrictEquals(uids[0], uid);
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
