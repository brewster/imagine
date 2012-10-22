test:
	npm test

lint:
	find server.js lib -name "*.js" -print0 | xargs -0 \
		jslint --stupid --indent 2 --nomen --vars --maxlen 80

.PHONY: test
