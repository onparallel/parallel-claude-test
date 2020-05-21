import { Box, Icon, Text, useToast } from "@chakra-ui/core";
import { RecipientSelect_ContactFragment } from "@parallel/graphql/__types";
import { useCreateContact } from "@parallel/utils/useCreateContact";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import { gql } from "apollo-boost";
import { memo, ReactNode, useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { components, OptionProps } from "react-select";
import AsyncCreatableSelect, { Props } from "react-select/async-creatable";
import { pick } from "remeda";
import { useReactSelectStyle } from "../../utils/useReactSelectStyle";

export type Recipient = RecipientSelect_ContactFragment;

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
  const [isCreating, setIsCreating] = useState(false);
  const reactSelectProps = useReactSelectProps();
  const createContact = useCreateContact();
  const toast = useToast();

  const loadOptions = useCallback(
    async (search) => {
      const exclude = [];
      for (const recipient of value) {
        exclude.push(recipient.id);
      }
      return await searchContacts(search, exclude);
    },
    [searchContacts, value]
  );

  async function handleCreate(email: string) {
    setIsCreating(true);
    try {
      const contact = await createContact({ defaultEmail: email });
      onChange([...value, pick(contact, ["id", "email", "fullName"])]);
    } catch (error) {
      if (error?.graphQLErrors?.[0]?.message === "EXISTING_CONTACT") {
        toast({
          title: intl.formatMessage({
            id: "component.recipient-select.existing-contact.title",
            defaultMessage: "Existing contact",
          }),
          description: intl.formatMessage({
            id: "component.recipient-select.existing-contact.description",
            defaultMessage: "This contact already exists.",
          }),
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
    setIsCreating(false);
  }

  return (
    <AsyncCreatableSelect<Recipient>
      placeholder={intl.formatMessage({
        id: "component.recipient-select.placeholder",
        defaultMessage: "Enter recipients...",
      })}
      value={value}
      isDisabled={isCreating}
      onChange={(value) => onChange((value as any) ?? [])}
      onCreateOption={handleCreate}
      isMulti
      loadOptions={loadOptions}
      {...reactSelectProps}
      {...props}
    />
  );
}

RecipientSelect.fragments = {
  Contact: gql`
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
                        id="component.recipient-select.no-options"
                        defaultMessage="We could not find any exisiting contacts for <em>{search}</em>"
                        values={{
                          search,
                          em: (...chunks: any[]) => <em>{chunks}</em>,
                        }}
                      />
                    </Text>
                    <Text as="div" marginTop={2}>
                      <FormattedMessage
                        id="component.recipient-select.enter-email"
                        defaultMessage="You can also enter a valid email."
                      />
                    </Text>
                  </>
                ) : (
                  <Text as="div" marginTop={2}>
                    <FormattedMessage
                      id="component.recipient-select.search-hint"
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
          Option: ({
            children,
            data,
            ...props
          }: Omit<OptionProps<Recipient>, "data"> & { data: Recipient }) => {
            if ((data as any).__isNew__) {
              return (
                <components.Option data={data} {...props}>
                  {children} {/* from formatCreateLabel */}
                </components.Option>
              );
            } else {
              return (
                <components.Option data={data} {...props}>
                  {data.fullName ? (
                    <Text as="span" verticalAlign="baseline">
                      <Text as="span">{data.fullName}</Text>
                      <Text as="span" display="inline-block" width={2}></Text>
                      <Text as="span" fontSize="sm" color="gray.500">
                        {data.email}
                      </Text>
                    </Text>
                  ) : (
                    <Text as="span">{data.email}</Text>
                  )}
                </components.Option>
              );
            }
          },
        },
        getOptionLabel: (option) => {
          if ((option as any).__isNew__) {
            return (option as any).label;
          } else {
            return option.email;
          }
        },
        getOptionValue: (option) => option.id,
        isValidNewOption: (value: string) => {
          return EMAIL_REGEX.test(value);
        },
        formatCreateLabel: (label: string) => {
          return (
            <FormattedMessage
              id="component.recipient-select.create-new-contact"
              defaultMessage="Create new contact for: <b>{email}</b>"
              values={{
                email: label,
                b: (...chunks: any[]) => (
                  <Text as="strong" style={{ marginLeft: "4px" }}>
                    {chunks}
                  </Text>
                ),
              }}
            ></FormattedMessage>
          );
        },
      } as Partial<Props<Recipient>>),
    [styleProps]
  );
}
