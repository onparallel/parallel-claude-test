import { gql } from "@apollo/client";
import {
  Box,
  Button,
  CloseButton,
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
} from "@chakra-ui/react";
import { SignatureIcon, TimeIcon } from "@parallel/chakra/icons";
import {
  PetitionSettings_PetitionBaseFragment,
  PetitionSettings_UserFragment,
  UpdatePetitionInput,
  usePetitionSettings_cancelPetitionSignatureRequestMutation,
  usePetitionSettings_startPetitionSignatureRequestMutation,
} from "@parallel/graphql/__types";
import { compareWithFragments } from "@parallel/utils/compareWithFragments";
import { FORMATS } from "@parallel/utils/dates";
import { Maybe } from "@parallel/utils/types";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import { memo, ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { DialogProps, useDialog } from "../common/DialogProvider";
import { HelpPopover } from "../common/HelpPopover";
import { PaddedCollapse } from "../common/PaddedCollapse";
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

function _PetitionSettings({
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
    petition.currentSignatureRequest.status === "PROCESSING"
      ? petition.currentSignatureRequest
      : null;

  const showSignatureConfigDialog = useSignatureConfigDialog();

  const showConfirmConfigureOngoingSignature = useDialog(
    ConfirmConfigureOngoingSignature
  );
  const showConfirmSignatureConfigChanged = useDialog(
    ConfirmSignatureConfigChanged
  );
  const [cancelSignatureRequest] =
    usePetitionSettings_cancelPetitionSignatureRequestMutation();
  const [startSignatureRequest] =
    usePetitionSettings_startPetitionSignatureRequestMutation();

  async function handleConfigureSignatureClick() {
    if (petition.__typename !== "Petition") {
      return;
    }
    try {
      if (ongoingSignatureRequest) {
        await showConfirmConfigureOngoingSignature({});
      }
      const signatureConfig = await showSignatureConfigDialog({
        petition,
        providers: user.organization.signatureIntegrations,
      });
      if (
        // config changed
        ongoingSignatureRequest &&
        (signatureConfig.provider !== petition.signatureConfig?.provider ||
          signatureConfig.contactIds.toString() !==
            petition.signatureConfig?.contacts.map((c) => c?.id).toString() ||
          signatureConfig.title !== petition.signatureConfig?.title)
      ) {
        await showConfirmSignatureConfigChanged({});
        await cancelSignatureRequest({
          variables: {
            petitionSignatureRequestId: ongoingSignatureRequest!.id,
          },
        });
      }
      await onUpdatePetition({ signatureConfig });

      if (["COMPLETED", "CLOSED"].includes(petition.status)) {
        await startSignatureRequest({ variables: { petitionId: petition.id } });
      }
    } catch {}
  }

  const showConfirmDisableOngoingSignature = useDialog(
    ConfirmDisableOngoingSignature
  );
  async function handleSignatureChange(value: boolean) {
    if (value) {
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

  const showConfirmSkipForwardSecurity = useDialog(ConfirmSkipForwardSecurity);
  async function handleSkipForwardSecurityChange(value: boolean) {
    try {
      if (value) {
        await showConfirmSkipForwardSecurity({});
      }
      await onUpdatePetition({ skipForwardSecurity: value });
    } catch {}
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
      <SwitchSetting
        title={
          <FormattedMessage
            id="component.petition-settings.petition-comments-enable"
            defaultMessage="Enable comments"
          />
        }
        help={
          <FormattedMessage
            id="component.petition-settings.petition-comments-description"
            defaultMessage="By enabling comments, recipients of the petition will be able to ask you questions within the recipient view."
          />
        }
        isChecked={petition.hasCommentsEnabled}
        onChange={async (value) =>
          await onUpdatePetition({ hasCommentsEnabled: value })
        }
      />
      {petition.__typename === "Petition" &&
      (petition.signatureConfig || hasSignature) ? (
        <Box>
          <SwitchSetting
            title={
              <FormattedMessage
                id="component.petition-settings.petition-signature-enable"
                defaultMessage="Enable eSignature"
              />
            }
            help={
              <FormattedMessage
                id="component.petition-settings.petition-signature-description"
                defaultMessage="By enabling eSignature, once the petition is completed by the recipient, Parallel will generate a PDF document with all the replies and send it to the selected eSignature provider to start the signature process."
              />
            }
            onChange={handleSignatureChange}
            isChecked={Boolean(petition.signatureConfig)}
            isDisabled={!hasSignature}
          />
          <PaddedCollapse in={Boolean(petition.signatureConfig)}>
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
          </PaddedCollapse>
        </Box>
      ) : null}
      {user.hasSkipForwardSecurity ? (
        <SwitchSetting
          title={
            <FormattedMessage
              id="component.petition-settings.skip-forward-security"
              defaultMessage="Disable Forward Security"
            />
          }
          help={
            <FormattedMessage
              id="component.petition-settings.forward-security-description"
              defaultMessage="Forward security is a security measure that protects the privacy of the data uploaded by the recipient in case they share their personal link by mistake."
            />
          }
          isChecked={petition.skipForwardSecurity}
          onChange={handleSkipForwardSecurityChange}
        />
      ) : null}
      {user.hasHideRecipientViewContents ? (
        <SwitchSetting
          title={
            <FormattedMessage
              id="component.petition-settings.hide-recipient-view-contents"
              defaultMessage="Hide recipient view contents"
            />
          }
          help={
            <FormattedMessage
              id="component.petition-settings.hide-recipient-view-contents-description"
              defaultMessage="By enabling this, the contents card in the recipient view will be hidden."
            />
          }
          isChecked={petition.isRecipientViewContentsHidden}
          onChange={async (value) =>
            await onUpdatePetition({ isRecipientViewContentsHidden: value })
          }
        />
      ) : null}
    </Stack>
  );
}

const fragments = {
  User: gql`
    fragment PetitionSettings_User on User {
      hasPetitionSignature: hasFeatureFlag(featureFlag: PETITION_SIGNATURE)
      hasSkipForwardSecurity: hasFeatureFlag(featureFlag: SKIP_FORWARD_SECURITY)
      hasHideRecipientViewContents: hasFeatureFlag(
        featureFlag: HIDE_RECIPIENT_VIEW_CONTENTS
      )
      organization {
        id
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
      hasCommentsEnabled
      skipForwardSecurity
      isRecipientViewContentsHidden
      ... on Petition {
        status
        deadline
        ...SignatureConfigDialog_Petition @include(if: $hasPetitionSignature)
        currentSignatureRequest @include(if: $hasPetitionSignature) {
          id
          status
        }
      }
    }
    ${SignatureConfigDialog.fragments.Petition}
  `,
};
const mutations = [
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
  gql`
    mutation PetitionSettings_startPetitionSignatureRequest($petitionId: GID!) {
      startSignatureRequest(petitionId: $petitionId) {
        id
        status
      }
    }
  `,
];

export const PetitionSettings = Object.assign(
  memo(
    _PetitionSettings,
    compareWithFragments<PetitionSettingsProps>({
      user: fragments.User,
      petition: fragments.PetitionBase,
    })
  ) as typeof _PetitionSettings,
  { fragments, mutations }
);

function SwitchSetting({
  title,
  help,
  isChecked,
  isDisabled,
  onChange,
}: {
  title: ReactNode;
  help: ReactNode;
  isChecked: boolean;
  isDisabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <FormControl as={Stack} direction="row">
      <FormLabel margin={0} display="flex" alignItems="center">
        {title}
        <HelpPopover marginLeft={2}>{help}</HelpPopover>
      </FormLabel>
      <Spacer />
      <Switch
        isChecked={isChecked}
        isDisabled={isDisabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </FormControl>
  );
}

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

function ConfirmSkipForwardSecurity(props: DialogProps<{}, void>) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.confirm-skip-forward-security.header"
          defaultMessage="Disable Forward Security"
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.petition-settings.forward-security-description"
              defaultMessage="Forward security is a security measure that protects the privacy of the data uploaded by the recipient in case they share their personal link by mistake."
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.petition-settings.skip-forward-security-warning"
              defaultMessage="If you disable Forward Security recipients will be able to share their links and other people might be able to access the data submitted so far."
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.confirm-skip-forward-security.confirm"
            defaultMessage="Disable Forward Security"
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
            id="generic.i-understand"
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
            id="generic.i-understand"
            defaultMessage="I understand"
          />
        </Button>
      }
      {...props}
    />
  );
}
