import { gql } from "@apollo/client";
import { Button } from "@chakra-ui/react";
import { NakedLink } from "@parallel/components/common/Link";
import { useTone } from "@parallel/components/common/ToneProvider";
import { usePreviewDowJonesPermissionDeniedDialog } from "@parallel/components/petition-preview/dialogs/PreviewDowJonesPermissionDeniedDialog";
import { FormattedMessage } from "react-intl";
import {
  RecipientViewPetitionFieldCard,
  RecipientViewPetitionFieldCardProps,
} from "../../recipient-view/fields/RecipientViewPetitionFieldCard";

export interface PreviewPetitionFieldKYCResearchProps
  extends Omit<
    RecipientViewPetitionFieldCardProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  isDisabled: boolean;
  onDeleteReply: (replyId: string) => void;
  isCacheOnly?: boolean;
}

export function PreviewPetitionFieldKYCResearch({
  field,
  isDisabled,
  isInvalid,
  onDeleteReply,
  onDownloadAttachment,
  onCommentsButtonClick,
  isCacheOnly,
}: PreviewPetitionFieldKYCResearchProps) {
  const tone = useTone();

  // const showSearchResultsDialog = useRecipientViewPetitionFieldKYCResearchDialog();
  const showDowJonesRestrictedDialog = usePreviewDowJonesPermissionDeniedDialog();

  const handleRestrictSearchInDowJones = async () => {
    try {
      await showDowJonesRestrictedDialog();
    } catch {}
  };

  return (
    <RecipientViewPetitionFieldCard
      field={field}
      isInvalid={isInvalid}
      onCommentsButtonClick={onCommentsButtonClick}
      onDownloadAttachment={onDownloadAttachment}
      tone={tone}
    >
      {field.petition.organization.hasDowJones ? (
        <NakedLink href={`/app/petitions/${field.petition.id}/preview/${field.id}`} passHref>
          <Button as="a" variant="outline" target="_blank" isDisabled={isDisabled}>
            <FormattedMessage
              id="component.preview-petition-field-kyc-research.search-in-down-jones"
              defaultMessage="Search in Dow Jones"
            />
          </Button>
        </NakedLink>
      ) : (
        <Button variant="outline" onClick={handleRestrictSearchInDowJones} isDisabled={isDisabled}>
          <FormattedMessage
            id="component.preview-petition-field-kyc-research.search-in-down-jones"
            defaultMessage="Search in Dow Jones"
          />
        </Button>
      )}
    </RecipientViewPetitionFieldCard>
  );
}

PreviewPetitionFieldKYCResearch.fragments = {
  PetitionField: gql`
    fragment PreviewPetitionFieldKYCResearch_PetitionField on PetitionField {
      id
      petition {
        id
        organization {
          id
          hasDowJones: hasIntegration(integration: DOW_JONES_KYC)
        }
      }
    }
  `,
};
