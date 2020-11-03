import { gql } from "@apollo/client";
import {
  Button,
  CloseButton,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Stack,
} from "@chakra-ui/core";
import { TimeIcon } from "@parallel/chakra/icons";
import {
  PetitionSettings_PetitionBaseFragment,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import { FormattedMessage, useIntl } from "react-intl";
import { usePetitionDeadlineDialog } from "../petition-compose/PetitionDeadlineDialog";

export type PetitionSettingsProps = {
  petition: PetitionSettings_PetitionBaseFragment;
  onUpdatePetition: (value: UpdatePetitionInput) => void;
};

export function PetitionSettings({
  petition,
  onUpdatePetition,
}: PetitionSettingsProps) {
  const intl = useIntl();
  const showPetitionDeadlineDialog = usePetitionDeadlineDialog();

  async function onChangeDeadline() {
    try {
      const deadline = await showPetitionDeadlineDialog({});
      onUpdatePetition({ deadline: deadline.toISOString() });
    } catch {}
  }

  const locales = useSupportedLocales();

  return (
    <Stack padding={4}>
      <FormControl id="petition-locale">
        <FormLabel>
          {petition.__typename === "Petition" ? (
            <FormattedMessage
              id="component.create-petition-dialog.locale-label"
              defaultMessage="Language of the petition"
            />
          ) : (
            <FormattedMessage
              id="component.create-template-dialog.locale-label"
              defaultMessage="Language of the template"
            />
          )}
        </FormLabel>
        <Select
          name="petition-locale"
          value={petition.locale}
          onChange={(event) =>
            onUpdatePetition({ locale: event.target.value as any })
          }
        >
          {locales.map((locale) => (
            <option key={locale.key} value={locale.key}>
              {locale.localizedLabel}
            </option>
          ))}
        </Select>
      </FormControl>
      {petition.__typename === "Petition" && (
        <FormControl id="petition-deadline">
          <FormLabel>
            <FormattedMessage
              id="petition.deadline-label"
              defaultMessage="Deadline"
            />
          </FormLabel>
          <Stack direction={{ base: "column", sm: "row" }}>
            <InputGroup size="md" flex="1">
              <Input
                isReadOnly
                placeholder={
                  petition.deadline
                    ? undefined
                    : intl.formatMessage({
                        id: "generic.no-deadline",
                        defaultMessage: "No deadline",
                      })
                }
                value={
                  petition.deadline
                    ? intl.formatDate(petition.deadline, {
                        ...FORMATS.LLL,
                        weekday: "long",
                      })
                    : ""
                }
                onChange={() => {}}
                onKeyUp={(event) => {
                  switch (event.key) {
                    case " ":
                    case "Enter":
                      onChangeDeadline();
                  }
                }}
                onClick={onChangeDeadline}
              />
              {petition.deadline ? (
                <InputRightElement>
                  <CloseButton
                    size="sm"
                    aria-label={intl.formatMessage({
                      id: "generic.clear",
                      defaultMessage: "Clear",
                    })}
                    onClick={() => onUpdatePetition({ deadline: null })}
                  />
                </InputRightElement>
              ) : null}
            </InputGroup>
            <Button
              leftIcon={<TimeIcon fontSize="18px" />}
              onClick={(event) => {
                event.stopPropagation();
                onChangeDeadline();
              }}
            >
              <FormattedMessage id="generic.change" defaultMessage="Change" />
            </Button>
          </Stack>
        </FormControl>
      )}
    </Stack>
  );
}

PetitionSettings.fragments = {
  PetitionBase: gql`
    fragment PetitionSettings_PetitionBase on PetitionBase {
      id
      locale
      ... on Petition {
        status
        deadline
      }
    }
  `,
};
