import { DataProxy, gql } from "@apollo/client";
import {
  Box,
  Button,
  Center,
  CloseButton,
  Collapse,
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
  UserArrowIcon,
} from "@parallel/chakra/icons";
import {
  PetitionSettings_PetitionBaseFragment,
  PetitionSettings_updatePetitionLink_PetitionTemplateFragment,
  PetitionSettings_UserFragment,
  PublicLinkSettingsDialog_PublicPetitionLinkFragment,
  UpdatePetitionInput,
  usePetitionSettings_cancelPetitionSignatureRequestMutation,
  usePetitionSettings_createPublicPetitionLinkMutation,
  usePetitionSettings_startPetitionSignatureRequestMutation,
  usePetitionSettings_updatePublicPetitionLinkMutation,
  usePetitionSettings_updateTemplateDefaultPermissionsMutation,
} from "@parallel/graphql/__types";
import { assertTypename, assertTypenameArray } from "@parallel/utils/apollo/assertTypename";
import { compareWithFragments } from "@parallel/utils/compareWithFragments";
import { FORMATS } from "@parallel/utils/dates";
import { Maybe } from "@parallel/utils/types";
import { useClipboardWithToast } from "@parallel/utils/useClipboardWithToast";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import { memo, ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { noop, pick } from "remeda";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { CopyToClipboardButton } from "../common/CopyToClipboardButton";
import { DialogProps, useDialog } from "../common/DialogProvider";
import { HelpPopover } from "../common/HelpPopover";
import { usePetitionDeadlineDialog } from "../petition-compose/PetitionDeadlineDialog";
import { SettingsRow, SettingsRowProps } from "../petition-compose/settings/SettingsRow";
import { PublicLinkSettingsDialog, usePublicLinkSettingsDialog } from "./PublicLinkSettingsDialog";
import { SignatureConfigDialog, useSignatureConfigDialog } from "./SignatureConfigDialog";
import {
  TemplateDefaultPermissionsDialog,
  useTemplateDefaultPermissionsDialog,
} from "./TemplateDefaultPermissionsDialog";
import { TestModeSignatureBadge } from "./TestModeSignatureBadge";

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

  const signatureIntegrations = user.organization.signatureIntegrations.items;
  const hasSignature = signatureIntegrations.length > 0;
  const hasDemoSignature =
    signatureIntegrations.length === 1 &&
    signatureIntegrations[0].__typename === "SignatureOrgIntegration" &&
    signatureIntegrations[0].environment === "DEMO";

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
      assertTypenameArray(signatureIntegrations, "SignatureOrgIntegration");
      const signatureConfig = await showSignatureConfigDialog({
        petition,
        providers: signatureIntegrations,
      });

      const previous = petition.signatureConfig;
      const signatureConfigHasChanged = [
        [signatureConfig.orgIntegrationId, previous?.integration?.id],
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

  const onCopyPublicLink = useClipboardWithToast({
    value: petition.__typename === "PetitionTemplate" ? petition.publicLink?.url : "",
    text: intl.formatMessage({
      id: "component.petition-settings.link-copied-toast",
      defaultMessage: "Link copied to clipboard",
    }),
  });

  const hasActivePublicLink = publicLink?.isActive ?? false;
  const [createPublicPetitionLink] = usePetitionSettings_createPublicPetitionLinkMutation();
  const [updatePublicPetitionLink] = usePetitionSettings_updatePublicPetitionLinkMutation();
  const showPublicLinkSettingDialog = usePublicLinkSettingsDialog();
  const handleToggleShareByLink = async () => {
    assertTypename(petition, "PetitionTemplate");
    try {
      if ((publicLink && !publicLink.isActive) || !publicLink) {
        if (!(await validPetitionFields())) {
          return;
        }
      }
      if (publicLink) {
        await updatePublicPetitionLink({
          variables: { publicPetitionLinkId: publicLink.id, isActive: !publicLink.isActive },
          update(cache, result) {
            if (result.data) {
              updatePetitionLinkCache(cache, petition.id, result.data.updatePublicPetitionLink);
            }
          },
        });
      } else {
        const publicLinkSettings = await showPublicLinkSettingDialog({ template: petition });
        const { data } = await createPublicPetitionLink({
          variables: {
            templateId: petition.id,
            ...publicLinkSettings,
          },
          update(cache, result) {
            if (result.data) {
              updatePetitionLinkCache(cache, petition.id, result.data.createPublicPetitionLink);
            }
          },
        });

        if (data) {
          const publicLink = data.createPublicPetitionLink;
          onCopyPublicLink({
            value: `${process.env.NEXT_PUBLIC_PARALLEL_URL}/${petition.locale}/pp/${publicLink?.slug}`,
          });
        }
      }
    } catch {}
  };
  const handleEditPublicPetitionLink = async () => {
    assertTypename(petition, "PetitionTemplate");
    if (!publicLink) {
      return;
    }
    try {
      const publicLinkSettings = await showPublicLinkSettingDialog({
        publicLink: publicLink,
        template: petition,
      });

      await updatePublicPetitionLink({
        variables: {
          publicPetitionLinkId: publicLink.id,
          ...publicLinkSettings,
        },
        update(cache, result) {
          if (result.data) {
            updatePetitionLinkCache(cache, petition.id, result.data.updatePublicPetitionLink);
          }
        },
      });
    } catch {}
  };

  const hasDefaultPermissions =
    petition.__typename === "PetitionTemplate" && petition.defaultPermissions.length > 0;

  const showTemplateDefaultPermissionsDialog = useTemplateDefaultPermissionsDialog();
  const [updateTemplateDefaultPermissions] =
    usePetitionSettings_updateTemplateDefaultPermissionsMutation();
  const handleUpdateTemplateDefaultPermissions = async (enable: boolean) => {
    assertTypename(petition, "PetitionTemplate");
    if (enable) {
      try {
        const { permissions } = await showTemplateDefaultPermissionsDialog({
          permissions: petition.defaultPermissions,
        });
        await updateTemplateDefaultPermissions({
          variables: { templateId: petition.id, permissions },
        });
      } catch {}
    } else {
      await updateTemplateDefaultPermissions({
        variables: { templateId: petition.id, permissions: [] },
      });
    }
  };

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
      <Stack spacing={2}>
        <SwitchSetting
          icon={<CommentIcon />}
          label={
            <FormattedMessage
              id="component.petition-settings.petition-comments-enable"
              defaultMessage="Enable comments"
            />
          }
          controlId="enable-comments"
          isChecked={petition.hasCommentsEnabled}
          onChange={async (value) => await onUpdatePetition({ hasCommentsEnabled: value })}
          isDisabled={isReadOnly}
        />
        {petition.signatureConfig || hasSignature ? (
          <SwitchSetting
            icon={<SignatureIcon />}
            label={
              <HStack>
                <Text as="span">
                  <FormattedMessage
                    id="component.petition-settings.petition-signature-enable"
                    defaultMessage="Enable eSignature"
                  />
                </Text>
                {petition.signatureConfig?.integration?.environment === "DEMO" ||
                hasDemoSignature ? (
                  <TestModeSignatureBadge hasPetitionSignature={user.hasPetitionSignature} />
                ) : null}
              </HStack>
            }
            onChange={handleSignatureChange}
            isChecked={Boolean(petition.signatureConfig)}
            isDisabled={!hasSignature}
            controlId="enable-esignature"
          >
            <Center>
              <Button onClick={handleConfigureSignatureClick} isDisabled={!hasSignature}>
                <Text as="span">
                  <FormattedMessage
                    id="component.petition-settings.petition-signature-configure"
                    defaultMessage="Configure eSignature"
                  />
                </Text>
              </Button>
            </Center>
          </SwitchSetting>
        ) : null}
        <SwitchSetting
          isDisabled={petition.__typename === "PetitionTemplate" && petition.isPublic}
          icon={petition.isReadOnly ? <LockClosedIcon /> : <LockOpenIcon />}
          label={
            <FormattedMessage
              id="component.petition-settings.restrict-editing"
              defaultMessage="Restrict editing"
            />
          }
          description={
            <FormattedMessage
              id="component.petition-settings.restrict-editing-description"
              defaultMessage="Enable this option to prevent users from accidentally making changes to this petition."
            />
          }
          isChecked={petition.isReadOnly}
          onChange={async (value) => {
            await onUpdatePetition({ isReadOnly: value });
          }}
          controlId="restrict-editing"
        />
        {petition.__typename === "PetitionTemplate" ? (
          <SwitchSetting
            icon={<UserArrowIcon />}
            label={
              <FormattedMessage
                id="component.petition-settings.share-automatically"
                defaultMessage="Share automatically"
              />
            }
            description={
              <FormattedMessage
                id="component.petition-settings.share-automatically-description"
                defaultMessage="Specify which users or groups of users the petitions created from this template are shared with"
              />
            }
            isChecked={hasDefaultPermissions}
            onChange={handleUpdateTemplateDefaultPermissions}
            controlId="share-by-link"
          >
            <Center>
              <Button onClick={() => handleUpdateTemplateDefaultPermissions(true)}>
                <FormattedMessage
                  id="component.petition-settings.share-automatically-settings"
                  defaultMessage="Sharing settings"
                />
              </Button>
            </Center>
          </SwitchSetting>
        ) : null}
        {petition.__typename === "PetitionTemplate" ? (
          <SwitchSetting
            icon={<LinkIcon />}
            label={
              <FormattedMessage
                id="component.petition-settings.share-by-link"
                defaultMessage="Share by link"
              />
            }
            description={
              <FormattedMessage
                id="component.petition-settings.share-by-link-description"
                defaultMessage="Share an open link that allows your clients create petitions by themselves. They will be managed by the owner."
              />
            }
            isChecked={hasActivePublicLink}
            onChange={handleToggleShareByLink}
            controlId="share-by-link"
          >
            <HStack paddingLeft={6}>
              <Input type="text" value={petition.publicLink?.url} onChange={noop} />
              <CopyToClipboardButton text={petition.publicLink?.url as string} />
              <IconButton
                variant="outline"
                aria-label="public link settings"
                onClick={handleEditPublicPetitionLink}
                icon={<SettingsIcon boxSize={"1.125rem"} />}
              />
            </HStack>
          </SwitchSetting>
        ) : null}
        {user.hasSkipForwardSecurity ? (
          <SwitchSetting
            isDisabled={petition.__typename === "PetitionTemplate" && petition.isPublic}
            icon={<ShieldIcon />}
            label={
              <FormattedMessage
                id="component.petition-settings.skip-forward-security"
                defaultMessage="Disable Forward Security"
              />
            }
            description={
              <FormattedMessage
                id="component.petition-settings.forward-security-description"
                defaultMessage="Forward security is a security measure that protects the privacy of the data uploaded by the recipient in case they share their personal link by mistake."
              />
            }
            isChecked={petition.skipForwardSecurity}
            onChange={handleSkipForwardSecurityChange}
            controlId="disable-forward-security"
          />
        ) : null}
        {user.hasHideRecipientViewContents ? (
          <SwitchSetting
            isDisabled={petition.__typename === "PetitionTemplate" && petition.isPublic}
            icon={<ListIcon />}
            label={
              <FormattedMessage
                id="component.petition-settings.hide-recipient-view-contents"
                defaultMessage="Hide recipient view contents"
              />
            }
            description={
              <FormattedMessage
                id="component.petition-settings.hide-recipient-view-contents-description"
                defaultMessage="By enabling this, the contents card in the recipient view will be hidden."
              />
            }
            isChecked={petition.isRecipientViewContentsHidden}
            onChange={async (value) =>
              await onUpdatePetition({ isRecipientViewContentsHidden: value })
            }
            controlId="hide-recipient-view-contents"
          />
        ) : null}
      </Stack>
    </Stack>
  );
}

