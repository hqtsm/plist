#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main(int argc, char ** argv) {
	if (argc < 2) {
		fprintf(stderr, "Usage: %s file.plist\n", argv[0]);
		return 1;
	}
	char * file = argv[1];
	CFStringRef fileStr = CFStringCreateWithBytes(
		NULL,
		(unsigned char *)file,
		strlen(file),
		kCFStringEncodingUTF8,
		false
	);
	CFPropertyListRef plist = plr(fileStr, NULL);
	plw(plist, CFSTR("/dev/stdout"), kCFPropertyListXMLFormat_v1_0);
	return !plist;
}
