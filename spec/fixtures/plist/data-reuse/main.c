#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main() {
	CFMutableArrayRef plist = CFArrayCreateMutable(NULL, 0, NULL);
	const unsigned char data[] = "reused";
	CFDataRef ref = CFDataCreate(NULL, data, sizeof(data) - 1);
	CFArrayAppendValue(plist, ref);
	CFArrayAppendValue(plist, ref);
	plw(plist, CFSTR("binary.plist"), kCFPropertyListBinaryFormat_v1_0);
	plw(plist, CFSTR("xml.plist"), kCFPropertyListXMLFormat_v1_0);
	return 0;
}
