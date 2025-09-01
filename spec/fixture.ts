import { assert } from '@std/assert';

let fixtures: Promise<string>;

export async function findFixtures(): Promise<string> {
	const noop = () => null;
	noop();
	let result;
	for (
		const s of [
			'spec/fixtures',
			'../spec/fixtures',
			'../../spec/fixtures',
		]
	) {
		// deno-lint-ignore no-await-in-loop
		result = await Deno.realPath(s).catch(noop);
		if (result) {
			break;
		}
	}
	assert(result, 'Could not find fixtures');
	return result;
}

export async function fixture(name: string): Promise<Uint8Array> {
	const base = await (fixtures ??= findFixtures());
	const file = `${base}/${name}`;
	return Deno.readFile(file);
}

export async function fixturePlist(
	group: string,
	name: string,
): Promise<Uint8Array> {
	return await fixture(`plist/${group}/${name}.plist`);
}

export async function fixtureNextStepLatin(): Promise<Map<number, number[]>> {
	const r = new Map<number, number[]>();
	for (
		const line of String.fromCharCode(
			...await fixture('encoding/x-nextstep/table.txt'),
		)
			.split('\n')
	) {
		const [a, b] = line.trim().split(' = ');
		if (a && b) {
			r.set(parseInt(a, 16), b.split(' ').map((b) => +b));
		}
	}
	return r;
}
