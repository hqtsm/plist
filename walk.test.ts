import { assert, assertEquals, assertStrictEquals } from '@std/assert';
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

/**
 * Get parents and depths.
 *
 * @param plist Plist object to walk.
 * @returns Parents and depths maps.
 */
function parentsDepths(
	plist: PLType,
): [Map<PLType, WalkParent>, Map<PLType, number>] {
	const parents = new Map<PLType, WalkParent>();
	const depths = new Map<PLType, number>();
	const visitors = {
		default(visit: PLType, parent: WalkParent, depth: number): void {
			parents.set(visit, parent);
			depths.set(visit, depth);
		},
	};
	walk(plist, {
		enter: visitors,
		value: visitors,
		leave: visitors,
	});
	return [parents, depths];
}

Deno.test('walk: key: default', () => {
	const dictABC = new PLDict([
		[new PLString('A'), new PLString('a')],
		[new PLString('B'), new PLString('b')],
		[new PLString('C'), new PLString('c')],
	]);
	const dictXYZ = new PLDict([
		[new PLString('X'), new PLString('x')],
		[new PLString('Y'), new PLString('y')],
		[new PLString('Z'), new PLString('z')],
	]);
	const plist = new PLArray([dictABC, dictXYZ]);
	const keys: (number | string)[] = [];
	walk(plist, {
		key: {
			default(visit, parent, depth): void {
				if (typeof visit === 'number') {
					keys.push(visit);
					assertEquals(parent, plist);
					assertEquals(depth, 1);
				} else {
					keys.push(visit.value);
					assert(parent === dictABC || parent === dictXYZ);
					assertEquals(depth, 2);
				}
			},
		},
	});
	assertEquals(keys, [0, 'A', 'B', 'C', 1, 'X', 'Y', 'Z']);
});

Deno.test('walk: key: array', () => {
	const plist = new PLArray([
		new PLInteger(1n),
		new PLInteger(2n),
		new PLInteger(3n),
	]);
	const keys: number[] = [];
	walk(plist, {
		key: {
			[PLTYPE_ARRAY](visit, parent, depth): void {
				keys.push(visit);
				assertEquals(parent, plist);
				assertEquals(depth, 1);
			},
		},
	});
	assertEquals(keys, [0, 1, 2]);
});

Deno.test('walk: key: dict', () => {
	const plist = new PLDict([
		[new PLString('A'), new PLString('a')],
		[new PLString('B'), new PLString('b')],
		[new PLString('C'), new PLString('c')],
	]);
	const keys: string[] = [];
	walk(plist, {
		key: {
			[PLTYPE_DICT](visit, parent, depth): void {
				keys.push(visit.value);
				assertEquals(parent, plist);
				assertEquals(depth, 1);
			},
		},
	});
	assertEquals(keys, ['A', 'B', 'C']);
});

Deno.test('walk: leave: default', () => {
	const dictABC = new PLDict([
		[new PLString('A'), new PLString('a')],
		[new PLString('B'), new PLString('b')],
		[new PLString('C'), new PLString('c')],
	]);
	const dictXYZ = new PLDict([
		[new PLString('X'), new PLString('x')],
		[new PLString('Y'), new PLString('y')],
		[new PLString('Z'), new PLString('z')],
	]);
	const plist = new PLArray([dictABC, dictXYZ]);
	const visitied: [PLArray | PLDict, WalkParent, number][] = [];
	walk(plist, {
		leave: {
			default(visit, parent, depth): void {
				visitied.push([visit, parent, depth]);
			},
		},
	});
	const expected: [PLArray | PLDict, WalkParent, number][] = [
		[dictABC, plist, 1],
		[dictXYZ, plist, 1],
		[plist, null, 0],
	];
	for (let i = 0; i < expected.length; i++) {
		assertStrictEquals(visitied[i][0], expected[i][0], `[${i}]: visit`);
		assertStrictEquals(visitied[i][1], expected[i][1], `[${i}]: parent`);
		assertStrictEquals(visitied[i][2], expected[i][2], `[${i}]: depth`);
	}
	assertEquals(visitied.length, expected.length);
});

