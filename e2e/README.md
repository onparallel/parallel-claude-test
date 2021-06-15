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
