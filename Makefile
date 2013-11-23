MOCHA_OPTS= --check-leaks
REPORTER = dot

check: test

test: test-unit test-acceptance

test-unit:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		$(MOCHA_OPTS)

test-acceptance:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--bail \
		test/acceptance/*.js

test-cov: lib-cov
	@EXPRESS_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html

lib-cov:
	@jscoverage lib lib-cov

benchmark:
	@./support/bench

clean:
	rm -f coverage.html
	rm -fr lib-cov

test-orders:
	@NODE_ENV=test NODE_PATH=lib ./node_modules/.bin/mocha test/routes/unit/orders \
		--reporter $(REPORTER) \
		$(MOCHA_OPTS)

.PHONY: test test-unit test-acceptance benchmark clean
