#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main() {
	CFMutableDictionaryRef plist = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);
	CFDictionarySetValue(plist, CFSTR(""), CFSTR("0"));
	CFDictionarySetValue(plist, CFSTR("a"), CFSTR("1"));
	CFDictionarySetValue(plist, CFSTR("aa"), CFSTR("2"));
	CFDictionarySetValue(plist, CFSTR("aaa"), CFSTR("3"));
	CFDictionarySetValue(plist, CFSTR("ab"), CFSTR("4"));
	CFDictionarySetValue(plist, CFSTR("abb"), CFSTR("5"));
	CFDictionarySetValue(plist, CFSTR("ac"), CFSTR("6"));
	plw(plist, CFSTR("binary.plist"), kCFPropertyListBinaryFormat_v1_0);
	plw(plist, CFSTR("xml.plist"), kCFPropertyListXMLFormat_v1_0);
	return 0;
}
