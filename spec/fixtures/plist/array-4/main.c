#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main() {
	CFMutableArrayRef plist = CFArrayCreateMutable(NULL, 0, NULL);
	const unsigned char aa[] = "aa";
	const unsigned char bb[] = "bb";
	CFDataRef data0 = CFDataCreate(NULL, aa, sizeof(aa) - 1);
	CFDataRef data1 = CFDataCreate(NULL, bb, sizeof(bb) - 1);
	for (int i = 0; i < 8; i++) {
		CFArrayAppendValue(plist, i % 2 ? data1 : data0);
	}
	plw(plist, CFSTR("binary.plist"), kCFPropertyListBinaryFormat_v1_0);
	plw(plist, CFSTR("xml.plist"), kCFPropertyListXMLFormat_v1_0);
	return 0;
}
