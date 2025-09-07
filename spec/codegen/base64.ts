// deno-lint-ignore-file no-console
const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const subE = 19;
const subD = 80;
const nulD = -99;

let hi = -Infinity;
let lo = Infinity;
for (let i = 64; i--;) {
	const c = b64.charCodeAt(i);
	hi = Math.max(hi, c);
	lo = Math.min(lo, c);
}
const range = hi - lo;

const b64e: number[] = [];
for (let i = 64; i--;) {
	b64e[i] = b64.charCodeAt(i) - i + subE;
}
console.log(`const b64e = ${JSON.stringify(b64e)};`);
console.log(`console.log(b64e[i] + i - ${subE});`);

const b64d: number[] = (new Array(range)).fill(nulD);
for (let i = 64; i--;) {
	const c = b64.charCodeAt(i);
	b64d[c - lo] = i - c + subD;
}
console.log(`const b64d = ${JSON.stringify(b64d)};`);
console.log(
	`console.log(i > 42 && i < 123 ? b64d[i - 43] + i - ${subD} : -1);`,
);
