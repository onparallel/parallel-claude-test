import { gql, useQuery } from "@apollo/client";
import { Badge, Box, Button, Center, Spinner } from "@chakra-ui/react";
import { EyeOffIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import {
  useWizardDialog,
  WizardStepDialogProps,
} from "@parallel/components/common/dialogs/WizardDialog";
import { HelpCenterLink } from "@parallel/components/common/HelpCenterLink";
import { PetitionFieldTypeIndicator } from "@parallel/components/petition-common/PetitionFieldTypeIndicator";
import { Flex, HStack, Stack, Text, Tooltip } from "@parallel/components/ui";
import {
  PetitionComposeCalculationRulesDialog_petitionDocument,
  PetitionComposeCalculationRulesDialog_PetitionFieldFragment,
  PetitionComposeCalculationRulesDialog_PetitionFragment,
} from "@parallel/graphql/__types";
import { PetitionFieldIndex, useFieldsWithIndices } from "@parallel/utils/fieldIndices";
import {
  FieldLogicChange,
  FieldLogicResult,
  PetitionFieldMathOperation,
  PetitionFieldMathRule,
} from "@parallel/utils/fieldLogic/types";
import { useFieldLogic } from "@parallel/utils/fieldLogic/useFieldLogic";
import { useEffect, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish, zip } from "remeda";
import { PetitionFieldLogicContext } from "../logic/PetitionFieldLogicContext";
import { PetitionFieldMathRowReadOnly } from "../logic/PetitionFieldMathEditor";

interface PetitionComposeCalculationRulesDialogProps {
  petitionId: string;
  variableName: string;
  showFieldLogicChanges?: boolean;
}

type PetitionComposeCalculationRulesDialogSteps = {
  LOADING: PetitionComposeCalculationRulesDialogProps;
  CONTENT: {
    variableName: string;
    petition: PetitionComposeCalculationRulesDialog_PetitionFragment;
    showFieldLogicChanges?: boolean;
  };
};

type PetitionFieldWithChildren =
  PetitionComposeCalculationRulesDialog_PetitionFragment["fields"][number];

function PetitionComposeCalculationRulesDialogLoading({
  petitionId,
  variableName,
  showFieldLogicChanges,
  onStep,
  ...props
}: WizardStepDialogProps<PetitionComposeCalculationRulesDialogSteps, "LOADING", void>) {
  const { data, loading } = useQuery(PetitionComposeCalculationRulesDialog_petitionDocument, {
    variables: { petitionId },
  });

  useEffect(() => {
    if (!loading && data?.petition) {
      onStep("CONTENT", { petition: data.petition, variableName, showFieldLogicChanges });
    }
  }, [loading, data?.petition, onStep, variableName, showFieldLogicChanges]);

  return (
    <ConfirmDialog
      size="2xl"
      header={
        <FormattedMessage
          id="component.petition-compose-calculation-rules-dialog.header"
          defaultMessage="Calculation steps"
        />
      }
      body={
        <Center padding={8} minHeight="200px">
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="primary.500"
            size="xl"
          />
        </Center>
      }
      confirm={<></>}
      cancel={
        <Button onClick={() => props.onReject()}>
          <FormattedMessage id="generic.close" defaultMessage="Close" />
        </Button>
      }
      {...props}
    />
  );
}

export function PetitionComposeCalculationRulesDialog({
  petition,
  variableName,
  showFieldLogicChanges,
  ...props
}: WizardStepDialogProps<PetitionComposeCalculationRulesDialogSteps, "CONTENT", void>) {
  const fieldsWithIndices = useFieldsWithIndices(petition) as [
    field: PetitionFieldWithChildren,
    fieldIndex: PetitionFieldIndex,
    childrenFieldIndices?: PetitionFieldIndex[],
  ][];

  const fieldLogic = useFieldLogic(petition);
  const fieldWithIndicesAndLogic = zip(fieldsWithIndices, fieldLogic);

  const fieldsWithVariable = useMemo(() => {
    return fieldWithIndicesAndLogic.filter(
      ([[field]]) =>
        checkFieldMath(field, variableName) ||
        field.children?.some((child) => checkFieldMath(child, variableName)),
    );
  }, [fieldWithIndicesAndLogic, variableName]);

  return (
    <ConfirmDialog
      size="2xl"
      scrollBehavior="inside"
      bodyProps={{ as: "div", display: "flex", flexDirection: "column" }}
      header={
        <FormattedMessage
          id="component.petition-compose-calculation-rules-dialog.header"
          defaultMessage="Calculation steps"
        />
      }
      body={
        <Stack gap={4}>
          <Text>
            <FormattedMessage
              id="component.petition-compose-calculation-rules-dialog.description"
              defaultMessage="Rules that determine the value of {variableName}"
              values={{ variableName: <Badge colorScheme="blue">{variableName}</Badge> }}
            />
          </Text>

          {fieldsWithVariable.length > 0 ? (
            <Stack gap={4}>
              {fieldsWithVariable.map((fieldData) => (
                <FieldWithVariableRenderer
                  key={fieldData[0][0].id}
                  fieldData={fieldData}
                  petition={petition}
                  variableName={variableName}
                  showFieldLogicChanges={showFieldLogicChanges}
                />
              ))}
            </Stack>
          ) : (
            <Stack>
              <Text color="gray.500">
                <FormattedMessage
                  id="component.petition-compose-calculation-rules-dialog.no-rules"
                  defaultMessage="There are no calculations added for this variable."
                />
              </Text>
              <Flex>
                <HelpCenterLink articleId={8574972} display="flex" alignItems="center">
                  <FormattedMessage
                    id="component.petition-compose-calculation-rules-dialog.how-to-add-calculations-link"
                    defaultMessage="How to add calculations"
                  />
                </HelpCenterLink>
              </Flex>
            </Stack>
          )}
        </Stack>
      }
      confirm={<></>}
      cancel={
        <Button onClick={() => props.onReject()}>
          <FormattedMessage id="generic.close" defaultMessage="Close" />
        </Button>
      }
      {...props}
    />
  );
}

export function usePetitionComposeCalculationRulesDialog() {
  return useWizardDialog(
    {
      LOADING: PetitionComposeCalculationRulesDialogLoading,
      CONTENT: PetitionComposeCalculationRulesDialog,
    },
    "LOADING",
  );
}
// Utility functions
const checkFieldMath = (
  field: PetitionComposeCalculationRulesDialog_PetitionFieldFragment,
  variableName: string,
) => {
  return (
    field.math &&
    field.math.some((math) =>
      math.operations.some(
        (operation: PetitionFieldMathOperation) => operation.variable === variableName,
      ),
    )
  );
};

const compareRules = (rule: PetitionFieldMathRule, rule2: PetitionFieldMathRule) => {
  return (
    rule.operator === rule2.operator &&
    rule.conditions.length === rule2.conditions.length &&
    rule.conditions.every((condition, index) => condition === rule2.conditions[index]) &&
    rule.operations.length === rule2.operations.length &&
    rule.operations.every((operation, index) => operation === rule2.operations[index])
  );
};

const getFieldLogicChanges = (changes: FieldLogicChange[], math: PetitionFieldMathRule) => {
  const fieldLogicChangeIndex = changes.findIndex((change) =>
    compareRules(change.rule, math as PetitionFieldMathRule),
  );

  const fieldLogicChanges =
    fieldLogicChangeIndex !== -1
      ? changes.splice(fieldLogicChangeIndex, math.operations.length)
      : null;

  return fieldLogicChanges;
};

const filterMathByVariable = (
  field: PetitionComposeCalculationRulesDialog_PetitionFieldFragment,
  variableName: string,
) => {
  return field.math?.filter((math) =>
    math.operations.some(
      (operation: PetitionFieldMathOperation) => operation.variable === variableName,
    ),
  ) as PetitionFieldMathRule[];
};
// Components
function FieldTitle({
  field,
  fieldIndex,
  isHidden,
}: {
  field: PetitionComposeCalculationRulesDialog_PetitionFieldFragment;
  fieldIndex: PetitionFieldIndex;
  isHidden?: boolean;
}) {
  const intl = useIntl();
  return (
    <HStack alignItems="center">
      <HStack>
        <PetitionFieldTypeIndicator
          type={field.type}
          fieldIndex={fieldIndex}
          isFixedWidth={false}
          as="div"
        />
        {isHidden ? (
          <Tooltip
            label={intl.formatMessage({
              id: "generic.field-not-visible",
              defaultMessage: "Field not visible",
            })}
          >
            <EyeOffIcon />
          </Tooltip>
        ) : null}
      </HStack>
      <Text fontWeight={500}>{field.title}</Text>
    </HStack>
  );
}

function MathRuleRenderer({
  math,
  variableName,
  fieldLogic,
  showFieldLogicChanges,
}: {
  math: PetitionFieldMathRule;
  variableName: string;
  fieldLogic?: FieldLogicResult;
  showFieldLogicChanges?: boolean;
}) {
  const changes = fieldLogic?.changes ?? [];
  const fieldLogicChanges = showFieldLogicChanges ? getFieldLogicChanges(changes, math) : null;

  return (
    <Box
      opacity={showFieldLogicChanges ? (isNonNullish(fieldLogicChanges) ? 1 : 0.5) : 1}
      aria-hidden={showFieldLogicChanges && isNullish(fieldLogicChanges)}
    >
      <PetitionFieldMathRowReadOnly
        row={math as PetitionFieldMathRule}
        fieldLogicChanges={fieldLogicChanges}
        filterByVariable={variableName}
      />
    </Box>
  );
}

function ChildFieldRenderer({
  child,
  childIndex,
  petition,
  variableName,
  showFieldLogicChanges,
  childLogic,
  isHidden,
}: {
  child: PetitionFieldWithChildren;
  childIndex: PetitionFieldIndex;
  petition: PetitionComposeCalculationRulesDialog_PetitionFragment;
  variableName: string;
  showFieldLogicChanges?: boolean;
  childLogic?: FieldLogicResult;
  isHidden?: boolean;
}) {
  const childFilteredMaths = filterMathByVariable(child, variableName);

  if (!childFilteredMaths || childFilteredMaths.length === 0) {
    return null;
  }

  return (
    <Stack marginStart={4}>
      <FieldTitle field={child} fieldIndex={childIndex} isHidden={isHidden} />
      <PetitionFieldLogicContext petition={petition} field={child} includeSelf>
        {childFilteredMaths.map((math, index) => (
          <MathRuleRenderer
            key={index}
            math={math}
            variableName={variableName}
            fieldLogic={childLogic}
            showFieldLogicChanges={showFieldLogicChanges}
          />
        ))}
      </PetitionFieldLogicContext>
    </Stack>
  );
}

function GroupChildrenWithLogic({
  field,
  petition,
  variableName,
  fieldLogic,
  childrenFieldIndices,
}: {
  field: PetitionFieldWithChildren;
  petition: PetitionComposeCalculationRulesDialog_PetitionFragment;
  variableName: string;
  fieldLogic: FieldLogicResult;
  childrenFieldIndices?: PetitionFieldIndex[];
}) {
  const intl = useIntl();

  // Get children logic with fields for grouped rendering
  const childrenLogicWithFields = fieldLogic.groupChildrenLogic?.map((childLogic) => {
    return zip(zip(field.children ?? [], childrenFieldIndices ?? []), childLogic).filter(
      ([[field], _]) => isNonNullish(field) && isNonNullish(field.math),
    );
  });

  if (!childrenLogicWithFields || childrenLogicWithFields.length === 0) {
    return null;
  }

  return (
    <Stack gap={4}>
      {childrenLogicWithFields.map((children, index) => (
        <Stack key={index}>
          <Text fontSize="sm">
            {`${
              field.options.groupName ??
              intl.formatMessage({
                id: "generic.group-name-fallback-reply",
                defaultMessage: "Reply",
              })
            } ${index + 1}`}
          </Text>
          {children.map(([[child, childIndex], childLogic]: [[any, any], any]) => (
            <ChildFieldRenderer
              key={child.id}
              child={child}
              childIndex={childIndex}
              petition={petition}
              variableName={variableName}
              showFieldLogicChanges={true}
              childLogic={childLogic}
              isHidden={!fieldLogic.isVisible || !childLogic.isVisible}
            />
          ))}
        </Stack>
      ))}
    </Stack>
  );
}

function GroupChildren({
  field,
  petition,
  variableName,
  childrenFieldIndices,
}: {
  field: PetitionFieldWithChildren;
  petition: PetitionComposeCalculationRulesDialog_PetitionFragment;
  variableName: string;
  childrenFieldIndices?: PetitionFieldIndex[];
}) {
  // Get children with math
  const childrenWithMath = field.children
    ?.map((child, index) => {
      const childIndex = childrenFieldIndices?.[index];
      if (typeof child === "string" || !child || !("math" in child) || isNullish(childIndex)) {
        return null;
      }
      return [child, childIndex] as const;
    })
    .filter(isNonNullish)
    .filter(([child]) => checkFieldMath(child, variableName));

  if (!childrenWithMath || childrenWithMath.length === 0) {
    return null;
  }

  return (
    <>
      {childrenWithMath.map(([child, childIndex]) => (
        <ChildFieldRenderer
          key={child.id}
          child={child}
          childIndex={childIndex}
          petition={petition}
          variableName={variableName}
        />
      ))}
    </>
  );
}

type FieldWithIndicesAndLogic = [
  [
    field: PetitionFieldWithChildren,
    fieldIndex: PetitionFieldIndex,
    childrenFieldIndices?: PetitionFieldIndex[],
  ],
  FieldLogicResult,
];

function FieldWithVariableRenderer({
  fieldData,
  petition,
  variableName,
  showFieldLogicChanges,
}: {
  fieldData: FieldWithIndicesAndLogic;
  petition: PetitionComposeCalculationRulesDialog_PetitionFragment;
  variableName: string;
  showFieldLogicChanges?: boolean;
}) {
  const [[field, fieldIndex, childrenFieldIndices], fieldLogic] = fieldData;

  const filteredMaths = filterMathByVariable(field, variableName);

  return (
    <Stack key={field.id}>
      <FieldTitle
        field={field}
        fieldIndex={fieldIndex}
        isHidden={showFieldLogicChanges ? !fieldLogic.isVisible : undefined}
      />

      <PetitionFieldLogicContext petition={petition} field={field} includeSelf>
        {filteredMaths?.map((math, index) => (
          <MathRuleRenderer
            key={index}
            math={math}
            variableName={variableName}
            fieldLogic={fieldLogic}
            showFieldLogicChanges={showFieldLogicChanges}
          />
        ))}
      </PetitionFieldLogicContext>
      {showFieldLogicChanges ? (
        <GroupChildrenWithLogic
          field={field}
          petition={petition}
          variableName={variableName}
          fieldLogic={fieldLogic}
          childrenFieldIndices={childrenFieldIndices}
        />
      ) : (
        <GroupChildren
          field={field}
          petition={petition}
          variableName={variableName}
          childrenFieldIndices={childrenFieldIndices}
        />
      )}
    </Stack>
  );
}

// GraphQL fragments and queries
const _fragments = {
  get Petition() {
    return gql`
      fragment PetitionComposeCalculationRulesDialog_Petition on PetitionBase {
        id
        variables {
          name
        }
        fields {
          ...PetitionComposeCalculationRulesDialog_PetitionField
          children {
            ...PetitionComposeCalculationRulesDialog_PetitionField
          }
        }
        ...useFieldsWithIndices_PetitionBase
        ...PetitionFieldLogicContext_PetitionBase
        ...useFieldLogic_PetitionBase
      }
      ${this.PetitionField}
      ${useFieldsWithIndices.fragments.PetitionBase}
      ${PetitionFieldLogicContext.fragments.PetitionBase}
      ${useFieldLogic.fragments.PetitionBase}
    `;
  },
  get PetitionField() {
    return gql`
      fragment PetitionComposeCalculationRulesDialog_PetitionField on PetitionField {
        id
        type
        title
        description
        math
        options
      }
    `;
  },
};

const _queries = [
  gql`
    query PetitionComposeCalculationRulesDialog_petition($petitionId: GID!) {
      petition(id: $petitionId) {
        id
        ...PetitionComposeCalculationRulesDialog_Petition
      }
    }
    ${_fragments.Petition}
  `,
];
