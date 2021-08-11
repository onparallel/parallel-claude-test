import { GraphQLFormattedError } from "graphql";
import { outdent } from "outdent";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toContainGraphQLError(expectedErrorCode?: string, expectedExtension?: any): R;
    }
  }
}

expect.extend({
  toContainGraphQLError(
    errors: GraphQLFormattedError[] | undefined,
    expectedErrorCode?: string,
    expectedExtra?: any
  ) {
    const options = {
      isNot: this.isNot,
      promise: this.promise,
    };
    if (errors) {
      const errorCode = errors[0]?.extensions?.code;
      return {
        message: () => outdent`
          ${this.utils.matcherHint(`.toContainGraphQLError`, errorCode, expectedErrorCode, options)}
        `,
        pass: expectedErrorCode
          ? errorCode === expectedErrorCode &&
            (expectedExtra
              ? JSON.stringify({ ...(errors[0].extensions ?? {}), ...expectedExtra }) ===
                JSON.stringify(errors[0].extensions ?? {})
              : true)
          : true,
      };
    } else {
      return {
        message: () => outdent`
          ${this.utils.matcherHint(`.toContainGraphQLError`, undefined, undefined, options)}
          
          Expected GraphQL response to have errors.
        `,
        pass: false,
      };
    }
  },
});
