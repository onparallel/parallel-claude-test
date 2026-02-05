import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  HStack,
  Heading,
  Input,
  InputGroup,
  InputRightAddon,
  InputRightElement,
  Stack,
  useToast,
} from "@chakra-ui/react";
import { Select } from "@parallel/chakra/components";
import {
  ArrowShortRightIcon,
  BellSettingsIcon,
  DocumentIcon,
  EmailIcon,
  FieldDateIcon,
  FieldNumberIcon,
  FolderIcon,
  LinkIcon,
  ListIcon,
  LockClosedIcon,
  LockOpenIcon,
  MoreIcon,
  ShieldIcon,
  ShortSearchIcon,
  SignatureIcon,
  ThumbsUpIcon,
  TimeIcon,
  UserPlusIcon,
} from "@parallel/chakra/icons";
import {
  PetitionSettings_PetitionBaseFragment,
  PetitionSettings_PetitionBaseFragmentDoc,
  PetitionSettings_UserFragment,
  PetitionSettings_UserFragmentDoc,
  PetitionSettings_createPublicPetitionLinkDocument,
  PetitionSettings_enableAutomaticNumberingOnPetitionFieldsDocument,
  PetitionSettings_updatePetitionRestrictionDocument,
  PetitionSettings_updatePublicPetitionLinkDocument,
  PetitionSettings_updateTemplateDefaultPermissionsDocument,
  PetitionSettings_updateTemplateDocumentThemeDocument,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { assertTypename } from "@parallel/utils/apollo/typename";
import { FORMATS } from "@parallel/utils/dates";
import { useAvailablePetitionLocales } from "@parallel/utils/locales";
import { memoWithFragments } from "@parallel/utils/memoWithFragments";
import { withError } from "@parallel/utils/promises/withError";
import { Maybe } from "@parallel/utils/types";
import { useClipboardWithToast } from "@parallel/utils/useClipboardWithToast";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, pick } from "remeda";
import { CloseButton } from "../common/CloseButton";
import { CopyToClipboardButton } from "../common/CopyToClipboardButton";
import { Divider } from "../common/Divider";
import { HelpPopover } from "../common/HelpPopover";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { NormalLink } from "../common/Link";
import { PathName } from "../common/PathName";
import { ConfirmDialog } from "../common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "../common/dialogs/DialogProvider";
import { useConfigureRemindersDialog } from "../petition-activity/dialogs/ConfigureRemindersDialog";
import { TestModeSignatureBadge } from "../petition-common/TestModeSignatureBadge";
import { usePublicLinkSettingsDialog } from "../petition-common/dialogs/PublicLinkSettingsDialog";
import { useSelectFolderDialog } from "../petition-common/dialogs/SelectFolderDialog";
import { useSignatureConfigDialog } from "../petition-common/dialogs/SignatureConfigDialog";
import { useTemplateDefaultPermissionsDialog } from "../petition-common/dialogs/TemplateDefaultPermissionsDialog";
import { useCompliancePeriodDialog } from "./dialogs/CompliancePeriodDialog";
import { useConfigureApprovalStepsDialog } from "./dialogs/ConfigureApprovalStepsDialog";
import { useConfigureAutomaticNumberingDialog } from "./dialogs/ConfigureAutomaticNumberingDialog";
import { usePetitionDeadlineDialog } from "./dialogs/PetitionDeadlineDialog";
import { useRestrictPetitionDialog } from "./dialogs/RestrictPetitionDialog";
import { usePasswordRestrictPetitionDialog } from "./dialogs/UnrestrictPetitionDialog";
import { SettingsRow } from "./settings/rows/SettingsRow";
import { SettingsRowButton } from "./settings/rows/SettingsRowButton";
import { SettingsRowSwitch } from "./settings/rows/SettingsRowSwitch";
import { Text } from "@parallel/components/ui";

export interface PetitionSettingsProps {
  user: PetitionSettings_UserFragment;
  petition: PetitionSettings_PetitionBaseFragment;
  onUpdatePetition: (value: UpdatePetitionInput) => Promise<void>;
  validPetitionFields: () => Promise<boolean>;
  onRefetch: () => Promise<any>;
  isDisabled?: boolean;
}

