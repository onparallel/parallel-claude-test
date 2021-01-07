import { gql } from "@apollo/client";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  RecipientViewPetitionFieldCard,
  RecipientViewPetitionFieldCardProps,
} from "./RecipientViewPetitionFieldCard";
import { RecipientViewPetitionFieldFileUpload } from "./RecipientViewPetitionFieldFileUpload";
import { RecipientViewPetitionFieldHeading } from "./RecipientViewPetitionFieldHeading";
import { RecipientViewPetitionFieldSelect } from "./RecipientViewPetitionFieldSelect";
import { RecipientViewPetitionFieldText } from "./RecipientViewPetitionFieldText";

export interface RecipientViewPetitionFieldProps
  extends Omit<
    RecipientViewPetitionFieldCardProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  petitionId: string;
  isDisabled: boolean;
}

export const RecipientViewPetitionField = Object.assign(
  chakraForwardRef<"header" | "section", RecipientViewPetitionFieldProps>(
    function RecipientViewPetitionField(props, ref) {
      return props.field.type === "HEADING" ? (
        <RecipientViewPetitionFieldHeading
          ref={ref as any}
          field={props.field}
        />
      ) : props.field.type === "TEXT" ? (
        <RecipientViewPetitionFieldText ref={ref as any} {...props} />
      ) : props.field.type === "SELECT" ? (
        <RecipientViewPetitionFieldSelect ref={ref as any} {...props} />
      ) : props.field.type === "FILE_UPLOAD" ? (
        <RecipientViewPetitionFieldFileUpload ref={ref as any} {...props} />
      ) : null;
    }
  ),
  {
    fragments: {
      PublicPetitionAccess: gql`
        fragment RecipientViewPetitionField_PublicPetitionAccess on PublicPetitionAccess {
          ...RecipientViewPetitionFieldCard_PublicPetitionAccess
        }
        ${RecipientViewPetitionFieldCard.fragments.PublicPetitionAccess}
      `,
      PublicPetitionField: gql`
        fragment RecipientViewPetitionField_PublicPetitionField on PublicPetitionField {
          ...RecipientViewPetitionFieldCard_PublicPetitionField
        }
        ${RecipientViewPetitionFieldCard.fragments.PublicPetitionField}
      `,
    },
  }
);
