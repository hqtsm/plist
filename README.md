# HQTSM: Plist

Property list file encoding and decoding

# Features

- Pure TypeScript, run anywhere
- Tree shaking friendly design
- Support for both encoding and decoding multiple formats
  - OpenStep / Strings
  - XML
  - Binary
- Optional support for non-UTF XML encodings (BYO decoder)
- Support for data types inconsistenly supported by official libraries
- Supports encoding output identical to official libraries
- Encoders and decoders preserve the data structure as closely as possible
- Includes a type-safe walk function to walk a property list

# Usage

## Encode Binary

```ts
import {
	encode,
	encodeBinary,
	FORMAT_BINARY_V1_0,
	PLDict,
	PLInteger,
	PLString,
} from '@hqtsm/plist';

const plist = new PLDict();
plist.set(new PLString('Name'), new PLString('John Smith'));
plist.set(new PLString('Age'), new PLInteger(42n));

const expected = `
	62 70 6C 69 73 74 30 30 D2 01 02 03 04 54 4E 61
	6D 65 53 41 67 65 5A 4A 6F 68 6E 20 53 6D 69 74
	68 10 2A 08 0D 12 16 21 00 00 00 00 00 00 01 01
	00 00 00 00 00 00 00 05 00 00 00 00 00 00 00 00
	00 00 00 00 00 00 00 23
	`.trim().split(/\s+/).map((s) => parseInt(s, 16));

// OR: encodeBinary(plist);
const enc = encode(plist, { format: FORMAT_BINARY_V1_0 });
console.assert(String.fromCharCode(...enc.slice(0, 8)) === 'bplist00');
console.assert(JSON.stringify([...enc]) === JSON.stringify(expected));
```

### Encode Binary Options

### Option: `format` (`'BINARY-V1.0'`)

Only `FORMAT_BINARY_V1_0` is valid for binary.

### Option: `duplicates` (`Iterable<PLTypeName | PLType>`)

A list of types or values to be duplicated in the offset table. Only useful to create a 1:1 identical encode as an official encoder.

## Encode XML

```ts
import {
	encode,
	FORMAT_XML_V1_0,
	PLDict,
	PLInteger,
	PLString,
	PLUID,
} from '@hqtsm/plist';

const plist = new PLDict();
plist.set(new PLString('First Name'), new PLString('John'));
plist.set(new PLString('Last Name'), new PLString('Smith'));
plist.set(new PLString('Age'), new PLInteger(42n));
plist.set(new PLString('ID'), new PLUID(1234n));

const expected = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>First Name</key>
	<string>John</string>
	<key>Last Name</key>
	<string>Smith</string>
	<key>Age</key>
	<integer>42</integer>
	<key>ID</key>
	<dict>
		<key>CF$UID</key>
		<integer>1234</integer>
	</dict>
</dict>
</plist>
`;

// OR: encodeXml(plist);
const enc = encode(plist, { format: FORMAT_XML_V1_0 });
console.assert(new TextDecoder().decode(enc) === expected);
```

## Encode XML Options

### Option: `format` (`'XML-V1.0' | 'XML-V0.9'`)

Either `FORMAT_XML_V1_0` or `FORMAT_XML_V0_9` (different headers).

### Option: `indent` (`string`)

A custom indent strings of tabs or spaces.

### Option: `unsignZero` (`boolean`)

Encode `-0.0` as just `0.0` as official encoders do.

### Option: `min128Zero` (`boolean`)

Encode smallest 128-bit integer as `-0` as official encoders do. 128-bit integers are a private API in official encoders, limited compatibility.

## Encode OpenStep / Strings

```ts
import { encode, FORMAT_OPENSTEP, PLDict, PLString } from '@hqtsm/plist';

const plist = new PLDict();
plist.set(new PLString('First Name'), new PLString('John'));
plist.set(new PLString('Last Name'), new PLString('Smith'));

const expected = `{
	"First Name" = John;
	"Last Name" = Smith;
}
`;

// OR: encodeOpenStep(plist);
const enc = encode(plist, { format: FORMAT_OPENSTEP });
console.assert(new TextDecoder().decode(enc) === expected);
```

```ts
import { encode, FORMAT_STRINGS, PLDict, PLString } from '@hqtsm/plist';

const plist = new PLDict();
plist.set(new PLString('First Name'), new PLString('John'));
plist.set(new PLString('Last Name'), new PLString('Smith'));

const expected = `"First Name" = John;
"Last Name" = Smith;
`;
// OR: encodeOpenStep(plist, { format: FORMAT_STRINGS });
const enc = encode(plist, { format: FORMAT_STRINGS });
console.assert(new TextDecoder().decode(enc) === expected);
```

## Encode OpenStep / Strings Options

### Option: `format` (`'OPENSTEP' | 'STRINGS'`)

Either `FORMAT_OPENSTEP` or `FORMAT_STRINGS`. With the strings format the plist type being encoded must be `PLDict`.

### Option: `indent` (`string`)

A custom indent strings of tabs or spaces.

### Option: `quote` (`'"' | "'"`)

Set the string quote character.

### Option: `quoted` (`boolean`)

Option to always make strings quoted even when it is optional.

### Option: `shortcut` (`boolean`)

Use the "shortcut" style for keys and values that are reference equal.

```
{
	"shortcut";
}
```

VS

```
{
	"shortcut" = "shortcut";
}
```

## Decode Binary

```ts
import { decode, FORMAT_BINARY_V1_0, PLDict, walk } from '@hqtsm/plist';

