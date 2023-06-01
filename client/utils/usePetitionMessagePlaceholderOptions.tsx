import { gql } from "@apollo/client";
import { usePetitionMessagePlaceholderOptions_PetitionBaseFragment } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import { zip } from "remeda";
import { useFieldIndices } from "./fieldIndices";
import { isFileTypeField } from "./isFileTypeField";
import { PlaceholderOption, createPlaceholderPlugin } from "./slate/PlaceholderPlugin";

export function usePetitionMessagePlaceholderOptions({
  petition,
}: {
  petition: usePetitionMessagePlaceholderOptions_PetitionBaseFragment;
}): PlaceholderOption[] {
  const intl = useIntl();
  const indices = useFieldIndices(petition.fields);
  return useMemo(() => {
    return [
      ...[
        {
          text: intl.formatMessage({
            id: "petition-message.placeholder-option.contact-first-name",
            defaultMessage: "Recipient first name",
          }),
          key: "contact-first-name",
        },
        {
          text: intl.formatMessage({
            id: "petition-message.placeholder-option.contact-last-name",
            defaultMessage: "Recipient last name",
          }),
          key: "contact-last-name",
        },
        {
          text: intl.formatMessage({
            id: "petition-message.placeholder-option.contact-full-name",
            defaultMessage: "Recipient full name",
          }),
          key: "contact-full-name",
        },
        {
          text: intl.formatMessage({
            id: "petition-message.placeholder-option.contact-email",
            defaultMessage: "Recipient email",
          }),
          key: "contact-email",
        },
        {
          text: intl.formatMessage({
            id: "petition-message.placeholder-option.user-first-name",
            defaultMessage: "My first name",
          }),
          key: "user-first-name",
        },
        {
          text: intl.formatMessage({
            id: "petition-message.placeholder-option.user-last-name",
            defaultMessage: "My last name",
          }),
          key: "user-last-name",
        },
        {
          text: intl.formatMessage({
            id: "petition-message.placeholder-option.user-full-name",
            defaultMessage: "My full name",
          }),
          key: "user-full-name",
        },
        {
          text: intl.formatMessage({
            id: "petition-message.placeholder-option.parallel-title",
            defaultMessage: "Parallel title",
          }),
          key: "petition-title",
        },
      ].map((item) => ({
        ...item,
        data: {
          group: intl.formatMessage({
            id: "petition-message.placeholder-option.contact-information",
            defaultMessage: "Contact Information",
          }),
        },
      })),
      ...zip(petition.fields, indices)
        .filter(([field]) => field.isInternal && !isFileTypeField(field.type))
        .map(([field, index]) => ({
          key: field.id,
          text:
            field.title ??
            intl.formatMessage({ id: "generic.untitled-field", defaultMessage: "Untitled field" }),
          data: {
            petition,
            field,
            index,
            group: intl.formatMessage({
              id: "petition-message.placeholder-option.references",
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
      }
    }
    ${createPlaceholderPlugin.fragments.PetitionBase}
  `,
};
