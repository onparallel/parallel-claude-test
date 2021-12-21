import { gql, useMutation } from "@apollo/client";
import { Box, Center, HStack, Text } from "@chakra-ui/react";
import { PaperclipIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  PetitionAttachmentsCard_petitionAttachmentDownloadLinkDocument,
  PetitionAttachmentsCard_PetitionFragment,
} from "@parallel/graphql/__types";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { FormattedMessage } from "react-intl";
import { Card, GenericCardHeader } from "../common/Card";
import { FileAttachmentButton } from "../common/FileAttachmentButton";

export interface PetitionAttachmentsCardProps {
  petition: PetitionAttachmentsCard_PetitionFragment;
}

const fragments = {
  get Petition() {
    return gql`
      fragment PetitionAttachmentsCard_Petition on Petition {
        id
        attachments {
          id
          file {
            ...FileAttachmentButton_FileUpload
          }
        }
      }
      ${FileAttachmentButton.fragments.FileUpload}
    `;
  },
};

const mutations = [
  gql`
    mutation PetitionAttachmentsCard_petitionAttachmentDownloadLink(
      $petitionId: GID!
      $attachmentId: GID!
    ) {
      petitionAttachmentDownloadLink(petitionId: $petitionId, attachmentId: $attachmentId) {
        result
        url
      }
    }
  `,
];

export const PetitionAttachmentsCard = Object.assign(
  chakraForwardRef<"section", PetitionAttachmentsCardProps>(function PetitionAttachmentsCard(
    { petition, ...props },
    ref
  ) {
    const [petitionAttachmentDownloadLink] = useMutation(
      PetitionAttachmentsCard_petitionAttachmentDownloadLinkDocument
    );
    async function handleAttachmentClick(attachmentId: string) {
      openNewWindow(async () => {
        const { data } = await petitionAttachmentDownloadLink({
          variables: { petitionId: petition.id, attachmentId },
        });
        const { url } = data!.petitionAttachmentDownloadLink;
        return url!;
      });
    }
    return (
      <Card ref={ref} {...props}>
        <GenericCardHeader>
          <HStack as="span" spacing={2}>
            <PaperclipIcon fontSize="20px" />
            <Text as="span">
              <FormattedMessage
                id="component.petition-attachments-card.header"
                defaultMessage="Attachments"
              />
            </Text>
          </HStack>
        </GenericCardHeader>
        {petition.attachments.length > 0 ? (
          <Box padding={2}>
            {petition.attachments.map((attachment) => (
              <FileAttachmentButton
                margin={1}
                key={attachment.id}
                file={attachment.file}
                onClick={() => handleAttachmentClick(attachment.id)}
              />
            ))}
          </Box>
        ) : (
          <Center flexDirection="column" minHeight={24} textStyle="hint" textAlign="center">
            <Text>
              <FormattedMessage
                id="component.petition-attachments-card.no-attachments"
                defaultMessage="No files have been attached to this petition."
              />
            </Text>
          </Center>
        )}
      </Card>
    );
  }),
  { fragments, mutations }
);
