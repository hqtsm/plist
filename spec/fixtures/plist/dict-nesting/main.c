#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main() {
	CFMutableDictionaryRef plist = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);

	CFMutableDictionaryRef dictA = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);
	CFMutableDictionaryRef dictB = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);

	CFMutableDictionaryRef dictAA = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);
	CFDictionarySetValue(dictAA, CFSTR("AAA"), CFSTR("aaa"));
	CFDictionarySetValue(dictAA, CFSTR("AAB"), CFSTR("aab"));
	CFDictionarySetValue(dictA, CFSTR("AA"), dictAA);

	CFMutableDictionaryRef dictAB = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);
	CFDictionarySetValue(dictAB, CFSTR("ABA"), CFSTR("aba"));
	CFDictionarySetValue(dictAB, CFSTR("ABB"), CFSTR("abb"));
	CFDictionarySetValue(dictA, CFSTR("AB"), dictAB);

	CFMutableDictionaryRef dictBA = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);
	CFDictionarySetValue(dictBA, CFSTR("BAA"), CFSTR("baa"));
	CFDictionarySetValue(dictBA, CFSTR("BAB"), CFSTR("bab"));
	CFDictionarySetValue(dictB, CFSTR("BA"), dictBA);

	CFMutableDictionaryRef dictBB = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);
	CFDictionarySetValue(dictBB, CFSTR("BBA"), CFSTR("bba"));
	CFDictionarySetValue(dictBB, CFSTR("BBB"), CFSTR("bbb"));
	CFDictionarySetValue(dictB, CFSTR("BB"), dictBB);

	CFDictionarySetValue(plist, CFSTR("A"), dictA);
	CFDictionarySetValue(plist, CFSTR("B"), dictB);

	plw(plist, CFSTR("binary.plist"), kCFPropertyListBinaryFormat_v1_0);
	plw(plist, CFSTR("xml.plist"), kCFPropertyListXMLFormat_v1_0);
	return 0;
}
