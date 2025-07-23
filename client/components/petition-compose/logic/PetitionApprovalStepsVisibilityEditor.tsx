import { gql } from "@apollo/client";
import { Box, Button, Flex, Grid, HStack, IconButton, Stack } from "@chakra-ui/react";
import { DeleteIcon } from "@parallel/chakra/icons";
import { PetitionApprovalStepsVisibilityEditor_PetitionBaseFragment } from "@parallel/graphql/__types";
import { defaultFieldCondition } from "@parallel/utils/fieldLogic/conditions";
import {
  PetitionFieldLogicCondition,
  PetitionFieldLogicConditionLogicalJoin,
  PetitionFieldVisibility,
  PetitionFieldVisibilityType,
} from "@parallel/utils/fieldLogic/types";
import { Fragment, SetStateAction, useEffect, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { PetitionFieldLogicAddConditionButton } from "./PetitionFieldLogicAddConditionButton";
import { PetitionFieldLogicConditionEditor } from "./PetitionFieldLogicConditionEditor";
import { PetitionFieldLogicConditionLogicalJoinSelect } from "./PetitionFieldLogicConditionLogicalJoinSelect";
import { PetitionFieldLogicContext } from "./PetitionFieldLogicContext";
import { PetitionFieldVisibilityTypeSelect } from "./PetitionFieldVisibilityTypeSelect";

export interface PetitionApprovalStepsVisibilityEditorProps {
  petition: PetitionApprovalStepsVisibilityEditor_PetitionBaseFragment;
  showErrors?: boolean;
  value: PetitionFieldVisibility;
  onChange: (visibility: PetitionFieldVisibility) => void;
  onRemove: () => void;
  isReadOnly?: boolean;
}

export function PetitionApprovalStepsVisibilityEditor({
  petition,
  value,
  onChange,
  onRemove,
  showErrors,
  isReadOnly,
}: PetitionApprovalStepsVisibilityEditorProps) {
  const intl = useIntl();

  const allFields = useMemo(
    () => petition.fields.flatMap((f) => [f, ...(f.children ?? [])]),
    [petition.fields],
  );
  const field = allFields.at(-1)!;
  const visibility =
    value ??
    ({
      type: "SHOW",
      operator: "AND",
      conditions: field && field.type !== "HEADING" ? [defaultFieldCondition(field)] : [{}],
    } as PetitionFieldVisibility);

  useEffect(() => {
    // This is a workaround to ensure that the visibility is always set when the component is mounted and the value is not provided
    if (!value) {
      onChange(visibility);
    }
  }, []);

  function setVisibility(dispatch: (prev: PetitionFieldVisibility) => PetitionFieldVisibility) {
    onChange(dispatch(visibility));
  }
  function setConditions(value: SetStateAction<PetitionFieldLogicCondition[]>) {
    return setVisibility((visibility) => ({
      ...visibility,
      conditions: typeof value === "function" ? value(visibility.conditions) : value,
    }));
  }
  function setVisibilityOperator(value: SetStateAction<PetitionFieldLogicConditionLogicalJoin>) {
    return setVisibility((visibility) => ({
      ...visibility,
      operator: typeof value === "function" ? value(visibility.operator) : value,
    }));
  }
  function setVisibilityType(value: SetStateAction<PetitionFieldVisibilityType>) {
    return setVisibility((visibility) => ({
      ...visibility,
      type: typeof value === "function" ? value(visibility.type) : value,
    }));
  }
  const updateCondition = function (index: number, condition: PetitionFieldLogicCondition) {
    setConditions((conditions) => conditions.map((c, i) => (i === index ? condition : c)));
  };

  const lastCondition = visibility.conditions[visibility.conditions.length - 1];
  const lastConditionFieldId = "fieldId" in lastCondition ? lastCondition.fieldId : null;
  const lastConditionField = allFields.find((f) => f.id === lastConditionFieldId);

  return (
    <PetitionFieldLogicContext petition={petition} field={field} includeSelf>
      <Stack spacing={2} padding={2} borderRadius="md" backgroundColor="gray.100">
        <Grid
          templateColumns={
            isReadOnly
              ? "auto 1fr"
              : {
                  base: "auto minmax(160px, 1fr)",
                  xl: "auto minmax(160px, 2fr) 3fr",
                }
          }
          alignItems="start"
          columnGap={2}
          rowGap={2}
        >
          {visibility.conditions.map((condition, index) => {
            return (
              <Fragment key={index}>
                {isReadOnly ? (
                  <Box justifySelf="flex-end" fontSize="sm" height="24px" lineHeight="24px">
                    {index === 0 ? (
                      <PetitionFieldVisibilityTypeSelect
                        value={visibility.type}
                        onChange={(type) => setVisibilityType(type!)}
                        isReadOnly
                      />
                    ) : (
                      <Box justifySelf="flex-end" fontSize="sm">
                        <Box as="span">
                          {visibility.operator === "AND" ? (
                            <FormattedMessage
                              id="generic.condition-logical-join-and"
                              defaultMessage="and"
                            />
                          ) : (
                            <FormattedMessage
                              id="generic.condition-logical-join-or"
                              defaultMessage="or"
                            />
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <>
                    {index === 0 ? (
                      <Box justifySelf="flex-end" fontSize="sm">
                        <PetitionFieldVisibilityTypeSelect
                          value={visibility.type}
                          onChange={(type) => setVisibilityType(type!)}
                          isReadOnly={isReadOnly}
                        />
                      </Box>
                    ) : (
                      <Stack direction="row">
                        <IconButton
                          size="sm"
                          icon={<DeleteIcon />}
                          aria-label={intl.formatMessage({
                            id: "generic.remove",
                            defaultMessage: "Remove",
                          })}
                          onClick={() =>
                            setConditions((conditions) => conditions.filter((c, i) => i !== index))
                          }
                          isDisabled={isReadOnly}
                        />
                        {index === 1 ? (
                          <Box flex="1" minWidth="0">
                            <PetitionFieldLogicConditionLogicalJoinSelect
                              value={visibility.operator}
                              onChange={(operator) => setVisibilityOperator(operator!)}
                            />
                          </Box>
                        ) : (
                          <Flex
                            flex="1"
                            alignItems="start"
                            paddingStart="11px"
                            textStyle={isReadOnly ? "muted" : undefined}
                          >
                            {visibility.operator === "AND" ? (
                              <FormattedMessage
                                id="generic.condition-logical-join-and"
                                defaultMessage="and"
                              />
                            ) : (
                              <FormattedMessage
                                id="generic.condition-logical-join-or"
                                defaultMessage="or"
                              />
                            )}
                          </Flex>
                        )}
                      </Stack>
                    )}
                  </>
                )}
                <PetitionFieldLogicConditionEditor
                  condition={condition}
                  onConditionChange={(value) => updateCondition(index, value)}
                  isReadOnly={isReadOnly}
                  showErrors={showErrors}
                />
              </Fragment>
            );
          })}
        </Grid>

        <HStack justify="space-between">
          <Box>
            {visibility.conditions.length < 15 && !isReadOnly ? (
              <PetitionFieldLogicAddConditionButton
                isDisabled={!lastConditionField || lastConditionField.type === "HEADING"}
                conditions={visibility.conditions}
                onAddCondition={(condition) =>
                  setConditions((conditions) => [...conditions, condition])
                }
              />
            ) : null}
          </Box>

          <Button
            variant="ghost"
            colorScheme="red"
            onClick={onRemove}
            size="sm"
            fontSize="md"
            fontWeight={400}
          >
            <FormattedMessage id="generic.remove-condition" defaultMessage="Remove condition" />
          </Button>
        </HStack>
      </Stack>
    </PetitionFieldLogicContext>
  );
}

PetitionApprovalStepsVisibilityEditor.fragments = {
  get PetitionBase() {
    return gql`
      fragment PetitionApprovalStepsVisibilityEditor_PetitionBase on PetitionBase {
        fields {
          id
          ...PetitionApprovalStepsVisibilityEditor_PetitionField
          children {
            id
            ...PetitionApprovalStepsVisibilityEditor_PetitionField
          }
        }
        ...PetitionFieldLogicContext_PetitionBase
      }
      ${PetitionFieldLogicContext.fragments.PetitionBase}
      ${this.PetitionField}
    `;
  },
  PetitionField: gql`
    fragment PetitionApprovalStepsVisibilityEditor_PetitionField on PetitionField {
      id
      visibility
    }
  `,
};
