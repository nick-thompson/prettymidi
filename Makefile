
all: test min

min:
	./node_modules/uglify-js/bin/uglifyjs -o prettymidi.min.js prettymidi.js --comments

test:
	./node_modules/mocha/bin/mocha --reporter spec

.PHONY: min test all
