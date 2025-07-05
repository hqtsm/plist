#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main() {
	CFMutableDictionaryRef plist = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);
	for (int i = 0; i < 365; i++) {
		char keystr[1024] = {0};
		sprintf(keystr, "%0.3d", i + 1);
		double value = 86400 * i;
		CFStringRef key = CFStringCreateWithBytes(NULL, (unsigned char *)keystr, strlen(keystr), kCFStringEncodingUTF8, false);
		CFDateRef val = CFDateCreate(NULL, value);
		CFDictionarySetValue(plist, key, val);
	}
	plw(plist, CFSTR("binary.plist"), kCFPropertyListBinaryFormat_v1_0);
	plw(plist, CFSTR("xml.plist"), kCFPropertyListXMLFormat_v1_0);
	return 0;
}
