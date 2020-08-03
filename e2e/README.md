# Parallel

## Run

In order to run the tests, first make sure that:

- you have installed all required dependencies.
- you have the client and server running on an accessible URL.

Then just run `yarn test:e2e`.

## Environment variables

`PLAYWRIGHT_HEADLESS=true` will run tests on browsers with headless mode. Defaults to false.
`PARALLEL_CLIENT_HOST=<HOST>` URL for the Parallel client. Defaults to localhost.  
`PARALLEL_CLIENT_PORT=<PORT>` PORT of the Parallel client. Defaults to 80
