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

export async function fixturePlist(
	group: string,
	name: string,
): Promise<Uint8Array> {
	const base = await (fixtures ??= findFixtures());
	const file = `${base}/plist/${group}/${name}.plist`;
	return Deno.readFile(file);
}
