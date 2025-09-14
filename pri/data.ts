/**
 * Get buffer or view as bytes.
 *
 * @param buffer Buffer or buffer view.
 * @returns Bytes.
 */
export function bytes(buffer: ArrayBufferView | ArrayBuffer): Uint8Array {
	return 'buffer' in buffer
		? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
		: new Uint8Array(buffer);
}

/**
 * Error message for invalid binary.
 *
 * @param offset Offset.
 * @returns Error message.
 */
export function binaryError(offset: number): string {
	return `Invalid binary data at 0x${offset.toString(16).toUpperCase()}`;
}
