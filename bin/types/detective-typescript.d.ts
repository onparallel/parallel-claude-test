declare module "detective-typescript" {
  export default function detective(
    source: string,
    options: {
      skipTypeImports?: boolean;
      mixedImports?: boolean;
      skipAsyncImports?: boolean;
      jsx?: boolean;
    },
  );
}
