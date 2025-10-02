#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main() {
	CFMutableArrayRef plist = CFArrayCreateMutable(NULL, 0, NULL);
	CFArrayAppendValue(plist, kCFBooleanFalse);
	plw(plist, CFSTR("binary.plist"), kCFPropertyListBinaryFormat_v1_0);
	FILE * f = fopen("binary.plist", "r+");
	fseek(f, 10, SEEK_SET);
	char marker = 0;
	fwrite(&marker, 1, 1, f);
	fclose(f);
	return 0;
}