Deno.test('walk: leave: array', () => {
	const plist = new PLArray();
	let leaves = 0;
	walk(plist, {
		leave: {
			[PLTYPE_ARRAY](): void {
				leaves++;
			},
		},
	});
	assertEquals(leaves, 1);
	leaves = 0;
	plist.push(new PLInteger(1n));
	walk(plist, {
		leave: {
			[PLTYPE_ARRAY](visit, parent, depth): void {
				leaves++;
				assertStrictEquals(visit, plist);
				assertEquals(parent, null);
				assertEquals(depth, 0);
			},
		},
	});
	assertEquals(leaves, 1);
});

Deno.test('walk: leave: dict', () => {
	const plist = new PLDict();
	let leaves = 0;
	walk(plist, {
		leave: {
			[PLTYPE_DICT](): void {
				leaves++;
			},
		},
	});
	assertEquals(leaves, 1);
	leaves = 0;
	plist.set(new PLString('A'), new PLString('a'));
	walk(plist, {
		leave: {
			[PLTYPE_DICT](visit, parent, depth): void {
				leaves++;
				assertStrictEquals(visit, plist);
				assertEquals(parent, null);
				assertEquals(depth, 0);
			},
		},
	});
	assertEquals(leaves, 1);
});

Deno.test('walk: value: default', () => {
	const plist = new PLArray();
	plist.push(new PLBoolean());
	plist.push(new PLData());
	plist.push(new PLDate());
	plist.push(new PLDict());
	plist.push(new PLInteger());
	plist.push(new PLReal());
	plist.push(new PLString());
	plist.push(new PLUID());

	const visitied: [PLType, WalkParent, number][] = [];
	walk(plist, {
		enter: {
			default(visit, parent, depth): void {
				visitied.push([visit, parent, depth]);
			},
		},
		value: {
			default(visit, parent, depth): void {
				visitied.push([visit, parent, depth]);
			},
		},
	});
	assertStrictEquals(visitied.length, plist.length + 1);
	for (let i = 0; i < plist.length; i++) {
		const expect = i ? plist.get(i - 1) : plist;
		assertStrictEquals(visitied[i][0], expect, `[${i}]: visit`);
		assertStrictEquals(visitied[i][1], i ? plist : null, `[${i}]: parent`);
		assertStrictEquals(visitied[i][2], i ? 1 : 0, `[${i}]: depth`);
	}
});

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
	const boolTrue = new PLBoolean(true);
	dict.set(kTrue, boolTrue);
	const kFalse = new PLString('FALSE');
	const boolFalse = new PLBoolean(false);
	dict.set(kFalse, boolFalse);
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

	const visitied: [string, PLType | number, WalkParent, number][] = [];
	const visitiedger = (method: string) => {
		return (
			visit: PLType | number,
			parent: WalkParent,
			depth: number,
		) => {
			visitied.push([
				method,
				visit,
				parent,
				depth,
			]);
		};
	};
	walk(plist, {
		enter: {
			[PLTYPE_ARRAY]: visitiedger(`enter.${PLTYPE_ARRAY}`),
			[PLTYPE_DICT]: visitiedger(`enter.${PLTYPE_DICT}`),
			default: visitiedger('enter.default'),
		},
		key: {
			[PLTYPE_ARRAY]: visitiedger(`key.${PLTYPE_ARRAY}`),
			[PLTYPE_DICT]: visitiedger(`key.${PLTYPE_DICT}`),
			default: visitiedger('key.default'),
		},
		value: {
			[PLTYPE_BOOLEAN]: visitiedger(`value.${PLTYPE_BOOLEAN}`),
			[PLTYPE_DATA]: visitiedger(`value.${PLTYPE_DATA}`),
			[PLTYPE_DATE]: visitiedger(`value.${PLTYPE_DATE}`),
			[PLTYPE_INTEGER]: visitiedger(`value.${PLTYPE_INTEGER}`),
			[PLTYPE_REAL]: visitiedger(`value.${PLTYPE_REAL}`),
			[PLTYPE_STRING]: visitiedger(`value.${PLTYPE_STRING}`),
			[PLTYPE_UID]: visitiedger(`value.${PLTYPE_UID}`),
			default: visitiedger('value.default'),
		},
		leave: {
			[PLTYPE_ARRAY]: visitiedger(`leave.${PLTYPE_ARRAY}`),
			[PLTYPE_DICT]: visitiedger(`leave.${PLTYPE_DICT}`),
			default: visitiedger('leave.default'),
		},
	});
	const expected = [
		[`enter.${PLTYPE_DICT}`, plist, null, 0],

		[`key.${PLTYPE_DICT}`, kArray, plist, 1],
		[`enter.${PLTYPE_ARRAY}`, array, plist, 1],

		[`key.${PLTYPE_ARRAY}`, 0, array, 2],
		[`value.${PLTYPE_INTEGER}`, int0, array, 2],
		[`key.${PLTYPE_ARRAY}`, 1, array, 2],
		[`value.${PLTYPE_INTEGER}`, int1, array, 2],
		[`key.${PLTYPE_ARRAY}`, 2, array, 2],
		[`value.${PLTYPE_INTEGER}`, int2, array, 2],

		[`leave.${PLTYPE_ARRAY}`, array, plist, 1],

		[`key.${PLTYPE_DICT}`, kData, plist, 1],
		[`value.${PLTYPE_DATA}`, data, plist, 1],

		[`key.${PLTYPE_DICT}`, kDate, plist, 1],
		[`value.${PLTYPE_DATE}`, date, plist, 1],

		[`key.${PLTYPE_DICT}`, kDict, plist, 1],
		[`enter.${PLTYPE_DICT}`, dict, plist, 1],

		[`key.${PLTYPE_DICT}`, kTrue, dict, 2],
		[`value.${PLTYPE_BOOLEAN}`, boolTrue, dict, 2],

		[`key.${PLTYPE_DICT}`, kFalse, dict, 2],
		[`value.${PLTYPE_BOOLEAN}`, boolFalse, dict, 2],

		[`leave.${PLTYPE_DICT}`, dict, plist, 1],

		[`key.${PLTYPE_DICT}`, kReal, plist, 1],
		[`value.${PLTYPE_REAL}`, real, plist, 1],

		[`key.${PLTYPE_DICT}`, kString, plist, 1],
		[`value.${PLTYPE_STRING}`, string, plist, 1],

		[`key.${PLTYPE_DICT}`, kUID, plist, 1],
		[`value.${PLTYPE_UID}`, uid, plist, 1],

		[`leave.${PLTYPE_DICT}`, plist, null, 0],
	];
	for (let i = 0; i < expected.length; i++) {
		assertStrictEquals(visitied[i][0], expected[i][0], `[${i}]: method`);
		assertStrictEquals(visitied[i][1], expected[i][1], `[${i}]: visit`);
		assertStrictEquals(visitied[i][2], expected[i][2], `[${i}]: parent`);
		assertStrictEquals(visitied[i][3], expected[i][3], `[${i}]: depth`);
	}
	assertEquals(visitied.length, expected.length);
});

