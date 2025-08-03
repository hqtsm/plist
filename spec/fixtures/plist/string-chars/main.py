#!/usr/bin/env python3

unesc = b'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$/:.-'
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
	14: b'\\16',
	15: b'\\17',
	16: b'\\20',
	17: b'\\21',
	18: b'\\22',
	19: b'\\23',
	20: b'\\24',
	21: b'\\25',
	22: b'\\26',
	23: b'\\27',
	24: b'\\30',
	25: b'\\31',
	26: b'\\32',
	27: b'\\33',
	28: b'\\34',
	29: b'\\35',
	30: b'\\36',
	31: b'\\37',
	34: b'\\"',
	92: b'\\\\',
	127: b'\\177',
}

with open('openstep.plist', 'wb') as out:
	with open('strings.plist', 'wb') as strings:
		out.write(b'{\n')
		for i in range(0, 0xffff + 1):
			k = ('%0.5d' % (i)).encode()
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
			strings.write(k + b' = ' + v + b';\n')
		out.write(b'}\n')
