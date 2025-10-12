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
- Encoders and decoders preserve the data structure as closely as possible.
- Includes a type-safe walk function to walk a property list.

# Usage

## Encode

### Binary

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

### XML

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

### OpenStep

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

### Strings

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

## Decode

### Binary

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

// OR: decodeBinary():
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

### XML

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

### OpenStep

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

### Strings

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
