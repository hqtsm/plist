// deno-lint-ignore-file no-console
import { fixtureNextStepLatin } from '../fixture.ts';

async function main(): Promise<void> {
	const nsl = await fixtureNextStepLatin();
	const table: number[] = [];
	for (let c = 128; c <= 255; c++) {
		const codes = nsl.get(c);
		if (codes) {
			if (codes.length !== 1) {
				throw new Error('Invalid');
			}
			const [code] = codes;
			table[c - 128] = code - c;
		}
	}
	console.log(`const latin = ${JSON.stringify(table)};`);
	console.log(`console.log(latin[c - 128] + c);`);
}
main().catch((err) => {
	console.error(err);
	Deno.exit(1);
});
