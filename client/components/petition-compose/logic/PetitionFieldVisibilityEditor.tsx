import { gql } from "@apollo/client";
import { Box, Flex, Grid, IconButton, Stack } from "@chakra-ui/react";
import { DeleteIcon } from "@parallel/chakra/icons";
import {
  PetitionFieldVisibilityEditor_PetitionBaseFragment,
  PetitionFieldVisibilityEditor_PetitionFieldFragment,
} from "@parallel/graphql/__types";
import {
  PetitionFieldLogicCondition,
  PetitionFieldLogicConditionLogicalJoin,
  PetitionFieldVisibility,
  PetitionFieldVisibilityType,
} from "@parallel/utils/fieldLogic/types";
import { Fragment, SetStateAction } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { PetitionFieldLogicAddConditionButton } from "./PetitionFieldLogicAddConditionButton";
import { PetitionFieldLogicConditionEditor } from "./PetitionFieldLogicConditionEditor";
import { PetitionFieldLogicConditionLogicalJoinSelect } from "./PetitionFieldLogicConditionLogicalJoinSelect";
import { PetitionFieldLogicContext } from "./PetitionFieldLogicContext";
import { PetitionFieldVisibilityTypeSelect } from "./PetitionFieldVisibilityTypeSelect";

export interface PetitionFieldVisibilityProps {
  field: PetitionFieldVisibilityEditor_PetitionFieldFragment;
  petition: PetitionFieldVisibilityEditor_PetitionBaseFragment;
  showErrors?: boolean;
  onVisibilityEdit: (visibility: PetitionFieldVisibility) => void;
  isReadOnly?: boolean;
}

export function PetitionFieldVisibilityEditor({
  field,
  petition,
  onVisibilityEdit,
  showErrors,
  isReadOnly,
}: PetitionFieldVisibilityProps) {
  const intl = useIntl();

  const visibility = field.visibility as PetitionFieldVisibility;
  function setVisibility(dispatch: (prev: PetitionFieldVisibility) => PetitionFieldVisibility) {
    onVisibilityEdit(dispatch(visibility));
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

  return (
    <PetitionFieldLogicContext petition={petition} field={field}>
      <Stack spacing={2} padding={2} borderRadius="md" backgroundColor="gray.100">
        <Grid
          templateColumns={{
            base: "auto minmax(160px, 1fr)",
            xl: "auto minmax(160px, 2fr) 3fr",
          }}
          alignItems="start"
          columnGap={2}
          rowGap={2}
        >
          {visibility.conditions.map((condition, index) => {
            return (
              <Fragment key={index}>
                <Box fontSize="sm">
                  {index === 0 ? (
                    <PetitionFieldVisibilityTypeSelect
                      value={visibility.type}
                      onChange={(type) => setVisibilityType(type!)}
                      isReadOnly={isReadOnly}
                    />
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
                            isReadOnly={isReadOnly}
                          />
                        </Box>
                      ) : (
                        <Flex
                          flex="1"
                          alignItems="start"
                          paddingLeft="11px"
                          textStyle={isReadOnly ? "muted" : undefined}
                        >
                          {visibility.operator === "AND" ? (
                            <FormattedMessage
                              id="component.petition-field-visibility-editor.and"
                              defaultMessage="and"
                            />
                          ) : (
                            <FormattedMessage
                              id="component.petition-field-visibility-editor.or"
                              defaultMessage="or"
                            />
                          )}
                        </Flex>
                      )}
                    </Stack>
                  )}
                </Box>
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

        {visibility.conditions.length < 15 && !isReadOnly ? (
          <PetitionFieldLogicAddConditionButton
            conditions={visibility.conditions}
            onAddCondition={(condition) =>
              setConditions((conditions) => [...conditions, condition])
            }
          />
        ) : null}
      </Stack>
    </PetitionFieldLogicContext>
  );
}

PetitionFieldVisibilityEditor.fragments = {
  PetitionBase: gql`
    fragment PetitionFieldVisibilityEditor_PetitionBase on PetitionBase {
      ...PetitionFieldLogicContext_PetitionBase
    }
    ${PetitionFieldLogicContext.fragments.PetitionBase}
  `,
  PetitionField: gql`
    fragment PetitionFieldVisibilityEditor_PetitionField on PetitionField {
      visibility
      ...PetitionFieldLogicContext_PetitionField
    }
    ${PetitionFieldLogicContext.fragments.PetitionField}
  `,
};
