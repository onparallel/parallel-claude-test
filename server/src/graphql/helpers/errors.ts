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
    message: string
  ) {
    super(
      `Validation error on argument "${argName}" for "${parentType}.${fieldName}": ${message}`,
      "ARG_VALIDATION_ERROR",
      {
        parentType,
        fieldName,
        argName,
        message,
      }
    );
  }
}