Deno.test('walk: stop: enter: array', () => {
	const plist = new PLArray();
	const int1 = new PLInteger(1n);
	const int2 = new PLInteger(2n);
	const int3 = new PLInteger(3n);
	const int4 = new PLInteger(4n);
	const int5 = new PLInteger(5n);
	const int6 = new PLInteger(6n);
	const a = new PLArray([int1, int2]);
	const b = new PLArray([int3, int4]);
	const c = new PLArray([int5, int6]);
	plist.push(a, b, c);
	const visited: PLType[] = [];
	const expected = [plist, a, int1, int2, b];
	walk(plist, {
		enter: {
			[PLTYPE_ARRAY](visit): number {
				visited.push(visit);
				return visit === b ? -1 : 0;
			},
		},
		value: {
			default(visit): number {
				visited.push(visit);
				return 0;
			},
		},
	});
	assertEquals(visited.length, expected.length);
	for (let i = 0; i < visited.length; i++) {
		assertStrictEquals(visited[i], expected[i], `[${i}]: visit`);
	}
	visited.length = 0;
	walk(plist, {
		enter: {
			default(visit): number {
				visited.push(visit);
				return visit === b ? -1 : 0;
			},
		},
		value: {
			default(visit): void {
				visited.push(visit);
			},
		},
	});
	assertEquals(visited.length, expected.length);
	for (let i = 0; i < visited.length; i++) {
		assertStrictEquals(visited[i], expected[i], `[${i}]: visit`);
	}
});

