import {
  Box,
  BoxProps,
  Button,
  Center,
  Flex,
  FormControl,
  FormErrorMessage,
  List,
  ListItem,
  Stack,
} from "@chakra-ui/react";
import { DeleteIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import {
  RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragment,
  RecipientViewPetitionField_PublicPetitionFieldFragment,
  useRecipientViewPetitionFieldMutations_publicUpdateSimpleReplyMutation,
} from "@parallel/graphql/__types";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useReactSelectProps } from "@parallel/utils/useReactSelectProps";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { FormattedMessage, useIntl } from "react-intl";
import Select from "react-select";
import { useCreateSimpleReply, useDeletePetitionReply } from "./mutations";
import {
  RecipientViewPetitionFieldCard,
  RecipientViewPetitionFieldCardProps,
} from "./RecipientViewPetitionFieldCard";
import { RecipientViewPetitionFieldReplySavingIndicator } from "./RecipientViewPetitionFieldReplySavingIndicator";

export interface RecipientViewPetitionFieldSelectProps
  extends Omit<RecipientViewPetitionFieldCardProps, "children"> {
  keycode: string;
  canReply: boolean;
}

export const RecipientViewPetitionFieldSelect = chakraForwardRef<
  "section",
  RecipientViewPetitionFieldSelectProps
>(function RecipientViewPetitionField(
  {
    keycode,
    canReply,
    field,
    isInvalid,
    hasCommentsEnabled,
    onOpenCommentsClick,
    ...props
  },
  ref
) {
  const deletePetitionReply = useDeletePetitionReply();
  const createSimpleReply = useCreateSimpleReply();
  return (
    <RecipientViewPetitionFieldCard
      ref={ref}
      field={field}
      isInvalid={isInvalid}
      hasCommentsEnabled={hasCommentsEnabled}
      onOpenCommentsClick={onOpenCommentsClick}
      {...props}
    >
      {field.replies.length ? (
        <List as={Stack} marginTop={1}>
          {field.replies.map((reply) => (
            <ListItem key={reply.id}>
              <RecipientViewPetitionFieldReplySelect
                keycode={keycode}
                reply={reply}
                options={field.options as FieldOptions["SELECT"]}
                onRemove={() =>
                  deletePetitionReply({
                    keycode,
                    fieldId: field.id,
                    replyId: reply.id,
                  })
                }
              />
            </ListItem>
          ))}
        </List>
      ) : null}
      <Box marginTop={2}>
        <OptionSelectReplyForm
          field={field}
          canReply={canReply}
          onCreateReply={(content) =>
            createSimpleReply({
              keycode,
              fieldId: field.id,
              content,
            })
          }
        />
      </Box>
    </RecipientViewPetitionFieldCard>
  );
});

interface RecipientViewPetitionFieldReplySelectProps {
  keycode: string;
  options: FieldOptions["SELECT"];
  reply: RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragment;
  onRemove: () => void;
}

// This context is used to pass some properties to react-select subcomponents
const RecipientViewPetitionFieldReplySelectContext = createContext<{
  isUpdating: boolean;
  reply: RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragment;
}>(null as any);

