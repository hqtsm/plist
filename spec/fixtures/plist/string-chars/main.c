#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main() {
	CFMutableArrayRef plist = CFArrayCreateMutable(NULL, 0, NULL);
	for (int i = 0; i <= 0xffff; i++) {
		char keyi[8] = {0};
		sprintf(keyi, "%0.5d", i);
		unsigned short s = i;
		CFStringRef key = CFStringCreateWithBytes(NULL, (unsigned char *)keyi, strlen(keyi), kCFStringEncodingUTF8, false);
		CFStringRef val = CFStringCreateWithBytes(NULL, (unsigned char *)&s, 2, kCFStringEncodingUTF16, false);
		CFArrayAppendValue(plist, key);
		CFArrayAppendValue(plist, val);
	}
	plw(plist, CFSTR("binary.plist"), kCFPropertyListBinaryFormat_v1_0);
	plw(plist, CFSTR("xml.plist"), kCFPropertyListXMLFormat_v1_0);
	return 0;
}
