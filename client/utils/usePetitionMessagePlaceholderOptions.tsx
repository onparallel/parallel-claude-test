import { gql } from "@apollo/client";
import { usePetitionMessagePlaceholderOptions_PetitionBaseFragment } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import { useFieldsWithIndices } from "./fieldIndices";
import { isFileTypeField } from "./isFileTypeField";
import { PlaceholderOption, createPlaceholderPlugin } from "./slate/PlaceholderPlugin";

export function usePetitionMessagePlaceholderOptions({
  petition,
}: {
  petition: usePetitionMessagePlaceholderOptions_PetitionBaseFragment;
}): PlaceholderOption[] {
  const intl = useIntl();
  const fieldsWithIndices = useFieldsWithIndices(petition.fields);
  return useMemo(() => {
    return [
      ...[
        {
          text: intl.formatMessage({
            id: "util.use-petition-message-placeholder-options.contact-first-name",
            defaultMessage: "Recipient first name",
          }),
          key: "contact-first-name",
        },
        {
          text: intl.formatMessage({
            id: "util.use-petition-message-placeholder-options.contact-last-name",
            defaultMessage: "Recipient last name",
          }),
          key: "contact-last-name",
        },
        {
          text: intl.formatMessage({
            id: "util.use-petition-message-placeholder-options.contact-full-name",
            defaultMessage: "Recipient full name",
          }),
          key: "contact-full-name",
        },
        {
          text: intl.formatMessage({
            id: "util.use-petition-message-placeholder-options.contact-email",
            defaultMessage: "Recipient email",
          }),
          key: "contact-email",
        },
        {
          text: intl.formatMessage({
            id: "util.use-petition-message-placeholder-options.user-first-name",
            defaultMessage: "My first name",
          }),
          key: "user-first-name",
        },
        {
          text: intl.formatMessage({
            id: "util.use-petition-message-placeholder-options.user-last-name",
            defaultMessage: "My last name",
          }),
          key: "user-last-name",
        },
        {
          text: intl.formatMessage({
            id: "util.use-petition-message-placeholder-options.user-full-name",
            defaultMessage: "My full name",
          }),
          key: "user-full-name",
        },
        {
          text: intl.formatMessage({
            id: "util.use-petition-message-placeholder-options.parallel-title",
            defaultMessage: "Parallel title",
          }),
          key: "petition-title",
        },
      ].map((item) => ({
        ...item,
        data: {
          group: intl.formatMessage({
            id: "util.use-petition-message-placeholder-options.group-contact-information",
            defaultMessage: "Contact Information",
          }),
        },
      })),
      ...fieldsWithIndices
        .filter(
          ([field]) =>
            field.isInternal &&
            !field.isReadOnly &&
            !isFileTypeField(field.type) &&
            field.type !== "FIELD_GROUP", // don't include FIELD_GROUP nor any of its children
        )
        .map(([field, fieldIndex]) => ({
          key: field.id,
          text:
            field.title ??
            intl.formatMessage({ id: "generic.untitled-field", defaultMessage: "Untitled field" }),
          data: {
            petition,
            field,
            index: fieldIndex,
            group: intl.formatMessage({
              id: "util.use-petition-message-placeholder-options.group-references",
              defaultMessage: "References",
            }),
          },
        })),
    ];
  }, [intl.locale]);
}

usePetitionMessagePlaceholderOptions.fragments = {
  PetitionBase: gql`
    fragment usePetitionMessagePlaceholderOptions_PetitionBase on PetitionBase {
      ...createPlaceholderPlugin_PetitionBase
      fields {
        type
        isInternal
        isReadOnly
      }
    }
    ${createPlaceholderPlugin.fragments.PetitionBase}
  `,
};
