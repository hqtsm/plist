/**
 * @module
 *
 * OpenStep utils.
 */

/**
 * Escape letters.
 */
export const esc = 'abtnvfr';

/**
 * Unescape letters.
 */
export const unesc = '\x07\bcde\fghijklm\nopq\rs\tu\v';

/**
 * OpenStep Latin encoding table.
 */
export const latin = [
	32,
	63,
	63,
	63,
	63,
	63,
	63,
	64,
	64,
	64,
	64,
	64,
	64,
	64,
	64,
	64,
	64,
	64,
	64,
	64,
	64,
	64,
	64,
	66,
	66,
	66,
	66,
	66,
	66,
	24,
	57,
	88,
	9,
	0,
	0,
	0,
	8096,
	0,
	236,
	0,
	-4,
	8048,
	8050,
	0,
	8077,
	8077,
	64083,
	64083,
	-2,
	8034,
	8046,
	8046,
	3,
	-15,
	0,
	8043,
	8034,
	8037,
	8035,
	0,
	8042,
	8051,
	-18,
	0,
	-7,
	522,
	-14,
	515,
	536,
	-22,
	530,
	530,
	-32,
	-23,
	528,
	-19,
	-25,
	528,
	525,
	504,
	8004,
	-32,
	-22,
	-22,
	-22,
	11,
	11,
	11,
	11,
	11,
	11,
	12,
	12,
	12,
	12,
	12,
	12,
	-27,
	11,
	-57,
	10,
	10,
	10,
	10,
	89,
	-17,
	104,
	-49,
	6,
	6,
	6,
	6,
	6,
	-11,
	7,
	7,
	7,
	60,
	6,
	6,
	74,
	-1,
	89,
	-28,
	2,
	2,
];

/**
 * Check if a character is unquoted.
 *
 * @param chr Character code.
 * @returns True if in: a-zA-Z0-9:_$/.-
 */
export const unquoted = (chr: number): boolean =>
	chr < 123 && (
		chr > 96 ||
		(chr < 91 && (chr > 64 || (chr < 59 && (chr > 44 || chr === 36)))) ||
		chr === 95
	);
