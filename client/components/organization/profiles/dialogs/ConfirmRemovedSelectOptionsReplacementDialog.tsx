import { Button, FormControl, HStack, Stack, Text } from "@chakra-ui/react";
import { AssignIcon } from "@parallel/chakra/icons";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { ProfileFieldSelectOptionItem } from "@parallel/components/profiles/fields/ProfileFieldSelect";
import {
  UpdateProfileTypeFieldSelectOptionsSubstitution,
  UserLocale,
} from "@parallel/graphql/__types";
import { ProfileTypeFieldOptions } from "@parallel/utils/profileFields";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { UnwrapArray } from "@parallel/utils/types";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import Select, { OptionProps, SingleValueProps, components } from "react-select";

type SelectOptionValue = UnwrapArray<ProfileTypeFieldOptions["SELECT"]["values"]>;

interface ConfirmUpdateProfileTypeSelectFieldDialogProps {
  currentOptions: SelectOptionValue[];
  removedOptions: (SelectOptionValue & { count: number })[];
  showOptionsWithColors: boolean;
}

function ConfirmRemovedSelectOptionsReplacementDialog({
  currentOptions,
  removedOptions,
  showOptionsWithColors,
  ...props
}: DialogProps<
  ConfirmUpdateProfileTypeSelectFieldDialogProps,
  UpdateProfileTypeFieldSelectOptionsSubstitution[]
>) {
  const intl = useIntl();

  const { control, handleSubmit } = useForm({
    mode: "onSubmit",
    defaultValues: {
      values: removedOptions.map((option) => [option, null as string | null] as const),
    },
  });

  const { fields } = useFieldArray({
    name: "values",
    control,
  });

  const reactSelectProps = useReactSelectProps<SelectOptionValue>({
    components: {
      SingleValue,
      Option,
    },
  });

  const getOptionLabel = (option: SelectOptionValue) => {
    return option.label[intl.locale as UserLocale] ?? "";
  };

  const getOptionValue = (option: SelectOptionValue) => option.value;

  return (
    <ConfirmDialog
      {...props}
      closeOnEsc
      closeOnOverlayClick={false}
      size="xl"
      content={{
        as: "form",
        onSubmit: handleSubmit(async (data) => {
          props.onResolve(
            data.values.map(([option, value]) => ({ old: option.value, new: value })),
          );
        }),
      }}
      header={
        <FormattedMessage
          id="component.confirm-update-profile-type-select-field-dialog.removed-options-header"
          defaultMessage="Removed options"
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.confirm-update-profile-type-select-field-dialog.remove-option-body"
              defaultMessage="The following options have been removed, this action will affect all profiles that had any of these options selected, how do you want to proceed?"
            />
          </Text>
          {fields.map((field, index) => {
            const option = field[0];
            return (
              <HStack key={field.id} spacing={4}>
                <Text flex="1" noOfLines={2} wordBreak="break-all">
                  <LocalizableUserTextRender value={option.label} default="" />
                  &nbsp;
                  <Text as="span" textStyle="hint" fontSize="sm">
                    <FormattedMessage
                      id="generic.n-profiles"
                      defaultMessage="{count, plural, one {# profile} other {# profiles}}"
                      values={{ count: option.count }}
                    />
                  </Text>
                </Text>
                <AssignIcon />
                <FormControl flex="2">
                  <Controller
                    name={`values.${index}` as const}
                    control={control}
                    render={({
                      field: {
                        ref,
                        value: [option, value],
                        onChange,
                        onBlur,
                      },
                    }) => (
                      <Select
                        ref={ref}
                        options={currentOptions}
                        isClearable
                        getOptionLabel={getOptionLabel}
                        getOptionValue={getOptionValue}
                        isMulti={false}
                        value={currentOptions?.find((v) => v.value === value) ?? null}
                        onChange={(o: SelectOptionValue) => onChange([option, o?.value ?? null])}
                        onBlur={onBlur}
                        placeholder={intl.formatMessage({
                          id: "component.confirm-update-profile-type-select-field-dialog.remove-option-placeholder",
                          defaultMessage: "Remove from all profiles",
                        })}
                        {...reactSelectProps}
                        {...({ showOptionsWithColors } as any)}
                      />
                    )}
                  />
                </FormControl>
              </HStack>
            );
          })}
        </Stack>
      }
      confirm={
        <Button colorScheme="primary" type="submit">
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
    />
  );
}

export function useConfirmRemovedSelectOptionsReplacementDialog() {
  return useDialog(ConfirmRemovedSelectOptionsReplacementDialog);
}

function SingleValue(props: SingleValueProps<SelectOptionValue>) {
  return (
    <components.SingleValue {...props}>
      <ProfileFieldSelectOptionItem
        color={(props.selectProps as any).showOptionsWithColors ? props.data.color : undefined}
      >
        <LocalizableUserTextRender value={props.data.label} default={<></>} />
      </ProfileFieldSelectOptionItem>
    </components.SingleValue>
  );
}

function Option({ children, ...props }: OptionProps<SelectOptionValue>) {
  return (
    <components.Option {...props}>
      <ProfileFieldSelectOptionItem
        color={(props.selectProps as any).showOptionsWithColors ? props.data.color : undefined}
      >
        <LocalizableUserTextRender value={props.data.label} default={<></>} />
      </ProfileFieldSelectOptionItem>
    </components.Option>
  );
}
