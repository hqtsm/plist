#include <stdio.h>
#include <CoreFoundation/CoreFoundation.h>
#include "../../inc/shared.c"

typedef struct name_node {
	const char * name;
	struct name_node * next;
} name_node;

typedef struct group_node {
	CFStringEncoding encoding;
	char * name;
	name_node * names;
	struct group_node * next;
} group_node;

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
	"iso-8859-12",
	"iso-8859-13",
	"iso-8859-14",
	"iso-8859-15",
	"iso-8859-16",
	// "windows-37",
	"windows-437",
	"windows-737",
	"windows-775",
	"windows-850",
	"windows-851",
	"windows-852",
	"windows-855",
	"windows-857",
	"windows-860",
	"windows-861",
	"windows-862",
	"windows-863",
	"windows-864",
	"windows-865",
	"windows-866",
	"windows-869",
	"windows-874",
	"windows-932",
	"windows-936",
	"windows-949",
	"windows-950",
	"windows-1250",
	"windows-1251",
	"windows-1252",
	"windows-1253",
	"windows-1254",
	"windows-1255",
	"windows-1256",
	"windows-1257",
	"windows-1258",
	"windows-1361",
	// "cp37",
	"cp367",
	"cp437",
	"cp737",
	"cp775",
	"cp819",
	"cp850",
	"cp851",
	"cp852",
	"cp855",
	"cp857",
	"cp860",
	"cp861",
	"cp862",
	"cp863",
	"cp864",
	"cp865",
	"cp866",
	"cp869",
	"cp874",
	"cp878",
	"cp912",
	"cp913",
	"cp914",
	"cp915",
	"cp920",
	"cp921",
	"cp923",
	"cp932",
	"cp936",
	"cp949",
	"cp950",
	"cp970",
	"cp1089",
	"cp1250",
	"cp1251",
	"cp1252",
	"cp1253",
	"cp1254",
	"cp1255",
	"cp1256",
	"cp1257",
	"cp1258",
	"cp1361",
	// "cp1383",
	"ms874",
	"ms932",
	"ms936",
	"ms949",
	"ms950",
	"ms9500",
	"ms9501",
	"ms9502",
	"ms9503",
	"ms9504",
	"ms9505",
	"ms9506",
	"ms9507",
	"ms9508",
	"ms9509",
	// CF maps MacRoman CFStringEncoding (0) to error (0), maybe erroneously?
	"macintosh"
};

CFStringEncoding getEncoding(const char * encoding) {
	CFStringRef s = CFStringCreateWithCString(NULL, encoding, kCFStringEncodingUTF8);
	CFStringEncoding id = CFStringConvertIANACharSetNameToEncoding(s);
	CFRelease(s);
	return id;
}

char * getName(CFStringEncoding encoding) {
	CFStringRef cfName = CFStringConvertEncodingToIANACharSetName(encoding);
	if (!cfName) {
		return NULL;
	}
	CFIndex length = CFStringGetLength(cfName);
	CFIndex maxSize = CFStringGetMaximumSizeForEncoding(length, kCFStringEncodingUTF8) + 1;
	char *buffer = (char *)malloc(maxSize);
	if (!buffer) {
		return NULL;
	}
	Boolean success = CFStringGetCString(cfName, buffer, maxSize, kCFStringEncodingUTF8);
	if (!success) {
		free(buffer);
		return NULL;
	}
	return buffer;
}

void putStr(FILE * fp, unsigned char * str, size_t len) {
	for (int i = 0; i < len; i++) {
		switch (str[i]) {
			case '<': fprintf(fp, "&lt;"); break;
			case '>': fprintf(fp, "&gt;"); break;
			case '&': fprintf(fp, "&amp;"); break;
			default: fwrite(&str[i], 1, 1, fp);
		}
	}
}

int main() {
	CFStringRef str;
	unsigned char byte[1];
	unsigned char bytes[2];

	group_node * groups = NULL;
	for (int i = sizeof(encodings) / sizeof(char *); i--;) {
		const char * encoding = encodings[i];
		CFStringEncoding se = getEncoding(encoding);
		char * name = getName(se);

		group_node * group = groups;
		while (group && group->next && group->encoding != se) {
			group = group->next;
		}
		if (!group || group->encoding != se) {
			group_node * g = malloc(sizeof(group_node));
			g->encoding = se;
			g->name = name;
			g->names = NULL;
			g->next = NULL;
			if (group) {
				group->next = g;
			}
			if (!groups) {
				groups = g;
			}
			group = g;
		}

		name_node * n = malloc(sizeof(name_node));
		n->name = encoding;
		n->next = group->names;
		group->names = n;
	}

	for (group_node * g = groups; g; g = g->next) {
		char filename[1024];
		char * c = &filename[sprintf(filename, "%s", g->name)];
		for (name_node * n = g->names; n; n = n->next) {
			c += sprintf(c, "_%s", n->name);
		}
		sprintf(c, ".plist");
		printf("0x%X\t%s\n", g->encoding, filename);

		FILE * fp = fopen(filename, "w");
		fprintf(fp, "<?xml version=\"1.0\" encoding=\"%s\"?>\n", g->name);
		fprintf(fp, "%s\n", DOCTYPE);
		fprintf(fp, "<plist version=\"1.0\">\n");
		fprintf(fp, "\t<dict>\n");
		for (int a = 0; a < 256; a++) {
			for (int b = -1; b < 256; b++) {
				if (b < 0) {
					byte[0] = a;
					str = CFStringCreateWithBytes(NULL, byte, 1, g->encoding, false);
				} else {
					bytes[0] = a;
					bytes[1] = b;
					str = CFStringCreateWithBytes(NULL, bytes, 2, g->encoding, false);
				}
				if (str) {
					if (b < 0) {
						fprintf(fp, "\t\t<key>%0.02X =", a);
					} else {
						fprintf(fp, "\t\t<key>%0.02X %0.02X =", a, b);
					}
					for (CFIndex i = 0, l = CFStringGetLength(str); i < l; i++) {
						UniChar c = CFStringGetCharacterAtIndex(str, i);
						fprintf(fp, " %d", c);
					}
					fprintf(fp, "</key>\n");
					fprintf(fp, "\t\t<string>");
					if (b < 0) {
						putStr(fp, byte, 1);
					} else {
						putStr(fp, bytes, 2);
					}
					fprintf(fp, "</string>\n");
					CFRelease(str);
					if (b < 0) {
						break;
					}
				}
			}
		}
		fprintf(fp, "\t</dict>\n");
		fprintf(fp, "</plist>\n");
		fclose(fp);
	}
	return 0;
}
