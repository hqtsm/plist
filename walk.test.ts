import { assertEquals, assertStrictEquals } from '@std/assert';
import { PLArray, PLTYPE_ARRAY } from './array.ts';
import { PLBoolean, PLTYPE_BOOLEAN } from './boolean.ts';
import { PLData, PLTYPE_DATA } from './data.ts';
import { PLDate, PLTYPE_DATE } from './date.ts';
import { PLDict, PLTYPE_DICT } from './dict.ts';
import { PLInteger, PLTYPE_INTEGER } from './integer.ts';
import { PLReal, PLTYPE_REAL } from './real.ts';
import { PLString, PLTYPE_STRING } from './string.ts';
import type { PLType } from './type.ts';
import { PLTYPE_UID, PLUID } from './uid.ts';
import { walk, type WalkParent } from './walk.ts';

Deno.test('walk: all', () => {
	const plist = new PLDict();

	const int0 = new PLInteger(1n);
	const int1 = new PLInteger(2n);
	const int2 = new PLInteger(3n);
	const kArray = new PLString('Array');
	const array = new PLArray([int0, int1, int2]);
	plist.set(kArray, array);

	const kData = new PLString('Data');
	const data = new PLData(8);
	plist.set(kData, data);

	const kDate = new PLString('Date');
	const date = new PLDate(0);
	plist.set(kDate, date);

	const kDict = new PLString('Dict');
	const dict = new PLDict();
	const kTrue = new PLString('TRUE');
	const bTrue = new PLBoolean(true);
	dict.set(kTrue, bTrue);
	const kFalse = new PLString('FALSE');
	const bFalse = new PLBoolean(false);
	dict.set(kFalse, bFalse);
	plist.set(kDict, dict);

	const kReal = new PLString('Real');
	const real = new PLReal(3.14);
	plist.set(kReal, real);

	const kString = new PLString('String');
	const string = new PLString('Hello world!');
	plist.set(kString, string);

	const kUID = new PLString('UID');
	const uid = new PLUID(42n);
	plist.set(kUID, uid);

	const visited: [
		string,
		PLType,
		number,
		PLString | number | null,
		WalkParent,
	][] = [];
	const visiter = (method: string) => {
		return (
			visit: PLType,
			depth: number,
			key: PLString | number | null,
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
			[PLTYPE_REAL]: visiter(`visit.${PLTYPE_REAL}`),
			[PLTYPE_STRING]: visiter(`visit.${PLTYPE_STRING}`),
			[PLTYPE_UID]: visiter(`visit.${PLTYPE_UID}`),
			default: visiter('visit.default'),
		},
		{
			[PLTYPE_ARRAY]: visiter(`leave.${PLTYPE_ARRAY}`),
			[PLTYPE_DICT]: visiter(`leave.${PLTYPE_DICT}`),
			default: visiter('leave.default'),
		},
	);

	const expected: typeof visited = [
		[`visit.${PLTYPE_DICT}`, plist, 0, null, null],

		[`visit.${PLTYPE_STRING}`, kArray, 1, null, plist],
		[`visit.${PLTYPE_ARRAY}`, array, 1, kArray, plist],

		[`visit.${PLTYPE_INTEGER}`, int0, 2, 0, array],
		[`visit.${PLTYPE_INTEGER}`, int1, 2, 1, array],
		[`visit.${PLTYPE_INTEGER}`, int2, 2, 2, array],

		[`leave.${PLTYPE_ARRAY}`, array, 1, kArray, plist],

		[`visit.${PLTYPE_STRING}`, kData, 1, null, plist],
		[`visit.${PLTYPE_DATA}`, data, 1, kData, plist],

		[`visit.${PLTYPE_STRING}`, kDate, 1, null, plist],
		[`visit.${PLTYPE_DATE}`, date, 1, kDate, plist],

		[`visit.${PLTYPE_STRING}`, kDict, 1, null, plist],
		[`visit.${PLTYPE_DICT}`, dict, 1, kDict, plist],

		[`visit.${PLTYPE_STRING}`, kTrue, 2, null, dict],
		[`visit.${PLTYPE_BOOLEAN}`, bTrue, 2, kTrue, dict],

		[`visit.${PLTYPE_STRING}`, kFalse, 2, null, dict],
		[`visit.${PLTYPE_BOOLEAN}`, bFalse, 2, kFalse, dict],

		[`leave.${PLTYPE_DICT}`, dict, 1, kDict, plist],

		[`visit.${PLTYPE_STRING}`, kReal, 1, null, plist],
		[`visit.${PLTYPE_REAL}`, real, 1, kReal, plist],

		[`visit.${PLTYPE_STRING}`, kString, 1, null, plist],
		[`visit.${PLTYPE_STRING}`, string, 1, kString, plist],

		[`visit.${PLTYPE_STRING}`, kUID, 1, null, plist],
		[`visit.${PLTYPE_UID}`, uid, 1, kUID, plist],

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

Deno.test('skip: value', () => {
	const plist = new PLDict();

	const vInt = new PLInteger();
	const kInt = new PLString('int');
	const aInt = new PLArray([vInt]);
	plist.set(kInt, aInt);

	const vUID = new PLUID();
	const kUID = new PLString('uid');
	const aUID = new PLArray([vUID]);
	plist.set(kUID, aUID);

	const vReal = new PLReal();
	const kReal = new PLString('real');
	const aReal = new PLArray([vReal]);
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
	assertStrictEquals(uids[0], vUID);
});

Deno.test('stop: key', () => {
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

Deno.test('stop: value', () => {
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

Deno.test('stop: leave', () => {
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
