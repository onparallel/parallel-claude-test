import { gql } from "@apollo/client";
import {
  Box,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Text,
} from "@chakra-ui/core";
import { UserPlusIcon } from "@parallel/chakra/icons";
import { ContactSelect_ContactFragment } from "@parallel/graphql/__types";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import { useId } from "@reach/auto-id";
import {
  forwardRef,
  memo,
  ReactNode,
  Ref,
  useCallback,
  useMemo,
  useState,
} from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  components,
  InputActionMeta,
  OptionProps,
  OptionsType,
} from "react-select";
import AsyncCreatableSelect, {
  Props as AsyncCreatableSelectProps,
} from "react-select/async-creatable";
import { pick } from "remeda";
import {
  useReactSelectStyle,
  UserReactSelectStyleProps,
} from "../../utils/useReactSelectStyle";
import { useExistingContactToast } from "@parallel/utils/useExistingContactToast";

export type ContactSelectSelection = ContactSelect_ContactFragment & {
  unknown?: boolean;
};

export type ContactSelectProps = Pick<
  AsyncCreatableSelectProps<ContactSelectSelection>,
  "inputId"
> & {
  value: ContactSelectSelection[];
  isInvalid?: boolean;
  onChange: (recipients: ContactSelectSelection[]) => void;
  onCreateContact: (data: {
    defaultEmail?: string;
  }) => Promise<ContactSelectSelection>;
  onSearchContacts: (
    search: string,
    exclude: string[]
  ) => Promise<ContactSelectSelection[]>;
};

export const ContactSelect = Object.assign(
  forwardRef(function (
    {
      value,
      isInvalid,
      onSearchContacts,
      onCreateContact,
      onChange,
      ...props
    }: ContactSelectProps,
    ref: Ref<AsyncCreatableSelect<ContactSelectSelection>>
  ) {
    const intl = useIntl();
    const errorToast = useExistingContactToast();

    const [isCreating, setIsCreating] = useState(false);

    const [options, setOptions] = useState<ContactSelectSelection[]>([]);

    const loadOptions = useCallback(
      async (search) => {
        const exclude = [];
        for (const recipient of value) {
          if (!recipient.unknown) {
            exclude.push(recipient.id);
          }
        }
        const options = await onSearchContacts(search, exclude);
        setOptions(options);
        return options;
      },
      [onSearchContacts, setOptions, value, options]
    );

    const handleCreate = useCallback(
      async (email: string) => {
        setIsCreating(true);
        try {
          const contact = await onCreateContact({ defaultEmail: email });
          onChange([
            ...value.filter((v) => v.id !== email),
            pick(contact, ["id", "email", "fullName"]),
          ]);
        } catch (error) {
          if (
            error?.graphQLErrors?.[0]?.extensions.code === "EXISTING_CONTACT"
          ) {
            errorToast();
          }
        }
        setIsCreating(false);
      },
      [value, onCreateContact, onChange]
    );
    const inputId = `contact-select-${useId()}`;
    const reactSelectProps = useReactSelectProps({ isInvalid }, handleCreate);

    const [previousValue, setPreviousValue] = useState("");
    const handleInputChange = useCallback(
      (newValue: string, meta: InputActionMeta) => {
        if (
          previousValue.trim() !== "" &&
          ["input-blur", "menu-close"].includes(meta.action)
        ) {
          const option = options.find((o) => o.email === previousValue) || {
            id: previousValue,
            email: previousValue,
            fullName: "",
            unknown: true,
          };

          onChange([...value, option]);
        }
        setPreviousValue(newValue);
      },
      [value, previousValue]
    );

    const unknownRecipients = useMemo(() => value.filter((v) => v.unknown), [
      value,
    ]);

    return (
      <FormControl id={inputId} isInvalid={isInvalid}>
        <FormLabel paddingBottom={0}>
          <FormattedMessage
            id="component.contact-select.label"
            defaultMessage="Recipients"
          />
        </FormLabel>
        <AsyncCreatableSelect<ContactSelectSelection>
          inputId={inputId}
          placeholder={intl.formatMessage({
            id: "component.contact-select.placeholder",
            defaultMessage: "Enter recipients...",
          })}
          ref={ref}
          value={value}
          isDisabled={isCreating}
          onChange={(value) => onChange((value as any) ?? [])}
          onInputChange={handleInputChange}
          onCreateOption={handleCreate}
          isMulti
          loadOptions={loadOptions}
          {...reactSelectProps}
          {...props}
        />

        <FormErrorMessage>
          {unknownRecipients.length === 0 ? (
            <FormattedMessage
              id="component.contact-select.required-error"
              defaultMessage="Please specify at least one recipient"
            />
          ) : (
            <FormattedMessage
              id="petition.message-settings.unknown-recipients"
              defaultMessage="We couldn't find {count, plural, =1 { {email}} other {some of the emails}} in your contacts list."
              values={{
                count: unknownRecipients.length,
                email: unknownRecipients[0].email,
              }}
            />
          )}
        </FormErrorMessage>
      </FormControl>
    );
  }),
  {
    fragments: {
      Contact: gql`
        fragment ContactSelect_Contact on Contact {
          id
          fullName
          email
        }
      `,
    },
  }
);

