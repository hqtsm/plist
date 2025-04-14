#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main() {
	CFMutableArrayRef plist = CFArrayCreateMutable(NULL, 0, NULL);
	int value = 0;
	CFNumberRef num0 = CFNumberCreate(NULL, kCFNumberIntType, &value);
	value = 1;
	CFNumberRef num1 = CFNumberCreate(NULL, kCFNumberIntType, &value);
	for (int i = 0; i < 255; i++) {
		CFArrayAppendValue(plist, i % 2 ? num1 : num0);
	}
	plw(plist, CFSTR("binary.plist"), kCFPropertyListBinaryFormat_v1_0);
	plw(plist, CFSTR("xml.plist"), kCFPropertyListXMLFormat_v1_0);
	return 0;
}
