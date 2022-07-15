import { gql, useMutation } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  CloseButton,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputRightAddon,
  InputRightElement,
  Select,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import {
  ArrowShortRightIcon,
  BellSettingsIcon,
  DocumentIcon,
  EmailIcon,
  FieldDateIcon,
  LinkIcon,
  ListIcon,
  LockClosedIcon,
  LockOpenIcon,
  ShieldIcon,
  SignatureIcon,
  TimeIcon,
} from "@parallel/chakra/icons";
import {
  PetitionSettings_cancelPetitionSignatureRequestDocument,
  PetitionSettings_createPublicPetitionLinkDocument,
  PetitionSettings_PetitionBaseFragment,
  PetitionSettings_startPetitionSignatureRequestDocument,
  PetitionSettings_updatePetitionRestrictionDocument,
  PetitionSettings_updatePublicPetitionLinkDocument,
  PetitionSettings_updateTemplateDefaultPermissionsDocument,
  PetitionSettings_updateTemplateDocumentThemeDocument,
  PetitionSettings_UserFragment,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { assertTypename, assertTypenameArray } from "@parallel/utils/apollo/typename";
import { compareWithFragments } from "@parallel/utils/compareWithFragments";
import { FORMATS } from "@parallel/utils/dates";
import { withError } from "@parallel/utils/promises/withError";
import { Maybe } from "@parallel/utils/types";
import { useClipboardWithToast } from "@parallel/utils/useClipboardWithToast";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { usePetitionLimitReachedErrorDialog } from "@parallel/utils/usePetitionLimitReachedErrorDialog";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import { memo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, noop, pick } from "remeda";
import { CopyToClipboardButton } from "../common/CopyToClipboardButton";
import { ConfirmDialog } from "../common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "../common/dialogs/DialogProvider";
import { Divider } from "../common/Divider";
import { HelpPopover } from "../common/HelpPopover";
import { NormalLink } from "../common/Link";
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
import {
  CompliancePeriodDialog,
  useCompliancePeriodDialog,
} from "./dialogs/CompliancePeriodDialog";
import { usePetitionDeadlineDialog } from "./dialogs/PetitionDeadlineDialog";
import { useRestrictPetitionDialog } from "./dialogs/RestrictPetitionDialog";
import { usePasswordRestrictPetitionDialog } from "./dialogs/UnrestrictPetitionDialog";
import { SettingsRow } from "./settings/SettingsRow";
import { SettingsRowButton } from "./SettingsRowButton";
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

  const myEffectivePermission = petition.myEffectivePermission!.permissionType;

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

  const showPetitionLimitReachedErrorDialog = usePetitionLimitReachedErrorDialog();
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
            .filter(isDefined)
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
        try {
          await startSignatureRequest({ variables: { petitionId: petition.id } });
        } catch (error) {
          if (isApolloError(error, "PETITION_SEND_CREDITS_ERROR")) {
            await withError(showPetitionLimitReachedErrorDialog());
          }
        }
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
        await updatePublicPetitionLink({
          variables: {
            publicPetitionLinkId: publicLink.id,
            isActive: !publicLink.isActive,
          },
        });
      } else {
        const publicLinkSettings = await showPublicLinkSettingDialog({ template: petition, user });
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
        user,
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
      isDisabled={isPublicTemplate || petition.isAnonymized || myEffectivePermission === "READ"}
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
          defaultMessage="Enable this option to prevent users from accidentally making changes to this parallel."
        />
      }
      isChecked={petition.isRestricted}
      onChange={handleRestrictPetition}
      controlId="restrict-editing"
    />
  );

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
          id: "component.petition-settings.compliance-updated.toast-title",
          defaultMessage: "Changes saved correctly",
        }),
        description: intl.formatMessage({
          id: "component.petition-settings.compliance-updated.toast-description",
          defaultMessage: "Compliance period successfully updated.",
        }),
        duration: 5000,
      });
    } catch {}
  };

  const settingIsDisabled =
    isPublicTemplate ||
    petition.isAnonymized ||
    petition.isRestricted ||
    myEffectivePermission === "READ";

  const [updateTemplateDocumentTheme] = useMutation(
    PetitionSettings_updateTemplateDocumentThemeDocument
  );

  async function handleUpdateTemplateDocumentTheme(orgThemeId: string) {
    await withError(
      updateTemplateDocumentTheme({
        variables: {
          templateId: petition.id,
          orgThemeId,
        },
      })
    );
  }

  return (
    <Stack padding={4} spacing={2}>
      {petition.__typename === "PetitionTemplate" ? (
        <>
          <Heading as="h5" size="sm" marginY={1.5}>
            <FormattedMessage
              id="component.petition-settings.adjustments-template"
              defaultMessage="Template settings"
            />
          </Heading>
          {restrictEditingSwitch}
          <SettingsRowButton
            data-section="share-by-link"
            isDisabled={
              isPublicTemplate || petition.isRestricted || myEffectivePermission === "READ"
            }
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
              <Input
                size="sm"
                borderRadius="md"
                type="text"
                value={petition.publicLink?.url}
                onChange={noop}
              />
              <InputRightAddon borderRadius="md" padding={0}>
                <CopyToClipboardButton
                  size="sm"
                  border={"1px solid"}
                  borderColor="inherit"
                  borderLeftRadius={0}
                  text={petition.publicLink?.url as string}
                />
              </InputRightAddon>
            </InputGroup>
          </SettingsRowButton>
          <SettingsRow
            controlId="template-document-theme"
            isDisabled={
              petition.isRestricted || petition.isAnonymized || myEffectivePermission === "READ"
            }
            icon={<DocumentIcon />}
            label={
              <>
                <FormattedMessage
                  id="component.petition-settings.document-theme-label"
                  defaultMessage="Document theme"
                />
                <HelpPopover>
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
                </HelpPopover>
              </>
            }
          >
            <Box>
              <Select
                size="sm"
                borderRadius="md"
                name="template-selected-theme"
                width="120px"
                value={petition.selectedDocumentTheme.id}
                onChange={(event) => handleUpdateTemplateDocumentTheme(event.target.value)}
                isDisabled={
                  petition.isRestricted ||
                  isPublicTemplate ||
                  petition.isAnonymized ||
                  myEffectivePermission === "READ"
                }
              >
                {user.organization.pdfDocumentThemes.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </Select>
            </Box>
          </SettingsRow>
          <Divider paddingTop={2} />
          <Heading as="h5" size="sm" paddingTop={2.5} paddingBottom={1.5}>
            <FormattedMessage
              id="component.petition-settings.adjustments-for-parallels"
              defaultMessage="Settings for parallels"
            />
          </Heading>
        </>
      ) : (
        <Heading as="h5" size="sm" marginY={1.5}>
          <FormattedMessage
            id="component.petition-settings.adjustments-parallels"
            defaultMessage="Parallel settings"
          />
        </Heading>
      )}
      <SettingsRow
        controlId="petition-locale"
        isDisabled={
          petition.isRestricted || petition.isAnonymized || myEffectivePermission === "READ"
        }
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
            onChange={(event) => onUpdatePetition({ locale: event.target.value as any })}
            isDisabled={
              petition.isRestricted ||
              isPublicTemplate ||
              petition.isAnonymized ||
              myEffectivePermission === "READ"
            }
          >
            {locales.map((locale) => (
              <option key={locale.key} value={locale.key}>
                {locale.localizedLabel}
              </option>
            ))}
          </Select>
        </Box>
      </SettingsRow>
      {petition.__typename === "Petition" ? (
        <SettingsRow
          controlId="petition-deadline"
          isActive={Boolean(petition.deadline)}
          icon={<FieldDateIcon />}
          isDisabled={petition.isAnonymized || myEffectivePermission === "READ"}
          label={<FormattedMessage id="petition.deadline-label" defaultMessage="Deadline" />}
          description={
            <FormattedMessage
              id="component.petition-settings.deadline-description"
              defaultMessage="This date is used to inform the recipients of the deadline for which you need to have the information."
            />
          }
        >
          <DeadlineInput
            value={petition.deadline ? new Date(petition.deadline) : null}
            onChange={(value) => onUpdatePetition({ deadline: value?.toISOString() ?? null })}
          />
        </SettingsRow>
      ) : null}
      {petition.__typename === "PetitionTemplate" ? (
        <SettingsRowButton
          data-section="share-automatically"
          isDisabled={isPublicTemplate || petition.isRestricted || myEffectivePermission === "READ"}
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
      ) : (
        restrictEditingSwitch
      )}
      {petition.signatureConfig || hasSignature ? (
        <SettingsRowButton
          data-section="esignature-settings"
          isDisabled={!hasSignature || settingIsDisabled}
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
                  defaultMessage="Generates a document and iniciates an eSignature process upon completion of the parallel, through one of our integrated providers."
                />
              </HelpPopover>
              {petition.signatureConfig?.integration?.environment === "DEMO" || hasDemoSignature ? (
                <TestModeSignatureBadge hasPetitionSignature={user.hasPetitionSignature} />
              ) : null}
            </HStack>
          }
          isActive={Boolean(petition.signatureConfig)}
          onAdd={() => handleSignatureChange(true)}
          onRemove={() => handleSignatureChange(false)}
          onConfig={() => handleConfigureSignatureClick()}
          controlId="enable-esignature"
        />
      ) : null}
      {petition.__typename === "PetitionTemplate" ? (
        <SettingsRowButton
          isDisabled={settingIsDisabled}
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
      ) : null}
      {user.hasAutoAnonymize ? (
        <SettingsRowButton
          isDisabled={
            isPublicTemplate ||
            petition.isAnonymized ||
            petition.isRestricted ||
            myEffectivePermission !== "OWNER"
          }
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
          isActive={isDefined(petition.anonymizeAfterMonths)}
          onAdd={() => handleConfigCompliancePeriod(true)}
          onConfig={() => handleConfigCompliancePeriod(true)}
          onRemove={() => handleConfigCompliancePeriod(false)}
        />
      ) : null}
      {user.hasSkipForwardSecurity ? (
        <SettingsRowSwitch
          isDisabled={settingIsDisabled}
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
          isDisabled={settingIsDisabled}
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
      {petition.__typename === "Petition" && petition.fromTemplateId ? (
        <Alert status="info" background="transparent" padding={0}>
          <AlertIcon />
          <AlertDescription fontStyle="italic">
            <FormattedMessage
              id="component.petition-settings.from-template-information"
              defaultMessage="Parallel created from the {name}."
              values={{
                name:
                  petition.fromTemplateId && !petition.fromTemplate ? (
                    <Text textStyle="hint" as="span">
                      <FormattedMessage
                        id="component.petition-settings.template-not-available"
                        defaultMessage="Template not available"
                      />
                    </Text>
                  ) : (
                    <Text textStyle={petition.fromTemplate?.name ? undefined : "hint"} as="span">
                      {petition.fromTemplate?.name ??
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
      hasAutoAnonymize: hasFeatureFlag(featureFlag: AUTO_ANONYMIZE)
      ...TestModeSignatureBadge_User
      ...PublicLinkSettingsDialog_User
      organization {
        id
        signatureIntegrations: integrations(type: SIGNATURE, limit: 100) {
          items {
            ... on SignatureOrgIntegration {
              ...SignatureConfigDialog_SignatureOrgIntegration
            }
          }
        }
        pdfDocumentThemes {
          id
          name
        }
      }
      ...SignatureConfigDialog_User
    }
    ${TestModeSignatureBadge.fragments.User}
    ${PublicLinkSettingsDialog.fragments.User}
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
      selectedDocumentTheme {
        id
        name
      }
      myEffectivePermission {
        permissionType
      }
      ...SignatureConfigDialog_PetitionBase
      ...CompliancePeriodDialog_PetitionBase
      ... on Petition {
        status
        deadline
        currentSignatureRequest {
          id
          status
        }
        fromTemplateId
        fromTemplate {
          id
          name
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
      isAnonymized
    }
    ${SignatureConfigDialog.fragments.PetitionBase}
    ${CompliancePeriodDialog.fragments.PetitionBase}
    ${PublicLinkSettingsDialog.fragments.PetitionTemplate}
    ${PublicLinkSettingsDialog.fragments.PublicPetitionLink}
    ${TemplateDefaultPermissionsDialog.fragments.PublicPetitionLink}
    ${TemplateDefaultPermissionsDialog.fragments.TemplateDefaultPermission}
  `,
};
const mutations = [
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
      $slug: String
    ) {
      createPublicPetitionLink(
        templateId: $templateId
        title: $title
        description: $description
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
      $slug: String
      $prefillSecret: String
    ) {
      updatePublicPetitionLink(
        publicPetitionLinkId: $publicPetitionLinkId
        isActive: $isActive
        title: $title
        description: $description
        slug: $slug
        prefillSecret: $prefillSecret
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
    <InputGroup size="sm" borderRadius="md" flex="1" paddingLeft={4}>
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
      ) : (
        <InputRightElement pointerEvents="none">
          <FieldDateIcon />
        </InputRightElement>
      )}
    </InputGroup>
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
