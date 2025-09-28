#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main() {
	CFMutableArrayRef plist = CFArrayCreateMutable(NULL, 0, NULL);
	CFMutableDictionaryRef dict = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);
	CFDictionarySetValue(dict, CFSTR("AAAA"), CFSTR("1111"));
	CFDictionarySetValue(dict, CFSTR("BBBB"), CFSTR("2222"));
	CFArrayAppendValue(plist, dict);
	CFArrayAppendValue(plist, dict);
	plw(plist, CFSTR("binary.plist"), kCFPropertyListBinaryFormat_v1_0);
	plw(plist, CFSTR("xml.plist"), kCFPropertyListXMLFormat_v1_0);
	return 0;
}
