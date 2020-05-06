import { ApolloError } from "apollo-server-express";

export class PublicPetitionNotAvailableError extends ApolloError {
  readonly name = "PublicPetitionNotAvailable";
  constructor(message: string) {
    super(message, "PUBLIC_PETITION_NOT_AVAILABLE");
  }
}
