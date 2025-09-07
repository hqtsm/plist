/**
 * Get hex character value.
 *
 * @param c Character.
 * @returns Value, or -1 for invalid.
 */
export const b16d = (c: number): number =>
	c < 58
		? c < 48 ? -1 : c - 48
		: c > 96
		? c < 103 ? c - 87 : -1
		: c < 71 && c > 64
		? c - 55
		: -1;
