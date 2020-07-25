import { gql } from "@apollo/client";
import {
  Button,
  CloseButton,
  Flex,
  FormControl,
  FormLabel,
  IModal,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  Stack,
} from "@chakra-ui/core";
import { TimeIcon } from "@parallel/chakra/icons";
import {
  PetitionSettingsModal_PetitionFragment,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import { KeyboardEvent, MouseEvent } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { usePetitionDeadlineDialog } from "../petition-compose/PetitionDeadlineDialog";

export type PetitionSettingsModalProps = Omit<IModal, "children"> & {
  petition: PetitionSettingsModal_PetitionFragment;
  onUpdatePetition: (value: UpdatePetitionInput) => void;
};

export function PetitionSettingsModal({
  petition,
  onUpdatePetition,
  ...props
}: PetitionSettingsModalProps) {
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
    <Modal {...props} size="xl">
      <ModalOverlay />
      <ModalContent rounded="md">
        <ModalHeader>
          <FormattedMessage
            id="petition.settings-header"
            defaultMessage="Petition settings"
          />
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody paddingBottom={6}>
          <Stack>
            <FormControl>
              <FormLabel htmlFor="petition-locale">
                <FormattedMessage
                  id="component.create-petition-dialog.locale-label"
                  defaultMessage="Language of the petition"
                />
              </FormLabel>
              <Select
                id="petition-locale"
                name="petition-locale"
                value={petition.locale}
                onChange={(event) => {
                  onUpdatePetition({ locale: event.target.value as any });
                }}
              >
                {locales.map((locale) => (
                  <option key={locale.key} value={locale.key}>
                    {locale.localizedLabel}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="petition-deadline">
                <FormattedMessage
                  id="petition.deadline-label"
                  defaultMessage="Deadline"
                />
              </FormLabel>
              <Flex flexDirection={{ base: "column", sm: "row" }}>
                <InputGroup size="md" flex="1">
                  <Input
                    id="petition-deadline"
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
                    onKeyUp={(event: KeyboardEvent) => {
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
                        label={intl.formatMessage({
                          id: "petition.remove-deadline",
                          defaultMessage: "Remove deadline",
                        })}
                        onClick={() => onUpdatePetition({ deadline: null })}
                      />
                    </InputRightElement>
                  ) : null}
                </InputGroup>
                <Button
                  leftIcon={<TimeIcon />}
                  marginLeft={{ base: 0, sm: 2 }}
                  marginTop={{ base: 2, sm: 0 }}
                  onClick={(event: MouseEvent) => {
                    event.stopPropagation();
                    onChangeDeadline();
                  }}
                >
                  {petition.deadline ? (
                    <FormattedMessage
                      id="petition.change-deadline"
                      defaultMessage="Change deadline"
                    />
                  ) : (
                    <FormattedMessage
                      id="petition.set-a-deadline"
                      defaultMessage="Set a deadline"
                    />
                  )}
                </Button>
              </Flex>
            </FormControl>
          </Stack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

PetitionSettingsModal.fragments = {
  Petition: gql`
    fragment PetitionSettingsModal_Petition on Petition {
      id
      status
      locale
      deadline
    }
  `,
};
