#!/usr/bin/env bash
set -o errexit
set -o nounset
set -o pipefail

HEADER='<?xml version="1.0" encoding="UTF-8"?>'
DOCTYPE='<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">'
PLIST_OPEN='<plist version="1.0">'
PLIST_CLOSE='</plist>'
ARRAY_OPEN='<array>'
ARRAY_CLOSE='</array>'

printf > 'string-entity-dec.plist' '%s\n' \
	"${HEADER}" \
	"${DOCTYPE}" \
	"${PLIST_OPEN}" \
	"${ARRAY_OPEN}"
printf > 'string-entity-hex.plist' '%s\n' \
	"${HEADER}" \
	"${DOCTYPE}" \
	"${PLIST_OPEN}" \
	"${ARRAY_OPEN}"

for i in {0..65535}; do
	printf > 'string-entity.plist' '%s\n%s\n%s\n%s%i%s\n%s\n' \
		"${HEADER}" \
		"${DOCTYPE}" \
		"${PLIST_OPEN}" \
		'<string>&#' "${i}" ';</string>' \
		"${PLIST_CLOSE}"
	code=0
	../../util/bin/plshow 'string-entity.plist' 2>/dev/null || code="$?"
	if [[ "${code}" == 0 ]]; then
		echo "+ ${i}"
		printf >> 'string-entity-dec.plist' '\t%s%i%s\n' \
			'<string>&#' "${i}" ';</string>'
		printf >> 'string-entity-hex.plist' '\t%s%X%s\n' \
			'<string>&#x' "${i}" ';</string>'
	else
		echo "- ${i}"
	fi
done

printf >> 'string-entity-dec.plist' '%s\n' \
	"${ARRAY_CLOSE}" \
	"${PLIST_CLOSE}"
printf >> 'string-entity-hex.plist' '%s\n' \
	"${ARRAY_CLOSE}" \
	"${PLIST_CLOSE}"

rm 'string-entity.plist'
