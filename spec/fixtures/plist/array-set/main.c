#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main() {
	CFMutableArrayRef set = CFArrayCreateMutable(NULL, 0, NULL);
	CFMutableArrayRef plist = CFArrayCreateMutable(NULL, 0, NULL);
	CFArrayAppendValue(plist, set);
	plw(plist, CFSTR("binary.plist"), kCFPropertyListBinaryFormat_v1_0);
	FILE * f = fopen("binary.plist", "r+");
	fseek(f, 10, SEEK_SET);
	char marker;
	fread(&marker, 1, 1, f);
	marker = 0xC0 | (marker & 0xF);
	fseek(f, 10, SEEK_SET);
	fwrite(&marker, 1, 1, f);
	fclose(f);
	return 0;
}
