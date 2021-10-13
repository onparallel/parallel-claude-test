import { gql } from "@apollo/client";
import { Box, Text, Tooltip } from "@chakra-ui/react";
import { AlertCircleFilledIcon, UserPlusIcon } from "@parallel/chakra/icons";
import { ContactSelect_ContactFragment } from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import {
  ExtendComponentProps,
  useReactSelectProps,
  UseReactSelectProps,
} from "@parallel/utils/react-select/hooks";
import { CustomAsyncCreatableSelectProps } from "@parallel/utils/react-select/types";
import { useExistingContactToast } from "@parallel/utils/useExistingContactToast";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import useMergedRef from "@react-hook/merged-ref";
import { ClipboardEvent, forwardRef, KeyboardEvent, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { CommonProps, components, InputActionMeta, InputProps } from "react-select";
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
  onCreateContact: (data: { defaultEmail?: string }) => Promise<ContactSelectSelection>;
  onSearchContacts: (search: string, exclude: string[]) => Promise<ContactSelectSelection[]>;
  onPasteEmails?: (emails: string[]) => void;
}

export type ContactSelectInstance = AsyncCreatableSelect<ContactSelectSelection, true>;

export const ContactSelect = Object.assign(
  forwardRef<ContactSelectInstance, ContactSelectProps>(function (
    { value, onSearchContacts, onCreateContact, onPasteEmails, onChange, ...props },
    ref
  ) {
    const errorToast = useExistingContactToast();

    const [isCreating, setIsCreating] = useState(false);

    const [options, setOptions] = useState<ContactSelectSelection[]>();

    const rsProps = useContactSelectReactSelectProps({
      ...props,
      isDisabled: props.isDisabled || isCreating,
    });
    const innerRef = useRef<any>();
    const _ref = useMergedRef(ref, innerRef);

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
          pick(contact, ["id", "email", "fullName", "hasBouncedEmail"]),
        ]);
        setIsCreating(false);
        return true;
      } catch (e) {
        if (isApolloError(e) && e.graphQLErrors[0]?.extensions?.code === "EXISTING_CONTACT") {
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
        ref={_ref}
        value={value}
        isMulti
        onChange={onChange as any}
        inputValue={inputValue}
        onKeyDown={handleKeyDown}
        onInputChange={handleInputChange}
        onCreateOption={handleCreate}
        loadOptions={loadOptions}
        defaultOptions={options}
        {...{ onPasteEmails }}
        {...rsProps}
      />
    );
  }),
  {
    fragments: {
      Contact: gql`
        fragment ContactSelect_Contact on Contact {
          id
          firstName # firstName and lastName are needed for converting from Contact to PetitionSigner in some dialogs
          lastName
          fullName
          email
          hasBouncedEmail
        }
      `,
    },
  }
);

function useContactSelectReactSelectProps(
  props: UseReactSelectProps
): AsyncCreatableSelectProps<ContactSelectSelection, true, never> {
  const rsProps = useReactSelectProps<ContactSelectSelection, true, never>(props);

  const components = useMemo(
    () => ({
      ...rsProps.components,
      NoOptionsMessage,
      MultiValueLabel,
      Option,
      Input,
    }),
    [rsProps.components]
  );

  return {
    ...rsProps,
    getOptionLabel,
    getOptionValue,
    isValidNewOption,
    formatCreateLabel,
    components,
  };
}

export type ContactSelectComponentPropExtensions = {
  onPasteEmails?: (emails: string[]) => void;
};

export type ContactSelectComponentProps<T = CommonProps<any, any, any>> = ExtendComponentProps<
  T,
  ContactSelectComponentPropExtensions
>;

const getOptionLabel = (option: ContactSelectSelection) => {
  if ((option as any).__isNew__) {
    return (option as any).label;
  } else {
    return option.email;
  }
};

const getOptionValue = (option: ContactSelectSelection) => option.id;

const isValidNewOption = (value: string, _: any, options: readonly ContactSelectSelection[]) => {
  return options.length === 0 && EMAIL_REGEX.test(value);
};

const formatCreateLabel = (label: string) => {
  return (
    <Text as="span">
      <FormattedMessage
        id="component.contact-select.create-new-contact"
        defaultMessage="Create new contact for: <b>{email}</b>"
        values={{ email: label }}
      />
    </Text>
  );
};

const NoOptionsMessage: typeof components.NoOptionsMessage = function NoOptionsMessage(props) {
  const search = props.selectProps.inputValue;
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
                em: (chunks: any) => <em>{chunks}</em>,
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
};

const MultiValueLabel: typeof components.MultiValueLabel = function MultiValueLabel({
  children,
  ...props
}) {
  const { fullName, email, isDeleted, hasBouncedEmail } =
    props.data as unknown as ContactSelectSelection;
  const intl = useIntl();
  return (
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
      {hasBouncedEmail ? (
        <Tooltip
          label={intl.formatMessage({
            id: "component.contact-select.bounced-email-tooltip",
            defaultMessage: "Previously bounced email",
          })}
        >
          <AlertCircleFilledIcon boxSize={4} color="yellow.500" marginLeft={2} />
        </Tooltip>
      ) : null}
    </components.MultiValueLabel>
  );
};

const Option: typeof components.Option = function Option({ children, ...props }) {
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
        {contact.hasBouncedEmail ? (
          <AlertCircleFilledIcon boxSize={4} color="yellow.500" marginLeft={2} />
        ) : null}
      </components.Option>
    );
  }
};

const Input: typeof components.Input = function Input(props) {
  const {
    selectProps: { onPasteEmails },
  } = props as ContactSelectComponentProps<InputProps>;
  return (
    <components.Input
      {...props}
      {...{
        onPaste:
          onPasteEmails &&
          ((e: ClipboardEvent<HTMLInputElement>) => {
            if (e.clipboardData.types.includes("text/plain")) {
              const text = e.clipboardData.getData("text/plain");
              const emails = text.split(/\s+/g).filter((part) => part.match(EMAIL_REGEX));
              if (emails.length > 1) {
                e.preventDefault();
                onPasteEmails(emails);
              }
            }
          }),
      }}
    />
  );
};
