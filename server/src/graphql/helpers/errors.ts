import { GraphQLError, GraphQLResolveInfo } from "graphql";
import {} from "@apollo/server/errors";

export class ApolloError extends GraphQLError {
  override readonly name: string = "ApolloError";
  constructor(message: string, code?: string, extensions?: Record<string, any>) {
    super(message, { extensions: { code, ...extensions } });

    if (extensions?.extensions) {
      throw Error(
        "Pass extensions directly as the third argument of the ApolloError constructor: `new " +
          "ApolloError(message, code, {myExt: value})`, not `new ApolloError(message, code, " +
          "{extensions: {myExt: value}})`",
      );
    }
  }
}

export class ForbiddenError extends ApolloError {
  override readonly name = "ForbiddenError";
  constructor(message: string, extensions?: Record<string, any>) {
    super(message, "FORBIDDEN", extensions);
  }
}

export class AuthenticationError extends ApolloError {
  override readonly name = "AuthenticationError";
  constructor(message: string, extensions?: Record<string, any>) {
    super(message, "UNAUTHENTICATED", extensions);
  }
}

export class UnknownError extends ApolloError {
  override readonly name = "UnknownError";
  constructor(message: string, extensions?: Record<string, any>) {
    super(message, "UNKNOWN_ERROR", extensions);
  }
}

export class ArgValidationError extends ApolloError {
  override readonly name = "ArgValidationError";
  constructor(
    { parentType, fieldName }: GraphQLResolveInfo,
    argName: string,
    message: string,
    extra?: any,
  ) {
    super(
      `Validation error on argument "${argName}" for "${parentType}.${fieldName}": ${message}`,
      "ARG_VALIDATION_ERROR",
      {
        parentType,
        fieldName,
        argName,
        message,
        extra,
      },
    );
  }
}

export class ValidatorOrConditionError extends ApolloError {
  override readonly name = "ValidatorOrConditionError";
  constructor({ parentType, fieldName }: GraphQLResolveInfo, message: string, extra?: any) {
    super(
      `Validator error on OR condition for ${parentType}.${fieldName}: ${message}`,
      "VALIDATOR_CONDITION_ERROR",
      {
        extra,
      },
    );
  }
}

export class InvalidReplyError extends ApolloError {
  override readonly name = "InvalidReplyError";
  constructor(
    { parentType, fieldName }: GraphQLResolveInfo,
    argName: string,
    message: string,
    extra?: any,
  ) {
    super(message, "INVALID_REPLY_ERROR", {
      parentType,
      fieldName,
      argName,
      message,
      extra,
    });
  }
}

export class MaxFileSizeExceededError extends ApolloError {
  override readonly name = "MaxFileSizeExceededError";
  constructor(
    { parentType, fieldName }: GraphQLResolveInfo,
    argName: string,
    message: string,
    extra?: any,
  ) {
    super(message, "MAX_FILE_SIZE_EXCEEDED_ERROR", {
      parentType,
      fieldName,
      argName,
      message,
      extra,
    });
  }
}
