#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main() {
	CFMutableArrayRef plist = CFArrayCreateMutable(NULL, 0, NULL);
	double value = 0;
	CFNumberRef num0 = CFNumberCreate(NULL, kCFNumberDoubleType, &value);
	value = 1.0;
	CFNumberRef num1 = CFNumberCreate(NULL, kCFNumberDoubleType, &value);
	for (int i = 0; i < 128; i++) {
		CFArrayAppendValue(plist, i % 2 ? num1 : num0);
	}
	plw(plist, CFSTR("binary.plist"), kCFPropertyListBinaryFormat_v1_0);
	plw(plist, CFSTR("xml.plist"), kCFPropertyListXMLFormat_v1_0);
	return 0;
}
