#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main() {
	CFMutableArrayRef plist = CFArrayCreateMutable(NULL, 0, NULL);
	CFArrayAppendValue(plist, CFSTR("0"));
	CFArrayAppendValue(plist, CFSTR("1"));
	CFArrayAppendValue(plist, CFSTR("2"));
	CFArrayAppendValue(plist, CFSTR("3"));
	CFArrayAppendValue(plist, CFSTR("4"));
	CFArrayAppendValue(plist, CFSTR("5"));
	CFArrayAppendValue(plist, CFSTR("6"));
	CFArrayAppendValue(plist, CFSTR("7"));
	CFArrayAppendValue(plist, CFSTR("8"));
	CFArrayAppendValue(plist, CFSTR("9"));
	CFArrayAppendValue(plist, CFSTR("A"));
	CFArrayAppendValue(plist, CFSTR("B"));
	CFArrayAppendValue(plist, CFSTR("C"));
	CFArrayAppendValue(plist, CFSTR("D"));
	CFArrayAppendValue(plist, CFSTR("E"));
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
