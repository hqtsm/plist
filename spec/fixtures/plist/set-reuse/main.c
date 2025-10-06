#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main() {
	CFMutableArrayRef plist = CFArrayCreateMutable(NULL, 0, NULL);
	CFMutableArrayRef array = CFArrayCreateMutable(NULL, 0, NULL);
	CFArrayAppendValue(array, CFSTR("AAAA"));
	CFArrayAppendValue(array, CFSTR("BBBB"));
	CFArrayAppendValue(plist, array);
	CFArrayAppendValue(plist, array);
	plw(plist, CFSTR("binary.plist"), kCFPropertyListBinaryFormat_v1_0);
	FILE * f = fopen("binary.plist", "r+");
	int offsets[] = {0xB, 0x18};
	for (int i = 0; i < sizeof(offsets) / sizeof(int); i++) {
		fseek(f, offsets[i], SEEK_SET);
		char marker;
		fread(&marker, 1, 1, f);
		marker = 0xC0 | (marker & 0xF);
		fseek(f, offsets[i], SEEK_SET);
		fwrite(&marker, 1, 1, f);
	}
	fclose(f);
	return 0;
}
