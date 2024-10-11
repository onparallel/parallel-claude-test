import { gql, useApolloClient, useMutation } from "@apollo/client";
import { Box, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from "@chakra-ui/react";
import { CalculatorIcon, ListIcon, PaperPlaneIcon, SettingsIcon } from "@parallel/chakra/icons";
import { Link } from "@parallel/components/common/Link";
import { ResponsiveButtonIcon } from "@parallel/components/common/ResponsiveButtonIcon";
import { SupportButton } from "@parallel/components/common/SupportButton";
import { ToneProvider } from "@parallel/components/common/ToneProvider";
import { isDialogError, withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import {
  FieldErrorDialog,
  useFieldErrorDialog,
} from "@parallel/components/common/dialogs/FieldErrorDialog";
import { WithApolloDataContext, withApolloData } from "@parallel/components/common/withApolloData";
import {
  PetitionLayout,
  usePetitionStateWrapper,
  withPetitionLayoutContext,
} from "@parallel/components/layout/PetitionLayout";
import { AddPetitionAccessDialog } from "@parallel/components/petition-activity/dialogs/AddPetitionAccessDialog";
import { PetitionCompletedAlert } from "@parallel/components/petition-common/PetitionCompletedAlert";
import { useSendPetitionHandler } from "@parallel/components/petition-common/useSendPetitionHandler";
import { AddNewFieldPlaceholderProvider } from "@parallel/components/petition-compose/AddNewFieldPlaceholderProvider";
import { PetitionComposeAttachments } from "@parallel/components/petition-compose/PetitionComposeAttachments";
import { PetitionComposeContents } from "@parallel/components/petition-compose/PetitionComposeContents";
import { PetitionComposeFieldList } from "@parallel/components/petition-compose/PetitionComposeFieldList";
import { PetitionComposeNewFieldDrawer } from "@parallel/components/petition-compose/PetitionComposeNewFieldDrawer";
import { PetitionComposeVariables } from "@parallel/components/petition-compose/PetitionComposeVariables";
import { PetitionLimitReachedAlert } from "@parallel/components/petition-compose/PetitionLimitReachedAlert";
import { PetitionSettings } from "@parallel/components/petition-compose/PetitionSettings";
import { PetitionTemplateDescriptionEdit } from "@parallel/components/petition-compose/PetitionTemplateDescriptionEdit";
import { useConfigureAutomateSearchDialog } from "@parallel/components/petition-compose/dialogs/ConfigureAutomateSearchDialog";
import { useConfirmChangeFieldTypeDialog } from "@parallel/components/petition-compose/dialogs/ConfirmChangeFieldTypeDialog";
import { useConfirmChangeShortTextFormatDialog } from "@parallel/components/petition-compose/dialogs/ConfirmChangeShortTextFormatDialog";
import { useConfirmDeleteFieldDialog } from "@parallel/components/petition-compose/dialogs/ConfirmDeleteFieldDialog";
import { useConfirmLinkFieldDialog } from "@parallel/components/petition-compose/dialogs/ConfirmLinkFieldDialog";
import { useConfirmUnlinkFieldDialog } from "@parallel/components/petition-compose/dialogs/ConfirmUnlinkFieldDialog";
import { useFieldUsedForSearchesDialog } from "@parallel/components/petition-compose/dialogs/FieldUsedForSearchesDialog";
import { useHandledPetitionFromTemplateDialog } from "@parallel/components/petition-compose/dialogs/PetitionFromTemplateDialog";
import { usePublicTemplateDialog } from "@parallel/components/petition-compose/dialogs/PublicTemplateDialog";
import {
  ReferencedFieldDialog,
  useReferencedFieldDialog,
} from "@parallel/components/petition-compose/dialogs/ReferencedFieldDialog";
import { PetitionComposeFieldSettings } from "@parallel/components/petition-compose/settings/PetitionComposeFieldSettings";
import {
  cleanPreviewFieldReplies,
  updatePreviewFieldReplies,
} from "@parallel/components/petition-preview/clientMutations";
import {
  PetitionCompose_PetitionFieldFragment,
  PetitionCompose_changePetitionFieldTypeDocument,
  PetitionCompose_clonePetitionFieldDocument,
  PetitionCompose_createPetitionFieldDocument,
  PetitionCompose_createProfileLinkedPetitionFieldDocument,
  PetitionCompose_deletePetitionFieldDocument,
  PetitionCompose_linkPetitionFieldChildrenDocument,
  PetitionCompose_petitionDocument,
  PetitionCompose_unlinkPetitionFieldChildrenDocument,
  PetitionCompose_updateFieldPositionsDocument,
  PetitionCompose_updatePetitionDocument,
  PetitionCompose_updatePetitionFieldAutoSearchConfigDocument,
  PetitionCompose_updatePetitionFieldDocument,
  PetitionCompose_updatePetitionFieldFragmentDoc,
  PetitionCompose_userDocument,
  PetitionFieldType,
  UpdatePetitionFieldInput,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useFieldsWithIndices } from "@parallel/utils/fieldIndices";
import {
  PetitionFieldLogicCondition,
  PetitionFieldMath,
  PetitionFieldVisibility,
} from "@parallel/utils/fieldLogic/types";
import { useUpdateIsReadNotification } from "@parallel/utils/mutations/useUpdateIsReadNotification";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { waitFor } from "@parallel/utils/promises/waitFor";
import { withError } from "@parallel/utils/promises/withError";
import { Maybe, UnwrapArray, UnwrapPromise } from "@parallel/utils/types";
import { useAsyncEffect } from "@parallel/utils/useAsyncEffect";
import { useHighlightElement } from "@parallel/utils/useHighlightElement";
import { useTempQueryParam } from "@parallel/utils/useTempQueryParam";
import { useUpdatingRef } from "@parallel/utils/useUpdatingRef";
import { validatePetitionFields } from "@parallel/utils/validatePetitionFields";
import { waitForElement } from "@parallel/utils/waitForElement";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, uniqueBy, zip } from "remeda";
import scrollIntoView from "smooth-scroll-into-view-if-needed";

type PetitionComposeProps = UnwrapPromise<ReturnType<typeof PetitionCompose.getInitialProps>>;

type FieldSelection = PetitionCompose_PetitionFieldFragment;

function PetitionCompose({ petitionId }: PetitionComposeProps) {
  const intl = useIntl();

  const { data: queryObject } = useAssertQuery(PetitionCompose_userDocument);
  const { me } = queryObject;
  const { data, refetch } = useAssertQuery(PetitionCompose_petitionDocument, {
    variables: { id: petitionId },
  });
  const petition = data.petition!;

  const apollo = useApolloClient();

  const updateIsReadNotification = useUpdateIsReadNotification();
  useEffect(() => {
    updateIsReadNotification({ isRead: true, filter: "SHARED", petitionIds: [petitionId] });
  }, [petitionId]);

  const isTemplate = petition.__typename === "PetitionTemplate";

  const isPublicTemplate = isTemplate && petition.isPublic;

  const myEffectivePermission = petition.myEffectivePermission!.permissionType;

  const isSharedByLink = (isTemplate && petition.publicLink?.isActive) ?? false;

  const fieldsWithIndices = useFieldsWithIndices(petition);
  const allFieldsWithIndices = useMemo(() => {
    return fieldsWithIndices.flatMap(([field, fieldIndex, childrenFieldIndices]) => {
      return [
        [field, fieldIndex],
        ...(isNonNullish(field.children) ? zip(field.children, childrenFieldIndices!) : []),
      ] as unknown as [
        FieldSelection | UnwrapArray<Exclude<FieldSelection["children"], null | undefined>>,
        string,
      ][];
    });
  }, [fieldsWithIndices]);
  const [activeFieldId, setActiveFieldId] = useState<Maybe<string>>(null);
  const activeFieldWithIndex = useMemo(() => {
    return isNonNullish(activeFieldId)
      ? (allFieldsWithIndices.find(([field]) => field.id === activeFieldId) ?? null)
      : null;
  }, [allFieldsWithIndices, activeFieldId]);
  const activeField = activeFieldWithIndex?.[0] ?? null;

  const fieldsRef = useUpdatingRef({ allFieldsWithIndices, activeFieldId, fieldsWithIndices });

  const wrapper = usePetitionStateWrapper();

  const fieldDrawerRef = useRef<HTMLDivElement>(null);

  const [addFieldAfterId, setAddFieldAfterId] =
    useState<Maybe<[afterFieldId: string | undefined, inParentFieldId: string | undefined]>>(null);
  const isAddFieldDrawerOpen = isNonNullish(addFieldAfterId);
  const [afterFieldId, inParentFieldId] = addFieldAfterId ?? [];

  const handleCloseFieldDrawer = useCallback(() => setAddFieldAfterId(null), []);

  const handleShowAddField = useCallback(
    (afterFieldId?: string, inParentFieldId?: string, focusSearchInput?: boolean) => {
      setAddFieldAfterId([afterFieldId, inParentFieldId]);
      if (focusSearchInput) {
        fieldDrawerRef.current?.querySelector("input")?.focus();
      }
    },
    [],
  );

  const [showErrors, setShowErrors] = useState(false);

  // 0 - Content
  // 1 - Petition/Template Settings
  const [tabIndex, setTabIndex] = useState(1);

  const handleTabsChange = (index: number) => {
    setTabIndex(index);
  };

  const showPublicTemplateDialog = usePublicTemplateDialog();
  useEffect(() => {
    if (isPublicTemplate) {
      withError(showPublicTemplateDialog());
    }
  }, []);

  const showPetitionFromTemplateDialog = useHandledPetitionFromTemplateDialog();

  useTempQueryParam("field", async (fieldId) => {
    // give some time for intersection observers to kick in,
    // without the delay scroll observer don't work well
    await waitFor(100);
    await scrollToField(fieldId);
  });

  useTempQueryParam("fromTemplate", () => {
    withError(showPetitionFromTemplateDialog());
  });

  useEffect(() => {
    setShowErrors(isSharedByLink);
  }, [setShowErrors, isSharedByLink]);

  useAsyncEffect(async () => {
    // Validate and focus fields when have "tags" in url, because it probably comes from other page when validates petition fields
    const hash = window.location.hash;
    if (hash) {
      if (hash.includes("#field-settings-")) {
        handleFieldSettingsClick(hash.replace("#field-settings-", ""));
      } else {
        const { error, fieldsWithIndices } = validatePetitionFields(allFieldsWithIndices, petition);
        if (error && fieldsWithIndices && fieldsWithIndices.length > 0) {
          setShowErrors(true);
          await focusFieldTitle(fieldsWithIndices[0][0].id);
        }
      }
    }
  }, []);

  const [updatePetition] = useMutation(PetitionCompose_updatePetitionDocument);
  const handleUpdatePetition = useCallback(
    wrapper(async (data: UpdatePetitionInput) => {
      await updatePetition({
        variables: {
          petitionId,
          data,
        },
      });
    }),
    [petitionId],
  );

  const [updateFieldPositions] = useMutation(PetitionCompose_updateFieldPositionsDocument);
  const handleUpdateFieldPositions = useCallback(
    wrapper(async function (fieldIds: string[], parentFieldId?: string) {
      await updateFieldPositions({ variables: { petitionId, fieldIds, parentFieldId } });
    }),
    [petitionId],
  );

  const [clonePetitionField] = useMutation(PetitionCompose_clonePetitionFieldDocument);
  const handleCloneField = useCallback(
    wrapper(async (fieldId: string) => {
      const { data } = await clonePetitionField({
        variables: { petitionId, fieldId },
      });
      const field = data!.clonePetitionField;
      if (isAddFieldDrawerOpen) {
        if (field.type === "FIELD_GROUP") {
          setAddFieldAfterId([undefined, field.id]);
        } else {
          setAddFieldAfterId([field.id, inParentFieldId]);
        }
      }
      setActiveFieldId(field.id);
      await focusFieldTitle(field.id);
    }),
    [petitionId, isAddFieldDrawerOpen, inParentFieldId],
  );

  const [deletePetitionField] = useMutation(PetitionCompose_deletePetitionFieldDocument);
  const confirmDelete = useConfirmDeleteFieldDialog();

  /** returns true if referencing fields have been fixed */
  const tryFixReferencingFields = async (fieldId: string) => {
    const { allFieldsWithIndices } = fieldsRef.current!;
    // if this field is being referenced by any other field ask the user
    // if they want to remove the conflicting conditions

    const fieldToCheck = allFieldsWithIndices.find(([f]) => f.id === fieldId)![0];
    const referencingVisibility = allFieldsWithIndices.filter(([f]) =>
      (f.visibility as PetitionFieldVisibility)?.conditions.some(
        (c) =>
          "fieldId" in c &&
          (fieldToCheck.type === "FIELD_GROUP"
            ? c.fieldId === fieldId || fieldToCheck.children?.some((f) => c.fieldId === f.id)
            : c.fieldId === fieldId),
      ),
    );

    const referencingMath = allFieldsWithIndices.filter(([f]) =>
      (f.math as PetitionFieldMath[])?.some(
        (calc) =>
          calc.conditions.some((c) => "fieldId" in c && c.fieldId === fieldId) ||
          calc.operations.some((o) => o.operand.type === "FIELD" && o.operand.fieldId === fieldId),
      ),
    );

    if (referencingVisibility.length > 0 || referencingMath.length > 0) {
      try {
        await showReferencedFieldDialog({
          fieldsWithIndices: uniqueBy(
            [...referencingMath, ...referencingVisibility],
            ([_, fieldIndex]) => fieldIndex,
          ),
          referencedInMath: referencingMath.length > 0,
          referencesInVisibility: referencingVisibility.length > 0,
        });
      } catch {
        return false;
      }
      for (const [field] of referencingVisibility) {
        const visibility = field.visibility! as PetitionFieldVisibility;
        const conditions = visibility.conditions.filter(
          (c) =>
            !(
              "fieldId" in c &&
              (fieldToCheck.type === "FIELD_GROUP"
                ? c.fieldId === fieldId || fieldToCheck.children?.some((f) => c.fieldId === f.id)
                : c.fieldId === fieldId)
            ),
        );

        await _handleFieldEdit(field.id, {
          visibility: conditions.length > 0 ? { ...visibility, conditions } : null,
        });
      }

      for (const [field] of referencingMath) {
        const newMath = (field.math! as PetitionFieldMath[])
          .map((calc) => {
            const conditions = calc.conditions.filter(
              (c) => !("fieldId" in c && c.fieldId === fieldId),
            );

            const operations = calc.operations.filter(
              (o) =>
                !(
                  o.operand.type === "FIELD" &&
                  (fieldToCheck.type === "FIELD_GROUP"
                    ? o.operand.fieldId === fieldId ||
                      fieldToCheck.children?.some(
                        (f) => "fieldId" in o.operand && o.operand.fieldId === f.id,
                      )
                    : o.operand.fieldId === fieldId)
                ),
            );

            if (!conditions.length || !operations.length) {
              return null;
            }

            return {
              ...calc,
              conditions,
              operations,
            };
          })
          .filter(isNonNullish);

        await _handleFieldEdit(field.id, {
          math: newMath.length > 0 ? newMath : null,
        });
      }
      return true;
    }
  };

  const [updatePetitionFieldAutoSearchConfig] = useMutation(
    PetitionCompose_updatePetitionFieldAutoSearchConfigDocument,
  );

  const checkReferencedFieldInBackgroundCheck = async (fieldId: string) => {
    const { allFieldsWithIndices } = fieldsRef.current;
    const referencedInBackgroundCheck = allFieldsWithIndices.filter(([f]) => {
      const options = f.options as FieldOptions["BACKGROUND_CHECK"];
      return (
        f.type === "BACKGROUND_CHECK" &&
        options.autoSearchConfig &&
        (options.autoSearchConfig.name.includes(fieldId) ||
          options.autoSearchConfig.date === fieldId)
      );
    });

    if (referencedInBackgroundCheck.length) {
      const [backgroundCheckField] = referencedInBackgroundCheck[0];
      try {
        await showFieldUsedForSearchesDialog();
        const config = await showAutomateSearchDialog({
          petitionId,
          field: backgroundCheckField,
        });

        await updatePetitionFieldAutoSearchConfig({
          variables: {
            fieldId: backgroundCheckField.id,
            petitionId,
            config,
          },
        });

        return true;
      } catch (e) {
        if (isDialogError(e) && e.reason === "DELETE_AUTO_SEARCH_CONFIG") {
          try {
            await _handleFieldEdit(backgroundCheckField.id, {
              options: {
                ...backgroundCheckField.options,
                autoSearchConfig: null,
              },
            });
          } catch {}
        }
      }
      return true;
    }
    return false;
  };

  const handleDeleteField = useCallback(
    wrapper(async function (fieldId: string) {
      setActiveFieldId((activeFieldId) => (activeFieldId === fieldId ? null : activeFieldId));

      if (await checkReferencedFieldInBackgroundCheck(fieldId)) {
        return;
      }
      await deleteField(false);

      async function deleteField(force: boolean) {
        try {
          const { allFieldsWithIndices } = fieldsRef.current;
          const fieldIndex = allFieldsWithIndices.findIndex(([f]) => f.id === fieldId);
          const field = allFieldsWithIndices[fieldIndex]![0];

          await deletePetitionField({
            variables: { petitionId, fieldId, force },
            update: (cache, { data }) => {
              if (isTemplate && isNonNullish(field.parent) && isNonNullish(data)) {
                updatePreviewFieldReplies(cache, field.parent.id, (replies) => {
                  return replies.map((r) => {
                    const children = [...r.children!].filter(({ field }) => field.id !== fieldId);
                    return {
                      ...r,
                      children,
                    };
                  });
                });
              }
            },
          });
          let _afterFieldId = afterFieldId;
          let _inParentFieldId = inParentFieldId;

          if (afterFieldId === field.id || inParentFieldId === field.id) {
            const previousField = field.position
              ? allFieldsWithIndices[fieldIndex - 1][0]
              : undefined;

            _afterFieldId =
              inParentFieldId === field.id && previousField?.parent?.id
                ? previousField.parent.id
                : previousField?.id;

            if (inParentFieldId === field.id) {
              _inParentFieldId = undefined;
            }
            setAddFieldAfterId([_afterFieldId, _inParentFieldId]);
          }
        } catch (e) {
          if (isApolloError(e, "FIELD_HAS_REPLIES_ERROR")) {
            try {
              await confirmDelete();
            } catch {
              return;
            }
            await deleteField(true);
          } else if (isApolloError(e, "FIELD_IS_REFERENCED_ERROR")) {
            if (await tryFixReferencingFields(fieldId)) {
              await deleteField(false);
            }
          } else if (isApolloError(e, "FIRST_CHILD_HAS_VISIBILITY_CONDITIONS_ERROR")) {
            await withError(
              showErrorDialog({
                message: (
                  <FormattedMessage
                    id="generic.first-child-visibility-conditions-error"
                    defaultMessage="You cannot set conditions for the first field in a group."
                  />
                ),
              }),
            );
          } else if (isApolloError(e, "FIRST_CHILD_IS_INTERNAL_ERROR")) {
            await withError(
              showErrorDialog({
                message: (
                  <FormattedMessage
                    id="generic.first-child-is-internal-error"
                    defaultMessage="The first field of a group cannot be internal if the group is not. Disable this setting to be able to reorder."
                  />
                ),
              }),
            );
          } else {
            // throw error to show compose generic error dialog
            throw e;
          }
        }
      }
    }),
    [petitionId, afterFieldId, inParentFieldId],
  );

  const handleFieldSettingsClick = useCallback(
    function (fieldId: string) {
      setActiveFieldId(fieldId);
    },
    [petitionId],
  );

  const handleFieldTypeIndicatorClick = useCallback(
    function (fieldId: string) {
      setActiveFieldId(fieldId);
    },
    [petitionId],
  );

  const handleSettingsClose = useCallback(
    function () {
      setActiveFieldId(null);
    },
    [petitionId],
  );

  const confirmChangeFormat = useConfirmChangeShortTextFormatDialog();

  const [updatePetitionField] = useMutation(PetitionCompose_updatePetitionFieldDocument);
  const _handleFieldEdit = useCallback(
    async function (fieldId: string, data: UpdatePetitionFieldInput, force?: boolean) {
      const { allFieldsWithIndices } = fieldsRef.current!;

      const field = allFieldsWithIndices.find(([f]) => f.id === fieldId)?.[0];
      if (
        isNonNullish(data.isInternal) &&
        data.isInternal === false &&
        isNonNullish(field) &&
        field.type === "FIELD_GROUP" &&
        (field.children ?? []).length > 0 &&
        (field.children![0].type === "DOW_JONES_KYC" ||
          field.children![0].type === "BACKGROUND_CHECK")
      ) {
        await withError(
          showErrorDialog({
            message: (
              <FormattedMessage
                id="generic.dow-jones-kyc-external-error"
                defaultMessage="A Dow Jones field can't be set as external. Remove if from the group or move it to another position and try again."
              />
            ),
          }),
        );
        return;
      }
      if (data.multiple === false) {
        // check no field is referencing with invalid NUMBER_OF_REPLIES condition
        const validCondition = (c: PetitionFieldLogicCondition) => {
          if ("fieldId" in c && c.fieldId === fieldId) {
            if (c.modifier === "NUMBER_OF_REPLIES") {
              return c.value === 0 && (c.operator === "EQUAL" || c.operator === "GREATER_THAN");
            } else if (c.modifier === "ALL" || c.modifier === "NONE") {
              return false;
            }
          }
          return true;
        };
        const referencingVisibility = allFieldsWithIndices.filter(([f]) =>
          (f.visibility as PetitionFieldVisibility)?.conditions.some((c) => !validCondition(c)),
        );

        const referencingMath = allFieldsWithIndices.filter(([f]) =>
          (f.math as PetitionFieldMath[])?.some((calc) =>
            calc.conditions.some((c) => !validCondition(c)),
          ),
        );

        if (referencingVisibility.length || referencingMath.length) {
          try {
            await showReferencedFieldDialog({
              fieldsWithIndices: uniqueBy(
                [...referencingMath, ...referencingVisibility],
                ([_, fieldIndex]) => fieldIndex,
              ),
              referencedInMath: referencingMath.length > 0,
              referencesInVisibility: referencingVisibility.length > 0,
            });
            await Promise.all(
              referencingVisibility.map(async ([field]) => {
                const visibility = field.visibility! as PetitionFieldVisibility;
                const conditions = visibility.conditions.filter(validCondition);
                await handleFieldEdit(field.id, {
                  visibility: conditions.length > 0 ? { ...visibility, conditions } : null,
                });
              }),
            );

            for (const [field] of referencingMath) {
              const newMath = (field.math! as PetitionFieldMath[])
                .map((calc) => {
                  const conditions = calc.conditions.filter(validCondition);

                  if (!conditions.length) {
                    return null;
                  }

                  return {
                    ...calc,
                    conditions,
                  };
                })
                .filter(isNonNullish);

              await _handleFieldEdit(field.id, {
                math: newMath.length > 0 ? newMath : null,
              });
            }
          } catch {
            return;
          }
        }
      }

      try {
        await updatePetitionField({
          variables: { petitionId, fieldId, data },
          // eslint-disable-next-line @typescript-eslint/naming-convention
          optimisticResponse: (_, { IGNORE }) => {
            // make field settings more responsive by enabling optimistic responses
            const keys = Object.keys(data);
            if (
              keys.length === 1 &&
              [
                "options",
                "optional",
                "multiple",
                "isInternal",
                "showInPdf",
                "showActivityInPdf",
                "hasCommentsEnabled",
                "requireApproval",
              ].includes(keys[0])
            ) {
              const cached = apollo.readFragment({
                fragment: PetitionCompose_updatePetitionFieldFragmentDoc,
                fragmentName: "PetitionCompose_updatePetitionField",
                id: fieldId,
              });
              if (isNonNullish(cached)) {
                return {
                  updatePetitionField: {
                    ...cached,
                    ...data,
                    options: {
                      ...cached.options,
                      ...data?.options,
                    },
                  },
                };
              }
            }
            return IGNORE as any;
          },
        });
      } catch (e) {
        if (isApolloError(e, "FIELD_IS_BEING_REFERENCED_IN_AUTO_SEARCH_CONFIG")) {
          await checkReferencedFieldInBackgroundCheck(fieldId);
        }
        if (isApolloError(e, "ALIAS_ALREADY_EXISTS")) {
          throw e;
        }
        if (isApolloError(e, "FIELD_HAS_REPLIES_ERROR")) {
          try {
            await confirmChangeFormat();
            await updatePetitionField({
              variables: { petitionId, fieldId, data, force: true },
            });
          } catch {}
        }
      }
    },
    [petitionId],
  );
  const handleFieldEdit = useCallback(wrapper(_handleFieldEdit), [petitionId, _handleFieldEdit]);

  const showAutomateSearchDialog = useConfigureAutomateSearchDialog();
  const showFieldUsedForSearchesDialog = useFieldUsedForSearchesDialog();
  const showReferencedFieldDialog = useReferencedFieldDialog();
  const confirmChangeFieldType = useConfirmChangeFieldTypeDialog();
  const [changePetitionFieldType] = useMutation(PetitionCompose_changePetitionFieldTypeDocument);
  const handleFieldTypeChange = useCallback(
    wrapper(async function (fieldId: string, type: PetitionFieldType) {
      const { allFieldsWithIndices } = fieldsRef.current!;

      if (await checkReferencedFieldInBackgroundCheck(fieldId)) {
        return;
      }

      const field = allFieldsWithIndices.find(([f]) => f.id === fieldId)![0];
      const referencingVisibility = allFieldsWithIndices.filter(([f]) =>
        (f.visibility as PetitionFieldVisibility)?.conditions.some(
          (c) => "fieldId" in c && c.fieldId === fieldId,
        ),
      );

      const referencingMath = allFieldsWithIndices.filter(([f]) =>
        (f.math as PetitionFieldMath[])?.some(
          (calc) =>
            calc.conditions.some((c) => "fieldId" in c && c.fieldId === fieldId) ||
            calc.operations.some(
              (o) => o.operand.type === "FIELD" && o.operand.fieldId === fieldId,
            ),
        ),
      );

      if (referencingVisibility.length || referencingMath.length) {
        // valid field types changes
        if (type === "TEXT" && field.type === "SELECT") {
          // pass
        } else {
          try {
            await showReferencedFieldDialog({
              fieldsWithIndices: uniqueBy(
                [...referencingMath, ...referencingVisibility],
                ([_, fieldIndex]) => fieldIndex,
              ),
              referencedInMath: referencingMath.length > 0,
              referencesInVisibility: referencingVisibility.length > 0,
            });
            for (const [field] of referencingVisibility) {
              const visibility = field.visibility! as PetitionFieldVisibility;
              const conditions = visibility.conditions.filter(
                (c) => !("fieldId" in c && c.fieldId === fieldId),
              );
              await _handleFieldEdit(field.id, {
                visibility: conditions.length > 0 ? { ...visibility, conditions } : null,
              });
            }

            for (const [field] of referencingMath) {
              const newMath = (field.math! as PetitionFieldMath[])
                .map((calc) => {
                  const conditions = calc.conditions.filter(
                    (c) => !("fieldId" in c && c.fieldId === fieldId),
                  );

                  const operations = calc.operations.filter(
                    (o) =>
                      !(
                        o.operand.type === "FIELD" &&
                        "fieldId" in o.operand &&
                        o.operand.fieldId === fieldId
                      ),
                  );

                  if (!conditions.length || !operations.length) {
                    return null;
                  }

                  return {
                    ...calc,
                    conditions,
                    operations,
                  };
                })
                .filter(isNonNullish);

              await _handleFieldEdit(field.id, {
                math: newMath.length > 0 ? newMath : null,
              });
            }
          } catch {
            return;
          }
        }
      }
      try {
        await changePetitionFieldType({
          variables: { petitionId, fieldId, type },
        });
        cleanPreviewFieldReplies(apollo, fieldId);
        return;
      } catch {}
      try {
        await confirmChangeFieldType();
        await changePetitionFieldType({
          variables: { petitionId, fieldId, type, force: true },
        });
      } catch {}
    }),
    [petitionId],
  );

  const validateNewFieldPosition = async (type: PetitionFieldType, position?: number) => {
    const { allFieldsWithIndices } = fieldsRef.current!;
    const field = allFieldsWithIndices.find(([f]) => f.id === inParentFieldId)![0];
    const childrenLength = field.children?.length ?? 0;
    let _position = isNonNullish(position) && childrenLength > position ? position + 1 : 0;
    if (
      (type === "DOW_JONES_KYC" || type === "BACKGROUND_CHECK") &&
      childrenLength === 0 &&
      !field.isInternal
    ) {
      try {
        await showErrorDialog({
          message: (
            <FormattedMessage
              id="page.petition-compose.first-child-is-internal-error"
              defaultMessage="The first field of a group cannot be internal if the group is not."
            />
          ),
        });
      } catch {}

      throw new Error("FIRST_CHILD_IS_INTERNAL_ERROR");
    } else {
      if (
        (type === "DOW_JONES_KYC" || type === "BACKGROUND_CHECK") &&
        childrenLength > 0 &&
        _position === 0 &&
        !field.isInternal
      ) {
        _position = 1;
      }
    }
    return _position;
  };

  const [createProfileLinkedPetitionField] = useMutation(
    PetitionCompose_createProfileLinkedPetitionFieldDocument,
  );
  const [createPetitionField] = useMutation(PetitionCompose_createPetitionFieldDocument);
  const handleAddField = useCallback(
    wrapper(async function (type: PetitionFieldType, profileTypeFieldId?: string) {
      const parentFieldId = inParentFieldId;
      const { fieldsWithIndices } = fieldsRef.current!;

      let position = undefined as number | undefined;
      if (isNonNullish(parentFieldId)) {
        const parentField = fieldsWithIndices.find(([f]) => f.id === parentFieldId)![0];
        const childIndex = parentField.children?.findIndex((f) => f.id === afterFieldId);
        try {
          position = await validateNewFieldPosition(
            type,
            childIndex === -1 ? undefined : childIndex,
          );
        } catch {
          return;
        }
      } else {
        const fieldIndex = fieldsWithIndices.findIndex(([f]) => f.id === afterFieldId);

        if (fieldIndex !== -1) {
          position = fieldIndex + 1;
        }
      }
      let newFieldId = "";

      if (profileTypeFieldId && parentFieldId) {
        const { data } = await createProfileLinkedPetitionField({
          variables: {
            petitionId,
            parentFieldId,
            profileTypeFieldId,
            position,
          },
          update: (cache, { data }) => {
            if (isTemplate && isNonNullish(parentFieldId) && isNonNullish(data)) {
              updatePreviewFieldReplies(cache, parentFieldId, (replies) => {
                return replies.map((r) => {
                  const children = [...(r.children ?? [])];
                  children.splice(position!, 0, {
                    __typename: "PetitionFieldGroupChildReply",
                    field: data.createProfileLinkedPetitionField,
                    replies: [],
                  });
                  return {
                    ...r,
                    children,
                  };
                });
              });
            }
          },
        });
        newFieldId = data!.createProfileLinkedPetitionField.id;
      } else {
        const { data } = await createPetitionField({
          variables: { petitionId, type, position, parentFieldId },
          update: (cache, { data }) => {
            if (isTemplate && isNonNullish(parentFieldId) && isNonNullish(data)) {
              updatePreviewFieldReplies(cache, parentFieldId, (replies) => {
                return replies.map((r) => {
                  const children = [...(r.children ?? [])];
                  children.splice(position!, 0, {
                    __typename: "PetitionFieldGroupChildReply",
                    field: data.createPetitionField,
                    replies: [],
                  });
                  return {
                    ...r,
                    children,
                  };
                });
              });
            }
          },
        });
        newFieldId = data!.createPetitionField.id;
      }
      await waitForElement(`#field-${newFieldId}`);
      setActiveFieldId(newFieldId);

      if (type === "FIELD_GROUP") {
        setAddFieldAfterId([undefined, newFieldId]);
      } else {
        setAddFieldAfterId([newFieldId, inParentFieldId]);
      }
      scrollToField(newFieldId).then();
    }),
    [petitionId, afterFieldId, inParentFieldId],
  );

  const showErrorDialog = useErrorDialog();
  const showFieldErrorDialog = useFieldErrorDialog();
  const validPetitionFields = async () => {
    const { error, message, footer, fieldsWithIndices } = validatePetitionFields(
      allFieldsWithIndices,
      petition,
    );
    if (error) {
      setShowErrors(true);
      if (fieldsWithIndices && fieldsWithIndices.length > 0) {
        if (error === "PAID_FIELDS_BLOCKED") {
          await withError(
            showFieldErrorDialog({
              header: (
                <FormattedMessage
                  id="generic.fields-not-available"
                  defaultMessage="Fields not available"
                />
              ),
              message,
              footer,
              fieldsWithIndices,
              cancel: (
                <SupportButton
                  variant="outline"
                  colorScheme="primary"
                  message={intl.formatMessage({
                    id: "generic.upgrade-plan-support-message",
                    defaultMessage:
                      "Hi, I would like to get more information about how to upgrade my plan.",
                  })}
                >
                  <FormattedMessage id="generic.contact" defaultMessage="Contact" />
                </SupportButton>
              ),
              confirmText: <FormattedMessage id="generic.continue" defaultMessage="Continue" />,
            }),
          );
          return true;
        } else {
          await withError(showFieldErrorDialog({ message, fieldsWithIndices }));
          const firstId = fieldsWithIndices[0][0].id;
          const node = document.querySelector(`#field-${firstId}`);
          await scrollIntoView(node!, { block: "center", behavior: "smooth" });
        }
      } else {
        await withError(showErrorDialog({ message }));
        if (error === "NO_REPLIABLE_FIELDS") {
          document.querySelector<HTMLButtonElement>("#menu-button-big-add-field-button")?.click();
        }
      }
      return false;
    }
    return true;
  };

  const [linkPetitionFieldChild] = useMutation(PetitionCompose_linkPetitionFieldChildrenDocument);
  const showConfirmLinkDialog = useConfirmLinkFieldDialog();
  const handleLinkField = useCallback(
    wrapper(async function (parentFieldId: string, childrenFieldIds: string[]) {
      const fieldId = childrenFieldIds[0];
      const linkField = async (force?: boolean) => {
        await linkPetitionFieldChild({
          variables: {
            petitionId,
            parentFieldId,
            childrenFieldIds,
            force,
          },
          update: (cache, { data }) => {
            if (isTemplate && isNonNullish(data)) {
              for (const fieldId of childrenFieldIds) {
                updatePreviewFieldReplies(cache, parentFieldId, (replies) => {
                  return replies.map((r) => {
                    return {
                      ...r,
                      children: [
                        ...(r.children ?? []),
                        {
                          field: {
                            __typename: "PetitionField",
                            id: fieldId,
                            replies: [],
                          },
                          replies: [],
                          __typename: "PetitionFieldGroupChildReply",
                        },
                      ],
                    };
                  });
                });
              }
            }
          },
        });

        if (afterFieldId === fieldId) {
          setAddFieldAfterId([afterFieldId, parentFieldId]);
        }
      };
      try {
        await linkField();
      } catch (error) {
        if (isApolloError(error, "FIELD_IS_BEING_REFERENCED_IN_AUTO_SEARCH_CONFIG")) {
          await checkReferencedFieldInBackgroundCheck(
            (error.graphQLErrors[0]!.extensions?.fieldId ?? "") as string,
          );
        } else if (isApolloError(error, "FIELD_HAS_REPLIES_ERROR")) {
          try {
            await showConfirmLinkDialog();
            await linkField(true);
          } catch {}
        } else if (isApolloError(error, "FIRST_CHILD_HAS_VISIBILITY_CONDITIONS_ERROR")) {
          await withError(
            showErrorDialog({
              message: (
                <FormattedMessage
                  id="generic.first-child-visibility-conditions-error"
                  defaultMessage="You cannot set conditions for the first field in a group."
                />
              ),
            }),
          );
        } else if (isApolloError(error, "FIRST_CHILD_IS_INTERNAL_ERROR")) {
          await withError(
            showErrorDialog({
              message: (
                <FormattedMessage
                  id="generic.first-child-is-internal-error"
                  defaultMessage="The first field of a group cannot be internal if the group is not. Disable this setting to be able to reorder."
                />
              ),
            }),
          );
        } else if (isApolloError(error, "INVALID_FIELD_CONDITIONS_ORDER")) {
          await withError(
            showErrorDialog({
              message: (
                <FormattedMessage
                  id="generic.invalid-field-conditions-error"
                  defaultMessage="You can only move fields so that visibility and calculations conditions refer only to previous fields."
                />
              ),
            }),
          );
        } else {
          throw error;
        }
      }
    }),
    [petitionId, afterFieldId],
  );

  const [unlinkPetitionFieldChild] = useMutation(
    PetitionCompose_unlinkPetitionFieldChildrenDocument,
  );
  const showConfirmUnlinkFieldDialog = useConfirmUnlinkFieldDialog();
  const handleUnlinkField = useCallback(
    wrapper(async function (parentFieldId: string, childrenFieldIds: string[]) {
      const fieldId = childrenFieldIds[0];
      const unlinkChild = async (force?: boolean) => {
        await unlinkPetitionFieldChild({
          variables: {
            petitionId,
            parentFieldId,
            childrenFieldIds,
            force,
          },
          update: (cache, { data }) => {
            if (isTemplate && isNonNullish(data))
              for (const fieldId of childrenFieldIds) {
                updatePreviewFieldReplies(cache, parentFieldId, (replies) => {
                  return replies.map((r) => {
                    const children = [...r.children!].filter(({ field }) => field.id !== fieldId);
                    return {
                      ...r,
                      children,
                    };
                  });
                });
              }
          },
        });

        if (afterFieldId === fieldId) {
          setAddFieldAfterId([afterFieldId, undefined]);
        }
      };
      try {
        await unlinkChild();
      } catch (error) {
        if (isApolloError(error, "FIELD_HAS_REPLIES_ERROR")) {
          try {
            await showConfirmUnlinkFieldDialog();
            await unlinkChild(true);
          } catch {}
        } else if (isApolloError(error, "FIRST_CHILD_HAS_VISIBILITY_CONDITIONS_ERROR")) {
          await withError(
            showErrorDialog({
              message: (
                <FormattedMessage
                  id="generic.first-child-visibility-conditions-error"
                  defaultMessage="You cannot set conditions for the first field in a group."
                />
              ),
            }),
          );
        } else if (isApolloError(error, "FIRST_CHILD_IS_INTERNAL_ERROR")) {
          await withError(
            showErrorDialog({
              message: (
                <FormattedMessage
                  id="generic.first-child-is-internal-error"
                  defaultMessage="The first field of a group cannot be internal if the group is not. Disable this setting to be able to reorder."
                />
              ),
            }),
          );
        } else if (isApolloError(error, "FIELD_IS_REFERENCED_ERROR")) {
          if (await tryFixReferencingFields(fieldId)) {
            await unlinkChild();
          }
        } else {
          throw error;
        }
      }
    }),
    [petitionId, afterFieldId],
  );

  const handleNextClick = useSendPetitionHandler(
    me,
    petition?.__typename === "Petition" ? petition : null,
    handleUpdatePetition,
    validPetitionFields,
  );

  const highlight = useHighlightElement();
  const scrollToField = useCallback(async (fieldId: string) => {
    await Promise.all([
      waitForElement(`#field-${fieldId}`).then(highlight),
      focusFieldTitle(fieldId),
    ]);
  }, []);

  async function focusFieldTitle(fieldId: string) {
    const title = await waitForElement<HTMLInputElement>(`#field-title-${fieldId}`);
    title.focus();
  }

  const extendFlexColumn = {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  } as const;

  const displayPetitionLimitReachedAlert =
    me.organization.isPetitionUsageLimitReached &&
    petition?.__typename === "Petition" &&
    petition.status === "DRAFT";

  const isReadOnly =
    petition.isRestricted ||
    isPublicTemplate ||
    petition.isAnonymized ||
    myEffectivePermission === "READ";

  return (
    <ToneProvider value={petition.organization.brandTheme.preferredTone}>
      <PetitionLayout
        key={petition.id}
        queryObject={queryObject}
        petition={petition}
        onUpdatePetition={handleUpdatePetition}
        onRefetch={() => refetch()}
        section="compose"
        headerActions={
          petition?.__typename === "Petition" &&
          !petition.accesses?.find((a) => a.status === "ACTIVE" && !a.isContactless) &&
          petition.isInteractionWithRecipientsEnabled ? (
            <ResponsiveButtonIcon
              data-testid="compose-send-petition-button"
              data-action="compose-next"
              id="petition-next"
              colorScheme="primary"
              icon={<PaperPlaneIcon fontSize="18px" />}
              isDisabled={petition.isAnonymized || myEffectivePermission === "READ"}
              label={intl.formatMessage({
                id: "generic.send-to",
                defaultMessage: "Send to...",
              })}
              onClick={handleNextClick}
            />
          ) : null
        }
        hasLeftPane
        isLeftPaneActive={isAddFieldDrawerOpen}
        leftPane={
          <PetitionComposeNewFieldDrawer
            ref={fieldDrawerRef}
            user={me}
            onClose={handleCloseFieldDrawer}
            onAddField={handleAddField}
            onFieldEdit={handleFieldEdit}
            petition={petition}
            newFieldPlaceholderParentFieldId={inParentFieldId}
          />
        }
        hasRightPane
        isRightPaneActive={Boolean(activeFieldId)}
        rightPane={
          activeField ? (
            <PetitionComposeFieldSettings
              id={`compose-petition-field-settings-${activeField.id}`}
              data-testid="compose-petition-field-settings"
              data-field-id={activeField.id}
              petition={petition}
              key={activeField.id}
              field={activeField}
              fieldIndex={activeFieldWithIndex![1]}
              onFieldEdit={handleFieldEdit}
              onFieldTypeChange={handleFieldTypeChange}
              onClose={handleSettingsClose}
              isReadOnly={isReadOnly}
              user={me}
              {...extendFlexColumn}
            />
          ) : (
            <Tabs
              variant="enclosed"
              {...extendFlexColumn}
              overflow="hidden"
              index={tabIndex}
              onChange={handleTabsChange}
            >
              <TabList marginX="-1px" marginTop="-1px" flex="none">
                <Tab
                  paddingY={4}
                  paddingX={3.5}
                  lineHeight={5}
                  fontWeight="bold"
                  borderTopRadius={0}
                  _focusVisible={{ boxShadow: "inline" }}
                >
                  <ListIcon fontSize="18px" marginEnd={1} aria-hidden="true" />
                  <FormattedMessage id="generic.contents" defaultMessage="Contents" />
                </Tab>
                <Tab
                  data-action="petition-settings"
                  className="petition-settings"
                  paddingY={4}
                  paddingX={3.5}
                  lineHeight={5}
                  fontWeight="bold"
                  borderTopRadius={0}
                  _focusVisible={{ boxShadow: "inline" }}
                >
                  <SettingsIcon fontSize="16px" marginEnd={1} aria-hidden="true" />
                  <FormattedMessage
                    id="page.compose.petition-settings-header"
                    defaultMessage="Settings"
                  />
                </Tab>
                <Tab
                  data-action="petition-settings"
                  className="petition-settings"
                  paddingY={4}
                  paddingX={3.5}
                  lineHeight={5}
                  fontWeight="bold"
                  borderTopRadius={0}
                  _focusVisible={{ boxShadow: "inline" }}
                >
                  <CalculatorIcon fontSize="16px" marginEnd={1} aria-hidden="true" />
                  <FormattedMessage
                    id="page.compose.petition-variables-header"
                    defaultMessage="Variables"
                  />
                </Tab>
              </TabList>
              <TabPanels {...extendFlexColumn}>
                <TabPanel {...extendFlexColumn} padding={0} overflow="auto" paddingBottom="52px">
                  <PetitionComposeContents
                    fieldsWithIndices={allFieldsWithIndices as any}
                    onFieldClick={scrollToField}
                    onFieldEdit={handleFieldEdit}
                    isReadOnly={isReadOnly}
                  />
                </TabPanel>
                <TabPanel {...extendFlexColumn} padding={0} overflow="auto" paddingBottom="52px">
                  <PetitionSettings
                    user={me}
                    petition={petition}
                    onUpdatePetition={handleUpdatePetition}
                    validPetitionFields={validPetitionFields}
                    onRefetch={() => refetch()}
                  />
                </TabPanel>
                <TabPanel {...extendFlexColumn} padding={0} overflow="auto" paddingBottom="52px">
                  <PetitionComposeVariables
                    petition={petition}
                    allFieldsWithIndices={allFieldsWithIndices as any}
                    isReadOnly={isReadOnly}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          )
        }
      >
        <Box position="sticky" top={0} zIndex={2}>
          {displayPetitionLimitReachedAlert ? (
            <PetitionLimitReachedAlert limit={me.organization.petitionsPeriod?.limit ?? 0} />
          ) : null}
          {petition?.__typename === "Petition" &&
          ["COMPLETED", "CLOSED"].includes(petition.status) &&
          !petition.isAnonymized ? (
            <PetitionCompletedAlert />
          ) : null}
        </Box>
        <Box
          padding={4}
          zIndex={1}
          backgroundColor={petition.__typename === "PetitionTemplate" ? "primary.50" : undefined}
        >
          <AddNewFieldPlaceholderProvider value={{ afterFieldId, inParentFieldId }}>
            <PetitionComposeFieldList
              showErrors={showErrors}
              petition={petition}
              activeFieldId={activeFieldId}
              onCloneField={handleCloneField}
              onDeleteField={handleDeleteField}
              onUpdateFieldPositions={handleUpdateFieldPositions}
              onFieldEdit={handleFieldEdit}
              onFieldSettingsClick={handleFieldSettingsClick}
              onFieldTypeIndicatorClick={handleFieldTypeIndicatorClick}
              onLinkField={handleLinkField}
              onUnlinkField={handleUnlinkField}
              showAddField={handleShowAddField}
              isReadOnly={isReadOnly}
            />
          </AddNewFieldPlaceholderProvider>
          {petition.isDocumentGenerationEnabled ? (
            <PetitionComposeAttachments petition={petition} isReadOnly={isReadOnly} marginTop="4" />
          ) : null}

          {petition.__typename === "PetitionTemplate" ? (
            <PetitionTemplateDescriptionEdit
              petitionId={petition.id}
              marginTop="4"
              description={petition.description}
              onUpdatePetition={handleUpdatePetition}
              isReadOnly={isReadOnly}
            />
          ) : null}

          {petition.__typename === "Petition" && petition.accesses.length > 0 ? (
            <Box color="gray.500" marginTop={12} paddingX={4} textAlign="center">
              <Text>
                <FormattedMessage
                  id="page.compose.petition-already-sent"
                  defaultMessage="This parallel has already been sent."
                />
              </Text>
              <Text>
                <FormattedMessage
                  id="page.compose.send-from-activity"
                  defaultMessage="If you want to send it to someone else you can do it from the <a>Activity</a> tab."
                  values={{
                    a: (chunks: any) => (
                      <Link href={`/app/petitions/${petitionId}/activity`}>{chunks}</Link>
                    ),
                  }}
                />
              </Text>
            </Box>
          ) : null}
        </Box>
      </PetitionLayout>
    </ToneProvider>
  );
}

const _fragments = {
  get PetitionBase() {
    return gql`
      fragment PetitionCompose_PetitionBase on PetitionBase {
        id
        isInteractionWithRecipientsEnabled
        isDocumentGenerationEnabled
        organization {
          id
          brandTheme {
            preferredTone
          }
        }
        isRestricted
        fields {
          id
          ...PetitionCompose_PetitionField
        }
        myEffectivePermission {
          permissionType
        }
        isAnonymized
        ... on Petition {
          accesses {
            id
            status
            isContactless
          }
          status
          signatureConfig {
            integration {
              environment
              name
            }
          }
          ...useSendPetitionHandler_Petition
        }
        ... on PetitionTemplate {
          isPublic
          description
        }
        ...PetitionLayout_PetitionBase
        ...PetitionSettings_PetitionBase
        ...PetitionComposeFieldList_PetitionBase
        ...PetitionComposeAttachments_PetitionBase
        ...PetitionComposeVariables_PetitionBase
        ...validatePetitionFields_PetitionBase
        ...PetitionComposeFieldSettings_PetitionBase
        ...useFieldsWithIndices_PetitionBase
        ...PetitionComposeNewFieldDrawer_PetitionBase
      }
      ${this.PetitionField}
      ${PetitionLayout.fragments.PetitionBase}
      ${PetitionComposeFieldList.fragments.PetitionBase}
      ${PetitionSettings.fragments.PetitionBase}
      ${PetitionComposeAttachments.fragments.PetitionBase}
      ${useSendPetitionHandler.fragments.Petition}
      ${PetitionComposeVariables.fragments.PetitionBase}
      ${validatePetitionFields.fragments.PetitionBase}
      ${PetitionComposeFieldSettings.fragments.PetitionBase}
      ${useFieldsWithIndices.fragments.PetitionBase}
      ${PetitionComposeNewFieldDrawer.fragments.PetitionBase}
    `;
  },
  get PetitionField() {
    return gql`
      fragment PetitionCompose_PetitionField on PetitionField {
        id
        ...PetitionComposeFieldList_PetitionField
        ...PetitionComposeContents_PetitionField
        ...PetitionComposeFieldSettings_PetitionField
        ...validatePetitionFields_PetitionField
        ...FieldErrorDialog_PetitionField
        ...ReferencedFieldDialog_PetitionField
        parent {
          id
          position
        }
        children {
          id
          ...PetitionComposeContents_PetitionField
          ...PetitionComposeFieldSettings_PetitionField
          ...validatePetitionFields_PetitionField
          ...FieldErrorDialog_PetitionField
          ...ReferencedFieldDialog_PetitionField
          parent {
            id
            position
          }
          replies {
            id
          }
        }
      }
      ${PetitionComposeFieldList.fragments.PetitionField}
      ${PetitionComposeFieldSettings.fragments.PetitionField}
      ${PetitionComposeContents.fragments.PetitionField}
      ${validatePetitionFields.fragments.PetitionField}
      ${FieldErrorDialog.fragments.PetitionField}
      ${ReferencedFieldDialog.fragments.PetitionField}
    `;
  },
  get updatePetitionField() {
    return gql`
      fragment PetitionCompose_updatePetitionField on PetitionField {
        id
        ...PetitionCompose_PetitionField
        petition {
          id
          lastChangeAt
          ... on Petition {
            status
          }
        }
      }
      ${this.PetitionField}
    `;
  },
  get Query() {
    return gql`
      fragment PetitionCompose_Query on Query {
        ...PetitionLayout_Query
        me {
          id
          ...PetitionSettings_User
          ...useUpdateIsReadNotification_User
          ...useSendPetitionHandler_User
          organization {
            isPetitionUsageLimitReached: isUsageLimitReached(limitName: PETITION_SEND)
            petitionsPeriod: currentUsagePeriod(limitName: PETITION_SEND) {
              limit
            }
          }
          ...PetitionComposeFieldSettings_User
          ...PetitionComposeNewFieldDrawer_User
        }
      }
      ${PetitionLayout.fragments.Query}
      ${PetitionSettings.fragments.User}
      ${useSendPetitionHandler.fragments.User}
      ${useUpdateIsReadNotification.fragments.User}
      ${PetitionComposeFieldSettings.fragments.User}
      ${PetitionComposeNewFieldDrawer.fragments.User}
    `;
  },
};

const _mutations = [
  gql`
    mutation PetitionCompose_updatePetitionFieldAutoSearchConfig(
      $petitionId: GID!
      $fieldId: GID!
      $config: UpdatePetitionFieldAutoSearchConfigInput
    ) {
      updatePetitionFieldAutoSearchConfig(
        petitionId: $petitionId
        fieldId: $fieldId
        config: $config
      ) {
        id
        options
      }
    }
  `,
  gql`
    mutation PetitionCompose_updatePetition($petitionId: GID!, $data: UpdatePetitionInput!) {
      updatePetition(petitionId: $petitionId, data: $data) {
        ...PetitionLayout_PetitionBase
        ...PetitionSettings_PetitionBase
        ...AddPetitionAccessDialog_Petition
      }
    }
    ${PetitionLayout.fragments.PetitionBase}
    ${PetitionSettings.fragments.PetitionBase}
    ${AddPetitionAccessDialog.fragments.Petition}
  `,
  gql`
    mutation PetitionCompose_updateFieldPositions(
      $petitionId: GID!
      $fieldIds: [GID!]!
      $parentFieldId: GID
    ) {
      updateFieldPositions(
        petitionId: $petitionId
        fieldIds: $fieldIds
        parentFieldId: $parentFieldId
      ) {
        id
        ...PetitionLayout_PetitionBase
        fields {
          id
          position
          children {
            id
            position
            optional
          }
        }
      }
    }
    ${PetitionLayout.fragments.PetitionBase}
  `,
  gql`
    mutation PetitionCompose_createPetitionField(
      $petitionId: GID!
      $type: PetitionFieldType!
      $position: Int
      $parentFieldId: GID
    ) {
      createPetitionField(
        petitionId: $petitionId
        type: $type
        position: $position
        parentFieldId: $parentFieldId
      ) {
        id
        ...PetitionCompose_PetitionField
        ...PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionField
        petition {
          ...PetitionLayout_PetitionBase
          ...PetitionComposeNewFieldDrawer_PetitionBase
          fields {
            id
            position
            children {
              id
            }
          }
        }
      }
    }
    ${updatePreviewFieldReplies.fragments.PetitionField}
    ${PetitionLayout.fragments.PetitionBase}
    ${PetitionComposeNewFieldDrawer.fragments.PetitionBase}
    ${_fragments.PetitionField}
  `,
  gql`
    mutation PetitionCompose_clonePetitionField($petitionId: GID!, $fieldId: GID!) {
      clonePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
        id
        ...PetitionCompose_PetitionField
        ...PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionField
        petition {
          ...PetitionLayout_PetitionBase
          ...PetitionComposeNewFieldDrawer_PetitionBase
          fields {
            id
            position
            children {
              id
            }
          }
        }
      }
    }
    ${updatePreviewFieldReplies.fragments.PetitionField}
    ${PetitionLayout.fragments.PetitionBase}
    ${PetitionComposeNewFieldDrawer.fragments.PetitionBase}
    ${_fragments.PetitionField}
  `,
  gql`
    mutation PetitionCompose_deletePetitionField(
      $petitionId: GID!
      $fieldId: GID!
      $force: Boolean
    ) {
      deletePetitionField(petitionId: $petitionId, fieldId: $fieldId, force: $force) {
        id
        ...PetitionLayout_PetitionBase
        fields {
          id
          position
          children {
            id
          }
        }
      }
    }
    ${PetitionLayout.fragments.PetitionBase}
  `,
  gql`
    mutation PetitionCompose_updatePetitionField(
      $petitionId: GID!
      $fieldId: GID!
      $data: UpdatePetitionFieldInput!
      $force: Boolean
    ) {
      updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data, force: $force) {
        ...PetitionCompose_updatePetitionField
      }
    }
    ${_fragments.updatePetitionField}
  `,
  gql`
    mutation PetitionCompose_changePetitionFieldType(
      $petitionId: GID!
      $fieldId: GID!
      $type: PetitionFieldType!
      $force: Boolean
    ) {
      changePetitionFieldType(
        petitionId: $petitionId
        fieldId: $fieldId
        type: $type
        force: $force
      ) {
        id
        ...PetitionCompose_PetitionField
        petition {
          id
          ... on Petition {
            status
          }
          lastChangeAt
        }
      }
    }
    ${_fragments.PetitionField}
  `,
  gql`
    mutation PetitionCompose_linkPetitionFieldChildren(
      $petitionId: GID!
      $parentFieldId: GID!
      $childrenFieldIds: [GID!]!
      $force: Boolean
    ) {
      linkPetitionFieldChildren(
        petitionId: $petitionId
        parentFieldId: $parentFieldId
        childrenFieldIds: $childrenFieldIds
        force: $force
      ) {
        ...PetitionCompose_PetitionField
        petition {
          id
          fields {
            id
            isChild
          }
          lastChangeAt
        }
      }
    }
    ${_fragments.PetitionField}
  `,
  gql`
    mutation PetitionCompose_unlinkPetitionFieldChildren(
      $petitionId: GID!
      $parentFieldId: GID!
      $childrenFieldIds: [GID!]!
      $force: Boolean
    ) {
      unlinkPetitionFieldChildren(
        petitionId: $petitionId
        parentFieldId: $parentFieldId
        childrenFieldIds: $childrenFieldIds
        force: $force
      ) {
        ...PetitionCompose_PetitionField
        petition {
          id
          fields {
            id
            isChild
            parent {
              id
            }
          }
          lastChangeAt
        }
      }
    }
    ${_fragments.PetitionField}
  `,
  gql`
    mutation PetitionCompose_createProfileLinkedPetitionField(
      $petitionId: GID!
      $parentFieldId: GID!
      $profileTypeFieldId: GID!
      $position: Int
    ) {
      createProfileLinkedPetitionField(
        petitionId: $petitionId
        parentFieldId: $parentFieldId
        profileTypeFieldId: $profileTypeFieldId
        position: $position
      ) {
        id
        ...PetitionCompose_PetitionField
        ...PetitionComposeField_ChildPetitionField
        ...PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionField
        petition {
          ...PetitionLayout_PetitionBase
          ...PetitionComposeNewFieldDrawer_PetitionBase
          fields {
            id
            position
            children {
              id
            }
          }
        }
      }
    }
    ${updatePreviewFieldReplies.fragments.PetitionField}
    ${PetitionLayout.fragments.PetitionBase}
    ${PetitionComposeNewFieldDrawer.fragments.PetitionBase}
    ${_fragments.PetitionField}
  `,
];

const _queries = [
  gql`
    query PetitionCompose_user {
      ...PetitionCompose_Query
    }
    ${_fragments.Query}
  `,
  gql`
    query PetitionCompose_petition($id: GID!) {
      petition(id: $id) {
        ...PetitionCompose_PetitionBase
      }
    }
    ${_fragments.PetitionBase}
  `,
];

PetitionCompose.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const petitionId = query.petitionId as string;
  await Promise.all([
    fetchQuery(PetitionCompose_userDocument),
    fetchQuery(PetitionCompose_petitionDocument, {
      variables: { id: petitionId },
      ignoreCache: true,
    }),
  ]);
  return { petitionId };
};

export default compose(withPetitionLayoutContext, withDialogs, withApolloData)(PetitionCompose);
