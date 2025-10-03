#!/usr/bin/env python3
import struct

keys = [
	('null', struct.pack('>B', 0x00)),
	('true', struct.pack('>B', 0x08)),
	('false', struct.pack('>B', 0x09)),
	('int', struct.pack('>BB', 0x10, 123)),
	('float', struct.pack('>Bf', 0x22, 3.14)),
	('double', struct.pack('>Bd', 0x23, 3.14)),
	('date', struct.pack('>Bd', 0x33, 3.14)),
	('data', struct.pack('>BB', 0x41, 0x4B)),
	('string-ascii', struct.pack('>BBBB', 0x53, 0x4B, 0x45, 0x59)),
	('string-unicode', struct.pack('>BBB', 0x61, 0x26, 0x3A)),
	('uid', struct.pack('>BB', 0x80, 42)),
	('array', struct.pack('>B', 0xA0)),
	('set', struct.pack('>B', 0xC0)),
	('dict', struct.pack('>B', 0xD0))
]

value = struct.pack('>BBBBBB', 0x55, 0x76, 0x61, 0x6C, 0x75, 0x65)

for (name, key) in keys:
	with open(f'key-type-{name}.plist', 'wb') as out:
		out.write(b'bplist00')
		offsets = [out.tell()]
		out.write(struct.pack('>BBB', 0xD1, 1, 2))
		offsets.append(out.tell())
		out.write(key)
		offsets.append(out.tell())
		out.write(value)
		offset = out.tell()
		for o in offsets:
			out.write(struct.pack('>B', o))
		out.write(struct.pack('>xxxxxxBBQQQ', 1, 1, len(offsets), 0, offset))
