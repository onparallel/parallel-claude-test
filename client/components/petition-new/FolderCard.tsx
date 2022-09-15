import { gql } from "@apollo/client";
import { Flex, HStack, Stack, Text, VisuallyHidden } from "@chakra-ui/react";
import { FolderIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Card } from "@parallel/components/common/Card";
import { Spacer } from "@parallel/components/common/Spacer";
import { FolderCard_PetitionFolderFragment } from "@parallel/graphql/__types";
import { useRoleButton } from "@parallel/utils/useRoleButton";
import { FormattedMessage } from "react-intl";

export interface FolderCardProps {
  folder: FolderCard_PetitionFolderFragment;
  onPress: () => void;
}

export const FolderCard = Object.assign(
  chakraForwardRef<"div", FolderCardProps>(function FolderCard({ folder, onPress, ...props }, ref) {
    const buttonProps = useRoleButton(onPress);

    return (
      <Card
        ref={ref}
        as={Stack}
        padding={4}
        minHeight="160px"
        outline="none"
        isInteractive
        minWidth={0}
        {...buttonProps}
        {...props}
      >
        <HStack as="header" alignItems="flex-start">
          <Flex>
            <VisuallyHidden>
              <FormattedMessage id="generic.folder" defaultMessage="Folder" />
            </VisuallyHidden>
            <FolderIcon fontSize="lg" role="presentation" marginTop={1} />
          </Flex>
          <Text as="h2" fontSize="lg" noOfLines={2} fontWeight="bold">
            {folder.folderName}
          </Text>
        </HStack>
        <Spacer />
        <Text>
          <FormattedMessage
            id="component.folder-card.number-of-templates"
            defaultMessage="{count, plural, =1 {# template} other {# templates}}"
            values={{ count: folder.petitionCount }}
          />
        </Text>
      </Card>
    );
  }),
  {
    fragments: {
      PetitionFolder: gql`
        fragment FolderCard_PetitionFolder on PetitionFolder {
          folderId: id
          folderName: name
          path
          petitionCount
          minimumPermissionType
        }
      `,
    },
  }
);
