/**
 * @module
 *
 * Plist formats.
 */

/**
 * Legacy strings Plist format (OpenStep variant, dict body).
 */
export const FORMAT_STRINGS = 'STRINGS';

/**
 * Legacy OpenStep Plist format.
 */
export const FORMAT_OPENSTEP = 'OPENSTEP';

/**
 * XML Plist format, version 1.0.
 */
export const FORMAT_XML_V1_0 = 'XML-V1.0';

/**
 * XML Plist format, version 0.9.
 */
export const FORMAT_XML_V0_9 = 'XML-V0.9';

/**
 * Binary Plist format, version 1.0.
 */
export const FORMAT_BINARY_V1_0 = 'BINARY-V1.0';

/**
 * Plist formats.
 */
export type Format =
	| typeof FORMAT_STRINGS
	| typeof FORMAT_OPENSTEP
	| typeof FORMAT_XML_V0_9
	| typeof FORMAT_XML_V1_0
	| typeof FORMAT_BINARY_V1_0;
