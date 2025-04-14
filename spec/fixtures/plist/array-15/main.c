#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main() {
	CFMutableArrayRef plist = CFArrayCreateMutable(NULL, 0, NULL);
	CFDateRef date0 = CFDateCreate(NULL, 0.0);
	CFDateRef date1 = CFDateCreate(NULL, 1.0);
	for (int i = 0; i < 15; i++) {
		CFArrayAppendValue(plist, i % 2 ? date1 : date0);
	}
	plw(plist, CFSTR("binary.plist"), kCFPropertyListBinaryFormat_v1_0);
	plw(plist, CFSTR("xml.plist"), kCFPropertyListXMLFormat_v1_0);
	return 0;
}
