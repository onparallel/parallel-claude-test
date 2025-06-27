import { gql } from "@apollo/client";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { CalculatorIcon, ListIcon, SettingsIcon } from "@parallel/chakra/icons";
import { PetitionComposeContents } from "@parallel/components/petition-compose/PetitionComposeContents";
import { PetitionComposeVariables } from "@parallel/components/petition-compose/PetitionComposeVariables";
import { PetitionSettings } from "@parallel/components/petition-compose/PetitionSettings";
import {
  PetitionComposeRightPaneTabs_PetitionBaseFragment,
  PetitionComposeRightPaneTabs_PetitionFieldFragment,
  PetitionComposeRightPaneTabs_UserFragment,
  UpdatePetitionFieldInput,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { useState } from "react";
import { FormattedMessage } from "react-intl";

export interface PetitionComposeRightPaneTabsProps {
  me: PetitionComposeRightPaneTabs_UserFragment;
  petition: PetitionComposeRightPaneTabs_PetitionBaseFragment;
  isReadOnly: boolean;
  onFieldClick: (fieldId: string) => void;
  onFieldEdit: (fieldId: string, data: UpdatePetitionFieldInput) => Promise<void>;
  onUpdatePetition: (data: UpdatePetitionInput) => Promise<void>;
  validPetitionFields: () => Promise<boolean>;
  onRefetch: () => Promise<any>;
  allFieldsWithIndices: [
    field: PetitionComposeRightPaneTabs_PetitionFieldFragment,
    fieldIndex: PetitionFieldIndex,
    childrenFieldIndices?: string[],
  ][];
}

export function PetitionComposeRightPaneTabs({
  me,
  petition,
  isReadOnly,
  onFieldClick,
  onFieldEdit,
  onUpdatePetition,
  validPetitionFields,
  onRefetch,
  allFieldsWithIndices,
}: PetitionComposeRightPaneTabsProps) {
  // 0 - Content
  // 1 - Petition/Template Settings
  // 2 - Variables
  const [tabIndex, setTabIndex] = useState(1);

  const handleTabsChange = (index: number) => {
    setTabIndex(index);
  };

  const extendFlexColumn = {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  } as const;

  return (
    <Tabs
      variant="enclosed"
      overflow="hidden"
      index={tabIndex}
      onChange={handleTabsChange}
      {...extendFlexColumn}
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
          <FormattedMessage id="page.compose.petition-settings-header" defaultMessage="Settings" />
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
            fieldsWithIndices={allFieldsWithIndices}
            onFieldClick={onFieldClick}
            onFieldEdit={onFieldEdit}
            isReadOnly={isReadOnly}
          />
        </TabPanel>
        <TabPanel {...extendFlexColumn} padding={0} overflow="auto" paddingBottom="52px">
          <PetitionSettings
            user={me}
            petition={petition}
            onUpdatePetition={onUpdatePetition}
            validPetitionFields={validPetitionFields}
            onRefetch={onRefetch}
            isDisabled={isReadOnly}
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
  );
}

PetitionComposeRightPaneTabs.fragments = {
  User: gql`
    fragment PetitionComposeRightPaneTabs_User on User {
      id
      ...PetitionSettings_User
    }
    ${PetitionSettings.fragments.User}
  `,
  PetitionField: gql`
    fragment PetitionComposeRightPaneTabs_PetitionField on PetitionField {
      id
      ...PetitionComposeContents_PetitionField
      ...PetitionComposeVariables_PetitionField
    }
    ${PetitionComposeContents.fragments.PetitionField}
    ${PetitionComposeVariables.fragments.PetitionField}
  `,
  PetitionBase: gql`
    fragment PetitionComposeRightPaneTabs_PetitionBase on PetitionBase {
      id
      ...PetitionSettings_PetitionBase
      ...PetitionComposeVariables_PetitionBase
    }
    ${PetitionSettings.fragments.PetitionBase}
    ${PetitionComposeVariables.fragments.PetitionBase}
  `,
};
