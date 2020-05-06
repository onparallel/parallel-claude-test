import { ApolloError } from "apollo-server-express";

export class PublicPetitionNotAvailableError extends ApolloError {
  readonly name = "PublicPetitionNotAvailableError";
  constructor(message: string) {
    super(message, "PUBLIC_PETITION_NOT_AVAILABLE");
  }
}

export class UnknownError extends ApolloError {
  readonly name = "UnknownError";
  constructor(message: string) {
    super(message, "PUBLIC_PETITION_NOT_AVAILABLE");
  }
}
