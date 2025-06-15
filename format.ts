/**
 * @module
 *
 * Plist formats.
 */

/**
 * Legacy OpenStep Plist format.
 */
export const FORMAT_OPENSTEP = 'OPENSTEP';

/**
 * XML Plist format, version 1.0.
 */
export const FORMAT_XML_V1_0 = 'XML-V1.0';

/**
 * Binary Plist format, version 1.0.
 */
export const FORMAT_BINARY_V1_0 = 'BINARY-V1.0';

/**
 * Plist formats.
 */
export type Format =
	| typeof FORMAT_OPENSTEP
	| typeof FORMAT_XML_V1_0
	| typeof FORMAT_BINARY_V1_0;