Deno.test('walk: stop: enter: dict', () => {
	const plist = new PLDict();
	const int1 = new PLInteger(1n);
	const int2 = new PLInteger(2n);
	const int3 = new PLInteger(3n);
	const int4 = new PLInteger(4n);
	const int5 = new PLInteger(5n);
	const int6 = new PLInteger(6n);
	const a = new PLDict([
		[new PLString('A'), int1],
		[new PLString('B'), int2],
	]);
	const b = new PLDict([
		[new PLString('C'), int3],
		[new PLString('D'), int4],
	]);
	const c = new PLDict([
		[new PLString('E'), int5],
		[new PLString('F'), int6],
	]);
	plist.set(new PLString('1'), a);
	plist.set(new PLString('2'), b);
	plist.set(new PLString('3'), c);
	const visited: PLType[] = [];
	const expected = [plist, a, int1, int2, b];
	walk(plist, {
		enter: {
			[PLTYPE_DICT](visit): number {
				visited.push(visit);
				return visit === b ? -1 : 0;
			},
		},
		value: {
			default(visit): number {
				visited.push(visit);
				return 0;
			},
		},
	});
	assertEquals(visited.length, expected.length);
	for (let i = 0; i < visited.length; i++) {
		assertStrictEquals(visited[i], expected[i], `[${i}]: visit`);
	}
	visited.length = 0;
	walk(plist, {
		enter: {
			default(visit): number {
				visited.push(visit);
				return visit === b ? -1 : 0;
			},
		},
		value: {
			default(visit): void {
				visited.push(visit);
			},
		},
	});
	assertEquals(visited.length, expected.length);
	for (let i = 0; i < visited.length; i++) {
		assertStrictEquals(visited[i], expected[i], `[${i}]: visit`);
	}
});

Deno.test('walk: stop: key: array', () => {
	const v1 = new PLInteger(1n);
	const v2 = new PLInteger(2n);
	const v3 = new PLInteger(3n);
	const plist = new PLArray([v1, v2, v3]);
	const visitied: unknown[] = [];
	walk(plist, {
		key: {
			default(visit): number {
				visitied.push(visit);
				return visit === 1 ? -1 : 0;
			},
		},
		value: {
			default(visit): void {
				visitied.push(visit);
			},
		},
		leave: {
			default(): void {
				throw new Error('should not be called');
			},
		},
	});
	const expected = [0, v1, 1];
	assertEquals(visitied.length, expected.length);
	for (let i = 0; i < visitied.length; i++) {
		assertStrictEquals(visitied[i], expected[i], `[${i}]: visit`);
	}
});

Deno.test('walk: stop: key: dict', () => {
	const plist = new PLDict();
	const k1 = new PLString('1');
	const v1 = new PLInteger(1n);
	const k2 = new PLString('2');
	const v2 = new PLInteger(2n);
	const k3 = new PLString('3');
	const v3 = new PLInteger(3n);
	plist.set(k1, v1);
	plist.set(k2, v2);
	plist.set(k3, v3);
	const visitied: unknown[] = [];
	walk(plist, {
		key: {
			default(visit): number {
				visitied.push(visit);
				return visit === k2 ? -1 : 0;
			},
		},
		value: {
			default(visit): void {
				visitied.push(visit);
			},
		},
		leave: {
			default(): void {
				throw new Error('should not be called');
			},
		},
	});
	const expected = [k1, v1, k2];
	assertEquals(visitied.length, expected.length);
	for (let i = 0; i < visitied.length; i++) {
		assertStrictEquals(visitied[i], expected[i], `[${i}]: visit`);
	}
});

