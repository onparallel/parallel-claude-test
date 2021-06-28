# e2e testing

Run tests with the following command

```
ENV=xxx BROWSER=xxx yarn test
```

`ENV` can be one of the following:

- `local`: The app must be running locally on your machine.
- `staging`

`BROWSER` is a comma separated list of browser names to run the tests on

- `chrome`
- `firefox`
- `webkit`

Examples:

```
# Run tests locally using chrome
ENV=local BROWSER=chrome yarn test

# Run tests on staging on all browsers
ENV=staging BROWSER=chrome,firefox,webkit yarn test
```

By default, the tests on `local` and `staging` will open your browser and show every action performed.

If you want to run the tests on headless mode, pass `HEADLESS_BROWSER` to the test command.
Example:

```
# Run tests locally on all browsers on headless mode
ENV=local BROWSER=chrome,firefox,webkit HEADLESS_BROWSER=true yarn test
```
