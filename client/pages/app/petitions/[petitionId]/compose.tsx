import { gql, useApolloClient, useMutation } from "@apollo/client";
import { Box, Flex, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from "@chakra-ui/react";
import { CalculatorIcon, ListIcon, PaperPlaneIcon, SettingsIcon } from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { Link } from "@parallel/components/common/Link";
import { ResponsiveButtonIcon } from "@parallel/components/common/ResponsiveButtonIcon";
import { ToneProvider } from "@parallel/components/common/ToneProvider";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
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
import { TwoPaneLayout } from "@parallel/components/layout/TwoPaneLayout";
import { AddPetitionAccessDialog } from "@parallel/components/petition-activity/dialogs/AddPetitionAccessDialog";
import { PetitionCompletedAlert } from "@parallel/components/petition-common/PetitionCompletedAlert";
import { useSendPetitionHandler } from "@parallel/components/petition-common/useSendPetitionHandler";
import { PetitionComposeAttachments } from "@parallel/components/petition-compose/PetitionComposeAttachments";
import { PetitionComposeContents } from "@parallel/components/petition-compose/PetitionComposeContents";
import { PetitionComposeFieldList } from "@parallel/components/petition-compose/PetitionComposeFieldList";
import { PetitionComposeVariables } from "@parallel/components/petition-compose/PetitionComposeVariables";
import { PetitionLimitReachedAlert } from "@parallel/components/petition-compose/PetitionLimitReachedAlert";
import { PetitionSettings } from "@parallel/components/petition-compose/PetitionSettings";
import { PetitionTemplateDescriptionEdit } from "@parallel/components/petition-compose/PetitionTemplateDescriptionEdit";
import { useConfirmChangeFieldTypeDialog } from "@parallel/components/petition-compose/dialogs/ConfirmChangeFieldTypeDialog";
import { useConfirmChangeShortTextFormatDialog } from "@parallel/components/petition-compose/dialogs/ConfirmChangeShortTextFormatDialog";
import { useConfirmDeleteFieldDialog } from "@parallel/components/petition-compose/dialogs/ConfirmDeleteFieldDialog";
import { useConfirmLinkFieldDialog } from "@parallel/components/petition-compose/dialogs/ConfirmLinkFieldDialog";
import { useConfirmUnlinkFieldDialog } from "@parallel/components/petition-compose/dialogs/ConfirmUnlinkFieldDialog";
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
  PetitionCompose_deletePetitionFieldDocument,
  PetitionCompose_linkPetitionFieldChildrenDocument,
  PetitionCompose_petitionDocument,
  PetitionCompose_unlinkPetitionFieldChildrenDocument,
  PetitionCompose_updateFieldPositionsDocument,
  PetitionCompose_updatePetitionDocument,
  PetitionCompose_updatePetitionFieldDocument,
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
import { waitFor } from "@parallel/utils/promises/waitFor";
import { withError } from "@parallel/utils/promises/withError";
import { Maybe, UnwrapArray, UnwrapPromise } from "@parallel/utils/types";
import { useTempQueryParam } from "@parallel/utils/useTempQueryParam";
import { useUpdatingRef } from "@parallel/utils/useUpdatingRef";
import { validatePetitionFields } from "@parallel/utils/validatePetitionFields";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, uniqBy, zip } from "remeda";
import scrollIntoView from "smooth-scroll-into-view-if-needed";

type PetitionComposeProps = UnwrapPromise<ReturnType<typeof PetitionCompose.getInitialProps>>;

type FieldSelection = PetitionCompose_PetitionFieldFragment;

