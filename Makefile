install:
	npm install

run:
	npx babel-node 'src/bin/page-loader.js'

publish:
	npm publish

lint:
	npx eslint .

test:
	npm test

.PHONY: test