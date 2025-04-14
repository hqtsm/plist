#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main() {
	CFMutableDictionaryRef plist = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);

	CFDictionarySetValue(plist, CFStringCreateMutableCopy(NULL, 0, CFSTR("A")), CFSTR("11"));

	// Value order in plist not deterministic.
	CFDictionarySetValue(plist, CFStringCreateMutableCopy(NULL, 0, CFSTR("B")), CFSTR("21"));
	CFDictionarySetValue(plist, CFStringCreateMutableCopy(NULL, 0, CFSTR("B")), CFSTR("22"));

	// Value order in plist not deterministic.
	CFDictionarySetValue(plist, CFStringCreateMutableCopy(NULL, 0, CFSTR("C")), CFSTR("31"));
	CFDictionarySetValue(plist, CFStringCreateMutableCopy(NULL, 0, CFSTR("C")), CFSTR("32"));
	CFDictionarySetValue(plist, CFStringCreateMutableCopy(NULL, 0, CFSTR("C")), CFSTR("33"));

	plw(plist, CFSTR("binary.plist"), kCFPropertyListBinaryFormat_v1_0);
	plw(plist, CFSTR("xml.plist"), kCFPropertyListXMLFormat_v1_0);
	return 0;
}
