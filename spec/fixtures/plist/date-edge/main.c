#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

int main() {
	double values[] = {
		0.0,
		// CoreFoundation is weird when creating a -0.0 date.
		// CFDateGetAbsoluteTime returns 0xbeefffffffffffff (~-0.000015).
		// -0.0,
		1.0,
		-1.0,
		-59011441438.0,
		-63300000000.0,
		0.000001,
		-0.000001,
		0.00001,
		-0.00001,
		0.0001,
		-0.0001,
		0.001,
		-0.001,
		0.01,
		-0.01,
		0.1,
		-0.1,
		0.5,
		-0.5,
		0.9,
		-0.9,
		0.99999,
		-0.99999,
		12596342400.0,
		2.220446049250313e-16,
		M_E,
		M_LOG2E,
		M_LOG10E,
		M_LN2,
		M_LN10,
		M_PI,
		M_PI_2,
		M_PI_4,
		M_1_PI,
		M_2_PI,
		M_2_SQRTPI,
		M_SQRT2,
		M_SQRT1_2,
		-978307200.0,
		978307200.0,
		123456789.0,
		9007199254740991.0,
		-9007199254740991.0,
		NAN,
		INFINITY,
		-INFINITY,
	};
	CFMutableDictionaryRef plist = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);
	for (int i = 0; i < sizeof(values) / sizeof(double); i++) {
		double value = values[i];
		union {
			double d;
			uint64_t u;
		} v = {.d = value};
		htonll(v.u);
		char keyhex[1024] = {0};
		sprintf(keyhex, "%lf %016llx", value, v.u);
		CFStringRef key = CFStringCreateWithBytes(NULL, (unsigned char *)keyhex, strlen(keyhex), kCFStringEncodingUTF8, false);
		CFDateRef val = CFDateCreate(NULL, value);
		CFDictionarySetValue(plist, key, val);
	}
	plw(plist, CFSTR("binary.plist"), kCFPropertyListBinaryFormat_v1_0);
	plw(plist, CFSTR("xml.plist"), kCFPropertyListXMLFormat_v1_0);
	return 0;
}
