#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

struct sample {
	const char * name;
	double value;
};

int main() {
	CFMutableDictionaryRef plist = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);
	struct sample values[] = {
		{"0.0", 0.0},
		{"-0.0", -0.0},
		{"1.0", 1.0},
		{"-1.0", -1.0},
		{"0.01", 0.01},
		{"-0.01", -0.01},
		{"3.14", 3.14},
		{"-3.14", -3.14},
		{"NAN", NAN},
		{"INFINITY", INFINITY},
		{"-INFINITY", -INFINITY},
	};
	for (int i = 0; i < sizeof(values) / sizeof(struct sample); i++) {
		char name[1024] = {0};
		sprintf(name, "f64:%s", values[i].name);
		CFStringRef key = CFStringCreateWithBytes(NULL, (const unsigned char *)name, strlen(name), kCFStringEncodingUTF8, false);
		CFNumberRef val = CFNumberCreate(NULL, kCFNumberFloat64Type, &values[i].value);
		CFDictionarySetValue(plist, key, val);
		float f32 = values[i].value;
		sprintf(name, "f32:%s", values[i].name);
		key = CFStringCreateWithBytes(NULL, (const unsigned char *)name, strlen(name), kCFStringEncodingUTF8, false);
		val = CFNumberCreate(NULL, kCFNumberFloat32Type, &f32);
		CFDictionarySetValue(plist, key, val);
	}
	plw(plist, CFSTR("binary.plist"), kCFPropertyListBinaryFormat_v1_0);
	plw(plist, CFSTR("xml.plist"), kCFPropertyListXMLFormat_v1_0);
	return 0;
}
