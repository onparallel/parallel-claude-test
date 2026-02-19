/// <reference types="vitest/globals" />
import { GraphQLFormattedError } from "graphql";
import * as matchers from "jest-extended";
import { outdent } from "outdent";
import { isDeepEqual } from "remeda";

interface GraphQLMatchers<R = unknown> {
  toContainGraphQLError(expectedErrorCode?: string, expectedExtension?: any): R;
}

declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Assertion<T = any> extends CustomMatchers<T>, GraphQLMatchers<T> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends CustomMatchers<any>, GraphQLMatchers {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ExpectStatic extends CustomMatchers<any>, GraphQLMatchers {}
}

expect.extend(matchers);
expect.extend({
  toContainGraphQLError(
    errors: GraphQLFormattedError[] | undefined,
    expectedErrorCode?: string,
    expectedExtra?: any,
  ) {
    const options = {
      isNot: this.isNot,
      promise: this.promise,
    };
    if (errors) {
      const errorCode = errors[0]?.extensions?.code as string;
      return {
        message: () => outdent`
          ${this.utils.matcherHint(`.toContainGraphQLError`, errorCode, expectedErrorCode, options)}
        `,
        pass: expectedErrorCode
          ? errorCode === expectedErrorCode &&
            (expectedExtra
              ? isDeepEqual(
                  { ...(errors[0].extensions ?? {}), ...expectedExtra },
                  errors[0].extensions ?? {},
                )
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
