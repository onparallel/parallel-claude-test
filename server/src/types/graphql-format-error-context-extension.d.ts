declare module "graphql-format-error-context-extension" {
  export class FormatErrorWithContextExtension<TContext> {
    constructor(
      formatError: (
        error: import("graphql").GraphQLError,
        context: TContext
      ) => import("graphql").GraphQLFormattedError
    );
  }
}
