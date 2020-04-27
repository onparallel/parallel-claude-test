export function run(main: () => Promise<void>) {
  main()
    .then()
    .catch((error) => {
      console.log(error);
      process.exit(1);
    });
}
