import { gql } from "@apollo/client";
import {
  Box,
  Button,
  CloseButton,
  Collapse,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import {
  CommentIcon,
  LinkIcon,
  ListIcon,
  LockClosedIcon,
  LockOpenIcon,
  SettingsIcon,
  ShieldIcon,
  SignatureIcon,
  TimeIcon,
} from "@parallel/chakra/icons";
import {
  PetitionSettings_PetitionBaseFragment,
  PetitionSettings_UserFragment,
  PublicLinkSettingsDialog_PublicPetitionLinkFragment,
  UpdatePetitionInput,
  usePetitionSettings_cancelPetitionSignatureRequestMutation,
  usePetitionSettings_createPublicPetitionLinkMutation,
  usePetitionSettings_startPetitionSignatureRequestMutation,
  usePetitionSettings_updatePublicPetitionLinkMutation,
} from "@parallel/graphql/__types";
import { compareWithFragments } from "@parallel/utils/compareWithFragments";
import { FORMATS } from "@parallel/utils/dates";
import { Maybe } from "@parallel/utils/types";
import { useClipboardWithToast } from "@parallel/utils/useClipboardWithToast";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import { memo, ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { pick } from "remeda";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { CopyToClipboardButton } from "../common/CopyToClipboardButton";
import { DialogProps, useDialog } from "../common/DialogProvider";
import { HelpPopover } from "../common/HelpPopover";
import { Spacer } from "../common/Spacer";
import { usePetitionDeadlineDialog } from "../petition-compose/PetitionDeadlineDialog";
import { PublicLinkSettingsDialog, usePublicLinkSettingsDialog } from "./PublicLinkSettingsDialog";
import { SignatureConfigDialog, useSignatureConfigDialog } from "./SignatureConfigDialog";

export type PetitionSettingsProps = {
  user: PetitionSettings_UserFragment;
  petition: PetitionSettings_PetitionBaseFragment;
  onUpdatePetition: (value: UpdatePetitionInput) => void;
  validPetitionFields: () => Promise<boolean>;
};

function _PetitionSettings({
  user,
  petition,
  onUpdatePetition,
  validPetitionFields,
}: PetitionSettingsProps) {
  const locales = useSupportedLocales();
  const intl = useIntl();
  const hasSignature =
    user.hasPetitionSignature && user.organization.signatureIntegrations.length > 0;

  const ongoingSignatureRequest =
    petition.__typename === "Petition" &&
    petition.currentSignatureRequest &&
    petition.currentSignatureRequest.status === "PROCESSING"
      ? petition.currentSignatureRequest
      : null;

  const isReadOnly = petition.isReadOnly;

  const publicLink = petition.__typename === "PetitionTemplate" ? petition.publicLink : null;

  const showSignatureConfigDialog = useSignatureConfigDialog();

  const showConfirmConfigureOngoingSignature = useDialog(ConfirmConfigureOngoingSignature);
  const showConfirmSignatureConfigChanged = useDialog(ConfirmSignatureConfigChanged);
  const [cancelSignatureRequest] = usePetitionSettings_cancelPetitionSignatureRequestMutation();
  const [startSignatureRequest] = usePetitionSettings_startPetitionSignatureRequestMutation();

  async function handleConfigureSignatureClick() {
    try {
      if (ongoingSignatureRequest) {
        await showConfirmConfigureOngoingSignature({});
      }
      const signatureConfig = await showSignatureConfigDialog({
        petition,
        providers: user.organization.signatureIntegrations,
      });

      const previous = petition.signatureConfig;
      const signatureConfigHasChanged = [
        [signatureConfig.provider, previous?.provider],
        [
          signatureConfig.signersInfo
            .map((s) => JSON.stringify(pick(s, ["email", "firstName", "lastName"])))
            .join(","),
          previous?.signers
            .map((s) => JSON.stringify(pick(s, ["email", "firstName", "lastName"])))
            .join(","),
        ],
        [signatureConfig.title, previous?.title],
        [signatureConfig.letRecipientsChooseSigners, previous?.letRecipientsChooseSigners],
      ].some(([after, before]) => after !== before);

      if (ongoingSignatureRequest && signatureConfigHasChanged) {
        await showConfirmSignatureConfigChanged({});
        await cancelSignatureRequest({
          variables: {
            petitionSignatureRequestId: ongoingSignatureRequest!.id,
          },
        });
      }
      await onUpdatePetition({ signatureConfig });

      if (petition.__typename === "Petition" && ["COMPLETED", "CLOSED"].includes(petition.status)) {
        await startSignatureRequest({ variables: { petitionId: petition.id } });
      }
    } catch {}
  }

  const showConfirmDisableOngoingSignature = useDialog(ConfirmDisableOngoingSignature);
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
  const { customHost } = petition.organization;
  const url = customHost
    ? `${process.env.NODE_ENV === "production" ? "https" : "http"}://${customHost}`
    : process.env.NEXT_PUBLIC_PARALLEL_URL;
  const publicLinkUrl = `${url}/${petition.locale}/pp/${publicLink?.slug}`;

  const onCopyPublicLink = useClipboardWithToast({
    value: publicLinkUrl,
    text: intl.formatMessage({
      id: "component.petition-settings.link-copied-toast",
      defaultMessage: "Link copied to clipboard",
    }),
  });

  const [createPublicPetitionLink] = usePetitionSettings_createPublicPetitionLinkMutation();
  const [updatePublicPetitionLink] = usePetitionSettings_updatePublicPetitionLinkMutation();

  const publicLinkSettingDialog = usePublicLinkSettingsDialog();

  const handleToggleShareByLink = async () => {
    try {
      if (publicLink) {
        if (!publicLink.isActive) {
          const isFieldsValid = await validPetitionFields();
          if (!isFieldsValid) return;
        }

        await updatePublicPetitionLink({
          variables: { publicPetitionLinkId: publicLink.id, isActive: !publicLink.isActive },
        });
      } else {
        const isFieldsValid = await validPetitionFields();
        if (!isFieldsValid) return;

        const _ownerId = petition.owner.id ?? "";

        const publicLinkSettings = await publicLinkSettingDialog({
          ownerId: _ownerId,
          locale: petition.locale,
          petitionName: petition.name ?? null,
          customHost: petition.organization.customHost,
        });

        const { data } = await createPublicPetitionLink({
          variables: {
            templateId: petition.id,
            ...publicLinkSettings,
          },
        });

        if (data) {
          const { publicLink } = data.createPublicPetitionLink;
          onCopyPublicLink({
            value: `${process.env.NEXT_PUBLIC_PARALLEL_URL}/${petition.locale}/pp/${publicLink?.slug}`,
          });
        }
      }
    } catch {}
  };

  const handleEditPublicPetitionLink = async () => {
    if (!publicLink) return;
    try {
      const publicLinkSettings = await publicLinkSettingDialog({
        publicLink: publicLink as PublicLinkSettingsDialog_PublicPetitionLinkFragment,
        locale: petition.locale,
        petitionName: petition.name ?? null,
        customHost: petition.organization.customHost,
      });

      await updatePublicPetitionLink({
        variables: {
          publicPetitionLinkId: publicLink.id,
          ...publicLinkSettings,
        },
      });
    } catch {}
  };

  const isSharedByLink = !!publicLink?.isActive;

  return (
    <Stack padding={4} spacing={4}>
      <FormControl id="petition-locale" isDisabled={isReadOnly}>
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
        </FormLabel>
        <Select
          name="petition-locale"
          value={petition.locale}
          onChange={(event) => onUpdatePetition({ locale: event.target.value as any })}
          isDisabled={isReadOnly}
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
            <FormattedMessage id="petition.deadline-label" defaultMessage="Deadline" />
            <HelpPopover>
              <Text fontSize="sm">
                <FormattedMessage
                  id="component.petition-settings.deadline-description"
                  defaultMessage="This date is used to inform the recipients of the deadline for which you need to have the information."
                />
              </Text>
            </HelpPopover>
          </FormLabel>
          <DeadlineInput
            value={petition.deadline ? new Date(petition.deadline) : null}
            onChange={(value) => onUpdatePetition({ deadline: value?.toISOString() ?? null })}
          />
        </FormControl>
      ) : null}
      <SwitchSetting
        icon={<CommentIcon />}
        title={
          <FormattedMessage
            id="component.petition-settings.petition-comments-enable"
            defaultMessage="Enable comments"
          />
        }
        isChecked={petition.hasCommentsEnabled}
        onChange={async (value) => await onUpdatePetition({ hasCommentsEnabled: value })}
        isDisabled={isReadOnly}
      />
      {petition.signatureConfig || hasSignature ? (
        <Box>
          <SwitchSetting
            icon={<SignatureIcon />}
            title={
              <FormattedMessage
                id="component.petition-settings.petition-signature-enable"
                defaultMessage="Enable eSignature"
              />
            }
            onChange={handleSignatureChange}
            isChecked={Boolean(petition.signatureConfig)}
            isDisabled={!hasSignature}
          />
          <Collapse in={Boolean(petition.signatureConfig)}>
            <Flex justifyContent="center" marginTop={2}>
              <Button onClick={handleConfigureSignatureClick} isDisabled={!hasSignature}>
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
      <SwitchSetting
        isDisabled={petition.__typename === "PetitionTemplate" && petition.isPublic}
        icon={petition.isReadOnly ? <LockClosedIcon /> : <LockOpenIcon />}
        title={
          <FormattedMessage
            id="component.petition-settings.restrict-editing"
            defaultMessage="Restrict editing"
          />
        }
        help={
          <FormattedMessage
            id="component.petition-settings.restrict-editing-description"
            defaultMessage="Enable this option to prevent users from accidentally making changes to this petition."
          />
        }
        isChecked={petition.isReadOnly}
        onChange={async (value) => {
          await onUpdatePetition({ isReadOnly: value });
        }}
      />
      {petition.__typename === "PetitionTemplate" ? (
        <SwitchSetting
          icon={<LinkIcon />}
          title={
            <FormattedMessage
              id="component.petition-settings.share-by-link"
              defaultMessage="Share by link"
            />
          }
          help={
            <FormattedMessage
              id="component.petition-settings.share-by-link-description"
              defaultMessage="Share an open link that allows your clients create petitions by themselves. They will be managed by the owner."
            />
          }
          isChecked={isSharedByLink}
          onChange={handleToggleShareByLink}
        />
      ) : null}
      {isSharedByLink ? (
        <HStack paddingLeft={5}>
          <Input type="text" value={publicLinkUrl} readOnly />
          <CopyToClipboardButton text={publicLinkUrl} />
          <IconButton
            variant="outline"
            aria-label="public link settings"
            onClick={handleEditPublicPetitionLink}
            icon={<SettingsIcon boxSize={"1.125rem"} />}
          />
        </HStack>
      ) : null}
      {user.hasSkipForwardSecurity ? (
        <SwitchSetting
          isDisabled={petition.__typename === "PetitionTemplate" && petition.isPublic}
          icon={<ShieldIcon />}
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
          isDisabled={petition.__typename === "PetitionTemplate" && petition.isPublic}
          icon={<ListIcon />}
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
      hasHideRecipientViewContents: hasFeatureFlag(featureFlag: HIDE_RECIPIENT_VIEW_CONTENTS)
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
      isReadOnly
      name
      organization {
        customHost
      }
      owner {
        id
      }
      ...SignatureConfigDialog_PetitionBase @include(if: $hasPetitionSignature)
      ... on Petition {
        status
        deadline
        currentSignatureRequest @include(if: $hasPetitionSignature) {
          id
          status
        }
      }
      ... on PetitionTemplate {
        isPublic
        publicLink {
          ...PublicLinkSettingsDialog_PublicPetitionLink
        }
      }
    }
    ${PublicLinkSettingsDialog.fragments.PublicPetitionLink}
    ${SignatureConfigDialog.fragments.PetitionBase}
  `,
};
const mutations = [
  gql`
    mutation PetitionSettings_cancelPetitionSignatureRequest($petitionSignatureRequestId: GID!) {
      cancelSignatureRequest(petitionSignatureRequestId: $petitionSignatureRequestId) {
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
  gql`
    mutation PetitionSettings_createPublicPetitionLink(
      $templateId: GID!
      $title: String!
      $description: String!
      $ownerId: GID!
      $otherPermissions: [UserOrUserGroupPublicLinkPermission!]
      $slug: String
    ) {
      createPublicPetitionLink(
        templateId: $templateId
        title: $title
        description: $description
        ownerId: $ownerId
        otherPermissions: $otherPermissions
        slug: $slug
      ) {
        id
        publicLink {
          id
          title
          description
          slug
          linkPermissions {
            permissionType
          }
        }
      }
    }
  `,
  gql`
    mutation PetitionSettings_updatePublicPetitionLink(
      $publicPetitionLinkId: GID!
      $isActive: Boolean
      $title: String
      $description: String
      $ownerId: GID
      $otherPermissions: [UserOrUserGroupPublicLinkPermission!]
      $slug: String
    ) {
      updatePublicPetitionLink(
        publicPetitionLinkId: $publicPetitionLinkId
        isActive: $isActive
        title: $title
        description: $description
        ownerId: $ownerId
        otherPermissions: $otherPermissions
        slug: $slug
      ) {
        id
        title
        description
        slug
        isActive
        linkPermissions {
          permissionType
        }
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
  icon,
  isChecked,
  isDisabled,
  onChange,
}: {
  title: ReactNode;
  help?: ReactNode;
  icon?: ReactNode;
  isChecked: boolean;
  isDisabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <FormControl as={Stack} direction="row" isDisabled={isDisabled}>
      <FormLabel margin={0} display="flex" alignItems="center">
        {icon ? <Flex marginRight={1}>{icon}</Flex> : null}
        {title}
        {help ? (
          <HelpPopover>
            <Text fontSize="sm">{help}</Text>
          </HelpPopover>
        ) : null}
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
          <FormattedMessage id="generic.i-understand" defaultMessage="I understand" />
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
          <FormattedMessage id="generic.i-understand" defaultMessage="I understand" />
        </Button>
      }
      {...props}
    />
  );
}
