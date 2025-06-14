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
with open('openstep.plist', 'wb') as plist:
	with open('strings.plist', 'wb') as strings:
		plist.write(b'{\n')
		for i in range(0, 0xffff + 1):
			v = str(i).encode()
			k = None
			if i in eschr:
				k = b'"' + eschr[i] + b'"'
			elif i <= 127:
				if i in unesc:
					k = chr(i).encode()
				else:
					k = ('"' + chr(i) + '"').encode()
			else:
				k = b'"\\U%0.04x"' % i
			plist.write(b'\t' + k + b' = ' + v + b';\n')
			strings.write(k + b' = ' + v + b';\n')
		plist.write(b'}\n')