Deno.test('walk: stop: leave: array', () => {
	const plist = new PLArray();
	const int1 = new PLInteger(1n);
	const int2 = new PLInteger(2n);
	const int3 = new PLInteger(3n);
	const int4 = new PLInteger(4n);
	const a = new PLArray([int1, int2]);
	const b = new PLArray([int3, int4]);
	plist.push(a, b);
	const visited: PLType[] = [];
	const expected = [plist, a, int1, int2];
	walk(plist, {
		enter: {
			[PLTYPE_ARRAY](visit): void {
				visited.push(visit);
			},
		},
		value: {
			default(visit): void {
				visited.push(visit);
			},
		},
		leave: {
			[PLTYPE_ARRAY]: () => -1,
		},
	});
	assertEquals(visited.length, expected.length);
	for (let i = 0; i < visited.length; i++) {
		assertStrictEquals(visited[i], expected[i], `[${i}]: visit`);
	}
	visited.length = 0;
	walk(plist, {
		enter: {
			default(visit): void {
				visited.push(visit);
			},
		},
		value: {
			default(visit): void {
				visited.push(visit);
			},
		},
		leave: {
			default: () => -1,
		},
	});
	assertEquals(visited.length, expected.length);
	for (let i = 0; i < visited.length; i++) {
		assertStrictEquals(visited[i], expected[i], `[${i}]: visit`);
	}
});

Deno.test('walk: stop: leave: dict', () => {
	const plist = new PLDict();
	const int1 = new PLInteger(1n);
	const int2 = new PLInteger(2n);
	const int3 = new PLInteger(3n);
	const int4 = new PLInteger(4n);
	const a = new PLDict([
		[new PLString('A'), int1],
		[new PLString('B'), int2],
	]);
	const b = new PLDict([
		[new PLString('C'), int3],
		[new PLString('D'), int4],
	]);
	plist.set(new PLString('1'), a);
	plist.set(new PLString('2'), b);
	const visited: PLType[] = [];
	const expected = [plist, a, int1, int2];
	walk(plist, {
		enter: {
			default(visit): void {
				visited.push(visit);
			},
		},
		value: {
			default(visit): void {
				visited.push(visit);
			},
		},
		leave: {
			[PLTYPE_DICT]: () => -1,
		},
	});
	assertEquals(visited.length, expected.length);
	for (let i = 0; i < visited.length; i++) {
		assertStrictEquals(visited[i], expected[i], `[${i}]: visit`);
	}
	visited.length = 0;
	walk(plist, {
		enter: {
			default(visit): void {
				visited.push(visit);
			},
		},
		value: {
			default(visit): void {
				visited.push(visit);
			},
		},
		leave: {
			default: () => -1,
		},
	});
	assertEquals(visited.length, expected.length);
	for (let i = 0; i < visited.length; i++) {
		assertStrictEquals(visited[i], expected[i], `[${i}]: visit`);
	}
});

Deno.test('walk: skip: enter', () => {
	const i1 = new PLInteger(1n);
	const i2 = new PLInteger(2n);
	const i3 = new PLInteger(3n);
	const i4 = new PLInteger(4n);
	const i5 = new PLInteger(5n);
	const c = new PLArray([i1, i2, i3]);
	const b = new PLArray([c, i4]);
	const a = new PLArray([b, i5]);
	const [parents, depths] = parentsDepths(a);
	for (
		const [amount, expected] of [
			[0, [a, b, c, i1, i2, i3, c, i4, b, i5, a]],
			[0.5, [a, b, c, i1, i2, i3, c, i4, b, i5, a]],
			[1, [a, b, c, i4, b, i5, a]],
			[1.5, [a, b, c, i4, b, i5, a]],
			[2, [a, b, c, b, i5, a]],
			[3, [a, b, c, b, a]],
			[4, [a, b, c, b, a]],
			[Infinity, [a, b, c, b, a]],
		] as [number, unknown[]][]
	) {
		const visited: unknown[] = [];
		walk(a, {
			enter: {
				default(visit, parent, depth): number {
					assertStrictEquals(depths.get(visit), depth);
					assertStrictEquals(parents.get(visit), parent);
					visited.push(visit);
					return visit === c ? amount : 0;
				},
			},
			value: {
				default(visit, parent, depth): void {
					assertStrictEquals(depths.get(visit), depth);
					assertStrictEquals(parents.get(visit), parent);
					visited.push(visit);
				},
			},
			leave: {
				default(visit, parent, depth): void {
					assertStrictEquals(depths.get(visit), depth);
					assertStrictEquals(parents.get(visit), parent);
					visited.push(visit);
				},
			},
		});
		assertEquals(visited.length, expected.length);
		for (let i = 0; i < visited.length; i++) {
			assertStrictEquals(
				visited[i],
				expected[i],
				`${amount}: [${i}]: visit`,
			);
		}
	}
});

