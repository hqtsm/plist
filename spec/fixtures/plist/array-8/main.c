#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main() {
	CFMutableArrayRef plist = CFArrayCreateMutable(NULL, 0, NULL);
	CFStringRef str0 = CFSTR("A");
	CFStringRef str1 = CFSTR("B");
	for (int i = 0; i < 8; i++) {
		CFArrayAppendValue(plist, i % 2 ? str1 : str0);
	}
	plw(plist, CFSTR("binary.plist"), kCFPropertyListBinaryFormat_v1_0);
	plw(plist, CFSTR("xml.plist"), kCFPropertyListXMLFormat_v1_0);
	return 0;
}
