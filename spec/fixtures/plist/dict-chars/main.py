#!/usr/bin/env python3

unesc = b'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
eschr = {
	7: b'\\a',
	8: b'\\b',
	9: b'\\t',
	10: b'\\n',
	11: b'\\v',
	12: b'\\f',
	34: b'\\"',
	92: b'\\\\',
}
with open('openstep.plist', 'wb') as out:
	out.write(b'{\n')
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
		out.write(b'\t' + k + b' = ' + v + b';\n')
	out.write(b'}\n')