Deno.test('walk: skip: key', () => {
	const i1 = new PLInteger(1n);
	const i2 = new PLInteger(2n);
	const i3 = new PLInteger(3n);
	const i4 = new PLInteger(4n);
	const i5 = new PLInteger(5n);
	const i6 = new PLInteger(6n);
	const c = new PLArray([i1, i2, i3, i4]);
	const b = new PLArray([c, i5]);
	const a = new PLArray([b, i6]);
	const [parents, depths] = parentsDepths(a);
	for (
		const [amount, expected] of [
			[0, [a, b, c, i1, i2, i3, i4, c, i5, b, i6, a]],
			[0.5, [a, b, c, i1, i2, i3, i4, c, i5, b, i6, a]],
			[1, [a, b, c, i1, i2, i4, c, i5, b, i6, a]],
			[1.5, [a, b, c, i1, i2, i4, c, i5, b, i6, a]],
			[2, [a, b, c, i1, i2, c, i5, b, i6, a]],
			[3, [a, b, c, i1, i2, c, b, i6, a]],
			[4, [a, b, c, i1, i2, c, b, a]],
			[5, [a, b, c, i1, i2, c, b, a]],
			[Infinity, [a, b, c, i1, i2, c, b, a]],
		] as [number, unknown[]][]
	) {
		const visited: unknown[] = [];
		walk(a, {
			enter: {
				default(visit, parent, depth): void {
					assertStrictEquals(depths.get(visit), depth);
					assertStrictEquals(parents.get(visit), parent);
					visited.push(visit);
				},
			},
			key: {
				default(visit): number {
					return visit === 2 ? amount : 0;
				},
			},
			value: {
				default(visit, parent, depth): void {
					assertStrictEquals(depths.get(visit), depth);
					assertStrictEquals(parents.get(visit), parent);
					visited.push(visit);
				},
			},
			leave: {
				default(visit, parent, depth): void {
					assertStrictEquals(depths.get(visit), depth);
					assertStrictEquals(parents.get(visit), parent);
					visited.push(visit);
				},
			},
		});
		assertEquals(visited.length, expected.length);
		for (let i = 0; i < visited.length; i++) {
			assertStrictEquals(
				visited[i],
				expected[i],
				`${amount}: [${i}]: visit`,
			);
		}
	}
});

