import { gql } from "@apollo/client";
import {
  Button,
  CloseButton,
  Flex,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Select,
  Stack,
} from "@chakra-ui/core";
import { TimeIcon } from "@parallel/chakra/icons";
import {
  PetitionSettingsModal_PetitionBaseFragment,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import { FormattedMessage, useIntl } from "react-intl";
import { usePetitionDeadlineDialog } from "../petition-compose/PetitionDeadlineDialog";

export type PetitionSettingsModalProps = Omit<ModalProps, "children"> & {
  petition: PetitionSettingsModal_PetitionBaseFragment;
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
      <ModalOverlay>
        <ModalContent borderRadius="md">
          <ModalHeader>
            {petition.__typename === "Petition" ? (
              <FormattedMessage
                id="petition.settings-header"
                defaultMessage="Petition settings"
              />
            ) : (
              <FormattedMessage
                id="template.settings-header"
                defaultMessage="Template settings"
              />
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody paddingBottom={6}>
            <Stack>
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
                  <Flex flexDirection={{ base: "column", sm: "row" }}>
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
                      onClick={(event) => {
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
              )}
            </Stack>
          </ModalBody>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
}

PetitionSettingsModal.fragments = {
  Petition: gql`
    fragment PetitionSettingsModal_PetitionBase on PetitionBase {
      id
      locale
      ... on Petition {
        status
        deadline
      }
    }
  `,
};
