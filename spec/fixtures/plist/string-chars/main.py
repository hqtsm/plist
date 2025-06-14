#!/usr/bin/env python3

unesc = b'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
eschr = {
	0: b'\\0',
	1: b'\\1',
	2: b'\\2',
	3: b'\\3',
	4: b'\\4',
	5: b'\\5',
	6: b'\\6',
	7: b'\\a', # b'\\7',
	8: b'\\b',
	9: b'\\t',
	10: b'\\n',
	11: b'\\v',
	12: b'\\f',
	13: b'\\r',
	34: b'\\"',
	92: b'\\\\',
}
ints = []
for i in range(0, 0xffff + 1):
	ints.append(str(i))
ints.sort()

with open('openstep.plist', 'wb') as out:
	out.write(b'{\n')
	for i in ints:
		i = int(i)
		k = str(i).encode()
		v = None
		if i in eschr:
			v = b'"' + eschr[i] + b'"'
		elif i <= 127:
			if i in unesc:
				v = chr(i).encode()
			else:
				v = ('"' + chr(i) + '"').encode()
		else:
			v = b'"\\U%0.04x"' % i
		out.write(b'\t' + k + b' = ' + v + b';\n')
	out.write(b'}\n')
