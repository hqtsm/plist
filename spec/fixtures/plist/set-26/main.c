#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main() {
	CFMutableArrayRef plist = CFArrayCreateMutable(NULL, 0, NULL);
	CFArrayAppendValue(plist, CFSTR("A"));
	CFArrayAppendValue(plist, CFSTR("B"));
	CFArrayAppendValue(plist, CFSTR("C"));
	CFArrayAppendValue(plist, CFSTR("D"));
	CFArrayAppendValue(plist, CFSTR("E"));
	CFArrayAppendValue(plist, CFSTR("F"));
	CFArrayAppendValue(plist, CFSTR("G"));
	CFArrayAppendValue(plist, CFSTR("H"));
	CFArrayAppendValue(plist, CFSTR("I"));
	CFArrayAppendValue(plist, CFSTR("J"));
	CFArrayAppendValue(plist, CFSTR("K"));
	CFArrayAppendValue(plist, CFSTR("L"));
	CFArrayAppendValue(plist, CFSTR("M"));
	CFArrayAppendValue(plist, CFSTR("N"));
	CFArrayAppendValue(plist, CFSTR("O"));
	CFArrayAppendValue(plist, CFSTR("P"));
	CFArrayAppendValue(plist, CFSTR("Q"));
	CFArrayAppendValue(plist, CFSTR("R"));
	CFArrayAppendValue(plist, CFSTR("S"));
	CFArrayAppendValue(plist, CFSTR("T"));
	CFArrayAppendValue(plist, CFSTR("U"));
	CFArrayAppendValue(plist, CFSTR("V"));
	CFArrayAppendValue(plist, CFSTR("W"));
	CFArrayAppendValue(plist, CFSTR("X"));
	CFArrayAppendValue(plist, CFSTR("Y"));
	CFArrayAppendValue(plist, CFSTR("Z"));
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
