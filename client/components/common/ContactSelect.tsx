import { gql } from "@apollo/client";
import { Box } from "@chakra-ui/react";
import { Tooltip } from "@parallel/chakra/components";
import { AlertCircleFilledIcon, UserPlusIcon } from "@parallel/chakra/icons";
import { ContactSelect_ContactFragment } from "@parallel/graphql/__types";
import { UseReactSelectProps, useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { CustomAsyncCreatableSelectProps } from "@parallel/utils/react-select/types";
import { Maybe, MaybePromise, unMaybeArray } from "@parallel/utils/types";
import { isValidEmail } from "@parallel/utils/validation";
import { useMergeRefs } from "@parallel/utils/useMergeRefs";
import { ClipboardEvent, KeyboardEvent, RefAttributes, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  InputActionMeta,
  InputProps,
  MultiValueProps,
  NoticeProps,
  OptionProps,
  SelectInstance,
  SingleValueProps,
  components,
} from "react-select";
import AsyncCreatableSelect, { AsyncCreatableProps } from "react-select/async-creatable";
import { isNonNullish, isNullish, pick, range, zip } from "remeda";
import { DeletedContact } from "./DeletedContact";
import { useErrorDialog } from "./dialogs/ErrorDialog";
import { Text } from "@parallel/components/ui";

export type ContactSelectSelection = ContactSelect_ContactFragment & {
  isInvalid?: boolean;
  isDeleted?: boolean;
};

export interface ContactSelectProps<IsMulti extends boolean = false>
  extends CustomAsyncCreatableSelectProps<ContactSelectSelection, IsMulti, never> {
  onCreateContact: (data: {
    email?: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<Maybe<ContactSelectSelection>>;
  onSearchContacts: (search: string, exclude: string[]) => Promise<ContactSelectSelection[]>;
  onPasteEmails?: (emails: string[][]) => MaybePromise<void>;
  onFocus?: () => void;
}

export type ContactSelectInstance<IsMulti extends boolean = false> = SelectInstance<
  ContactSelectSelection,
  IsMulti,
  never
>;

export function ContactSelect<IsMulti extends boolean = false>({
  ref,
  value,
  isMulti,
  onSearchContacts,
  onCreateContact,
  onPasteEmails,
  onChange,
  onFocus,
  ...props
}: ContactSelectProps<IsMulti> & RefAttributes<ContactSelectInstance<IsMulti>>) {
  const [isCreating, _setIsCreating] = useState(false);
  // we need this because the create handler is called twice when clicking on the create menu option,
  // one because of the click and another one from the input blur
  const isCreatingRef = useRef(false);
  function setIsCreating(value: boolean) {
    _setIsCreating(value);
    isCreatingRef.current = value;
  }

  const [options, setOptions] = useState<ContactSelectSelection[]>();

  const rsProps = useContactSelectReactSelectProps<IsMulti>({
    ...props,
    isDisabled: props.isDisabled || isCreating,
  });
  const innerRef = useRef<any>(undefined);
  const _ref = useMergeRefs(ref, innerRef);

  const [inputValue, setInputValue] = useState("");

  async function loadOptions(search: string) {
    if (!search) {
      setOptions(undefined);
      return [];
    }

    const exclude: string[] = [];
    if (isNonNullish(value)) {
      for (const recipient of unMaybeArray(value)) {
        if (!recipient.isInvalid) {
          exclude.push(recipient.id);
        }
      }
    }
    const options = await onSearchContacts(search.trim(), exclude);
    setOptions(options);
    return options;
  }

  async function handleCreate(email: string) {
    if (isCreatingRef.current) {
      return;
    }
    setIsCreating(true);
    try {
      const contact = await onCreateContact({ email });
      if (isNullish(contact)) {
        setIsCreating(false);
        return;
      }
      const option = pick(contact, [
        "id",
        "email",
        "firstName",
        "lastName",
        "fullName",
        "hasBouncedEmail",
      ]) as ContactSelectSelection;
      if (isMulti) {
        onChange(
          [
            ...((value ?? []) as ContactSelectSelection[]).filter((v) => v.email !== email),
            option,
          ] as any,
          { action: "select-option", option },
        );
      } else {
        onChange(option as any, { action: "select-option", option });
      }
      setIsCreating(false);
      setTimeout(() => innerRef.current?.focus(), 1);
      return true;
    } catch {}
    setIsCreating(false);
    setTimeout(() => innerRef.current?.focus(), 1);
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
        if (isValidEmail(cleaned)) {
          const option = options?.find((o) => o.email === cleaned);
          if (option) {
            onChange([...((value ?? []) as ContactSelectSelection[]), option] as any, {
              action: "select-option",
              option,
            });
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
    const select = innerRef.current!;
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
    <AsyncCreatableSelect<ContactSelectSelection, IsMulti, never>
      ref={_ref}
      isMulti={isMulti}
      onChange={onChange as any}
      onFocus={onFocus}
      value={value}
      inputValue={inputValue}
      onKeyDown={handleKeyDown}
      onInputChange={handleInputChange}
      onCreateOption={handleCreate}
      loadOptions={loadOptions}
      defaultOptions={options}
      {...{ onPasteEmails }}
      {...props}
      {...rsProps}
    />
  );
}

const _fragments = {
  // firstName and lastName are needed for converting from Contact to PetitionSigner in some dialogs
  Contact: gql`
    fragment ContactSelect_Contact on Contact {
      id
      firstName
      lastName
      fullName
      email
      hasBouncedEmail
    }
  `,
};

function useContactSelectReactSelectProps<IsMulti extends boolean>(
  props: UseReactSelectProps<ContactSelectSelection, IsMulti, never>,
): AsyncCreatableProps<ContactSelectSelection, IsMulti, never> {
  const rsProps = useReactSelectProps<ContactSelectSelection, IsMulti, never>(props);

  return {
    ...rsProps,
    getOptionLabel,
    getOptionValue,
    isValidNewOption,
    formatCreateLabel,
    components: {
      ...rsProps.components,
      NoOptionsMessage,
      MultiValueLabel,
      SingleValue,
      Option,
      Input,
    } as any,
  };
}

const getOptionLabel = (option: ContactSelectSelection) => {
  if ((option as any).__isNew__) {
    return (option as any).label;
  } else {
    return option.email;
  }
};

const getOptionValue = (option: ContactSelectSelection) => option.id;

const isValidNewOption = (value: string, _: any, options: readonly ContactSelectSelection[]) => {
  return options.length === 0 && isValidEmail(value);
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

function NoOptionsMessage(props: NoticeProps) {
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
}

function MultiValueLabel({ children, ...props }: MultiValueProps<ContactSelectSelection>) {
  const { fullName, email, isDeleted, hasBouncedEmail } = props.data;
  const intl = useIntl();
  const showHasBounced = !isDeleted && hasBouncedEmail;
  return (
    <>
      <components.MultiValueLabel {...props}>
        <Text as="span" marginStart={1}>
          {isDeleted ? <DeletedContact color="red.600" /> : `${fullName} <${email}>`}
        </Text>
      </components.MultiValueLabel>
      {showHasBounced ? (
        <Tooltip
          label={intl.formatMessage({
            id: "component.contact-select.bounced-email-tooltip",
            defaultMessage: "Previously bounced email",
          })}
        >
          <AlertCircleFilledIcon boxSize={4} color="yellow.500" marginX={0.5} alignSelf="center" />
        </Tooltip>
      ) : null}
    </>
  );
}

function SingleValue(props: SingleValueProps<ContactSelectSelection>) {
  const { fullName, email, isDeleted, hasBouncedEmail } = props.data;
  const intl = useIntl();
  return (
    <components.SingleValue {...props}>
      <Text as="span" marginStart={1}>
        {isDeleted ? <DeletedContact color="red.600" /> : `${fullName} <${email}>`}
      </Text>
      {hasBouncedEmail ? (
        <Tooltip
          label={intl.formatMessage({
            id: "component.contact-select.bounced-email-tooltip",
            defaultMessage: "Previously bounced email",
          })}
        >
          <AlertCircleFilledIcon boxSize={4} color="yellow.500" marginStart={2} />
        </Tooltip>
      ) : null}
    </components.SingleValue>
  );
}

function Option({ children, ...props }: OptionProps<ContactSelectSelection>) {
  if ((props.data as any).__isNew__) {
    return (
      <components.Option
        {...props}
        innerProps={{ ...props.innerProps, "data-testid": "create-contact-option" } as any}
      >
        {children} {/* from formatCreateLabel */}
      </components.Option>
    );
  } else {
    const contact = props.data;
    return (
      <components.Option
        {...props}
        innerProps={{ ...props.innerProps, "data-email": contact.email } as any}
      >
        <Text as="span" verticalAlign="baseline">
          <Text as="span">{contact.fullName}</Text>
          <Text as="span" display="inline-block" width={2} />
          <Text as="span" fontSize="sm" color="gray.500">
            {contact.email}
          </Text>
        </Text>

        {contact.hasBouncedEmail ? (
          <AlertCircleFilledIcon boxSize={4} color="yellow.500" marginStart={2} />
        ) : null}
      </components.Option>
    );
  }
}

function Input(
  props: InputProps & {
    selectProps: {
      onPasteEmails?: (emails: string[][]) => MaybePromise<void>;
    };
  },
) {
  const showErrorDialog = useErrorDialog();
  const intl = useIntl();
  return (
    <components.Input
      {...props}
      {...{
        onPaste:
          props.selectProps.onPasteEmails &&
          (async (e: ClipboardEvent<HTMLInputElement>) => {
            if (e.clipboardData.types.includes("text/plain")) {
              const text = e.clipboardData.getData("text/plain");
              const lines = text
                .trim()
                .split(/\n/g)
                .map((line) => line.trim());
              if (lines.length === 1) {
                const emails = text
                  .split(/(?:\s*[;,]\s*|\s+)/g)
                  .filter((part) => isValidEmail(part));
                if (emails.length > 1) {
                  e.preventDefault();
                  props.selectProps.onPasteEmails?.([emails]);
                }
              } else if (lines.length > 1) {
                const emails: string[][] = [];
                try {
                  for (const [line, row] of zip(lines, range(0, lines.length))) {
                    const current = [];
                    for (const word of line.split(/(?:\s*[;,]\s*|\s+)/g)) {
                      if (isValidEmail(word)) {
                        current.push(word);
                      } else {
                        e.preventDefault();
                        await showErrorDialog.ignoringDialogErrors({
                          header: intl.formatMessage({
                            id: "component.contact-select.invalid-email-pasted-dialog-title",
                            defaultMessage: "Invalid email pasted",
                          }),
                          message: intl.formatMessage(
                            {
                              id: "component.contact-select.invalid-email-pasted-dialog-description",
                              defaultMessage:
                                'An invalid email was pasted on line {lineNumber} "{email}". Please check and try again.',
                            },
                            { lineNumber: row + 1, email: word },
                          ),
                        });
                        throw new Error();
                      }
                    }
                    if (current.length === 0) {
                      e.preventDefault();
                      await showErrorDialog.ignoringDialogErrors({
                        header: intl.formatMessage({
                          id: "component.contact-select.no-emails-pasted-dialog-title",
                          defaultMessage: "No emails pasted",
                        }),
                        message: intl.formatMessage(
                          {
                            id: "component.contact-select.no-emails-pasted-dialog-description",
                            defaultMessage:
                              "No emails pasted on line {lineNumber}. Please check and try again.",
                          },
                          { lineNumber: row + 1 },
                        ),
                      });
                      throw new Error();
                    }
                    emails.push(current);
                  }
                  props.selectProps.onPasteEmails?.(emails);
                } catch {}
                e.preventDefault();
              }
            }
          }),
      }}
    />
  );
}
