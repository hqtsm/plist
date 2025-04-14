#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

const char * encodings[] = {
	"iso-8859-1",
	"iso-8859-2",
	"iso-8859-3",
	"iso-8859-4",
	"iso-8859-5",
	"iso-8859-6",
	"iso-8859-7",
	"iso-8859-8",
	"iso-8859-9",
	"iso-8859-10",
	"iso-8859-11",
	"iso-8859-13",
	"iso-8859-14",
	"iso-8859-15",
	"iso-8859-16",
	"cp819",
	"cp866",
	"cp1250",
	"cp1251",
	"cp1252",
	"cp1253",
	"cp1254",
	"cp1255",
	"cp1256",
	"cp1257",
	"cp1258",
	"windows-874",
	"windows-949",
	"windows-1250",
	"windows-1251",
	"windows-1252",
	"windows-1253",
	"windows-1254",
	"windows-1255",
	"windows-1256",
	"windows-1257",
	"windows-1258",
	// CF maps MacRoman CFStringEncoding (0) to error (0), maybe erroneously?
	"macintosh"
};

CFStringEncoding getEncoding(const char * encoding) {
	CFStringRef s = CFStringCreateWithCString(NULL, encoding, kCFStringEncodingUTF8);
	CFStringEncoding id = CFStringConvertIANACharSetNameToEncoding(s);
	CFRelease(s);
	return id;
}

int main() {
	for (int i = 0; i < sizeof(encodings) / sizeof(char *); i++) {
		const char * encoding = encodings[i];
		CFStringEncoding se = getEncoding(encoding);
		printf("%s: 0x%x\n", encoding, se);
		char filename[1024];
		sprintf(filename, "%s.plist", encoding);
		FILE * fp = fopen(filename, "w");
		fprintf(fp, "<?xml version=\"1.0\" encoding=\"%s\"?>\n", encoding);
		fprintf(fp, "%s\n", DOCTYPE);
		fprintf(fp, "<plist version=\"1.0\">\n");
		fprintf(fp, "\t<dict>\n");
		for (int i = 0; i < 256; i++) {
			unsigned char byte[1] = {i};
			CFStringRef str = CFStringCreateWithBytes(NULL, byte, 1, se, false);
			if (!str) {
				continue;
			}
			fprintf(fp, "\t\t<key>%i", i);
			for (CFIndex i = 0, l = CFStringGetLength(str); i < l; i++) {
				UniChar c = CFStringGetCharacterAtIndex(str, i);
				fprintf(fp, " %i", c);
			}
			fprintf(fp, "</key>\n");
			fprintf(fp, "\t\t<string>");
			switch (i) {
				case '<': fprintf(fp, "&lt;"); break;
				case '>': fprintf(fp, "&gt;"); break;
				case '&': fprintf(fp, "&amp;"); break;
				default: fwrite(byte, 1, 1, fp);
			}
			fprintf(fp, "</string>\n");
			CFRelease(str);
		}
		fprintf(fp, "\t</dict>\n");
		fprintf(fp, "</plist>\n");
		fclose(fp);
	}
	return 0;
}
