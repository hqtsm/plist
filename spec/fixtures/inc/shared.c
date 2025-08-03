#include <CoreFoundation/CoreFoundation.h>

#define DOCTYPE "<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">"

#ifndef CFKeyedArchiverUIDRef
	typedef const struct __CFKeyedArchiverUID * CFKeyedArchiverUIDRef;
#endif

#ifndef _CFKeyedArchiverUIDCreate
	CFKeyedArchiverUIDRef _CFKeyedArchiverUIDCreate(CFAllocatorRef allocator, uint32_t value);
#endif

#ifndef kCFNumberSInt128Type
	enum {
		kCFNumberSInt128Type = 17
	};
#endif

#ifndef CFSInt128Struct
	typedef struct {
		int64_t high;
		uint64_t low;
	} CFSInt128Struct;
#endif

CFPropertyListRef plr(CFStringRef file, CFPropertyListFormat * format) {
	CFURLRef url = CFURLCreateWithFileSystemPath(NULL, file, kCFURLPOSIXPathStyle, false);
	CFReadStreamRef stream = CFReadStreamCreateWithFile(NULL, url);
	CFReadStreamOpen(stream);
	CFErrorRef error = NULL;
	// Rejects streams less than 6 bytes.
	// CFPropertyListRef plist = CFPropertyListCreateWithStream(NULL, stream, 0, 0, format, &error);
	CFMutableDataRef data = CFDataCreateMutable(kCFAllocatorDefault, 0);
	UInt8 buffer[4096];
	CFIndex length;
	while ((length = CFReadStreamRead(stream, buffer, sizeof(buffer))) > 0) {
		CFDataAppendBytes(data, buffer, length);
	}
	CFPropertyListRef plist = CFPropertyListCreateWithData(NULL, data, 0, format, &error);
	if (error) {
		CFShow(error);
	}
	CFReadStreamClose(stream);
	return plist;
}

int plw(CFPropertyListRef plist, CFStringRef file, CFPropertyListFormat format) {
	CFURLRef url = CFURLCreateWithFileSystemPath(NULL, file, kCFURLPOSIXPathStyle, false);
	CFWriteStreamRef stream = CFWriteStreamCreateWithFile(NULL, url);
	CFWriteStreamOpen(stream);
	CFErrorRef error = NULL;
	CFPropertyListWrite(plist, stream, format, 0, &error);
	if (error) {
		CFShow(error);
	}
	CFWriteStreamClose(stream);
	return !error;
}
