import { gql } from "@apollo/client";
import { Card } from "@parallel/components/common/Card";
import {
  RecipientViewPetitionFieldCard_PetitionFieldFragment,
  RecipientViewPetitionFieldCard_PublicPetitionFieldFragment,
} from "@parallel/graphql/__types";
import { ReactNode } from "react";

export type RecipientViewPetitionFieldCard_PetitionFieldSelection =
  | RecipientViewPetitionFieldCard_PublicPetitionFieldFragment
  | RecipientViewPetitionFieldCard_PetitionFieldFragment;

export interface RecipientViewPetitionFieldCardProps {
  field: RecipientViewPetitionFieldCard_PetitionFieldSelection;
  isInvalid: boolean;
  children: ReactNode;
}

export function RecipientViewPetitionFieldCard({
  field,
  isInvalid,
  children,
}: RecipientViewPetitionFieldCardProps) {
  return (
    <Card
      id={`field-${field.id}`}
      data-testid="recipient-view-field"
      data-field-type={field.type}
      padding={4}
      overflow="hidden"
      {...(isInvalid
        ? {
            border: "2px solid",
            borderColor: "red.500",
          }
        : {})}
    >
      {children}
    </Card>
  );
}

RecipientViewPetitionFieldCard.fragments = {
  get PetitionField() {
    return gql`
      fragment RecipientViewPetitionFieldCard_PetitionField on PetitionField {
        id
        type
      }
    `;
  },
  get PublicPetitionField() {
    return gql`
      fragment RecipientViewPetitionFieldCard_PublicPetitionField on PublicPetitionField {
        id
        type
      }
    `;
  },
};
