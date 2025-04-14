#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main() {
	unsigned char str[] = "🤖";
	CFStringRef plist = CFStringCreateWithBytes(NULL, str, sizeof(str) - 1, kCFStringEncodingUTF8, false);
	plw(plist, CFSTR("binary.plist"), kCFPropertyListBinaryFormat_v1_0);
	plw(plist, CFSTR("xml.plist"), kCFPropertyListXMLFormat_v1_0);
	return 0;
}