function PetitionCompose({ petitionId }: PetitionComposeProps) {
  const intl = useIntl();

  const {
    data: { me, realMe },
  } = useAssertQuery(PetitionCompose_userDocument);
  const { data, refetch } = useAssertQuery(PetitionCompose_petitionDocument, {
    variables: { id: petitionId },
  });
  const petition = data.petition!;

  const apollo = useApolloClient();

  const updateIsReadNotification = useUpdateIsReadNotification();
  useEffect(() => {
    updateIsReadNotification({ isRead: true, filter: "SHARED", petitionIds: [petitionId] });
  }, []);

  const isTemplate = petition.__typename === "PetitionTemplate";

  const isPublicTemplate = isTemplate && petition.isPublic;

  const myEffectivePermission = petition.myEffectivePermission!.permissionType;

  const isSharedByLink = (isTemplate && petition.publicLink?.isActive) ?? false;

  const fieldsWithIndices = useFieldsWithIndices(petition.fields);
  const allFieldsWithIndices = useMemo(() => {
    return fieldsWithIndices.flatMap(([field, fieldIndex, childrenFieldIndices]) => {
      return [
        [field, fieldIndex],
        ...(isDefined(field.children) ? zip(field.children, childrenFieldIndices!) : []),
      ] as unknown as [
        FieldSelection | UnwrapArray<Exclude<FieldSelection["children"], null | undefined>>,
        string,
      ][];
    });
  }, [fieldsWithIndices]);
  const [activeFieldId, setActiveFieldId] = useState<Maybe<string>>(null);
  const activeFieldWithIndex = useMemo(() => {
    return isDefined(activeFieldId)
      ? allFieldsWithIndices.find(([field]) => field.id === activeFieldId) ?? null
      : null;
  }, [allFieldsWithIndices, activeFieldId]);
  const activeField = activeFieldWithIndex?.[0] ?? null;

  const fieldsRef = useUpdatingRef({ allFieldsWithIndices, activeFieldId });

  const wrapper = usePetitionStateWrapper();

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
    await waitFor(500);
    handleIndexFieldClick(fieldId);
  });

  useTempQueryParam("fromTemplate", () => {
    withError(showPetitionFromTemplateDialog());
  });

  useEffect(() => {
    setShowErrors(isSharedByLink);
  }, [setShowErrors, isSharedByLink]);

  useEffect(() => {
    // Validate and focus fields when have "tags" in url, because it probably comes from other page when validates petition fields
    const hash = window.location.hash;
    if (hash) {
      if (hash.includes("#field-settings-")) {
        handleFieldSettingsClick(hash.replace("#field-settings-", ""));
      } else {
        const { error, fieldsWithIndices } = validatePetitionFields(allFieldsWithIndices);
        if (error && fieldsWithIndices && fieldsWithIndices.length > 0) {
          setShowErrors(true);
          focusFieldTitle(fieldsWithIndices[0][0].id);
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
      setActiveFieldId(field.id);
      focusFieldTitle(field.id);
    }),
    [petitionId],
  );

  const [deletePetitionField] = useMutation(PetitionCompose_deletePetitionFieldDocument);
  const confirmDelete = useConfirmDeleteFieldDialog();

  /** returns true if referencing fields have been fixed */
  const tryFixReferencingFields = async (fieldId: string) => {
    const { allFieldsWithIndices } = fieldsRef.current!;
    // if this field is being referenced by any other field ask the user
    // if they want to remove the conflicting conditions

    const fieldToCheck = allFieldsWithIndices.find(([f]) => f.id === fieldId)![0];
    const referencingVisibility = allFieldsWithIndices.filter(
      ([f]) =>
        (f.visibility as PetitionFieldVisibility)?.conditions.some(
          (c) =>
            "fieldId" in c &&
            (fieldToCheck.type === "FIELD_GROUP"
              ? c.fieldId === fieldId || fieldToCheck.children?.some((f) => c.fieldId === f.id)
              : c.fieldId === fieldId),
        ),
    );

    const referencingMath = allFieldsWithIndices.filter(
      ([f]) =>
        (f.math as PetitionFieldMath[])?.some(
          (calc) =>
            calc.conditions.some((c) => "fieldId" in c && c.fieldId === fieldId) ||
            calc.operations.some(
              (o) => o.operand.type === "FIELD" && o.operand.fieldId === fieldId,
            ),
        ),
    );

    if (referencingVisibility.length > 0 || referencingMath.length > 0) {
      try {
        await showReferencedFieldDialog({
          fieldsWithIndices: uniqBy(
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
          .filter(isDefined);

        await _handleFieldEdit(field.id, {
          math: newMath.length > 0 ? newMath : null,
        });
      }
      return true;
    }
  };

  const handleDeleteField = useCallback(
    wrapper(async function (fieldId: string) {
      setActiveFieldId((activeFieldId) => (activeFieldId === fieldId ? null : activeFieldId));
      await deleteField(false);

      async function deleteField(force: boolean) {
        try {
          const { allFieldsWithIndices } = fieldsRef.current;
          const field = allFieldsWithIndices.find(([f]) => f.id === fieldId)![0];
          await deletePetitionField({
            variables: { petitionId, fieldId, force },
            update: (cache, { data }) => {
              if (isTemplate && isDefined(field.parent) && isDefined(data)) {
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
    [petitionId],
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
        isDefined(data.isInternal) &&
        data.isInternal === false &&
        isDefined(field) &&
        field.type === "FIELD_GROUP" &&
        (field.children ?? []).length > 0 &&
        field.children![0].type === "DOW_JONES_KYC"
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
        const referencingVisibility = allFieldsWithIndices.filter(
          ([f]) =>
            (f.visibility as PetitionFieldVisibility)?.conditions.some((c) => !validCondition(c)),
        );

        const referencingMath = allFieldsWithIndices.filter(
          ([f]) =>
            (f.math as PetitionFieldMath[])?.some((calc) =>
              calc.conditions.some((c) => !validCondition(c)),
            ),
        );

        if (referencingVisibility.length || referencingMath.length) {
          try {
            await showReferencedFieldDialog({
              fieldsWithIndices: uniqBy(
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
                .filter(isDefined);

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
        });
      } catch (e) {
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

  const showReferencedFieldDialog = useReferencedFieldDialog();
  const confirmChangeFieldType = useConfirmChangeFieldTypeDialog();
  const [changePetitionFieldType] = useMutation(PetitionCompose_changePetitionFieldTypeDocument);
  const handleFieldTypeChange = useCallback(
    wrapper(async function (fieldId: string, type: PetitionFieldType) {
      const { allFieldsWithIndices } = fieldsRef.current!;
      const field = allFieldsWithIndices.find(([f]) => f.id === fieldId)![0];
      const referencingVisibility = allFieldsWithIndices.filter(
        ([f]) =>
          (f.visibility as PetitionFieldVisibility)?.conditions.some(
            (c) => "fieldId" in c && c.fieldId === fieldId,
          ),
      );

      const referencingMath = allFieldsWithIndices.filter(
        ([f]) =>
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
              fieldsWithIndices: uniqBy(
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
                .filter(isDefined);

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

  const [createPetitionField] = useMutation(PetitionCompose_createPetitionFieldDocument);
  const handleAddField = useCallback(
    wrapper(async function (type: PetitionFieldType, position?: number, parentFieldId?: string) {
      const { data } = await createPetitionField({
        variables: { petitionId, type, position, parentFieldId },
        update: (cache, { data }) => {
          if (isTemplate && isDefined(parentFieldId) && isDefined(data)) {
            updatePreviewFieldReplies(cache, parentFieldId, (replies) => {
              return replies.map((r) => {
                const children = [...r.children!];
                children[0].__typename;
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

      setActiveFieldId(data!.createPetitionField.id);
      focusFieldTitle(data!.createPetitionField.id);
    }),
    [petitionId],
  );

  const showErrorDialog = useErrorDialog();
  const showFieldErrorDialog = useFieldErrorDialog();
  const validPetitionFields = async () => {
    const { error, message, fieldsWithIndices } = validatePetitionFields(allFieldsWithIndices);
    if (error) {
      setShowErrors(true);
      if (fieldsWithIndices && fieldsWithIndices.length > 0) {
        await withError(showFieldErrorDialog({ message, fieldsWithIndices }));
        const firstId = fieldsWithIndices[0][0].id;
        const node = document.querySelector(`#field-${firstId}`);
        await scrollIntoView(node!, { block: "center", behavior: "smooth" });
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
      try {
        await linkPetitionFieldChild({
          variables: {
            petitionId,
            parentFieldId,
            childrenFieldIds,
          },
          update: (cache, { data }) => {
            if (isTemplate && isDefined(data)) {
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
      } catch (error) {
        if (isApolloError(error, "FIELD_HAS_REPLIES_ERROR")) {
          try {
            await showConfirmLinkDialog();
            await linkPetitionFieldChild({
              variables: {
                petitionId,
                parentFieldId,
                childrenFieldIds,
                force: true,
              },
              update: (cache, { data }) => {
                if (isTemplate && isDefined(data)) {
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
    [petitionId],
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
            if (isTemplate && isDefined(data))
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
    [petitionId],
  );

  const handleNextClick = useSendPetitionHandler(
    me,
    petition?.__typename === "Petition" ? petition : null,
    handleUpdatePetition,
    validPetitionFields,
  );

  const handleIndexFieldClick = useCallback(async (fieldId: string) => {
    const fieldElement = document.querySelector(`#field-${fieldId}`);
    if (fieldElement) {
      focusFieldTitle(fieldId);
      await scrollIntoView(fieldElement, {
        block: "center",
        behavior: "smooth",
        scrollMode: "if-needed",
      });
    }
  }, []);

  function focusFieldTitle(fieldId: string) {
    setTimeout(() => {
      const title = document.querySelector<HTMLElement>(`#field-title-${fieldId}`);
      title?.focus();
    });
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
        me={me}
        realMe={realMe}
        petition={petition}
        onUpdatePetition={handleUpdatePetition}
        onRefetch={() => refetch()}
        section="compose"
        headerActions={
          petition?.__typename === "Petition" &&
          !petition.accesses?.find((a) => a.status === "ACTIVE" && !a.isContactless) ? (
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
        subHeader={
          <>
            {displayPetitionLimitReachedAlert ? (
              <PetitionLimitReachedAlert limit={me.organization.petitionsPeriod?.limit ?? 0} />
            ) : null}
            {petition?.__typename === "Petition" &&
            ["COMPLETED", "CLOSED"].includes(petition.status) &&
            !petition.isAnonymized ? (
              <PetitionCompletedAlert />
            ) : null}
          </>
        }
      >
        <TwoPaneLayout
          backgroundColor={petition.__typename === "PetitionTemplate" ? "primary.50" : undefined}
          top={4}
          isSidePaneActive={Boolean(activeFieldId)}
          sidePane={
            <Flex
              direction="column"
              paddingX={4}
              paddingLeft={{ lg: 0 }}
              maxHeight={{
                base: "calc(100vh - 188px)",
                sm: "calc(100vh - 122px)",
                md: "calc(100vh - 82px)",
              }}
              paddingBottom={{ base: 4, sm: "80px" }}
            >
              {activeField ? (
                <PetitionComposeFieldSettings
                  id={`compose-petition-field-settings-${activeField.id}`}
                  data-testid="compose-petition-field-settings"
                  data-field-id={activeField.id}
                  petitionId={petition.id}
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
                <Card {...extendFlexColumn}>
                  <Tabs
                    variant="enclosed"
                    {...extendFlexColumn}
                    index={tabIndex}
                    onChange={handleTabsChange}
                  >
                    <TabList marginX="-1px" marginTop="-1px" flex="none">
                      <Tab padding={4} lineHeight={5} fontWeight="bold">
                        <ListIcon fontSize="18px" marginRight={2} aria-hidden="true" />
                        <FormattedMessage id="generic.contents" defaultMessage="Contents" />
                      </Tab>
                      <Tab
                        data-action="petition-settings"
                        className="petition-settings"
                        padding={4}
                        lineHeight={5}
                        fontWeight="bold"
                      >
                        <SettingsIcon fontSize="16px" marginRight={2} aria-hidden="true" />
                        <FormattedMessage
                          id="page.compose.petition-settings-header"
                          defaultMessage="Settings"
                        />
                      </Tab>
                      <Tab
                        data-action="petition-settings"
                        className="petition-settings"
                        padding={4}
                        lineHeight={5}
                        fontWeight="bold"
                      >
                        <CalculatorIcon fontSize="16px" marginRight={2} aria-hidden="true" />
                        <FormattedMessage
                          id="page.compose.petition-variables-header"
                          defaultMessage="Variables"
                        />
                      </Tab>
                    </TabList>
                    <TabPanels {...extendFlexColumn}>
                      <TabPanel {...extendFlexColumn} padding={0} overflow="auto">
                        <PetitionComposeContents
                          fieldsWithIndices={allFieldsWithIndices as any}
                          onFieldClick={handleIndexFieldClick}
                          onFieldEdit={handleFieldEdit}
                          isReadOnly={isReadOnly}
                        />
                      </TabPanel>
                      <TabPanel {...extendFlexColumn} padding={0} overflow="auto">
                        <PetitionSettings
                          user={me}
                          petition={petition}
                          onUpdatePetition={handleUpdatePetition}
                          validPetitionFields={validPetitionFields}
                          onRefetch={() => refetch({ id: petitionId })}
                        />
                      </TabPanel>
                      <TabPanel {...extendFlexColumn} padding={0} overflow="auto">
                        <PetitionComposeVariables
                          petition={petition}
                          allFieldsWithIndices={allFieldsWithIndices as any}
                          isReadOnly={isReadOnly}
                        />
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </Card>
              )}
            </Flex>
          }
        >
          <Box padding={4}>
            <PetitionComposeFieldList
              showErrors={showErrors}
              user={me}
              petition={petition}
              activeFieldId={activeFieldId}
              onAddField={handleAddField}
              onCloneField={handleCloneField}
              onDeleteField={handleDeleteField}
              onUpdateFieldPositions={handleUpdateFieldPositions}
              onFieldEdit={handleFieldEdit}
              onFieldSettingsClick={handleFieldSettingsClick}
              onFieldTypeIndicatorClick={handleFieldTypeIndicatorClick}
              onLinkField={handleLinkField}
              onUnlinkField={handleUnlinkField}
              isReadOnly={isReadOnly}
            />

            <PetitionComposeAttachments petition={petition} isReadOnly={isReadOnly} marginTop="4" />

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
        </TwoPaneLayout>
      </PetitionLayout>
    </ToneProvider>
  );
}

const _fragments = {
  get PetitionBase() {
    return gql`
      fragment PetitionCompose_PetitionBase on PetitionBase {
        id
        ...PetitionLayout_PetitionBase
        ...PetitionSettings_PetitionBase
        ...PetitionComposeFieldList_PetitionBase
        ...PetitionComposeAttachments_PetitionBase
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
        myEffectivePermission {
          permissionType
        }
        isAnonymized
        ...PetitionComposeVariables_PetitionBase
      }
      ${PetitionLayout.fragments.PetitionBase}
      ${PetitionComposeFieldList.fragments.PetitionBase}
      ${PetitionSettings.fragments.PetitionBase}
      ${PetitionComposeAttachments.fragments.PetitionBase}
      ${useSendPetitionHandler.fragments.Petition}
      ${PetitionComposeVariables.fragments.PetitionBase}
      ${this.PetitionField}
    `;
  },
  get PetitionField() {
    return gql`
      fragment PetitionCompose_PetitionField on PetitionField {
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
          children {
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
        }
      }
      ${PetitionLayout.fragments.Query}
      ${PetitionSettings.fragments.User}
      ${useSendPetitionHandler.fragments.User}
      ${useUpdateIsReadNotification.fragments.User}
      ${PetitionComposeFieldSettings.fragments.User}
    `;
  },
};

const _mutations = [
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
          fields {
            id
            children {
              id
            }
            parent {
              id
            }
          }
        }
      }
    }
    ${updatePreviewFieldReplies.fragments.PetitionField}
    ${PetitionLayout.fragments.PetitionBase}
    ${_fragments.PetitionField}
  `,
  gql`
    mutation PetitionCompose_clonePetitionField($petitionId: GID!, $fieldId: GID!) {
      clonePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
        id
        ...PetitionCompose_PetitionField
        petition {
          ...PetitionLayout_PetitionBase
          fields {
            id
            children {
              id
            }
            parent {
              id
            }
          }
        }
      }
    }
    ${PetitionLayout.fragments.PetitionBase}
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
    }
    ${_fragments.PetitionField}
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
