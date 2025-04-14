/**
 * @module
 *
 * Plist formats.
 */

/**
 * Legacy OpenStep Plist format.
 */
export const FORMAT_OPEN_STEP = 1;

/**
 * XML Plist format, version 1.0.
 */
export const FORMAT_XML_V1_0 = 100;

/**
 * Binary Plist format, version 1.0.
 */
export const FORMAT_BINARY_V1_0 = 200;

/**
 * Plist formats.
 */
export type Format =
	| typeof FORMAT_OPEN_STEP
	| typeof FORMAT_XML_V1_0
	| typeof FORMAT_BINARY_V1_0;
