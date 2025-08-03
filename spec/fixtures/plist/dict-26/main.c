#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main() {
	CFMutableDictionaryRef plist = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);

	CFDictionarySetValue(plist, CFSTR("A"), CFSTR("a"));
	CFDictionarySetValue(plist, CFSTR("B"), CFSTR("b"));
	CFDictionarySetValue(plist, CFSTR("C"), CFSTR("c"));
	CFDictionarySetValue(plist, CFSTR("D"), CFSTR("d"));
	CFDictionarySetValue(plist, CFSTR("E"), CFSTR("e"));
	CFDictionarySetValue(plist, CFSTR("F"), CFSTR("f"));
	CFDictionarySetValue(plist, CFSTR("G"), CFSTR("g"));
	CFDictionarySetValue(plist, CFSTR("H"), CFSTR("h"));
	CFDictionarySetValue(plist, CFSTR("I"), CFSTR("i"));
	CFDictionarySetValue(plist, CFSTR("J"), CFSTR("j"));
	CFDictionarySetValue(plist, CFSTR("K"), CFSTR("k"));
	CFDictionarySetValue(plist, CFSTR("L"), CFSTR("l"));
	CFDictionarySetValue(plist, CFSTR("M"), CFSTR("m"));
	CFDictionarySetValue(plist, CFSTR("N"), CFSTR("n"));
	CFDictionarySetValue(plist, CFSTR("O"), CFSTR("o"));
	CFDictionarySetValue(plist, CFSTR("P"), CFSTR("p"));
	CFDictionarySetValue(plist, CFSTR("Q"), CFSTR("q"));
	CFDictionarySetValue(plist, CFSTR("R"), CFSTR("r"));
	CFDictionarySetValue(plist, CFSTR("S"), CFSTR("s"));
	CFDictionarySetValue(plist, CFSTR("T"), CFSTR("t"));
	CFDictionarySetValue(plist, CFSTR("U"), CFSTR("u"));
	CFDictionarySetValue(plist, CFSTR("V"), CFSTR("v"));
	CFDictionarySetValue(plist, CFSTR("W"), CFSTR("w"));
	CFDictionarySetValue(plist, CFSTR("X"), CFSTR("x"));
	CFDictionarySetValue(plist, CFSTR("Y"), CFSTR("y"));
	CFDictionarySetValue(plist, CFSTR("Z"), CFSTR("z"));

	plw(plist, CFSTR("binary.plist"), kCFPropertyListBinaryFormat_v1_0);
	plw(plist, CFSTR("xml.plist"), kCFPropertyListXMLFormat_v1_0);
	return 0;
}