function updatePetitionLinkCache(
  proxy: DataProxy,
  templateId: string,
  publicLink: PublicLinkSettingsDialog_PublicPetitionLinkFragment
) {
  proxy.writeFragment<PetitionSettings_updatePetitionLink_PetitionTemplateFragment>({
    id: templateId,
    fragment: gql`
      fragment PetitionSettings_updatePetitionLink_PetitionTemplate on PetitionTemplate {
        publicLink {
          ...PublicLinkSettingsDialog_PublicPetitionLink
        }
      }
      ${PublicLinkSettingsDialog.fragments.PublicPetitionLink}
    `,
    fragmentName: "PetitionSettings_updatePetitionLink_PetitionTemplate",
    data: { publicLink },
  });
}

const fragments = {
  User: gql`
    fragment PetitionSettings_User on User {
      hasApiTokens: hasFeatureFlag(featureFlag: API_TOKENS)
      hasPetitionSignature: hasFeatureFlag(featureFlag: PETITION_SIGNATURE)
      hasSkipForwardSecurity: hasFeatureFlag(featureFlag: SKIP_FORWARD_SECURITY)
      hasHideRecipientViewContents: hasFeatureFlag(featureFlag: HIDE_RECIPIENT_VIEW_CONTENTS)
      ...TestModeSignatureBadge_User
      organization {
        id
        signatureIntegrations: integrations(type: SIGNATURE, limit: 100) {
          items {
            ... on SignatureOrgIntegration {
              ...SignatureConfigDialog_SignatureOrgIntegration
            }
          }
        }
      }
    }
    ${TestModeSignatureBadge.fragments.User}
    ${SignatureConfigDialog.fragments.SignatureOrgIntegration}
  `,
  PetitionBase: gql`
    fragment PetitionSettings_PetitionBase on PetitionBase {
      id
      locale
      hasCommentsEnabled
      skipForwardSecurity
      isRecipientViewContentsHidden
      isReadOnly
      ...SignatureConfigDialog_PetitionBase
      ... on Petition {
        status
        deadline
        currentSignatureRequest {
          id
          status
        }
      }
      ... on PetitionTemplate {
        isPublic
        ...PublicLinkSettingsDialog_PetitionTemplate
        publicLink {
          id
          url
          isActive
          ...PublicLinkSettingsDialog_PublicPetitionLink
        }
        defaultPermissions {
          ...TemplateDefaultPermissionsDialog_TemplateDefaultPermission
        }
      }
    }
    ${SignatureConfigDialog.fragments.PetitionBase}
    ${PublicLinkSettingsDialog.fragments.PetitionTemplate}
    ${PublicLinkSettingsDialog.fragments.PublicPetitionLink}
    ${TemplateDefaultPermissionsDialog.fragments.PublicPetitionLink}
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
      $slug: String
    ) {
      createPublicPetitionLink(
        templateId: $templateId
        title: $title
        description: $description
        ownerId: $ownerId
        slug: $slug
      ) {
        ...PublicLinkSettingsDialog_PublicPetitionLink
      }
    }
    ${PublicLinkSettingsDialog.fragments.PublicPetitionLink}
  `,
  gql`
    mutation PetitionSettings_updatePublicPetitionLink(
      $publicPetitionLinkId: GID!
      $isActive: Boolean
      $title: String
      $description: String
      $ownerId: GID
      $slug: String
    ) {
      updatePublicPetitionLink(
        publicPetitionLinkId: $publicPetitionLinkId
        isActive: $isActive
        title: $title
        description: $description
        ownerId: $ownerId
        slug: $slug
      ) {
        ...PublicLinkSettingsDialog_PublicPetitionLink
      }
    }
    ${PublicLinkSettingsDialog.fragments.PublicPetitionLink}
  `,
  gql`
    mutation PetitionSettings_updateTemplateDefaultPermissions(
      $templateId: GID!
      $permissions: [UserOrUserGroupPermissionInput!]!
    ) {
      updateTemplateDefaultPermissions(templateId: $templateId, permissions: $permissions) {
        id
        defaultPermissions {
          ...TemplateDefaultPermissionsDialog_TemplateDefaultPermission
        }
      }
    }
    ${TemplateDefaultPermissionsDialog.fragments.PublicPetitionLink}
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

interface SwitchSettingProps extends Omit<SettingsRowProps, "children" | "onChange"> {
  icon?: ReactNode;
  isChecked: boolean;
  onChange: (value: boolean) => void;
  children?: ReactNode;
}

function SwitchSetting({
  label,
  icon,
  isChecked,
  onChange,
  children,
  ...props
}: SwitchSettingProps) {
  return (
    <Box>
      <SettingsRow
        label={
          <Stack direction="row" alignItems="center">
            {icon}
            <Text as="span">{label}</Text>
          </Stack>
        }
        {...props}
      >
        <Switch isChecked={isChecked} onChange={(e) => onChange(e.target.checked)} />
      </SettingsRow>
      {children ? (
        <Collapse in={isChecked}>
          <Box marginTop={2}>{children}</Box>
        </Collapse>
      ) : null}
    </Box>
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
