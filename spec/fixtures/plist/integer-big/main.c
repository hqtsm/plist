#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main() {
	CFMutableArrayRef plist = CFArrayCreateMutable(NULL, 0, NULL);
	CFSInt128Struct value;

	value.high = 0x1112131415161718;
	value.low = 0x0102030405060708;
	CFArrayAppendValue(plist, CFSTR("BIG"));
	CFArrayAppendValue(plist, CFNumberCreate(NULL, kCFNumberSInt128Type, &value));

	value.high = 0;
	value.low = 42;
	CFArrayAppendValue(plist, CFSTR("SMALL"));
	CFArrayAppendValue(plist, CFNumberCreate(NULL, kCFNumberSInt128Type, &value));

	value.high = 0x7FFFFFFFFFFFFFFF;
	value.low = 0xFFFFFFFFFFFFFFFF;
	CFArrayAppendValue(plist, CFSTR("MAX"));
	CFArrayAppendValue(plist, CFNumberCreate(NULL, kCFNumberSInt128Type, &value));

	value.high = 0x8000000000000000;
	value.low = 0x0000000000000000;
	CFArrayAppendValue(plist, CFSTR("MIN"));
	CFArrayAppendValue(plist, CFNumberCreate(NULL, kCFNumberSInt128Type, &value));

	value.high = 0x8000000000000000;
	value.low = 0x0000000000000001;
	CFArrayAppendValue(plist, CFSTR("MIN+1"));
	CFArrayAppendValue(plist, CFNumberCreate(NULL, kCFNumberSInt128Type, &value));

	value.high = 0x8000000000000000;
	value.low = 0x0000000000000002;
	CFArrayAppendValue(plist, CFSTR("MIN+2"));
	CFArrayAppendValue(plist, CFNumberCreate(NULL, kCFNumberSInt128Type, &value));

	plw(plist, CFSTR("binary.plist"), kCFPropertyListBinaryFormat_v1_0);
	plw(plist, CFSTR("xml.plist"), kCFPropertyListXMLFormat_v1_0);
	return 0;
}
