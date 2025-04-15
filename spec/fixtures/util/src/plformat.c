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
	CFPropertyListFormat format = 0;
	CFPropertyListRef plist = plr(fileStr, &format);
	printf("%li\n", format);
	return !plist;
}