function _PetitionSettings({
  user,
  petition,
  onRefetch,
  onUpdatePetition,
  validPetitionFields,
  isDisabled,
}: PetitionSettingsProps) {
  const locales = useAvailablePetitionLocales(user);
  const intl = useIntl();

  const signatureIntegrations = user.organization.signatureIntegrations.items;
  const hasSignatureIntegrations = signatureIntegrations.length > 0;
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

  const myEffectivePermission = petition.myEffectivePermission!.permissionType;

  const publicLink = petition.__typename === "PetitionTemplate" ? petition.publicLink : null;

  const isPublicTemplate = petition?.__typename === "PetitionTemplate" && petition.isPublic;

  const showSignatureConfigDialog = useSignatureConfigDialog();

  const [updatePetitionRestriction] = useMutation(
    PetitionSettings_updatePetitionRestrictionDocument,
  );

  async function handleConfigureSignatureClick() {
    try {
      const signatureConfig = await showSignatureConfigDialog({
        petitionId: petition.id,
      });

      await onUpdatePetition({ signatureConfig });
    } catch {}
  }

  async function handleSignatureChange(value: boolean) {
    if (value) {
      await handleConfigureSignatureClick();
    } else {
      try {
        await onUpdatePetition({
          // everything the same, except isEnabled: false
          signatureConfig: petition.signatureConfig
            ? {
                ...pick(petition.signatureConfig, [
                  "allowAdditionalSigners",
                  "instructions",
                  "minSigners",
                  "review",
                  "reviewAfterApproval",
                  "signingMode",
                  "title",
                  "useCustomDocument",
                ]),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                signersInfo: petition.signatureConfig.signers
                  .filter(isNonNullish)
                  .map(
                    pick([
                      "firstName",
                      "lastName",
                      "email",
                      "contactId",
                      "isPreset",
                      "signWithDigitalCertificate",
                      "signWithEmbeddedImageFileUploadId",
                    ]),
                  ),
                orgIntegrationId: petition.signatureConfig.integration!.id,
                isEnabled: false,
              }
            : null,
        });
      } catch {}
    }
  }

  const showConfirmSkipForwardSecurity = useDialog(ConfirmSkipForwardSecurity);
  async function handleSkipForwardSecurityChange(value: boolean) {
    try {
      if (value) {
        await showConfirmSkipForwardSecurity();
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
    { update: () => onRefetch() },
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
        await updatePublicPetitionLink({
          variables: {
            publicPetitionLinkId: publicLink.id,
            isActive: !publicLink.isActive,
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
    { update: () => onRefetch() },
  );
  const handleUpdateTemplateDefaultPermissions = async (enable: boolean) => {
    assertTypename(petition, "PetitionTemplate");
    if (enable) {
      try {
        await showTemplateDefaultPermissionsDialog({
          petitionId: petition.id,
          userId: user.id,
          onUpdatePermissions: async (permissions) => {
            await updateTemplateDefaultPermissions({
              variables: { templateId: petition.id, permissions },
            });
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
  const showGenericErrorToast = useGenericErrorToast();

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
        error.errors[0]?.extensions?.code === "INVALID_PETITION_RESTRICTION_PASSWORD"
      ) {
        return false;
      } else {
        showGenericErrorToast(error);
      }
      return false;
    }
  };
  const handleRestrictPetition = async (value: boolean) => {
    try {
      if (value) {
        const { password } = await configRestrictPetitionDialog();
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

  const toast = useToast();
  const showConfigCompliancePeriodDialog = useCompliancePeriodDialog();
  const handleConfigCompliancePeriod = async (showDialog: boolean) => {
    try {
      if (showDialog) {
        const data = await showConfigCompliancePeriodDialog({ petition });
        await onUpdatePetition({
          anonymizeAfterMonths: data.anonymizeAfterMonths,
          anonymizePurpose: data.anonymizePurpose,
        });
      } else {
        await onUpdatePetition({
          anonymizeAfterMonths: null,
          anonymizePurpose: null,
        });
      }
      toast({
        status: "success",
        isClosable: true,
        title: intl.formatMessage({
          id: "component.petition-settings.compliance-updated-toast-title",
          defaultMessage: "Changes saved correctly",
        }),
        description: intl.formatMessage({
          id: "component.petition-settings.compliance-updated-toast-description",
          defaultMessage: "Compliance period successfully updated.",
        }),
        duration: 5000,
      });
    } catch {}
  };

  const [updateTemplateDocumentTheme] = useMutation(
    PetitionSettings_updateTemplateDocumentThemeDocument,
  );

  async function handleUpdateTemplateDocumentTheme(orgThemeId: string) {
    await withError(
      updateTemplateDocumentTheme({
        variables: {
          templateId: petition.id,
          orgThemeId,
        },
      }),
    );
  }

  const showSelectFolderDialog = useSelectFolderDialog();
  async function handleChangeDefaultPath() {
    try {
      assertTypename(petition, "PetitionTemplate");
      const path = await showSelectFolderDialog({
        currentPath: petition.defaultPath,
        type: "PETITION",
      });
      await onUpdatePetition({ defaultPath: path });
    } catch {}
  }

  const showConfigureAutomaticNumberingDialog = useConfigureAutomaticNumberingDialog();
  const handleAutomaticNumberingChange = async (value: boolean) => {
    if (value) {
      handleConfigureAutomaticNumberingClick();
    } else {
      await onUpdatePetition({ automaticNumberingConfig: null });
    }
  };

  const [enableAutomaticNumberingOnPetitionFields] = useMutation(
    PetitionSettings_enableAutomaticNumberingOnPetitionFieldsDocument,
  );
  const handleConfigureAutomaticNumberingClick = async () => {
    try {
      const { numberingType, updateExistingFields } = await showConfigureAutomaticNumberingDialog({
        numberingType: petition.automaticNumberingConfig?.numberingType,
      });
      await onUpdatePetition({
        automaticNumberingConfig: {
          numberingType,
        },
      });
      if (updateExistingFields) {
        await enableAutomaticNumberingOnPetitionFields({ variables: { petitionId: petition.id } });
      }
    } catch {}
  };

  const showConfigureApprovalStepsDialog = useConfigureApprovalStepsDialog();
  const handleUpdateApprovalSteps = async (enable: boolean) => {
    assertTypename(petition, "PetitionTemplate");
    if (enable) {
      try {
        const approvalFlowConfig = await showConfigureApprovalStepsDialog({
          petitionId: petition.id,
        });

        await onUpdatePetition({
          approvalFlowConfig: approvalFlowConfig.length > 0 ? approvalFlowConfig : null,
        });
      } catch {}
    } else {
      try {
        await onUpdatePetition({
          approvalFlowConfig: null,
        });
      } catch {}
    }
  };

  return (
    <Stack padding={4} spacing={2}>
      <Heading as="h5" size="sm" marginY={1.5}>
        <FormattedMessage
          id="component.petition-settings.process-settings"
          defaultMessage="Process settings"
        />
      </Heading>
      <SettingsRowSwitch
        isDisabled={
          isPublicTemplate ||
          petition.isAnonymized ||
          myEffectivePermission === "READ" ||
          isNonNullish(petition.permanentDeletionAt)
        }
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
            defaultMessage="Enable this option to prevent users from accidentally making changes to this {isTemplate, select, true{template} other{parallel}}."
            values={{ isTemplate: petition.__typename === "PetitionTemplate" }}
          />
        }
        isChecked={petition.isRestricted}
        onChange={handleRestrictPetition}
        controlId="restrict-editing"
        data-section="restrict-editing"
      />

      {petition.__typename === "PetitionTemplate" ? (
        <SettingsRowSwitch
          isDisabled={isDisabled}
          icon={<ShortSearchIcon />}
          label={
            <FormattedMessage
              id="component.petition-settings.review-flow"
              defaultMessage="Review flow"
            />
          }
          description={
            <>
              <Text fontSize="sm" marginBottom={2}>
                <FormattedMessage
                  id="component.petition-settings.review-flow-description"
                  defaultMessage="Enable this option if the process requires someone to review the answers."
                />
              </Text>
              <Text fontSize="sm">
                <FormattedMessage
                  id="component.petition-settings.help-us-tailor-options"
                  defaultMessage="Disabling it will help us tailor the options your process needs."
                />
              </Text>
            </>
          }
          isChecked={petition.isReviewFlowEnabled}
          onChange={(value) => withError(onUpdatePetition({ isReviewFlowEnabled: value }))}
          controlId="review-flow"
        />
      ) : null}

      {user.hasPetitionApprovalFlow && petition.__typename === "PetitionTemplate" ? (
        <SettingsRowButton
          data-section="approval-steps"
          isDisabled={isDisabled}
          icon={<ThumbsUpIcon />}
          label={
            <FormattedMessage
              id="component.petition-settings.approval-steps"
              defaultMessage="Approval steps"
            />
          }
          description={
            <>
              <Text fontSize="sm" marginBottom={2}>
                <FormattedMessage
                  id="component.petition-settings.approval-steps-description-1"
                  defaultMessage="Add approval steps to assign approvers to evaluate the process."
                />
              </Text>
              <Text fontSize="sm">
                <FormattedMessage
                  id="component.petition-settings.approval-steps-description-2"
                  defaultMessage="The parallel cannot be closed until all approval steps have been completed."
                />
              </Text>
            </>
          }
          controlId="approval-steps"
          isActive={isNonNullish(petition.approvalFlowConfig)}
          onAdd={() => handleUpdateApprovalSteps(true)}
          onRemove={() => handleUpdateApprovalSteps(false)}
          onConfig={() => handleUpdateApprovalSteps(true)}
        />
      ) : null}

      {petition.__typename === "PetitionTemplate" ? (
        <SettingsRowButton
          data-section="share-automatically"
          isDisabled={isDisabled}
          icon={<ArrowShortRightIcon />}
          label={
            <FormattedMessage
              id="component.petition-settings.share-automatically"
              defaultMessage="Assign automatically to"
            />
          }
          description={
            <FormattedMessage
              id="component.petition-settings.share-automatically-description"
              defaultMessage="Specify which users or teams the parallels created from this template are shared with."
            />
          }
          controlId="share-automatically"
          isActive={hasDefaultPermissions}
          onAdd={() => handleUpdateTemplateDefaultPermissions(true)}
          onRemove={() => handleUpdateTemplateDefaultPermissions(false)}
          onConfig={() => handleUpdateTemplateDefaultPermissions(true)}
        />
      ) : null}

      {petition.__typename === "PetitionTemplate" ? (
        <SettingsRow
          controlId="default-path"
          isDisabled={isDisabled}
          icon={<FolderIcon />}
          label={
            <FormattedMessage
              id="component.petition-settings.default-path"
              defaultMessage="Default folder"
            />
          }
        >
          <HStack minWidth={0} spacing={2}>
            <PathName
              as={Box}
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              overflow="hidden"
              type="PETITION"
              fontWeight={500}
              path={petition.defaultPath}
              tooltipPlacement="bottom-start"
            />

            <IconButtonWithTooltip
              size="xs"
              fontSize="md"
              placement="bottom-start"
              fontWeight={400}
              id="default-path"
              label={intl.formatMessage({ id: "generic.change", defaultMessage: "Change" })}
              icon={<MoreIcon />}
              onClick={handleChangeDefaultPath}
              isDisabled={
                petition.isRestricted ||
                isPublicTemplate ||
                myEffectivePermission === "READ" ||
                isNonNullish(petition.permanentDeletionAt)
              }
            />
          </HStack>
        </SettingsRow>
      ) : null}
      {!petition.isDocumentGenerationEnabled &&
      !petition.isInteractionWithRecipientsEnabled ? null : (
        <SettingsRow
          controlId="petition-locale"
          isDisabled={isDisabled}
          icon={<EmailIcon />}
          label={
            <FormattedMessage
              id="component.petition-settings.locale-label"
              defaultMessage="Communications language"
            />
          }
        >
          <Box>
            <Select
              size="sm"
              borderRadius="md"
              name="petition-locale"
              minWidth="120px"
              value={petition.locale}
              onChange={(e) => withError(() => onUpdatePetition({ locale: e.target.value as any }))}
            >
              {locales.map((locale) => (
                <option key={locale.key} value={locale.key}>
                  {locale.localizedLabel}
                </option>
              ))}
            </Select>
          </Box>
        </SettingsRow>
      )}

      <Divider />
      <SettingsRowSwitch
        isDisabled={isDisabled || petition.__typename === "Petition"}
        label={
          <Heading as="h5" size="sm">
            <FormattedMessage
              id="component.petition-settings.interaction-with-recipients"
              defaultMessage="Interaction with recipients"
            />
          </Heading>
        }
        description={
          petition.__typename === "Petition" ? (
            <FormattedMessage
              id="component.petition-settings.setting-determined-by-template"
              defaultMessage="This setting is determined by the template and cannot be changed."
            />
          ) : (
            <>
              <Text fontSize="sm" marginBottom={2}>
                <FormattedMessage
                  id="component.petition-settings.interaction-with-recipients-description"
                  defaultMessage="Enable this option if the process requires recipients to reply the form."
                />
              </Text>
              <Text fontSize="sm">
                <FormattedMessage
                  id="component.petition-settings.help-us-tailor-options"
                  defaultMessage="Disabling it will help us tailor the options your process needs."
                />
              </Text>
            </>
          )
        }
        isChecked={petition.isInteractionWithRecipientsEnabled}
        onChange={(value) => {
          withError(
            onUpdatePetition({
              isInteractionWithRecipientsEnabled: value,
              remindersConfig: null,
            }),
          );
        }}
        controlId="interaction-with-recipients"
      />

      {petition.isInteractionWithRecipientsEnabled ? (
        <>
          {petition.__typename === "PetitionTemplate" ? (
            <>
              <SettingsRowButton
                data-section="share-by-link"
                isDisabled={isDisabled}
                icon={<LinkIcon />}
                label={
                  <FormattedMessage id="generic.share-by-link" defaultMessage="Share by link" />
                }
                description={
                  <FormattedMessage
                    id="component.petition-settings.share-by-link-description"
                    defaultMessage="Share an open link that allows your clients create parallels by themselves. They will be managed by the owner."
                  />
                }
                isActive={hasActivePublicLink}
                onAdd={handleToggleShareByLink}
                onRemove={handleToggleShareByLink}
                onConfig={handleEditPublicPetitionLink}
                controlId="share-by-link"
              >
                <InputGroup size="sm">
                  <Input size="sm" borderRadius="md" type="text" value={petition.publicLink?.url} />
                  <InputRightAddon borderRadius="md" padding={0}>
                    <CopyToClipboardButton
                      size="sm"
                      border={"1px solid"}
                      borderColor="inherit"
                      borderStartRadius={0}
                      text={petition.publicLink?.url as string}
                    />
                  </InputRightAddon>
                </InputGroup>
              </SettingsRowButton>
              <SettingsRowButton
                isDisabled={isDisabled}
                icon={<BellSettingsIcon />}
                label={
                  <FormattedMessage
                    id="component.petition-settings.automatic-reminders"
                    defaultMessage="Automatic reminders"
                  />
                }
                isActive={Boolean(petition.remindersConfig)}
                onAdd={() => handleAutomaticReminders(true)}
                onRemove={() => handleAutomaticReminders(false)}
                onConfig={() => handleConfigureAutomaticReminders()}
                controlId="automatic-reminders"
              />
            </>
          ) : null}
          {user.hasSkipForwardSecurity ? (
            <SettingsRowSwitch
              isDisabled={isDisabled}
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
              isDisabled={isDisabled}
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
              onChange={(value) =>
                withError(onUpdatePetition({ isRecipientViewContentsHidden: value }))
              }
              controlId="hide-recipient-view-contents"
            />
          ) : null}
          {user.hasSettingDelegateAccess ? (
            <SettingsRowSwitch
              isDisabled={isDisabled}
              icon={<UserPlusIcon />}
              label={
                <FormattedMessage
                  id="component.petition-settings.delegate-access"
                  defaultMessage="Allow inviting collaborators"
                />
              }
              description={
                <FormattedMessage
                  id="component.petition-settings.delegate-access-description"
                  defaultMessage="By enabling this, the recipient can invite a collaborator to help them respond."
                />
              }
              isChecked={petition.isDelegateAccessEnabled}
              onChange={(value) => withError(onUpdatePetition({ isDelegateAccessEnabled: value }))}
              controlId="delegate-access"
            />
          ) : null}
        </>
      ) : null}
      <Divider />
      <SettingsRowSwitch
        isDisabled={isDisabled || petition.__typename === "Petition"}
        label={
          <Heading as="h5" size="sm">
            <FormattedMessage
              id="component.petition-settings.document-generation"
              defaultMessage="Document generation"
            />
          </Heading>
        }
        description={
          petition.__typename === "Petition" ? (
            <FormattedMessage
              id="component.petition-settings.setting-determined-by-template"
              defaultMessage="This setting is determined by the template and cannot be changed."
            />
          ) : (
            <>
              <Text fontSize="sm" marginBottom={2}>
                <FormattedMessage
                  id="component.petition-settings.document-generation-description"
                  defaultMessage="Enable this option if the process requires the generation of a document."
                />
              </Text>
              <Text fontSize="sm">
                <FormattedMessage
                  id="component.petition-settings.help-us-tailor-options"
                  defaultMessage="Disabling it will help us tailor the options your process needs."
                />
              </Text>
            </>
          )
        }
        isChecked={petition.isDocumentGenerationEnabled}
        onChange={(value) =>
          withError(onUpdatePetition({ isDocumentGenerationEnabled: value, signatureConfig: null }))
        }
        controlId="interaction-with-recipients"
      />

      {petition.isDocumentGenerationEnabled ? (
        <>
          {petition.__typename === "PetitionTemplate" ? (
            <SettingsRow
              controlId="template-document-theme"
              isDisabled={isDisabled}
              icon={<DocumentIcon />}
              label={
                <FormattedMessage
                  id="component.petition-settings.document-theme-label"
                  defaultMessage="Document theme"
                />
              }
              description={
                <FormattedMessage
                  id="component.petition-settings.document-theme-popover"
                  defaultMessage="Select the theme to be used in the document. You can design your themes in the <Link>Document Branding</Link>"
                  values={{
                    Link: (chunks: any[]) => (
                      <NormalLink
                        role="a"
                        href={`/${intl.locale}/app/organization/branding?style=document`}
                        target="_blank"
                      >
                        {chunks}
                      </NormalLink>
                    ),
                  }}
                />
              }
            >
              <Box>
                <Select
                  size="sm"
                  borderRadius="md"
                  minWidth="120px"
                  value={petition.selectedDocumentTheme.id}
                  onChange={(event) => handleUpdateTemplateDocumentTheme(event.target.value)}
                >
                  {user.organization.pdfDocumentThemes.map((theme) => (
                    <option key={theme.id} value={theme.id}>
                      {theme.name}
                    </option>
                  ))}
                </Select>
              </Box>
            </SettingsRow>
          ) : null}

          {petition.signatureConfig?.isEnabled || hasSignatureIntegrations ? (
            <SettingsRowButton
              data-section="esignature-settings"
              isDisabled={
                !hasSignatureIntegrations ||
                isDisabled ||
                ongoingSignatureRequest?.status === "ENQUEUED"
              }
              icon={<SignatureIcon />}
              label={
                <HStack>
                  <Text as="span">
                    <FormattedMessage
                      id="component.petition-settings.petition-signature-enable"
                      defaultMessage="eSignature process"
                    />
                  </Text>
                  <HelpPopover popoverWidth="2xs">
                    <FormattedMessage
                      id="component.petition-settings.signature-description"
                      defaultMessage="Generates a document and initiates an eSignature process upon completion of the parallel, through one of our integrated providers."
                    />
                  </HelpPopover>
                  {petition.signatureConfig?.integration?.environment === "DEMO" ||
                  hasDemoSignature ? (
                    <TestModeSignatureBadge hasPetitionSignature={user.hasPetitionSignature} />
                  ) : null}
                </HStack>
              }
              isActive={Boolean(petition.signatureConfig?.isEnabled)}
              onAdd={() => handleSignatureChange(true)}
              onRemove={() => handleSignatureChange(false)}
              onConfig={() => handleConfigureSignatureClick()}
              controlId="enable-esignature"
            />
          ) : null}

          <SettingsRowButton
            data-section="auto-enumeration-settings"
            isDisabled={isDisabled}
            icon={<FieldNumberIcon />}
            label={
              <HStack>
                <Text as="span">
                  <FormattedMessage
                    id="component.petition-settings.petition-automatic-numbering"
                    defaultMessage="Automatic numbering"
                  />
                </Text>
                <HelpPopover popoverWidth="2xs">
                  <Text marginBottom={2}>
                    <FormattedMessage
                      id="component.petition-settings.automatic-numbering-description1"
                      defaultMessage="Adds numbering to text blocks with numbering enabled."
                    />
                  </Text>
                  <Text>
                    <FormattedMessage
                      id="component.petition-settings.automatic-numbering-description"
                      defaultMessage="The number will dynamically change to match the order in which it appears on the form."
                    />
                  </Text>
                </HelpPopover>
              </HStack>
            }
            isActive={Boolean(petition.automaticNumberingConfig)}
            onAdd={() => handleAutomaticNumberingChange(true)}
            onRemove={() => handleAutomaticNumberingChange(false)}
            onConfig={() => handleConfigureAutomaticNumberingClick()}
            controlId="enable-auto-enumeration"
          />
        </>
      ) : null}
      {petition.__typename === "Petition" || user.hasAutoAnonymize ? (
        <>
          <Divider />
          <Heading as="h5" size="sm" paddingTop={2.5} paddingBottom={1.5}>
            <FormattedMessage
              id="component.petition-settings.closing-settings"
              defaultMessage="Closing settings"
            />
          </Heading>
        </>
      ) : null}

      {petition.__typename === "Petition" ? (
        <SettingsRow
          controlId="petition-deadline"
          isActive={Boolean(petition.deadline)}
          icon={<FieldDateIcon />}
          isDisabled={isDisabled}
          label={
            <FormattedMessage
              id="component.petition-settings.deadline-label"
              defaultMessage="Deadline"
            />
          }
          description={
            <FormattedMessage
              id="component.petition-settings.deadline-description"
              defaultMessage="This date is used to inform the recipients of the deadline for which you need to have the information."
            />
          }
        >
          <DeadlineInput
            value={petition.deadline ? new Date(petition.deadline) : null}
            onChange={(value) =>
              withError(onUpdatePetition({ deadline: value?.toISOString() ?? null }))
            }
            isDisabled={isDisabled}
          />
        </SettingsRow>
      ) : null}

      {user.hasAutoAnonymize ? (
        <SettingsRowButton
          isDisabled={isDisabled || myEffectivePermission !== "OWNER"}
          icon={<TimeIcon />}
          label={
            <FormattedMessage
              id="component.petition-settings.compliance-period"
              defaultMessage="Compliance period"
            />
          }
          description={
            <FormattedMessage
              id="component.petition-settings.compliance-period-description"
              defaultMessage="Set the retention period of the data collected with this {type, select, PETITION {parallel} other{template}} according to its purpose. The period will start from the closing of the parallel, after which the data will be anonymized."
              values={{ type: petition.__typename === "Petition" ? "PETITION" : "TEMPLATE" }}
            />
          }
          controlId="auto-anonymize"
          isActive={isNonNullish(petition.anonymizeAfterMonths)}
          onAdd={() => handleConfigCompliancePeriod(true)}
          onConfig={() => handleConfigCompliancePeriod(true)}
          onRemove={() => handleConfigCompliancePeriod(false)}
        />
      ) : null}

      {petition.__typename === "Petition" && petition.fromTemplate ? (
        <>
          <Divider />
          <Alert status="info" background="transparent" padding={0}>
            <AlertIcon />
            <AlertDescription fontStyle="italic">
              <FormattedMessage
                id="component.petition-settings.from-template-information"
                defaultMessage="Parallel created from the {name}."
                values={{
                  name: (
                    <Text textStyle={petition.fromTemplate.name ? undefined : "hint"} as="span">
                      {petition.fromTemplate.name ??
                        intl.formatMessage({
                          id: "generic.unnamed-template",
                          defaultMessage: "Unnamed template",
                        })}
                    </Text>
                  ),
                }}
              />
            </AlertDescription>
          </Alert>
        </>
      ) : null}
    </Stack>
  );
}

const _fragments = {
  User: gql`
    fragment PetitionSettings_User on User {
      id
      hasPetitionApprovalFlow: hasFeatureFlag(featureFlag: PETITION_APPROVAL_FLOW)
      hasSettingDelegateAccess: hasFeatureFlag(featureFlag: SETTING_DELEGATE_ACCESS)
      hasSkipForwardSecurity: hasFeatureFlag(featureFlag: SKIP_FORWARD_SECURITY)
      hasHideRecipientViewContents: hasFeatureFlag(featureFlag: HIDE_RECIPIENT_VIEW_CONTENTS)
      hasAutoAnonymize: hasFeatureFlag(featureFlag: AUTO_ANONYMIZE)
      ...useAvailablePetitionLocales_User
      ...TestModeSignatureBadge_User
      organization {
        id
        signatureIntegrations: integrations(type: SIGNATURE, limit: 100) {
          items {
            ... on SignatureOrgIntegration {
              id
              environment
            }
          }
        }
        pdfDocumentThemes {
          id
          name
        }
      }
    }
  `,
  SignatureConfig: gql`
    fragment PetitionSettings_SignatureConfig on SignatureConfig {
      useCustomDocument
      title
      timezone
      signingMode
      signers {
        contactId
        email
        firstName
        fullName
        isPreset
        lastName
        signWithDigitalCertificate
        signWithEmbeddedImageFileUploadId
      }
      reviewAfterApproval
      review
      minSigners
      message
      isEnabled
      integration {
        id
        environment
      }
      instructions
      allowAdditionalSigners
    }
  `,
  PetitionBase: gql`
    fragment PetitionSettings_PetitionBase on PetitionBase {
      id
      locale
      skipForwardSecurity
      isDelegateAccessEnabled
      isInteractionWithRecipientsEnabled
      isReviewFlowEnabled
      isDocumentGenerationEnabled
      isRecipientViewContentsHidden
      isRestricted
      isRestrictedWithPassword
      permanentDeletionAt
      approvalFlowConfig {
        ...Fragments_FullApprovalFlowConfig
      }
      automaticNumberingConfig {
        numberingType
      }
      selectedDocumentTheme {
        id
        name
      }
      myEffectivePermission {
        permissionType
      }
      signatureConfig {
        ...PetitionSettings_SignatureConfig
      }
      ...CompliancePeriodDialog_PetitionBase
      ... on Petition {
        status
        deadline
        currentSignatureRequest {
          id
          status
        }
        fromTemplate {
          id
          name
        }
      }
      ... on PetitionTemplate {
        isPublic
        ...PublicLinkSettingsDialog_PetitionTemplate
        remindersConfig {
          ...PetitionRemindersConfig_RemindersConfig
        }
        publicLink {
          id
          url
          isActive
          ...PublicLinkSettingsDialog_PublicPetitionLink
        }
        defaultPermissions {
          id
        }
        defaultPath
      }
      isAnonymized
    }
  `,
};

const _mutations = [
  gql`
    mutation PetitionSettings_updateTemplateDocumentTheme($templateId: GID!, $orgThemeId: GID!) {
      updateTemplateDocumentTheme(templateId: $templateId, orgThemeId: $orgThemeId) {
        id
        selectedDocumentTheme {
          id
          name
        }
      }
    }
  `,
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
    mutation PetitionSettings_createPublicPetitionLink(
      $templateId: GID!
      $title: String!
      $description: String!
      $slug: String
      $allowMultiplePetitions: Boolean!
      $petitionNamePattern: String
    ) {
      createPublicPetitionLink(
        templateId: $templateId
        title: $title
        description: $description
        slug: $slug
        allowMultiplePetitions: $allowMultiplePetitions
        petitionNamePattern: $petitionNamePattern
      ) {
        ...PublicLinkSettingsDialog_PublicPetitionLink
        template {
          id
          publicLink {
            id
          }
          lastChangeAt
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
      $slug: String
      $allowMultiplePetitions: Boolean
      $petitionNamePattern: String
    ) {
      updatePublicPetitionLink(
        publicPetitionLinkId: $publicPetitionLinkId
        isActive: $isActive
        title: $title
        description: $description
        slug: $slug
        allowMultiplePetitions: $allowMultiplePetitions
        petitionNamePattern: $petitionNamePattern
      ) {
        ...PublicLinkSettingsDialog_PublicPetitionLink
        template {
          id
          publicLink {
            id
          }
          lastChangeAt
        }
      }
    }
  `,
  gql`
    mutation PetitionSettings_updateTemplateDefaultPermissions(
      $templateId: GID!
      $permissions: [UserOrUserGroupPermissionInput!]!
    ) {
      updateTemplateDefaultPermissions(templateId: $templateId, permissions: $permissions) {
        id
        ...TemplateDefaultPermissionsDialog_PetitionTemplate
      }
    }
  `,
  gql`
    mutation PetitionSettings_enableAutomaticNumberingOnPetitionFields($petitionId: GID!) {
      enableAutomaticNumberingOnPetitionFields(petitionId: $petitionId) {
        id
        fields {
          id
          options
        }
      }
    }
  `,
];

export const PetitionSettings = memoWithFragments(_PetitionSettings, {
  user: PetitionSettings_UserFragmentDoc,
  petition: PetitionSettings_PetitionBaseFragmentDoc,
});

function DeadlineInput({
  value,
  onChange,
  isDisabled,
}: {
  value?: Maybe<Date>;
  onChange: (value: Maybe<Date>) => void;
  isDisabled?: boolean;
}) {
  const intl = useIntl();
  const showPetitionDeadlineDialog = usePetitionDeadlineDialog();

  async function handleOpenDeadlineDialog() {
    try {
      const date = await showPetitionDeadlineDialog();
      onChange(date);
    } catch {}
  }
  return (
    <InputGroup size="sm" borderRadius="md" flex="1" paddingStart={4}>
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
          <CloseButton isClear onClick={() => onChange(null)} isDisabled={isDisabled} />
        </InputRightElement>
      ) : (
        <InputRightElement pointerEvents="none">
          <FieldDateIcon />
        </InputRightElement>
      )}
    </InputGroup>
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
