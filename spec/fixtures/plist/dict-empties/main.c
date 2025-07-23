#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main() {
	CFMutableDictionaryRef plist = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);
	CFDictionarySetValue(plist, CFSTR("array"), CFArrayCreate(NULL, NULL, 0, NULL));
	CFDictionarySetValue(plist, CFSTR("dict"), CFDictionaryCreate(NULL, NULL, NULL, 0, NULL, NULL));
	plw(plist, CFSTR("binary.plist"), kCFPropertyListBinaryFormat_v1_0);
	plw(plist, CFSTR("xml.plist"), kCFPropertyListXMLFormat_v1_0);
	return 0;
}
