# Playwright E2E Test Suite

## Firsts steps:
If this is the **first time** you are executing the e2e tests, you will need to perform a full DB restart, so IDs defined in tests and seed file matches with the IDs in your local database.

**YOU ONLY NEED TO DO THIS ONCE!!**
1) Delete your postgres docker folder:
    - ``rm -rf ~/docker/volumes/parallel/postgres/``
2) execute the migrations and seed file:
    - ``yarn workspace @parallel/server migrate``
    - ``yarn workspace @parallel/server seed``


Now, make sure you have installed playwright:

``yarn workspace @parallel/e2e playwright install``


## Run the tests:

To run the suite, execute ``yarn test`` on e2e folder.

This will run all test suites in headless mode with 4 concurrent workers and in 3 browsers: Chromium, Safari and Firefox.

You can pass additional arguments to override this:

```yarn test [<spec_name>] [--workers <worker_num>] [--project <project_name>] [--headed]```
```
<spec_name>: Optional. Name of the spec to run. Doesn't need to be full file name.
<worker_num> Optional. Number of tests to run concurrently. Default: 4
<project_name> Optional. Name of the browser to run tests. Runs in Chromium,Firefox and Safari by default.
```

Visit [playwright CLI documentation](https://playwright.dev/docs/test-cli) for the full list of arguments.

For running the tests on your local machine, make sure you have client and server processes running:

- ``yarn workspace @parallel/server dev``
- ``yarn workspace @parallel/client dev``

The test suite will work with client process in development mode, but it will run much faster when compiled and ran in production mode:

- ``yarn workspace @parallel/client build``
- ``yarn workspace @parallel/client start``

> If any of the tests execute any server worker (e.g.: sending emails, starting signatures) make sure to run those workers as well and add parallele2euser1@gmail.com to the EMAILS_WHITELIST in your local .development.env file.