function useReactSelectProps(
  props: UserReactSelectStyleProps,
  handleCreateContact: (email: string) => Promise<void>
) {
  const styleProps = useReactSelectStyle<ContactSelectSelection>(props);
  return useMemo(
    () =>
      ({
        ...styleProps,
        components: {
          ...styleProps.components,
          NoOptionsMessage: memo(({ selectProps }) => {
            const search = selectProps.inputValue;
            return (
              <Box textAlign="center" color="gray.400" padding={4}>
                <UserPlusIcon boxSize="30px" />
                {search ? (
                  <>
                    <Text as="div" marginTop={2}>
                      <FormattedMessage
                        id="component.contact-select.no-options"
                        defaultMessage="We could not find any exisiting contacts for <em>{search}</em>"
                        values={{
                          search,
                          em: (chunks: any[]) => <em>{chunks}</em>,
                        }}
                      />
                    </Text>
                    <Text as="div" marginTop={2}>
                      <FormattedMessage
                        id="component.contact-select.enter-email"
                        defaultMessage="You can also enter a valid email."
                      />
                    </Text>
                  </>
                ) : (
                  <Text as="div" marginTop={2}>
                    <FormattedMessage
                      id="component.contact-select.search-hint"
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
              data: ContactSelectSelection;
              children: ReactNode;
            }) => {
              const { fullName, email, unknown } = data;
              return (
                <Box
                  onClick={() => {
                    if (unknown) handleCreateContact(data.email);
                  }}
                  style={{ cursor: unknown ? "pointer" : "default" }}
                >
                  <components.MultiValueLabel {...props}>
                    <Text as="span" marginLeft={1}>
                      {fullName ? `${fullName} <${email}>` : email}
                    </Text>
                  </components.MultiValueLabel>
                </Box>
              );
            }
          ),
          Option: ({
            children,
            data,
            ...props
          }: Omit<OptionProps<ContactSelectSelection>, "data"> & {
            data: ContactSelectSelection;
          }) => {
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
                      <Text as="span" display="inline-block" width={2} />
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
        isValidNewOption: (
          value: string,
          _,
          options: OptionsType<ContactSelectSelection>
        ) => {
          return options.length === 0 && EMAIL_REGEX.test(value);
        },
        formatCreateLabel: (label: string) => {
          return (
            <FormattedMessage
              id="component.contact-select.create-new-contact"
              defaultMessage="Create new contact for: <b>{email}</b>"
              values={{
                email: label,
                b: (chunks: any[]) => (
                  <Text as="strong" style={{ marginLeft: "4px" }}>
                    {chunks}
                  </Text>
                ),
              }}
            />
          );
        },
      } as Partial<AsyncCreatableSelectProps<ContactSelectSelection>>),
    [styleProps, handleCreateContact]
  );
}
