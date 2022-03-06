import { gql, useMutation } from "@apollo/client";
import {
  Button,
  Center,
  CloseButton,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  BellSettingsIcon,
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
  PetitionSettings_cancelPetitionSignatureRequestDocument,
  PetitionSettings_createPublicPetitionLinkDocument,
  PetitionSettings_PetitionBaseFragment,
  PetitionSettings_startPetitionSignatureRequestDocument,
  PetitionSettings_updatePetitionRestrictionDocument,
  PetitionSettings_updatePublicPetitionLinkDocument,
  PetitionSettings_updateTemplateDefaultPermissionsDocument,
  PetitionSettings_UserFragment,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { assertTypename, assertTypenameArray } from "@parallel/utils/apollo/assertTypename";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { compareWithFragments } from "@parallel/utils/compareWithFragments";
import { FORMATS } from "@parallel/utils/dates";
import { withError } from "@parallel/utils/promises/withError";
import { Maybe } from "@parallel/utils/types";
import { useClipboardWithToast } from "@parallel/utils/useClipboardWithToast";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import { memo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { noop, pick } from "remeda";
import { CopyToClipboardButton } from "../common/CopyToClipboardButton";
import { ConfirmDialog } from "../common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "../common/dialogs/DialogProvider";
import { Divider } from "../common/Divider";
import { HelpPopover } from "../common/HelpPopover";
import { useConfigureRemindersDialog } from "../petition-activity/dialogs/ConfigureRemindersDialog";
import {
  PublicLinkSettingsDialog,
  usePublicLinkSettingsDialog,
} from "../petition-common/dialogs/PublicLinkSettingsDialog";
import {
  SignatureConfigDialog,
  useSignatureConfigDialog,
} from "../petition-common/dialogs/SignatureConfigDialog";
import {
  TemplateDefaultPermissionsDialog,
  useTemplateDefaultPermissionsDialog,
} from "../petition-common/dialogs/TemplateDefaultPermissionsDialog";
import { TestModeSignatureBadge } from "../petition-common/TestModeSignatureBadge";
import { usePetitionDeadlineDialog } from "./dialogs/PetitionDeadlineDialog";
import { useRestrictPetitionDialog } from "./dialogs/RestrictPetitionDialog";
import { usePasswordRestrictPetitionDialog } from "./dialogs/UnrestrictPetitionDialog";
import { SettingsRowSwitch } from "./SettingsRowSwitch";

export interface PetitionSettingsProps {
  user: PetitionSettings_UserFragment;
  petition: PetitionSettings_PetitionBaseFragment;
  onUpdatePetition: (value: UpdatePetitionInput) => void;
  validPetitionFields: () => Promise<boolean>;
  onRefetch: () => Promise<any>;
}

function _PetitionSettings({
  user,
  petition,
  onRefetch,
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
    ["ENQUEUED", "PROCESSING", "PROCESSED"].includes(petition.currentSignatureRequest.status)
      ? petition.currentSignatureRequest
      : null;

  const publicLink = petition.__typename === "PetitionTemplate" ? petition.publicLink : null;

  const isPublicTemplate = petition?.__typename === "PetitionTemplate" && petition.isPublic;

  const showSignatureConfigDialog = useSignatureConfigDialog();
  const showConfirmConfigureOngoingSignature = useDialog(ConfirmConfigureOngoingSignature);
  const showConfirmSignatureConfigChanged = useDialog(ConfirmSignatureConfigChanged);

  const [cancelSignatureRequest] = useMutation(
    PetitionSettings_cancelPetitionSignatureRequestDocument
  );
  const [startSignatureRequest] = useMutation(
    PetitionSettings_startPetitionSignatureRequestDocument
  );

  const [updatePetitionRestriction] = useMutation(
    PetitionSettings_updatePetitionRestrictionDocument
  );

  async function handleConfigureSignatureClick() {
    try {
      if (ongoingSignatureRequest) {
        await showConfirmConfigureOngoingSignature({});
      }
      assertTypenameArray(signatureIntegrations, "SignatureOrgIntegration");
      const signatureConfig = await showSignatureConfigDialog({
        user,
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
        [signatureConfig.allowAdditionalSigners, previous?.allowAdditionalSigners],
      ].some(([after, before]) => after !== before);

      if (ongoingSignatureRequest && signatureConfigHasChanged) {
        await showConfirmSignatureConfigChanged({});
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
    text: intl.formatMessage({
      id: "component.petition-settings.link-copied-toast",
      defaultMessage: "Link copied to clipboard",
    }),
  });

  const hasActivePublicLink = publicLink?.isActive ?? false;
  const [createPublicPetitionLink] = useMutation(PetitionSettings_createPublicPetitionLinkDocument);
  const [updatePublicPetitionLink] = useMutation(
    PetitionSettings_updatePublicPetitionLinkDocument,
    // refetch on updates of public link so the new link owner is correctly passed to the TemplateDefaultPermissionsDialog
    { update: () => onRefetch() }
  );
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
        // if the public link owner is not found, it means its permissions have been modified on the TemplateDefaultPermissionsDialog
        // so, before reactivating the link we need to ask for a new owner
        let ownerId = publicLink.owner?.id;
        if (!ownerId) {
          const { ownerId: newOwnerId } = await showPublicLinkSettingDialog({
            template: petition,
            publicLink,
          });
          ownerId = newOwnerId;
        }
        await updatePublicPetitionLink({
          variables: {
            publicPetitionLinkId: publicLink.id,
            isActive: !publicLink.isActive,
            ownerId: publicLink.owner?.id ?? ownerId,
          },
        });
      } else {
        const publicLinkSettings = await showPublicLinkSettingDialog({ template: petition });
        const { data } = await createPublicPetitionLink({
          variables: {
            templateId: petition.id,
            ...publicLinkSettings,
          },
        });

        if (data) {
          onCopyPublicLink({ value: data.createPublicPetitionLink.url });
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
      });
    } catch {}
  };

  const hasDefaultPermissions =
    petition.__typename === "PetitionTemplate" && petition.defaultPermissions.length > 0;

  const showTemplateDefaultPermissionsDialog = useTemplateDefaultPermissionsDialog();
  const [updateTemplateDefaultPermissions] = useMutation(
    PetitionSettings_updateTemplateDefaultPermissionsDocument,
    { update: () => onRefetch() }
  );
  const handleUpdateTemplateDefaultPermissions = async (enable: boolean) => {
    assertTypename(petition, "PetitionTemplate");
    if (enable) {
      try {
        await showTemplateDefaultPermissionsDialog({
          userId: user.id,
          permissions: petition.defaultPermissions,
          publicLink: petition.publicLink,
          onUpdatePermissions: async (permissions) => {
            const { data } = await updateTemplateDefaultPermissions({
              variables: { templateId: petition.id, permissions },
            });
            return data!.updateTemplateDefaultPermissions.defaultPermissions;
          },
        });
      } catch {}
    } else {
      await updateTemplateDefaultPermissions({
        variables: { templateId: petition.id, permissions: [] },
      });
    }
  };

  const configureRemindersDialog = useConfigureRemindersDialog();

  const handleAutomaticReminders = async (value: boolean) => {
    if (value) {
      handleConfigureAutomaticReminders();
    } else {
      await withError(() => onUpdatePetition({ remindersConfig: null }));
    }
  };

  const handleConfigureAutomaticReminders = async () => {
    assertTypename(petition, "PetitionTemplate");
    try {
      //show reminders dialog
      const remindersConfig = await configureRemindersDialog({
        accesses: [],
        defaultRemindersConfig: petition.remindersConfig ?? null,
        remindersActive: true,
        hideRemindersActiveCheckbox: true,
      });
      delete remindersConfig?.__typename;
      await onUpdatePetition({ remindersConfig });
    } catch {}
  };

  const configRestrictPetitionDialog = useRestrictPetitionDialog();
  const passwordRestrictPetitionDialog = usePasswordRestrictPetitionDialog();
  const genericErrorToast = useGenericErrorToast();

  const handleUnrestrictPetition = async (password: string | null) => {
    try {
      await updatePetitionRestriction({
        variables: {
          petitionId: petition.id,
          isRestricted: false,
          password: password,
        },
      });
      return true;
    } catch (error) {
      if (
        isApolloError(error) &&
        error.graphQLErrors[0]?.extensions?.code === "INVALID_PETITION_RESTRICTION_PASSWORD"
      ) {
        return false;
      } else {
        genericErrorToast();
      }
      return false;
    }
  };
  const handleRestrictPetition = async (value: boolean) => {
    try {
      if (value) {
        const { password } = await configRestrictPetitionDialog({});
        await updatePetitionRestriction({
          variables: {
            petitionId: petition.id,
            isRestricted: true,
            password: password,
          },
        });
      } else {
        if (petition.isRestrictedWithPassword) {
          await passwordRestrictPetitionDialog({
            onUnrestrictPetition: handleUnrestrictPetition,
          });
        } else {
          await handleUnrestrictPetition(null);
        }
      }
    } catch {}
  };

  const restrictEditingSwitch = (
    <SettingsRowSwitch
      isDisabled={isPublicTemplate}
      icon={petition.isRestricted ? <LockClosedIcon /> : <LockOpenIcon />}
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
      isChecked={petition.isRestricted}
      onChange={handleRestrictPetition}
      controlId="restrict-editing"
    />
  );

  return (
    <Stack padding={4} spacing={2}>
      {petition.__typename === "PetitionTemplate" ? (
        <>
          <Heading as="h5" size="sm">
            <FormattedMessage
              id="component.petition-settings.adjustments-template"
              defaultMessage="Template settings"
            />
          </Heading>
          {restrictEditingSwitch}
          <SettingsRowSwitch
            data-section="share-by-link"
            isDisabled={isPublicTemplate || petition.isRestricted}
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
                isDisabled={isPublicTemplate || petition.isRestricted}
              />
            </HStack>
          </SettingsRowSwitch>
          <Divider paddingTop={2} />
          <Heading as="h5" size="sm" paddingTop={2}>
            <FormattedMessage
              id="component.petition-settings.adjustments-petitions"
              defaultMessage="Petition settings"
            />
          </Heading>
        </>
      ) : null}

      <FormControl id="petition-locale" isDisabled={petition.isRestricted}>
        <FormLabel display="flex" alignItems="center">
          <FormattedMessage
            id="component.petition-settings.locale-label"
            defaultMessage="Language used in the communications"
          />
        </FormLabel>
        <Select
          name="petition-locale"
          value={petition.locale}
          onChange={(event) => onUpdatePetition({ locale: event.target.value as any })}
          isDisabled={petition.isRestricted || isPublicTemplate}
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
              <FormattedMessage
                id="component.petition-settings.deadline-description"
                defaultMessage="This date is used to inform the recipients of the deadline for which you need to have the information."
              />
            </HelpPopover>
          </FormLabel>
          <DeadlineInput
            value={petition.deadline ? new Date(petition.deadline) : null}
            onChange={(value) => onUpdatePetition({ deadline: value?.toISOString() ?? null })}
          />
        </FormControl>
      ) : null}
      {petition.__typename === "PetitionTemplate" ? (
        <SettingsRowSwitch
          data-section="share-automatically"
          isDisabled={isPublicTemplate || petition.isRestricted}
          icon={<UserArrowIcon />}
          label={
            <FormattedMessage
              id="component.petition-settings.share-automatically"
              defaultMessage="Assign automatically to"
            />
          }
          description={
            <FormattedMessage
              id="component.petition-settings.share-automatically-description"
              defaultMessage="Specify which users or teams the petitions created from this template are shared with"
            />
          }
          isChecked={hasDefaultPermissions}
          onChange={handleUpdateTemplateDefaultPermissions}
          controlId="share-automatically"
        >
          <Center>
            <Button
              onClick={() => handleUpdateTemplateDefaultPermissions(true)}
              isDisabled={isPublicTemplate || petition.isRestricted}
            >
              <FormattedMessage
                id="component.petition-settings.share-automatically-settings"
                defaultMessage="Sharing settings"
              />
            </Button>
          </Center>
        </SettingsRowSwitch>
      ) : (
        restrictEditingSwitch
      )}
      {petition.signatureConfig || hasSignature ? (
        <SettingsRowSwitch
          data-section="esignature-settings"
          isDisabled={!hasSignature || isPublicTemplate}
          icon={<SignatureIcon />}
          label={
            <HStack>
              <Text as="span">
                <FormattedMessage
                  id="component.petition-settings.petition-signature-enable"
                  defaultMessage="Include eSignature process"
                />
              </Text>
              <HelpPopover>
                <FormattedMessage
                  id="component.petition-settings.signature-description"
                  defaultMessage="Generates a document and initiates an eSignature process upon completion of the petition."
                />
              </HelpPopover>
              {petition.signatureConfig?.integration?.environment === "DEMO" || hasDemoSignature ? (
                <TestModeSignatureBadge hasPetitionSignature={user.hasPetitionSignature} />
              ) : null}
            </HStack>
          }
          onChange={handleSignatureChange}
          isChecked={Boolean(petition.signatureConfig)}
          controlId="enable-esignature"
        >
          <Center>
            <Button
              onClick={handleConfigureSignatureClick}
              isDisabled={!hasSignature || isPublicTemplate}
            >
              <Text as="span">
                <FormattedMessage
                  id="component.petition-settings.petition-signature-configure"
                  defaultMessage="Configure eSignature"
                />
              </Text>
            </Button>
          </Center>
        </SettingsRowSwitch>
      ) : null}
      {petition.__typename === "PetitionTemplate" ? (
        <SettingsRowSwitch
          isDisabled={isPublicTemplate}
          icon={<BellSettingsIcon />}
          label={
            <FormattedMessage
              id="component.petition-settings.automatic-reminders"
              defaultMessage="Enable automatic reminders"
            />
          }
          isChecked={Boolean(petition.remindersConfig)}
          onChange={handleAutomaticReminders}
          controlId="automatic-reminders"
        >
          <Center>
            <Button onClick={handleConfigureAutomaticReminders} isDisabled={isPublicTemplate}>
              <Text as="span">
                <FormattedMessage
                  id="component.petition-settings.automatic-reminders-configure"
                  defaultMessage="Configure reminders"
                />
              </Text>
            </Button>
          </Center>
        </SettingsRowSwitch>
      ) : null}
      {user.hasSkipForwardSecurity ? (
        <SettingsRowSwitch
          isDisabled={isPublicTemplate}
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
        <SettingsRowSwitch
          isDisabled={isPublicTemplate}
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
  );
}

const fragments = {
  User: gql`
    fragment PetitionSettings_User on User {
      id
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
      ...SignatureConfigDialog_User
    }
    ${TestModeSignatureBadge.fragments.User}
    ${SignatureConfigDialog.fragments.SignatureOrgIntegration}
    ${SignatureConfigDialog.fragments.User}
  `,
  PetitionBase: gql`
    fragment PetitionSettings_PetitionBase on PetitionBase {
      id
      locale
      skipForwardSecurity
      isRecipientViewContentsHidden
      isRestricted
      isRestrictedWithPassword
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
        remindersConfig {
          offset
          time
          timezone
          weekdaysOnly
        }
        publicLink {
          id
          url
          isActive
          ...PublicLinkSettingsDialog_PublicPetitionLink
          ...TemplateDefaultPermissionsDialog_PublicPetitionLink
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
    ${TemplateDefaultPermissionsDialog.fragments.TemplateDefaultPermission}
  `,
};
const mutations = [
  gql`
    mutation PetitionSettings_updatePetitionRestriction(
      $petitionId: GID!
      $isRestricted: Boolean!
      $password: String
    ) {
      updatePetitionRestriction(
        petitionId: $petitionId
        isRestricted: $isRestricted
        password: $password
      ) {
        id
        isRestricted
        isRestrictedWithPassword
      }
    }
  `,
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
        template {
          id
          publicLink {
            id
          }
        }
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
        template {
          id
          publicLink {
            id
          }
        }
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
        publicLink {
          id
          isActive
        }
      }
    }
    ${TemplateDefaultPermissionsDialog.fragments.TemplateDefaultPermission}
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