export function RecipientViewPetitionFieldReplySelect({
  keycode,
  options,
  reply,
  onRemove,
}: RecipientViewPetitionFieldReplySelectProps) {
  const intl = useIntl();
  const [
    updateReply,
    { loading: isUpdating },
  ] = useRecipientViewPetitionFieldMutations_publicUpdateSimpleReplyMutation();
  const [value, setValue] = useState(toSelectOption(reply.content.text));

  const _reactSelectProps = useReactSelectProps({
    id: `petition-field-reply-select-${reply.id}`,
    isDisabled: false,
  });

  const reactSelectProps = useMemo(
    () =>
      ({
        ..._reactSelectProps,
        styles: {
          ..._reactSelectProps.styles,
          menu: (styles) => ({
            ...styles,
            zIndex: 100,
          }),
        },
        components: {
          ..._reactSelectProps.components,
          ValueContainer: (props) => {
            const { children, getStyles } = props;
            const { reply, isUpdating } = useContext(
              RecipientViewPetitionFieldReplySelectContext
            );
            return (
              <Box
                sx={{ ...getStyles("valueContainer", props), paddingRight: 8 }}
                position="relative"
              >
                {children}
                <Center
                  width={8}
                  paddingLeft={3}
                  paddingRight={1}
                  height="100%"
                  position="absolute"
                  right={0}
                  top={0}
                >
                  <RecipientViewPetitionFieldReplySavingIndicator
                    isSaving={isUpdating}
                    reply={reply}
                  />
                </Center>
              </Box>
            );
          },
        },
      } as typeof _reactSelectProps),
    [_reactSelectProps]
  );

  const values = useMemo(() => options.values.map(toSelectOption), [
    options.values,
  ]);

  const contextValue = useMemo(() => ({ reply, isUpdating }), [
    reply,
    isUpdating,
  ]);

  return (
    <Stack direction="row">
      <Box flex="1" position="relative">
        <RecipientViewPetitionFieldReplySelectContext.Provider
          value={contextValue}
        >
          <Select
            value={value}
            options={values}
            onChange={(value) => {
              setValue(value as any);
              updateReply({
                variables: {
                  keycode,
                  replyId: reply.id,
                  reply: value!.value,
                },
              });
            }}
            placeholder={
              options.placeholder ??
              intl.formatMessage({
                id:
                  "component.recipient-view-petition-field-reply.select-placeholder",
                defaultMessage: "Select an option",
              })
            }
            {...reactSelectProps}
          />
        </RecipientViewPetitionFieldReplySelectContext.Provider>
      </Box>
      <IconButtonWithTooltip
        onClick={onRemove}
        variant="ghost"
        icon={<DeleteIcon />}
        size="md"
        placement="bottom"
        label={intl.formatMessage({
          id:
            "component.recipient-view-petition-field-reply.remove-reply-label",
          defaultMessage: "Remove reply",
        })}
      />
    </Stack>
  );
}

interface OptionSelectReplyFormProps extends BoxProps {
  canReply: boolean;
  field: RecipientViewPetitionField_PublicPetitionFieldFragment;
  onCreateReply: (content: string) => void;
}

function OptionSelectReplyForm({
  field,
  canReply,
  onCreateReply,
  ...props
}: OptionSelectReplyFormProps) {
  const intl = useIntl();

  const { values, placeholder } = field.options as FieldOptions["SELECT"];
  const [selection, setSelection] = useState<string | null>();
  const [showError, setShowError] = useState(false);
  const disabled = !field.multiple && field.replies.length > 0;

  const _reactSelectProps = useReactSelectProps({
    id: `field-select-option-${field.id}`,
    isDisabled: disabled || !canReply,
    isInvalid: showError,
  });

  const reactSelectProps = useMemo(
    () =>
      ({
        ..._reactSelectProps,
        styles: {
          ..._reactSelectProps.styles,
          menu: (styles) => ({
            ...styles,
            zIndex: 1000,
          }),
        },
      } as typeof _reactSelectProps),
    [_reactSelectProps]
  );

  const availableOptions = useMemo(() => {
    return values.map((value) => ({ value, label: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (selection) {
      onCreateReply(selection);
      setTimeout(() => setSelection(null));
    } else {
      setShowError(true);
    }
  }, [selection]);

  return (
    <Flex flexDirection={{ base: "column", sm: "row" }} {...props}>
      <FormControl flex="1" isInvalid={showError} isDisabled={disabled}>
        <Select
          value={selection ? { value: selection, label: selection } : null}
          options={availableOptions}
          onChange={({ value }: any) => {
            setSelection(value as any);
            setShowError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSubmit();
            }
          }}
          placeholder={
            placeholder ??
            intl.formatMessage({
              id: "recipient-view.select-placeholder",
              defaultMessage: "Select an option",
            })
          }
          {...reactSelectProps}
        />
        {showError && (
          <FormErrorMessage>
            <FormattedMessage
              id="generic.forms.required-field-error"
              defaultMessage="A value is required"
            />
          </FormErrorMessage>
        )}
      </FormControl>
      <Button
        type="submit"
        variant="outline"
        isDisabled={disabled || !canReply}
        marginTop={{ base: 2, sm: 0 }}
        marginLeft={{ base: 0, sm: 4 }}
        onClick={handleSubmit}
      >
        <FormattedMessage id="generic.save" defaultMessage="Save" />
      </Button>
    </Flex>
  );
}

function toSelectOption(value: string) {
  return { value, label: value };
}
