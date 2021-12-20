import { gql, useMutation } from "@apollo/client";
import { List, Stack } from "@chakra-ui/react";
import { PaperclipIcon } from "@parallel/chakra/icons";
import {
  RecipientViewPetitionFileAttachments_PetitionAttachmentFragment,
  RecipientViewPetitionFileAttachments_publicPetitionAttachmentDownloadLinkDocument,
} from "@parallel/graphql/__types";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { FormattedMessage } from "react-intl";
import { Card, CardHeader, CardProps } from "../common/Card";
import { RecipientViewFileAttachment } from "./fields/RecipientViewFileAttachment";

interface RecipientViewPetitionFileAttachmentsProps extends CardProps {
  attachments: RecipientViewPetitionFileAttachments_PetitionAttachmentFragment[];
  keycode: string;
}

export function RecipientViewPetitionFileAttachments({
  attachments,
  keycode,
  ...props
}: RecipientViewPetitionFileAttachmentsProps) {
  const [publicPetitionAttachmentDownloadLink] = useMutation(
    RecipientViewPetitionFileAttachments_publicPetitionAttachmentDownloadLinkDocument
  );
  function handleDownloadAttachment(attachmentId: string) {
    openNewWindow(async () => {
      const { data } = await publicPetitionAttachmentDownloadLink({
        variables: { attachmentId, keycode },
      });
      const { url } = data!.publicPetitionAttachmentDownloadLink;
      return url!;
    });
  }
  return (
    <Card display="flex" flexDirection="column" {...props}>
      <CardHeader as="h3" size="sm">
        <PaperclipIcon marginRight={2} />
        <FormattedMessage id="recipient-view.attachments-header" defaultMessage="Attachments" />
      </CardHeader>
      <Stack as={List} spacing={2} padding={2}>
        {attachments.map((attachment) => (
          <RecipientViewFileAttachment
            key={attachment.id}
            attachment={attachment}
            hideDownloadIcon
            onClick={() => handleDownloadAttachment(attachment.id)}
          />
        ))}
      </Stack>
    </Card>
  );
}

RecipientViewPetitionFileAttachments.fragments = {
  get PetitionAttachment() {
    return gql`
      fragment RecipientViewPetitionFileAttachments_PetitionAttachment on PetitionAttachment {
        id
        file {
          filename
          contentType
          size
          isComplete
        }
      }
    `;
  },
};

RecipientViewPetitionFileAttachments.mutations = [
  gql`
    mutation RecipientViewPetitionFileAttachments_publicPetitionAttachmentDownloadLink(
      $keycode: ID!
      $attachmentId: GID!
    ) {
      publicPetitionAttachmentDownloadLink(keycode: $keycode, attachmentId: $attachmentId) {
        result
        url
      }
    }
  `,
];
