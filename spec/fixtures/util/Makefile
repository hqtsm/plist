all: \
	bin/plshow \
	bin/plxml \
	bin/plformat

bin:
	mkdir -p bin

bin/plshow: bin
	clang -Wall -framework Foundation -o $@ src/plshow.c

bin/plxml: bin
	clang -Wall -framework Foundation -o $@ src/plxml.c

bin/plformat: bin
	clang -Wall -framework Foundation -o $@ src/plformat.c

clean:
	rm -rf bin
