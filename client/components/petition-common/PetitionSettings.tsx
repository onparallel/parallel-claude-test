import { gql } from "@apollo/client";
import {
  Box,
  Button,
  CloseButton,
  Collapse,
  Flex,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/core";
import { SignatureIcon, TimeIcon } from "@parallel/chakra/icons";
import {
  PetitionSettings_PetitionBaseFragment,
  PetitionSettings_UserFragment,
  UpdatePetitionInput,
  usePetitionSettings_cancelPetitionSignatureRequestMutation,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useCreateContact } from "@parallel/utils/mutations/useCreateContact";
import { Maybe } from "@parallel/utils/types";
import { useSearchContacts } from "@parallel/utils/useSearchContacts";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import { ChangeEvent } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { DialogProps, useDialog } from "../common/DialogOpenerProvider";
import { HelpPopover } from "../common/HelpPopover";
import { Spacer } from "../common/Spacer";
import { usePetitionDeadlineDialog } from "../petition-compose/PetitionDeadlineDialog";
import {
  SignatureConfigDialog,
  useSignatureConfigDialog,
} from "./SignatureConfigDialog";

export type PetitionSettingsProps = {
  user: PetitionSettings_UserFragment;
  petition: PetitionSettings_PetitionBaseFragment;
  onUpdatePetition: (value: UpdatePetitionInput) => void;
};

export function PetitionSettings({
  user,
  petition,
  onUpdatePetition,
}: PetitionSettingsProps) {
  const locales = useSupportedLocales();
  const hasSignature =
    petition.__typename === "Petition" &&
    user.hasPetitionSignature &&
    user.organization.signatureIntegrations.length > 0;

  const ongoingSignatureRequest =
    petition.__typename === "Petition" &&
    petition.currentSignatureRequest &&
    ["PROCESSING", "ENQUEUED"].includes(petition.currentSignatureRequest.status)
      ? petition.currentSignatureRequest
      : null;

  const showSignatureConfigDialog = useSignatureConfigDialog();
  const handleSearchContacts = useSearchContacts();
  const handleCreateContact = useCreateContact();
  const showConfirmConfigureOngoingSignature = useDialog(
    ConfirmConfigureOngoingSignature
  );

  const showConfirmDisableOngoingSignature = useDialog(
    ConfirmDisableOngoingSignature
  );

  const showConfirmSignatureConfigChanged = useDialog(
    ConfirmSignatureConfigChanged
  );
  const [
    cancelSignatureRequest,
  ] = usePetitionSettings_cancelPetitionSignatureRequestMutation();
  async function handleConfigureSignatureClick() {
    if (petition.__typename !== "Petition") {
      return;
    }
    try {
      if (ongoingSignatureRequest) {
        await showConfirmConfigureOngoingSignature({});
      }
      const signatureConfig = await showSignatureConfigDialog({
        providers: user.organization.signatureIntegrations,
        config: petition.signatureConfig ?? null,
        onSearchContacts: handleSearchContacts,
        onCreateContact: handleCreateContact,
      });
      if (
        // config changed
        ongoingSignatureRequest &&
        (signatureConfig.provider !== petition.signatureConfig?.provider ||
          signatureConfig.contactIds.toString() !==
            petition.signatureConfig?.contacts.map((c) => c?.id).toString())
      ) {
        await showConfirmSignatureConfigChanged({});
        await cancelSignatureRequest({
          variables: {
            petitionSignatureRequestId: ongoingSignatureRequest!.id,
          },
        });
      }
      onUpdatePetition({ signatureConfig });
    } catch {}
  }

  async function handleSignatureChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.checked) {
      await handleConfigureSignatureClick();
    } else {
      try {
        if (ongoingSignatureRequest) {
          await showConfirmDisableOngoingSignature({});
          await cancelSignatureRequest({
            variables: {
              petitionSignatureRequestId: ongoingSignatureRequest.id,
            },
          });
        }
        onUpdatePetition({ signatureConfig: null });
      } catch {}
    }
  }

  return (
    <Stack padding={4} spacing={4}>
      <FormControl id="petition-locale">
        <FormLabel display="flex" alignItems="center">
          {petition.__typename === "Petition" ? (
            <FormattedMessage
              id="component.petition-settings.locale-label"
              defaultMessage="Language of the petition"
            />
          ) : (
            <FormattedMessage
              id="component.petition-settings.template-locale-label"
              defaultMessage="Language of the template"
            />
          )}
          <HelpPopover marginLeft={2}>
            <FormattedMessage
              id="component.petition-settings.locale-description"
              defaultMessage="This is the language that will be used in the communications with the recipients of this petition."
            />
          </HelpPopover>
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
      {petition.__typename === "Petition" ? (
        <FormControl id="petition-deadline">
          <FormLabel display="flex" alignItems="center">
            <FormattedMessage
              id="petition.deadline-label"
              defaultMessage="Deadline"
            />
            <HelpPopover marginLeft={2}>
              <FormattedMessage
                id="component.petition-settings.deadline-description"
                defaultMessage="This date is used to inform the recipients of the deadline for which you need to have the information."
              />
            </HelpPopover>
          </FormLabel>
          <DeadlineInput
            value={petition.deadline ? new Date(petition.deadline) : null}
            onChange={(value) =>
              onUpdatePetition({ deadline: value?.toISOString() ?? null })
            }
          />
        </FormControl>
      ) : null}
      {petition.__typename === "Petition" &&
      (petition.signatureConfig || hasSignature) ? (
        <Box>
          <FormControl as={Stack} direction="row">
            <FormLabel margin={0} display="flex" alignItems="center">
              <FormattedMessage
                id="component.petition-settings.petition-signature-enable"
                defaultMessage="Enable eSignature"
              />
              <HelpPopover marginLeft={2}>
                <FormattedMessage
                  id="component.petition-settings.petition-signature-description"
                  defaultMessage="By enabling eSignature, once the petition is completed by the recipient, Parallel will generate a PDF document with all the replies and send it to the selected eSignature provider to start the signature process."
                />
              </HelpPopover>
            </FormLabel>
            <Spacer />
            <Switch
              onChange={handleSignatureChange}
              isChecked={Boolean(petition.signatureConfig)}
              isDisabled={!hasSignature}
            />
          </FormControl>
          <Collapse isOpen={Boolean(petition.signatureConfig)}>
            <Flex justifyContent="center" marginTop={2}>
              <Button
                leftIcon={<SignatureIcon fontSize="18px" />}
                onClick={handleConfigureSignatureClick}
                isDisabled={!hasSignature}
              >
                <Text as="span">
                  <FormattedMessage
                    id="component.petition-settings.petition-signature-configure"
                    defaultMessage="Configure eSignature"
                  />
                </Text>
              </Button>
            </Flex>
          </Collapse>
        </Box>
      ) : null}
    </Stack>
  );
}

