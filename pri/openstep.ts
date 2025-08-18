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
