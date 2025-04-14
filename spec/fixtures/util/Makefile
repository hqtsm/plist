all: bin/plshow

bin:
	mkdir -p bin

bin/plshow: bin
	clang -Wall -framework Foundation -o $@ src/plshow.c

clean:
	rm -rf bin
