import AsyncCreatableSelect, { Props } from "react-select/async-creatable";
import { useReactSelectStyle } from "../../utils/useReactSelectStyle";
import { components } from "react-select";
import { Text, Box, Icon } from "@chakra-ui/core";
import { useMemo, memo, useCallback, useState, ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import { gql } from "apollo-boost";
import { RecipientSelect_ContactFragment } from "@parallel/graphql/__types";

export type Recipient =
  | RecipientSelect_ContactFragment
  | {
      value: string;
      __isNew__: true;
    };

type RecipientSelectProps = Pick<Props<Recipient>, "inputId"> & {
  value: Recipient[];
  onChange: (recipients: Recipient[]) => void;
  searchContacts: (search: string, exclude: string[]) => Promise<Recipient[]>;
};

export function RecipientSelect({
  value,
  searchContacts,
  onChange,
  ...props
}: RecipientSelectProps) {
  const intl = useIntl();
  const reactSelectProps = useReactSelectProps();
  const loadOptions = useCallback(
    async (search) => {
      const exclude = [];
      for (const recipient of value) {
        if (!("__isNew__" in recipient)) {
          exclude.push(recipient.id);
        }
      }
      return await searchContacts(search, exclude);
    },
    [searchContacts, value]
  );

  return (
    <AsyncCreatableSelect<Recipient>
      placeholder={intl.formatMessage({
        id: "components.recipient-select.placeholder",
        defaultMessage: "Enter recipients...",
      })}
      onChange={(value) => onChange((value as any) ?? [])}
      isMulti
      loadOptions={loadOptions}
      {...reactSelectProps}
      {...props}
    />
  );
}

RecipientSelect.fragments = {
  contact: gql`
    fragment RecipientSelect_Contact on Contact {
      id
      fullName
      email
    }
  `,
};

function useReactSelectProps() {
  const styleProps = useReactSelectStyle<Recipient>({ size: "md" });
  return useMemo(
    () =>
      ({
        styles: {
          ...styleProps.styles,
          multiValueLabel: (styles) => ({
            ...styles,
            display: "inline-flex",
            alignItems: "center",
          }),
        },
        components: {
          ...styleProps.components,
          NoOptionsMessage: memo(({ selectProps }) => {
            const search = selectProps.inputValue;
            return (
              <Box textAlign="center" color="gray.400" padding={4}>
                <Icon
                  name={"user-plus" as any}
                  role="presentation"
                  focusable={false}
                  size="30px"
                />
                {search ? (
                  <>
                    <Text as="div" marginTop={2}>
                      <FormattedMessage
                        id="components.recipient-select.no-options"
                        defaultMessage="We could not find any exisiting contacts for <em>{search}</em>"
                        values={{
                          search,
                          em: (...chunks: any[]) => <em>{chunks}</em>,
                        }}
                      />
                    </Text>
                    <Text as="div" marginTop={2}>
                      <FormattedMessage
                        id="components.recipient-select.enter-email"
                        defaultMessage="You can also enter a valid email."
                      />
                    </Text>
                  </>
                ) : (
                  <Text as="div" marginTop={2}>
                    <FormattedMessage
                      id="components.recipient-select.search-hint"
                      defaultMessage="Search for exisiting contacts or enter a valid email."
                    />
                  </Text>
                )}
              </Box>
            );
          }),
          MultiValueLabel: memo(
            ({
              data,
              children,
              ...props
            }: {
              data: Recipient;
              children: ReactNode;
            }) => {
              const intl = useIntl();
              if ("__isNew__" in data) {
                return (
                  <components.MultiValueLabel {...props}>
                    <Icon
                      name={"user-plus" as any}
                      aria-label={intl.formatMessage({
                        id: "components.recipient-select.new-contact",
                        defaultMessage: "New contact",
                      })}
                    />
                    <Text as="span" marginLeft={2}>
                      {children}
                    </Text>
                  </components.MultiValueLabel>
                );
              }
              const { fullName, email } = data;
              return (
                <components.MultiValueLabel {...props}>
                  <Text as="span" marginLeft={1}>
                    {fullName ? `${fullName} <${email}>` : email}
                  </Text>
                </components.MultiValueLabel>
              );
            }
          ),
        },
        getOptionLabel: (option) => {
          if ("__isNew__" in option) {
            return (option as any).label;
          } else {
            return option.email;
          }
        },
        getOptionValue: (option) => {
          if ("__isNew__" in option) {
            return option.value;
          } else {
            return option.email;
          }
        },
        isValidNewOption: (value: string) => {
          return EMAIL_REGEX.test(value);
        },
        formatCreateLabel: (label: string) => {
          return (
            <FormattedMessage
              id="component.recipient-select.create-new-contact"
              defaultMessage="Create new contact for: <em>{email}</em>"
              values={{
                email: label,
                em: (...chunks: any[]) => (
                  <em style={{ marginLeft: "4px" }}>{chunks}</em>
                ),
              }}
            ></FormattedMessage>
          );
        },
      } as Partial<Props<Recipient>>),
    [styleProps]
  );
}
