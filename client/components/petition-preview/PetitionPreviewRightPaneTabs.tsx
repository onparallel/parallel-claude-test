import { gql } from "@apollo/client";
import { Badge, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { CommentIcon, ListIcon } from "@parallel/chakra/icons";
import { PetitionComments } from "@parallel/components/petition-replies/PetitionComments";
import { PetitionRepliesFieldComments } from "@parallel/components/petition-replies/PetitionRepliesFieldComments";
import { RecipientViewContents } from "@parallel/components/recipient-view/RecipientViewContents";
import {
  PetitionPreviewRightPaneTabs_PetitionBaseFragment,
  PetitionPreviewRightPaneTabs_PetitionFieldFragment,
} from "@parallel/graphql/__types";
import { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { sumBy } from "remeda";
import { noop } from "ts-essentials";

interface PetitionPreviewRightPaneTabsProps {
  petition: PetitionPreviewRightPaneTabs_PetitionBaseFragment;
  activeFieldId: string | null;
  setActiveFieldId: (fieldId: string | null) => void;
  activeField?: PetitionPreviewRightPaneTabs_PetitionFieldFragment | null;
  currentPage: number;
  onAddComment: (content: any, isNote: boolean) => Promise<void>;
  onUpdateComment: (petitionFieldCommentId: string, content: any, isNote: boolean) => void;
  onDeleteComment: (petitionFieldCommentId: string) => void;
  onMarkAsUnread: (petitionFieldCommentId: string) => void;
  onlyReadPermission: boolean;
}

export function PetitionPreviewRightPaneTabs({
  petition,
  activeFieldId,
  setActiveFieldId,
  currentPage,
  activeField,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onMarkAsUnread,
  onlyReadPermission,
}: PetitionPreviewRightPaneTabsProps) {
  const [tabIndex, setTabIndex] = useState(activeFieldId ? 1 : 0);

  useEffect(() => {
    if (activeFieldId) {
      setTabIndex(1);
    }
  }, [activeFieldId]);

  const allFieldsUnreadCommentCount =
    sumBy(petition.fields, (f) => f.unreadCommentCount) +
    (petition.__typename === "Petition" ? petition.unreadGeneralCommentCount : 0);

  const extendFlexColumn = {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  } as const;

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
            >
              {allFieldsUnreadCommentCount < 100 ? allFieldsUnreadCommentCount : "99+"}
            </Badge>
          ) : null}
        </Tab>
      </TabList>
      <TabPanels {...extendFlexColumn}>
        <TabPanel {...extendFlexColumn} padding={0} overflow="auto">
          <RecipientViewContents
            currentPage={currentPage}
            petition={petition}
            onClose={noop}
            usePreviewReplies={petition.__typename !== "Petition"}
            isPreview
          />
        </TabPanel>
        <TabPanel {...extendFlexColumn} padding={0} overflow="auto" position="relative">
          {activeFieldId ? (
            <PetitionRepliesFieldComments
              key={activeFieldId}
              petition={petition}
              field={activeField}
              isDisabled={petition.isAnonymized || petition.__typename === "PetitionTemplate"}
              onClose={() => setActiveFieldId(null)}
              onAddComment={onAddComment}
              onUpdateComment={onUpdateComment}
              onDeleteComment={onDeleteComment}
              onMarkAsUnread={onMarkAsUnread}
              onlyReadPermission={onlyReadPermission}
            />
          ) : (
            <PetitionComments
              petition={petition}
              onSelectField={(fieldId) => setActiveFieldId(fieldId)}
            />
          )}
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}

PetitionPreviewRightPaneTabs.fragments = {
  get PetitionField() {
    return gql`
      fragment PetitionPreviewRightPaneTabs_PetitionField on PetitionField {
        id
        unreadCommentCount
        ...PetitionRepliesFieldComments_PetitionField
      }
      ${PetitionRepliesFieldComments.fragments.PetitionField}
    `;
  },
  get PetitionBase() {
    return gql`
      fragment PetitionPreviewRightPaneTabs_PetitionBase on PetitionBase {
        id
        isAnonymized
        fields {
          id
          ...PetitionPreviewRightPaneTabs_PetitionField
        }
        ... on Petition {
          unreadGeneralCommentCount
        }
        ...PetitionRepliesFieldComments_PetitionBase
        ...PetitionComments_PetitionBase
        ...RecipientViewContents_PetitionBase
      }
      ${this.PetitionField}
      ${PetitionRepliesFieldComments.fragments.PetitionBase}
      ${PetitionComments.fragments.PetitionBase}
      ${RecipientViewContents.fragments.PetitionBase}
    `;
  },
};
