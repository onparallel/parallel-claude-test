import {
  Box,
  Button,
  Checkbox,
  Collapse,
  FormControl,
  FormLabel,
  Input,
  Select,
  Stack,
  Text,
} from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { PetitionLocale } from "@parallel/graphql/__types";
import {
  addDays,
  addWeeks,
  format,
  isFuture,
  parse,
  startOfWeek,
} from "date-fns";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { useMergeRefs } from "../../utils/useMergeRefs";
import { DateTimePicker } from "../common/DateTimePicker";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";

export type CreatePetitionFormData = {
  name: string;
  locale: PetitionLocale;
};

export function CreatePetitionDialog({
  defaultName,
  defaultLocale,
  ...props
}: DialogProps<
  { defaultName?: string; defaultLocale?: string },
  {
    name: string;
    locale: PetitionLocale;
    deadline: Date | null;
  }
>) {
  const intl = useIntl();
  const {
    handleSubmit,
    register,
    errors,
    formState: { isValid },
  } = useForm<CreatePetitionFormData>({
    mode: "onChange",
    defaultValues: {
      name: defaultName ?? "",
      locale: (defaultLocale as PetitionLocale) ?? "en",
    },
  });

  const focusRef = useRef<HTMLInputElement>(null);
  const inputRef = useMergeRefs(focusRef, register({ required: true }));

  const [addDeadline, setAddDeadline] = useState(false);
  // next friday at 18:00
  const defaultDeadline = parse(
    "18:00",
    "HH:mm",
    addDays(
      startOfWeek(addWeeks(new Date(), 1), {
        weekStartsOn: 0,
      }),
      5
    )
  );
  const [deadline, setDeadline] = useState<Date>(defaultDeadline);
  const suggestions = useMemo(
    () =>
      ["17:00", "18:00", "23:59"].map((hours) => {
        const alternativeSameDay = parse(hours, "HH:mm", deadline);
        return isFuture(alternativeSameDay)
          ? alternativeSameDay
          : parse(hours, "HH:mm", addDays(deadline, 1));
      }),
    [format(deadline, "yyyy-MM-dd")]
  );
  const locales = useSupportedLocales();
  return (
    <ConfirmDialog
      size="xl"
      content={{
        as: "form",
        onSubmit: handleSubmit(({ name, locale }) => {
          props.onResolve({
            name,
            locale,
            deadline: addDeadline ? deadline : null,
          });
        }),
      }}
      initialFocusRef={focusRef}
      header={
        <Box as="label" htmlFor="petition-name">
          <FormattedMessage
            id="component.create-petition-dialog.header"
            defaultMessage="Creating petition"
          />
        </Box>
      }
      body={
        <Stack>
          <FormControl id="petition-name" isInvalid={!!errors.name}>
            <FormLabel>
              <FormattedMessage
                id="component.create-petition-dialog.name-label"
                defaultMessage="Give it an identifying name"
              />
            </FormLabel>
            <Input
              name="name"
              ref={inputRef}
              autoComplete="off"
              placeholder={intl.formatMessage({
                id: "generic.untitled-petition",
                defaultMessage: "Untitled petition",
              })}
            />
          </FormControl>
          <FormControl id="petition-locale">
            <FormLabel>
              <FormattedMessage
                id="component.create-petition-dialog.locale-label"
                defaultMessage="Language of the petition"
              />
            </FormLabel>
            <Select name="locale" ref={register()}>
              {locales.map((locale) => (
                <option key={locale.key} value={locale.key}>
                  {locale.localizedLabel}
                </option>
              ))}
            </Select>
          </FormControl>
          <Box marginTop={1}>
            <Checkbox
              colorScheme="purple"
              isChecked={addDeadline}
              onChange={(event) => setAddDeadline(event.target.checked)}
            >
              <Text fontSize="md" as="span">
                <FormattedMessage
                  id="component.create-petition-dialog.add-deadline"
                  defaultMessage="Add a deadline"
                />
              </Text>
            </Checkbox>
            <Collapse isOpen={addDeadline}>
              <Box marginTop={4}>
                <DateTimePicker
                  value={deadline}
                  onChange={setDeadline}
                  suggestions={suggestions}
                />
              </Box>
            </Collapse>
          </Box>
          <Box>
            <Text fontSize="sm" as="span" fontStyle="italic" color="gray.400">
              <FormattedMessage
                id="generic.can-be-changed-later"
                defaultMessage="You can change these settings later"
              />
            </Text>
          </Box>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="purple" isDisabled={!isValid}>
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      {...props}
    />
  );
}

export function useCreatePetitionDialog() {
  return useDialog(CreatePetitionDialog);
}
