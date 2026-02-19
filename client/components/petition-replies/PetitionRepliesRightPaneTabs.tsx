import { gql } from "@apollo/client";
import { Badge, Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { CommentIcon, ListIcon, SparklesIcon } from "@parallel/chakra/icons";
import { PetitionComments } from "@parallel/components/petition-replies/PetitionComments";
import { PetitionRepliesContents } from "@parallel/components/petition-replies/PetitionRepliesContents";
import { PetitionRepliesFieldComments } from "@parallel/components/petition-replies/PetitionRepliesFieldComments";
import { PetitionRepliesFilterButton } from "@parallel/components/petition-replies/PetitionRepliesFilterButton";
import { PetitionRepliesSummary } from "@parallel/components/petition-replies/PetitionRepliesSummary";
import {
  PetitionRepliesRightPaneTabs_PetitionFragment,
  PetitionRepliesRightPaneTabs_UserFragment,
} from "@parallel/graphql/__types";
import { useFieldsWithIndices } from "@parallel/utils/fieldIndices";
import { FieldLogicResult } from "@parallel/utils/fieldLogic/types";
import { PetitionFieldFilter } from "@parallel/utils/filterPetitionFields";
import { getPetitionSignatureEnvironment } from "@parallel/utils/getPetitionSignatureEnvironment";
import { getPetitionSignatureStatus } from "@parallel/utils/getPetitionSignatureStatus";
import { HStack } from "@parallel/components/ui";
import { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { sumBy } from "remeda";

interface PetitionRepliesRightPaneTabsProps {
  me: PetitionRepliesRightPaneTabs_UserFragment;
  petition: PetitionRepliesRightPaneTabs_PetitionFragment;
  fieldLogic: FieldLogicResult[];
  activeFieldId: string | null;
  filter: PetitionFieldFilter;
  setFilter: (filter: PetitionFieldFilter) => void;
  setActiveFieldId: (fieldId: string | null) => void;
  onSignatureStatusClick: () => void;
  onVariablesClick: () => void;
  onRefetch: () => void;
  onPetitionContentsFieldClick: (fieldId: string) => void;
  onAddComment: (content: any, isNote: boolean) => Promise<void>;
  onUpdateComment: (petitionFieldCommentId: string, content: string, isNote: boolean) => void;
  onDeleteComment: (petitionFieldCommentId: string) => void;
  onMarkAsUnread: (petitionFieldCommentId: string) => void;
  isDisabled: boolean;
}

export function PetitionRepliesRightPaneTabs({
  me,
  petition,
  fieldLogic,
  activeFieldId,
  filter,
  setFilter,
  setActiveFieldId,
  onSignatureStatusClick,
  onVariablesClick,
  onRefetch,
  onPetitionContentsFieldClick,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onMarkAsUnread,
  isDisabled,
}: PetitionRepliesRightPaneTabsProps) {
  const [tabIndex, setTabIndex] = useState(activeFieldId ? 1 : 0);

  const fieldsWithIndices = useFieldsWithIndices(petition);
  const activeField = activeFieldId ? petition.fields.find((f) => f.id === activeFieldId) : null;

  useEffect(() => {
    if (activeFieldId) {
      setTabIndex(1);
    }
  }, [activeFieldId]);

  const extendFlexColumn = {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  } as const;

  const allFieldsUnreadCommentCount =
    sumBy(petition.fields, (f) => f.unreadCommentCount) + petition.unreadGeneralCommentCount;
  const myEffectivePermission = petition.myEffectivePermission!.permissionType;
  const petitionSignatureStatus = getPetitionSignatureStatus(petition);
  const petitionSignatureEnvironment = getPetitionSignatureEnvironment(petition);

  return (
    <Tabs
      index={tabIndex}
      onChange={(index) => setTabIndex(index)}
      variant="enclosed"
      overflow="hidden"
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
          paddingY={4}
          paddingX={3.5}
          lineHeight={5}
          fontWeight="bold"
          borderTopRadius={0}
          _focusVisible={{ boxShadow: "inline" }}
        >
          <CommentIcon fontSize="18px" marginEnd={1} aria-hidden="true" />
          <FormattedMessage id="generic.comments" defaultMessage="Comments" />
          {allFieldsUnreadCommentCount ? (
            <Badge
              marginStart={1}
              background="primary.500"
              color="white"
              fontSize="xs"
              borderRadius="full"
              minW="18px"
              minH="18px"
              lineHeight="18px"
              pointerEvents="none"
              textAlign="center"
            >
              {allFieldsUnreadCommentCount < 100 ? allFieldsUnreadCommentCount : "99+"}
            </Badge>
          ) : null}
        </Tab>
        <Tab
          paddingY={4}
          paddingX={3.5}
          lineHeight={5}
          fontWeight="bold"
          borderTopRadius={0}
          _focusVisible={{ boxShadow: "inline" }}
        >
          <SparklesIcon fontSize="18px" marginEnd={1} role="presentation" />
          <FormattedMessage id="page.replies.summary-header" defaultMessage="Mike AI" />
        </Tab>
      </TabList>
      <TabPanels {...extendFlexColumn}>
        <TabPanel {...extendFlexColumn} padding={0} overflow="auto" paddingBottom="64px">
          <HStack padding={4} paddingTop={3} paddingBottom={0} justify="space-between">
            <Heading fontWeight={500} fontSize="xl">
              <FormattedMessage
                id="page.replies.list-of-contents"
                defaultMessage="List of contents"
              />
            </Heading>
            <PetitionRepliesFilterButton value={filter} onChange={setFilter} />
          </HStack>
          <PetitionRepliesContents
            fieldsWithIndices={fieldsWithIndices}
            filter={filter}
            fieldLogic={fieldLogic}
            onFieldClick={onPetitionContentsFieldClick}
            signatureStatus={
              petition.isDocumentGenerationEnabled ? petitionSignatureStatus : undefined
            }
            signatureEnvironment={petitionSignatureEnvironment}
            onSignatureStatusClick={onSignatureStatusClick}
            onVariablesClick={onVariablesClick}
            hasVariables={petition.variables.length > 0}
          />
        </TabPanel>
        <TabPanel {...extendFlexColumn} padding={0} overflow="auto" position="relative">
          {activeFieldId ? (
            <PetitionRepliesFieldComments
              key={activeFieldId}
              petition={petition}
              field={activeField}
              isDisabled={isDisabled}
              onClose={() => setActiveFieldId(null)}
              onAddComment={onAddComment}
              onUpdateComment={onUpdateComment}
              onDeleteComment={onDeleteComment}
              onMarkAsUnread={onMarkAsUnread}
              onlyReadPermission={myEffectivePermission === "READ"}
            />
          ) : (
            <PetitionComments
              petition={petition}
              onSelectField={(fieldId: string) => setActiveFieldId(fieldId)}
            />
          )}
        </TabPanel>
        <TabPanel {...extendFlexColumn} padding={0} overflow="auto" position="relative">
          <PetitionRepliesSummary petition={petition} user={me} onRefetch={onRefetch} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}

const _fragments = {
  User: gql`
    fragment PetitionRepliesRightPaneTabs_User on User {
      id
      ...PetitionRepliesSummary_User
    }
  `,
  Petition: gql`
    fragment PetitionRepliesRightPaneTabs_Petition on Petition {
      id
      variables {
        name
      }
      myEffectivePermission {
        permissionType
      }
      isDocumentGenerationEnabled
      unreadGeneralCommentCount
      fields {
        id
        unreadCommentCount
        ...PetitionRepliesContents_PetitionField
        ...PetitionRepliesFieldComments_PetitionField
      }
      ...PetitionComments_PetitionBase
      ...PetitionRepliesFieldComments_PetitionBase
      ... on Petition {
        ...PetitionRepliesSummary_Petition
        ...getPetitionSignatureStatus_Petition
        ...getPetitionSignatureEnvironment_Petition
      }
    }
  `,
};
