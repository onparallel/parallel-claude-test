import { gql } from "@apollo/client";
import { Box, Text, Tooltip } from "@chakra-ui/core";
import { UserPlusIcon } from "@parallel/chakra/icons";
import { ContactSelect_ContactFragment } from "@parallel/graphql/__types";
import { useExistingContactToast } from "@parallel/utils/useExistingContactToast";
import {
  useReactSelectProps,
  UserReactSelectProps,
} from "@parallel/utils/useReactSelectProps";
import { EMAIL_REGEX } from "@parallel/utils/validation";
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
import { DeletedContact } from "./DeletedContact";

export type ContactSelectSelection = ContactSelect_ContactFragment & {
  isInvalid?: boolean;
  isDeleted?: boolean;
};

export type ContactSelectProps = Omit<
  AsyncCreatableSelectProps<ContactSelectSelection>,
  "value" | "onChange"
> & {
  placeholder?: string;
  value: ContactSelectSelection[];
  onChange: (recipients: ContactSelectSelection[]) => void;
  onCreateContact: (data: {
    defaultEmail?: string;
  }) => Promise<ContactSelectSelection>;
  onSearchContacts: (
    search: string,
    exclude: string[]
  ) => Promise<ContactSelectSelection[]>;
} & UserReactSelectProps;

export const ContactSelect = Object.assign(
  forwardRef(function (
    {
      value,
      onSearchContacts,
      onCreateContact,
      onChange,
      ...props
    }: ContactSelectProps,
    ref: Ref<AsyncCreatableSelect<ContactSelectSelection>>
  ) {
    const errorToast = useExistingContactToast();

    const [isCreating, setIsCreating] = useState(false);

    const [options, setOptions] = useState<ContactSelectSelection[]>([]);

    const loadOptions = useCallback(
      async (search) => {
        const exclude: string[] = [];
        for (const recipient of value) {
          if (!recipient.isInvalid) {
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
    const reactSelectProps = useContactSelectReactSelectProps(
      { ...props, isDisabled: props.isDisabled || isCreating },
      handleCreate
    );

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
            isInvalid: true,
          };

          onChange([...value, option]);
        }
        setPreviousValue(newValue);
      },
      [value, previousValue]
    );

    return (
      <AsyncCreatableSelect<ContactSelectSelection>
        ref={ref}
        value={value}
        isMulti
        onChange={(value) => onChange((value as any) ?? [])}
        onInputChange={handleInputChange}
        onCreateOption={handleCreate}
        loadOptions={loadOptions}
        {...props}
        {...reactSelectProps}
      />
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

function useContactSelectReactSelectProps(
  props: UserReactSelectProps,
  handleCreateContact: (email: string) => Promise<void>
) {
  const reactSelectProps = useReactSelectProps<ContactSelectSelection>(props);
  return useMemo(
    () =>
      ({
        ...reactSelectProps,
        components: {
          ...reactSelectProps.components,
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
                        defaultMessage="We could not find any existing contacts for <em>{search}</em>"
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
                      defaultMessage="Search for existing contacts or enter a valid email."
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
              const { fullName, email, isInvalid, isDeleted } = data;
              const intl = useIntl();
              return (
                <Tooltip
                  label={intl.formatMessage({
                    id: "component.contact-select.click-to-create",
                    defaultMessage: "Click to create contact",
                  })}
                >
                  <Box
                    onClick={() => {
                      if (isInvalid) handleCreateContact(data.email);
                    }}
                    style={{ cursor: isInvalid ? "pointer" : "default" }}
                  >
                    <components.MultiValueLabel {...props}>
                      <Text as="span" marginLeft={1}>
                        {isDeleted ? (
                          <DeletedContact color="red.600" />
                        ) : fullName ? (
                          `${fullName} <${email}>`
                        ) : (
                          email
                        )}
                      </Text>
                    </components.MultiValueLabel>
                  </Box>
                </Tooltip>
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
    [reactSelectProps, handleCreateContact]
  );
}