const encoded = new Uint8Array(
	`
	62 70 6C 69 73 74 30 30 D2 01 02 03 04 54 4E 61
	6D 65 53 41 67 65 5A 4A 6F 68 6E 20 53 6D 69 74
	68 10 2A 08 0D 12 16 21 00 00 00 00 00 00 01 01
	00 00 00 00 00 00 00 05 00 00 00 00 00 00 00 00
	00 00 00 00 00 00 00 23
	`.trim().split(/\s+/).map((s) => parseInt(s, 16)),
);

// OR: decodeBinary(encoded):
const { format, plist } = decode(encoded);
console.assert(format === FORMAT_BINARY_V1_0);
console.assert(PLDict.is(plist));
walk(plist, {
	PLDict(dict) {
		console.assert(dict.size === 2);
	},
	PLString(str, _, key) {
		if (key) {
			console.assert(str.value === 'John Smith');
		} else {
			const keys = ['Name', 'Age'];
			console.assert(keys.includes(str.value));
		}
	},
	PLInteger(int) {
		console.assert(int.value === 42n);
	},
});
```

## Decode Binary Options

### Option: `int64` (`boolean`)

Optionally limit integers to the range of 64-bit signed or unsigned values. 128-bit integers in official decoders is limited to unsigned 64-bit values.

### Option: `primitiveKeys` (`boolean`)

Optionally limit key types to primitive types. The open source CF encoder does this.

### Option: `stringKeys` (`boolean`)

Optionally limit key types to string type. The closed source CF encoder does this.

## Decode XML

```ts
import { decode, FORMAT_XML_V1_0, PLDict, walk } from '@hqtsm/plist';

const encoded = new TextEncoder().encode(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>First Name</key>
	<string>John</string>
	<key>Last Name</key>
	<string>Smith</string>
	<key>Age</key>
	<integer>42</integer>
	<key>ID</key>
	<dict>
		<key>CF$UID</key>
		<integer>1234</integer>
	</dict>
</dict>
</plist>
`);

// OR: decodeXml(encoded);
const { format, plist } = decode(encoded);
console.assert(format === FORMAT_XML_V1_0);
console.assert(PLDict.is(plist));
walk(plist, {
	PLDict(dict) {
		console.assert(dict.size === 4);
	},
	PLString(str, _, key) {
		if (key) {
			const values = ['John', 'Smith'];
			console.assert(values.includes(str.value));
		} else {
			const keys = ['First Name', 'Last Name', 'Age', 'ID'];
			console.assert(keys.includes(str.value));
		}
	},
	PLInteger(int) {
		console.assert(int.value === 42n);
	},
	PLUID(int) {
		console.assert(int.value === 1234n);
	},
});
```

## Decode XML Options

### Option: `decoded` (`boolean`)

Flag to skip decoding and assumed UTF-8 without BOM.

### Option: `decoder` (`DecodeXmlDecoder`)

Optonal decoder function for converting XML to UTF-8 based on the header. Useful to decode an XML document with a non-UTF encoding. Official encoders always use UTF-8 but many encodings can be decoded depending on what the host platform has available. Using `TextDecoder` can be helpful, but it may be different in some edge cases.

### Option: `int64` (`boolean`)

Optionally limit integers to the range of 64-bit signed or unsigned values. 128-bit integers in official decoders is limited to unsigned 64-bit values.

### Option: `utf16le` (`boolean`)

Optional UTF-16 endian flag when no BOM available. Defaults to auto detect based on which character is null. Official decoders assume it will match host endian.

## Decode OpenStep / Strings

```ts
import { decode, FORMAT_OPENSTEP, PLDict, walk } from '@hqtsm/plist';

const encoded = new TextEncoder().encode(`{
	"First Name" = John;
	"Last Name" = Smith;
}
`);

// OR: decodeOpenStep(encoded);
const { format, plist } = decode(encoded);
console.assert(format === FORMAT_OPENSTEP);
console.assert(PLDict.is(plist));
walk(plist, {
	PLDict(dict) {
		console.assert(dict.size === 2);
	},
	PLString(str, _, key) {
		if (key) {
			const values = ['John', 'Smith'];
			console.assert(values.includes(str.value));
		} else {
			const keys = ['First Name', 'Last Name'];
			console.assert(keys.includes(str.value));
		}
	},
});
```

```ts
import { decode, FORMAT_STRINGS, PLDict, walk } from '@hqtsm/plist';

const encoded = new TextEncoder().encode(`"First Name" = John;
"Last Name" = Smith;
`);

// OR: decodeOpenStep(encoded);
const { format, plist } = decode(encoded);
console.assert(format === FORMAT_STRINGS);
console.assert(PLDict.is(plist));
walk(plist, {
	PLDict(dict) {
		console.assert(dict.size === 2);
	},
	PLString(str, _, key) {
		if (key) {
			const values = ['John', 'Smith'];
			console.assert(values.includes(str.value));
		} else {
			const keys = ['First Name', 'Last Name'];
			console.assert(keys.includes(str.value));
		}
	},
});
```

## Decode OpenStep / Strings Options

### Option: `allowMissingSemi` (`boolean`)

Allow missing semicolon on the last dict item. Official decoders once allowed this but deprecated and removed it.

### Option: `decoded` (`boolean`)

Flag to skip decoding and assumed UTF-8 without BOM. OpenStep does not store encoding information so UTF is assumed by decoders. If another encoding is used it must first be converted to UTF before decoding.

### Option: `utf16le` (`boolean`)

Optional UTF-16 endian flag when no BOM available. Defaults to auto detect based on which character is null. Official decoders assume it will match host endian.
