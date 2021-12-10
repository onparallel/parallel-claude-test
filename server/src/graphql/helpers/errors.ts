import { ApolloError } from "apollo-server-express";
import { GraphQLResolveInfo } from "graphql";

export class PublicPetitionNotAvailableError extends ApolloError {
  readonly name = "PublicPetitionNotAvailableError";
  constructor(message: string) {
    super(message, "PUBLIC_PETITION_NOT_AVAILABLE");
  }
}

export class UnknownError extends ApolloError {
  readonly name = "UnknownError";
  constructor(message: string) {
    super(message, "UNKNOWN_ERROR");
  }
}

export class ArgValidationError extends ApolloError {
  readonly name = "ArgValidationError";
  constructor(
    { parentType, fieldName }: GraphQLResolveInfo,
    argName: string,
    message: string,
    extra?: any
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
      }
    );
  }
}

export class WhitelistedError extends ApolloError {
  readonly name = "WhitelistedError";

  constructor(message: string, code: string, extensions?: Record<string, any>) {
    super(message, code, extensions);
  }
}

export class ValidatorOrConditionError extends ApolloError {
  readonly name = "ValidatorOrConditionError";
  constructor({ parentType, fieldName }: GraphQLResolveInfo, message: string, extra?: any) {
    super(
      `Validator error on OR condition for ${parentType}.${fieldName}: ${message}`,
      "VALIDATOR_CONDITION_ERROR",
      {
        extra,
      }
    );
  }
}

export class ExcelParsingError extends Error {
  constructor(message: string, public readonly row: number, public readonly column: number) {
    super(message);
  }
}

export class InvalidOptionError extends ApolloError {
  readonly name = "InvalidOptionError";
  constructor(
    { parentType, fieldName }: GraphQLResolveInfo,
    argName: string,
    message: string,
    extra?: any
  ) {
    super(message, "INVALID_OPTION_ERROR", {
      parentType,
      fieldName,
      argName,
      message,
      extra,
    });
  }
}