PetitionSettings.fragments = {
  User: gql`
    fragment PetitionSettings_User on User {
      hasPetitionSignature: hasFeatureFlag(featureFlag: PETITION_SIGNATURE)
      organization {
        signatureIntegrations: integrations(type: SIGNATURE) {
          ...SignatureConfigDialog_OrgIntegration
        }
      }
    }
    ${SignatureConfigDialog.fragments.OrgIntegration}
  `,
  PetitionBase: gql`
    fragment PetitionSettings_PetitionBase on PetitionBase {
      id
      locale
      ... on Petition {
        status
        deadline
        signatureConfig {
          ...SignatureConfigDialog_SignatureConfig
        }
        currentSignatureRequest {
          id
          status
        }
      }
    }
    ${SignatureConfigDialog.fragments.SignatureConfig}
  `,
};

PetitionSettings.mutations = [
  gql`
    mutation PetitionSettings_cancelPetitionSignatureRequest(
      $petitionSignatureRequestId: GID!
    ) {
      cancelSignatureRequest(
        petitionSignatureRequestId: $petitionSignatureRequestId
      ) {
        id
        status
      }
    }
  `,
];

function DeadlineInput({
  value,
  onChange,
}: {
  value?: Maybe<Date>;
  onChange: (value: Maybe<Date>) => void;
}) {
  const intl = useIntl();
  const showPetitionDeadlineDialog = usePetitionDeadlineDialog();

  async function handleOpenDeadlineDialog() {
    try {
      const date = await showPetitionDeadlineDialog({});
      onChange(date);
    } catch {}
  }
  return (
    <Stack direction={{ base: "column", sm: "row" }}>
      <InputGroup size="md" flex="1">
        <Input
          isReadOnly
          placeholder={
            value
              ? undefined
              : intl.formatMessage({
                  id: "generic.no-deadline",
                  defaultMessage: "No deadline",
                })
          }
          value={
            value
              ? intl.formatDate(value, {
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
                handleOpenDeadlineDialog();
            }
          }}
          onClick={handleOpenDeadlineDialog}
        />
        {value ? (
          <InputRightElement>
            <CloseButton
              size="sm"
              aria-label={intl.formatMessage({
                id: "generic.clear",
                defaultMessage: "Clear",
              })}
              onClick={() => onChange(null)}
            />
          </InputRightElement>
        ) : null}
      </InputGroup>
      <Button
        leftIcon={<TimeIcon fontSize="18px" />}
        onClick={(event) => {
          event.stopPropagation();
          handleOpenDeadlineDialog();
        }}
      >
        <FormattedMessage id="generic.change" defaultMessage="Change" />
      </Button>
    </Stack>
  );
}

function ConfirmDisableOngoingSignature(props: DialogProps<{}, void>) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.confirm-disable-ongoing-signature.header"
          defaultMessage="Ongoing eSignature"
        />
      }
      body={
        <FormattedMessage
          id="component.confirm-disable-ongoing-signature.body"
          defaultMessage="There is an ongoing eSignature process. If you disable eSignature this process will be cancelled."
        />
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.confirm-disable-ongoing-signature.confirm"
            defaultMessage="Disable eSignature"
          />
        </Button>
      }
      {...props}
    />
  );
}

function ConfirmConfigureOngoingSignature(props: DialogProps<{}, void>) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.confirm-configure-ongoing-signature.header"
          defaultMessage="Ongoing eSignature"
        />
      }
      body={
        <FormattedMessage
          id="component.confirm-configure-ongoing-signature.body"
          defaultMessage="There is an ongoing eSignature process. If you make any changes the ongoing process will be cancelled."
        />
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.confirm-configure-ongoing-signature-body.confirm"
            defaultMessage="I understand"
          />
        </Button>
      }
      {...props}
    />
  );
}

function ConfirmSignatureConfigChanged(props: DialogProps<{}, void>) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.confirm-signature-config-changed.header"
          defaultMessage="Ongoing eSignature"
        />
      }
      body={
        <FormattedMessage
          id="component.confirm-signature-config-changed.body"
          defaultMessage="You made changes to the eSignature configuration. If you continue, the ongoing eSignature process will be cancelled."
        />
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.confirm-signature-config-changed.confirm"
            defaultMessage="I understand"
          />
        </Button>
      }
      {...props}
    />
  );
}