Deno.test('walk: skip: value', () => {
	const i1 = new PLInteger(1n);
	const i2 = new PLInteger(2n);
	const i3 = new PLInteger(3n);
	const i4 = new PLInteger(4n);
	const i5 = new PLInteger(5n);
	const c = new PLArray([i1, i2, i3]);
	const b = new PLArray([c, i4]);
	const a = new PLArray([b, i5]);
	const [parents, depths] = parentsDepths(a);
	for (
		const [amount, expected] of [
			[0, [a, b, c, i1, i2, i3, c, i4, b, i5, a]],
			[0.5, [a, b, c, i1, i2, i3, c, i4, b, i5, a]],
			[1, [a, b, c, i1, i2, i3, c, i4, b, i5, a]],
			[1.5, [a, b, c, i1, i2, i3, c, i4, b, i5, a]],
			[2, [a, b, c, i1, i2, c, i4, b, i5, a]],
			[3, [a, b, c, i1, i2, c, b, i5, a]],
			[4, [a, b, c, i1, i2, c, b, a]],
			[5, [a, b, c, i1, i2, c, b, a]],
			[Infinity, [a, b, c, i1, i2, c, b, a]],
		] as [number, unknown[]][]
	) {
		const visited: unknown[] = [];
		walk(a, {
			enter: {
				default(visit, parent, depth): void {
					assertStrictEquals(depths.get(visit), depth);
					assertStrictEquals(parents.get(visit), parent);
					visited.push(visit);
				},
			},
			value: {
				default(visit, parent, depth): number {
					assertStrictEquals(depths.get(visit), depth);
					assertStrictEquals(parents.get(visit), parent);
					visited.push(visit);
					return visit === i2 ? amount : 0;
				},
			},
			leave: {
				default(visit, parent, depth): void {
					assertStrictEquals(depths.get(visit), depth);
					assertStrictEquals(parents.get(visit), parent);
					visited.push(visit);
				},
			},
		});
		assertEquals(visited.length, expected.length);
		for (let i = 0; i < visited.length; i++) {
			assertStrictEquals(
				visited[i],
				expected[i],
				`${amount}: [${i}]: visit`,
			);
		}
	}
});

Deno.test('walk: skip: leave', () => {
	const g = new PLArray([]);
	const f = new PLArray([]);
	const e = new PLArray([]);
	const d = new PLArray([]);
	const c = new PLArray([f, g]);
	const b = new PLArray([d, e]);
	const a = new PLArray([b, c]);
	const [parents, depths] = parentsDepths(a);
	for (
		const [amount, expected] of [
			[0, [a, b, d, d, e, e, b, c, f, f, g, g, c, a]],
			[0.5, [a, b, d, d, e, e, b, c, f, f, g, g, c, a]],
			[1, [a, b, d, d, e, e, b, c, f, f, g, g, c, a]],
			[1.5, [a, b, d, d, e, e, b, c, f, f, g, g, c, a]],
			[2, [a, b, d, d, b, c, f, f, g, g, c, a]],
			[3, [a, b, d, d, b, a]],
			[4, [a, b, d, d, b, a]],
			[Infinity, [a, b, d, d, b, a]],
		] as [number, unknown[]][]
	) {
		const visited: unknown[] = [];
		walk(a, {
			enter: {
				default(visit, parent, depth): void {
					assertStrictEquals(depths.get(visit), depth);
					assertStrictEquals(parents.get(visit), parent);
					visited.push(visit);
				},
			},
			leave: {
				default(visit, parent, depth): number {
					assertStrictEquals(depths.get(visit), depth);
					assertStrictEquals(parents.get(visit), parent);
					visited.push(visit);
					return visit === d ? amount : 0;
				},
			},
		});
		assertEquals(visited.length, expected.length);
		for (let i = 0; i < visited.length; i++) {
			assertStrictEquals(
				visited[i],
				expected[i],
				`${amount}: [${i}]: visit`,
			);
		}
	}
});

Deno.test('walk: recursion', () => {
	const b = new PLDict<PLType>();
	const a = new PLArray<PLType>([b, b, b, b, b]);
	a.push(a);
	const ancestors = new Set();
	let recursion: PLType | null = null;
	walk(a, {
		enter: {
			default(visit): number | void {
				if (ancestors.has(visit)) {
					recursion = visit;
					return -1;
				}
				ancestors.add(visit);
			},
		},
		leave: {
			default(visit): void {
				ancestors.delete(visit);
			},
		},
	});
	assertStrictEquals(recursion, a);
	const count = new Map<PLType, number>();
	recursion = null;
	walk(a, {
		enter: {
			default(visit): number | void {
				const c = (count.get(visit) || 0) + 1;
				count.set(visit, c);
				if (c === 5) {
					recursion = visit;
					return -1;
				}
			},
		},
		leave: {
			default(visit): void {
				count.set(visit, (count.get(visit) || 0) - 1);
			},
		},
	});
	assertStrictEquals(recursion, a);
	assertEquals(count.get(recursion), 5);
});
