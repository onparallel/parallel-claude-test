import { gql } from "@apollo/client";
import { Box, Text } from "@chakra-ui/react";
import { UserPlusIcon } from "@parallel/chakra/icons";
import { ContactSelect_ContactFragment } from "@parallel/graphql/__types";
import {
  useReactSelectProps,
  UseReactSelectProps,
} from "@parallel/utils/react-select/hooks";
import { CustomAsyncCreatableSelectProps } from "@parallel/utils/react-select/types";
import { useExistingContactToast } from "@parallel/utils/useExistingContactToast";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import useMergedRef from "@react-hook/merged-ref";
import deepmerge from "deepmerge";
import {
  forwardRef,
  KeyboardEvent,
  memo,
  ReactNode,
  useMemo,
  useRef,
  useState,
} from "react";
import { FormattedMessage } from "react-intl";
import { components, InputActionMeta } from "react-select";
import AsyncCreatableSelect, {
  Props as AsyncCreatableSelectProps,
} from "react-select/async-creatable";
import { pick } from "remeda";
import { DeletedContact } from "./DeletedContact";

export type ContactSelectSelection = ContactSelect_ContactFragment & {
  isInvalid?: boolean;
  isDeleted?: boolean;
};

export interface ContactSelectProps
  extends UseReactSelectProps,
    CustomAsyncCreatableSelectProps<ContactSelectSelection, true> {
  placeholder?: string;
  onCreateContact: (data: {
    defaultEmail?: string;
  }) => Promise<ContactSelectSelection>;
  onSearchContacts: (
    search: string,
    exclude: string[]
  ) => Promise<ContactSelectSelection[]>;
}

export const ContactSelect = Object.assign(
  forwardRef<
    AsyncCreatableSelect<ContactSelectSelection, true>,
    ContactSelectProps
  >(function (
    { value, onSearchContacts, onCreateContact, onChange, ...props },
    ref
  ) {
    const errorToast = useExistingContactToast();

    const [isCreating, setIsCreating] = useState(false);

    const [options, setOptions] = useState<ContactSelectSelection[]>();

    const reactSelectProps = useContactSelectReactSelectProps(
      { ...props, isDisabled: props.isDisabled || isCreating },
      handleCreate
    );
    const innerRef = useRef<any>();

    const [inputValue, setInputValue] = useState("");

    async function loadOptions(search: string) {
      if (!search) {
        setOptions(undefined);
        return [];
      }
      const exclude: string[] = [];
      for (const recipient of value ?? []) {
        if (!recipient.isInvalid) {
          exclude.push(recipient.id);
        }
      }
      const options = await onSearchContacts(search.trim(), exclude);
      setOptions(options);
      return options;
    }

    async function handleCreate(email: string) {
      setIsCreating(true);
      try {
        const contact = await onCreateContact({ defaultEmail: email });
        onChange([
          ...(value ?? []).filter((v) => v.id !== email),
          pick(contact, ["id", "email", "fullName"]),
        ]);
        setIsCreating(false);
        return true;
      } catch (error) {
        if (error?.graphQLErrors?.[0]?.extensions.code === "EXISTING_CONTACT") {
          errorToast();
        }
      }
      setIsCreating(false);
      return false;
    }

    async function handleInputChange(_value: string, meta: InputActionMeta) {
      switch (meta.action) {
        case "input-change":
          if (_value === "") {
            setInputValue("");
            setOptions(undefined);
          } else {
            setInputValue(_value);
          }
          break;
        case "set-value":
          setInputValue("");
          setOptions(undefined);
          break;
        case "input-blur":
          const cleaned = inputValue.trim();
          if (EMAIL_REGEX.test(cleaned)) {
            const option = options?.find((o) => o.email === cleaned);
            if (option) {
              onChange([...(value ?? []), option]);
              setInputValue("");
              setOptions(undefined);
            } else {
              if (await handleCreate(cleaned)) {
                setInputValue("");
                setOptions(undefined);
              }
            }
          }
          break;
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      const select = innerRef.current!.select.select.select;
      if (!select) {
        return;
      }
      switch (event.key) {
        case ",":
        case ";":
        case " ":
          const { focusedOption } = select.state;
          if (focusedOption && inputValue === focusedOption.email) {
            event.preventDefault();
            select.selectOption(focusedOption);
          }
      }
    }

    return (
      <AsyncCreatableSelect<ContactSelectSelection, true, never>
        ref={useMergedRef(ref, innerRef)}
        value={value}
        isMulti
        onChange={onChange as any}
        inputValue={inputValue}
        onKeyDown={handleKeyDown}
        onInputChange={handleInputChange}
        onCreateOption={handleCreate}
        loadOptions={loadOptions}
        defaultOptions={options}
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
  props: UseReactSelectProps,
  handleCreateContact: (email: string) => any
) {
  const reactSelectProps = useReactSelectProps<ContactSelectSelection, true>(
    props
  );
  return useMemo(
    () =>
      deepmerge<AsyncCreatableSelectProps<ContactSelectSelection, true, never>>(
        reactSelectProps,
        {
          components: {
            NoOptionsMessage: memo(({ selectProps }) => {
              const search = selectProps.inputValue;
              return (
                <Box textAlign="center" color="gray.400" padding={4}>
                  <UserPlusIcon boxSize={8} />
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
                const { fullName, email, isDeleted } = data;
                return (
                  <components.MultiValueLabel {...(props as any)}>
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
                );
              }
            ),
            Option: ({ children, ...props }) => {
              if ((props.data as any).__isNew__) {
                return (
                  <components.Option {...props}>
                    {children} {/* from formatCreateLabel */}
                  </components.Option>
                );
              } else {
                const contact = props.data as ContactSelectSelection;
                return (
                  <components.Option {...props}>
                    {contact.fullName ? (
                      <Text as="span" verticalAlign="baseline">
                        <Text as="span">{contact.fullName}</Text>
                        <Text as="span" display="inline-block" width={2} />
                        <Text as="span" fontSize="sm" color="gray.500">
                          {contact.email}
                        </Text>
                      </Text>
                    ) : (
                      <Text as="span">{contact.email}</Text>
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
          isValidNewOption: (value, _, options) => {
            return options.length === 0 && EMAIL_REGEX.test(value);
          },
          formatCreateLabel: (label) => {
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
        }
      ),
    [reactSelectProps, handleCreateContact]
  );
}
