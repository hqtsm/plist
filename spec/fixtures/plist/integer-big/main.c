#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main() {
	CFSInt128Struct value = { 0x1112131415161718, 0x0102030405060708 };
	CFPropertyListRef plist = CFNumberCreate(NULL, kCFNumberSInt128Type, &value);
	plw(plist, CFSTR("binary.plist"), kCFPropertyListBinaryFormat_v1_0);
	plw(plist, CFSTR("xml.plist"), kCFPropertyListXMLFormat_v1_0);
	return 0;
}
