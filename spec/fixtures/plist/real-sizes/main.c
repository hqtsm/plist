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
		{"10.0", 10.0},
		{"-10.0", -10.0},
		{"0.01", 0.01},
		{"-0.01", -0.01},
		{"3.14", 3.14},
		{"-3.14", -3.14},
		{"5e-45", 5e-45},
		{"-5e-45", -5e-45},
		{"5e-46", 5e-46},
		{"-5e-46", -5e-46},
		{"5e-324", 5e-324},
		{"-5e-324", -5e-324},
		{"PI", M_PI},
		{"-PI", -M_PI},
		{"NAN", NAN},
		{"INFINITY", INFINITY},
		{"-INFINITY", -INFINITY},
	};
	for (int i = 0; i < sizeof(values) / sizeof(struct sample); i++) {
		double f64 = values[i].value;
		char name[1024] = {0};

		union {
			double f;
			uint64_t u;
		} f64hex = {.f = f64};
		htonll(f64hex.u);
		sprintf(name, "f64 %016llx %s", f64hex.u, values[i].name);
		CFStringRef key = CFStringCreateWithBytes(NULL, (const unsigned char *)name, strlen(name), kCFStringEncodingUTF8, false);
		CFNumberRef val = CFNumberCreate(NULL, kCFNumberFloat64Type, &f64);
		CFDictionarySetValue(plist, key, val);

		float f32 = values[i].value;
		union {
			float f;
			uint32_t u;
		} f32hex = {.f = f64};
		htonl(f32hex.u);
		sprintf(name, "f32 %08x %s", f32hex.u, values[i].name);
		key = CFStringCreateWithBytes(NULL, (const unsigned char *)name, strlen(name), kCFStringEncodingUTF8, false);
		val = CFNumberCreate(NULL, kCFNumberFloat32Type, &f32);
		CFDictionarySetValue(plist, key, val);
	}
	plw(plist, CFSTR("binary.plist"), kCFPropertyListBinaryFormat_v1_0);
	plw(plist, CFSTR("xml.plist"), kCFPropertyListXMLFormat_v1_0);
	return 0;
}
