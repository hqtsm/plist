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
	plw(plist, CFSTR("xml.plist"), kCFPropertyListXMLFormat_v1_0);
	return 0;
}
