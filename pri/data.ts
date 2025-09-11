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
