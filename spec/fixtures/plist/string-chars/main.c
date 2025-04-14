#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main() {
	CFMutableDictionaryRef plist = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);
	for (int i = 0xffff; i >= 0; i--) {
		char keyi[8] = {0};
		sprintf(keyi, "%d", i);
		unsigned short s = i;
		CFStringRef key = CFStringCreateWithBytes(NULL, (unsigned char *)keyi, strlen(keyi), kCFStringEncodingUTF8, false);
		CFStringRef val = CFStringCreateWithBytes(NULL, (unsigned char *)&s, 2, kCFStringEncodingUTF16, false);
		CFDictionarySetValue(plist, key, val);
	}
	plw(plist, CFSTR("binary.plist"), kCFPropertyListBinaryFormat_v1_0);
	plw(plist, CFSTR("xml.plist"), kCFPropertyListXMLFormat_v1_0);
	return 0;
}
