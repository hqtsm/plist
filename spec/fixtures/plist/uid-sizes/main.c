#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main() {
	CFMutableArrayRef plist = CFArrayCreateMutable(NULL, 0, NULL);
	unsigned int values[] = {
		0x0,
		0x1,
		0x7f,
		0x80,
		0xff,
		0x100,
		0xffff,
		0x10000,
		0xffffff,
		0x1000000,
		0xffffffff,
	};
	for (int i = 0; i < sizeof(values) / sizeof(unsigned int); i++) {
		char keyi[20] = {0};
		sprintf(keyi, "0x%x", values[i]);
		CFStringRef key = CFStringCreateWithBytes(NULL, (unsigned char *)keyi, strlen(keyi), kCFStringEncodingUTF8, false);
		CFKeyedArchiverUIDRef val = _CFKeyedArchiverUIDCreate(NULL, values[i]);
		CFArrayAppendValue(plist, key);
		CFArrayAppendValue(plist, val);
	}
	plw(plist, CFSTR("binary.plist"), kCFPropertyListBinaryFormat_v1_0);
	plw(plist, CFSTR("xml.plist"), kCFPropertyListXMLFormat_v1_0);
	return 0;
}
