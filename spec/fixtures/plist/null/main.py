#!/usr/bin/env python3
import struct

with open('binary.plist', 'wb') as out:
	out.write(b'bplist00')
	out.write(struct.pack('>B', 0x00))
	offset = out.tell()
	out.write(struct.pack('>B', 8))
	out.write(struct.pack('>xxxxxxBBQQQ', 1, 1, 1, 0, offset))
