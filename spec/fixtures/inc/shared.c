#include <CoreFoundation/CoreFoundation.h>

#define DOCTYPE "<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">"

#ifndef CFKeyedArchiverUIDRef
	typedef const struct __CFKeyedArchiverUID * CFKeyedArchiverUIDRef;
#endif

#ifndef _CFKeyedArchiverUIDCreate
	CFKeyedArchiverUIDRef _CFKeyedArchiverUIDCreate(CFAllocatorRef allocator, uint32_t value);
#endif

CFPropertyListRef plr(CFStringRef file, CFPropertyListFormat * format) {
	CFURLRef url = CFURLCreateWithFileSystemPath(NULL, file, kCFURLPOSIXPathStyle, false);
	CFReadStreamRef stream = CFReadStreamCreateWithFile(NULL, url);
	CFReadStreamOpen(stream);
	CFErrorRef error = NULL;
	CFPropertyListRef plist = CFPropertyListCreateWithStream(NULL, stream, 0, 0, format, &error);
	if (error) {
		CFShow(error);
	}
	return plist;
}

int plw(CFPropertyListRef plist, CFStringRef file, CFPropertyListFormat format) {
	CFURLRef url = CFURLCreateWithFileSystemPath(NULL, file, kCFURLPOSIXPathStyle, FALSE);
	CFWriteStreamRef stream = CFWriteStreamCreateWithFile(NULL, url);
	CFWriteStreamOpen(stream);
	CFErrorRef error = NULL;
	CFPropertyListWrite(plist, stream, format, 0, &error);
	if (error) {
		CFShow(error);
	}
	return !error;
}
