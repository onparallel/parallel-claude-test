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

export type CreatePetitionFormData = {
  name: string;
  locale: PetitionLocale;
};

export function CreatePetitionDialog({
  defaultName,
  defaultLocale,
  ...props
}: { defaultName?: string; defaultLocale?: string } & DialogProps<{
  name: string;
  locale: PetitionLocale;
  deadline: Date | null;
}>) {
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
  const [addDeadline, setAddDeadline] = useState(false);
  const [deadline, setDeadline] = useState<Date>(defaultDeadline);

  const focusRef = useRef<HTMLInputElement>(null);
  const inputRef = useMergeRefs(focusRef, register({ required: true }));

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
      focusRef={focusRef}
      header={
        <Text as="label" {...{ htmlFor: "petition-name" }}>
          <FormattedMessage
            id="component.create-petition-dialog.header"
            defaultMessage="Creating petition"
          />
        </Text>
      }
      body={
        <Stack>
          <FormControl isInvalid={!!errors.name}>
            <FormLabel htmlFor="petition-name">
              <FormattedMessage
                id="component.create-petition-dialog.name-label"
                defaultMessage="Give it an identifying name"
              />
            </FormLabel>
            <Input
              id="petition-name"
              name="name"
              ref={inputRef}
              autoComplete="off"
              placeholder={intl.formatMessage({
                id: "generic.untitled-petition",
                defaultMessage: "Untitled petition",
              })}
            />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="petition-locale">
              <FormattedMessage
                id="component.create-petition-dialog.locale-label"
                defaultMessage="Language of the petition"
              />
              {/* <Text
                fontSize="sm"
                as="span"
                fontStyle="italic"
                color="gray.400"
                marginLeft={2}
              >
                <FormattedMessage
                  id="generic.can-be-changed-later"
                  defaultMessage="you can change this later"
                />
              </Text> */}
            </FormLabel>
            <Select
              id="petition-locale"
              name="petition-locale"
              ref={register()}
            >
              <option value="en">
                {intl.formatMessage({
                  id: "petition.locale.en",
                  defaultMessage: "English",
                })}
              </option>
              <option value="es">
                {intl.formatMessage({
                  id: "petition.locale.es",
                  defaultMessage: "Spanish",
                })}
              </option>
            </Select>
          </FormControl>
          <Box marginTop={1}>
            <Checkbox
              variantColor="purple"
              isChecked={addDeadline}
              onChange={(event) => setAddDeadline(event.target.checked)}
            >
              <Text fontSize="md" as="span">
                <FormattedMessage
                  id="component.create-petition-dialog.continue-button"
                  defaultMessage="Add a deadline"
                />
                {/* <Text
                  fontSize="sm"
                  as="span"
                  fontStyle="italic"
                  color="gray.400"
                  marginLeft={2}
                >
                  <FormattedMessage
                    id="generic.can-be-changed-later"
                    defaultMessage="you can change this later"
                  />
                </Text> */}
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
        <Button type="submit" variantColor="purple" isDisabled={!isValid}>
          <FormattedMessage
            id="component.create-petition-dialog.continue-button"
            defaultMessage="Continue"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useCreatePetitionDialog() {
  return useDialog(CreatePetitionDialog);
}
