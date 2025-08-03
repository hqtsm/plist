#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main() {
	CFMutableDictionaryRef plist = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);
	CFSInt128Struct value;

	value.high = 0x1112131415161718;
	value.low = 0x0102030405060708;
	CFDictionarySetValue(plist, CFSTR("BIG"), CFNumberCreate(NULL, kCFNumberSInt128Type, &value));

	value.high = 0;
	value.low = 42;
	CFDictionarySetValue(plist, CFSTR("SMALL"), CFNumberCreate(NULL, kCFNumberSInt128Type, &value));

	value.high = 0x7FFFFFFFFFFFFFFF;
	value.low = 0xFFFFFFFFFFFFFFFF;
	CFDictionarySetValue(plist, CFSTR("MAX"), CFNumberCreate(NULL, kCFNumberSInt128Type, &value));

	value.high = 0x8000000000000000;
	value.low = 0x0000000000000000;
	CFDictionarySetValue(plist, CFSTR("MIN"), CFNumberCreate(NULL, kCFNumberSInt128Type, &value));

	value.high = 0x8000000000000000;
	value.low = 0x0000000000000001;
	CFDictionarySetValue(plist, CFSTR("MIN+1"), CFNumberCreate(NULL, kCFNumberSInt128Type, &value));

	value.high = 0x8000000000000000;
	value.low = 0x0000000000000002;
	CFDictionarySetValue(plist, CFSTR("MIN+2"), CFNumberCreate(NULL, kCFNumberSInt128Type, &value));

	plw(plist, CFSTR("binary.plist"), kCFPropertyListBinaryFormat_v1_0);
	plw(plist, CFSTR("xml.plist"), kCFPropertyListXMLFormat_v1_0);
	return 0;
}
