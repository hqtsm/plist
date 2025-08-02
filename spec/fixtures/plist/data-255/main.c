#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main() {
	unsigned char data[255] = {0};
	for (int i = 0; i < sizeof(data); i++) {
		data[i] = i;
	}
	CFPropertyListRef plist = CFDataCreate(NULL, data, sizeof(data));
	plw(plist, CFSTR("binary.plist"), kCFPropertyListBinaryFormat_v1_0);
	plw(plist, CFSTR("xml.plist"), kCFPropertyListXMLFormat_v1_0);
	return 0;
}
