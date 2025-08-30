#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>

int main() {
	FILE * fp = fopen("iso-8859-1.txt", "w");
	for (int a = 0; a < 256; a++) {
		unsigned char byte = a;
		CFStringRef str = CFStringCreateWithBytes(NULL, &byte, 1, kCFStringEncodingISOLatin1, false);
		fprintf(fp, "%0.02X =", a);
		if (str) {
			for (CFIndex i = 0, l = CFStringGetLength(str); i < l; i++) {
				fprintf(fp, " %d", CFStringGetCharacterAtIndex(str, i));
			}
		}
		fprintf(fp, "\n");
	}
	fclose(fp);
	return 0;
}
