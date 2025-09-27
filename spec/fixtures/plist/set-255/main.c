#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main() {
	CFMutableArrayRef plist = CFArrayCreateMutable(NULL, 0, NULL);
	for (int i = 0; i < 255; i++) {
		char str[64];
		sprintf(str, "%0.3d", i);
		CFStringRef key = CFStringCreateWithBytes(NULL, (unsigned char *)str, strlen(str), kCFStringEncodingUTF8, false);
		CFArrayAppendValue(plist, key);
	}
	plw(plist, CFSTR("binary.plist"), kCFPropertyListBinaryFormat_v1_0);
	FILE * f = fopen("binary.plist", "r+");
	fseek(f, 8, SEEK_SET);
	char marker;
	fread(&marker, 1, 1, f);
	marker = 0xC0 | (marker & 0xF);
	fseek(f, 8, SEEK_SET);
	fwrite(&marker, 1, 1, f);
	fclose(f);
	return 0;
}
