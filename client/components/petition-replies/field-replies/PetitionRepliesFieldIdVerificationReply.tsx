import { gql } from "@apollo/client";

import { CameraIcon } from "@parallel/chakra/icons";
import { CopyToClipboardButton } from "@parallel/components/common/CopyToClipboardButton";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { PetitionRepliesFieldIdVerificationReply_PetitionFieldReplyFragment } from "@parallel/graphql/__types";
import { useLoadCountryNames } from "@parallel/utils/useLoadCountryNames";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";
import {
  InvalidIcon,
  PetitionRepliesMetadataDate,
  PetitionRepliesMetadataScore,
  PetitionRepliesMetadataScoreIcon,
  PetitionRepliesMetadataText,
  ValidIcon,
} from "./PetitionRepliesMetadata";
import { HStack, Stack, Text } from "@parallel/components/ui";

interface PetitionRepliesFieldIdVerificationReplyProps {
  reply: PetitionRepliesFieldIdVerificationReply_PetitionFieldReplyFragment;
}

interface MetadataLiveness {
  inferred_data: InferredDataLiveness;
  inferred_type: "VIDEOSELFIE";
}

interface InferredDataLiveness {
  liveness: number;
}

interface MetadataIDCard {
  inferred_data: InferredDataIDCard;
  inferred_type: string;
}

interface InferredDataIDCard {
  type: string;
  surname: string | null;
  /** ID of document's holder */
  idNumber: string | null;
  /** ID of the document itself */
  number: string | null;
  birthDate: string | null;
  createdAt: string;
  firstName: string | null;
  issueDate: string | null;
  birthPlace: string | null;
  checkedMRZ: number | null;
  nationality: string | null;
  faceFrontSide: number | null;
  expirationDate: string | null;
  issuingCountry: string | null;
  notShownScreen: number | null;
  unexpiredDocument: number | null;
  uncompromisedDocument: number | null;
}

export function PetitionRepliesFieldIdVerificationReply({
  reply,
}: PetitionRepliesFieldIdVerificationReplyProps) {
  if (isNonNullish(reply.content.error) && reply.content.error.length > 0) {
    return <ErrorMessageContent />;
  }

  if (
    ["PASSPORT", "ID_CARD", "DRIVER_LICENSE", "RESIDENCE_PERMIT"].includes(
      reply.metadata.inferred_type,
    )
  ) {
    return <IDCardView reply={reply} />;
  } else if (reply.metadata.inferred_type === "VIDEOSELFIE") {
    return <LivenessView reply={reply} />;
  }

  return null;
}

const _fragments = {
  PetitionFieldReply: gql`
    fragment PetitionRepliesFieldIdVerificationReply_PetitionFieldReply on PetitionFieldReply {
      id
      content
      status
      metadata
    }
  `,
};

function IDCardView({
  reply,
}: {
  reply: PetitionRepliesFieldIdVerificationReply_PetitionFieldReplyFragment;
}) {
  const intl = useIntl();

  const metadata = reply.metadata as MetadataIDCard;
  const metadataScores = useMetadataScores(reply);

  const { countries } = useLoadCountryNames(intl.locale);
  const getCountryName = (code: string) => {
    return countries?.[code] ?? countries?.[code.toUpperCase()];
  };

  const nationality = metadata.inferred_data.nationality;
  const issuingCountry = metadata.inferred_data.issuingCountry;
  const idNumber =
    metadata.inferred_type === "PASSPORT"
      ? metadata.inferred_data.number
      : metadata.inferred_data.idNumber;
  const firstName = metadata.inferred_data.firstName;
  const surname = metadata.inferred_data.surname;
  const hasName = isNonNullish(firstName) || isNonNullish(surname);
  const fullName = `${surname}, ${firstName}`;
  return (
    <HStack paddingBottom={3} flexWrap="wrap-reverse" width="100%" gap={6}>
      <Stack marginEnd={{ base: 0, xl: 10 }}>
        <HStack>
          <Text fontWeight={600}>{hasName ? fullName : " - "}</Text>
          {hasName ? <CopyToClipboardButton size="xs" fontSize="md" text={fullName} /> : null}
        </HStack>

        <PetitionRepliesMetadataText
          label={intl.formatMessage({
            id: "component.petition-replies-field-id-verification-reply.nationality",
            defaultMessage: "Nationality",
          })}
          content={nationality ? (getCountryName(nationality) ?? nationality) : null}
        />

        <PetitionRepliesMetadataDate
          label={intl.formatMessage({
            id: "component.petition-replies-field-id-verification-reply.date-of-birth",
            defaultMessage: "Date of birth",
          })}
          date={metadata.inferred_data.birthDate}
        />

        <PetitionRepliesMetadataText
          label={intl.formatMessage({
            id: "component.petition-replies-field-id-verification-reply.birth-place",
            defaultMessage: "Birth place",
          })}
          content={metadata.inferred_data.birthPlace}
        />
      </Stack>
      <Stack>
        <HStack>
          <Text>
            {metadata.inferred_type === "PASSPORT" ? (
              <FormattedMessage
                id="component.petition-replies-field-id-verification-reply.passport-number"
                defaultMessage="Passport"
              />
            ) : metadata.inferred_type === "ID_CARD" ? (
              <FormattedMessage
                id="component.petition-replies-field-id-verification-reply.id-number"
                defaultMessage="ID"
              />
            ) : metadata.inferred_type === "DRIVER_LICENSE" ? (
              <FormattedMessage
                id="component.petition-replies-field-id-verification-reply.driver-license-number"
                defaultMessage="Driver license"
              />
            ) : metadata.inferred_type === "RESIDENCE_PERMIT" ? (
              <FormattedMessage
                id="component.petition-replies-field-id-verification-reply.residence-permit-number"
                defaultMessage="Residence permit"
              />
            ) : null}
            {`: `}
            <b>{idNumber ?? " - "}</b>
          </Text>
          <SmallPopover
            width="auto"
            content={
              <Stack minWidth={0}>
                {metadataScores.map(({ score, label }, index) => {
                  return (
                    <HStack key={index} justify="space-between">
                      <Text as="span">{label}</Text>
                      <PetitionRepliesMetadataScoreIcon
                        score={score}
                        threshold={50}
                        maxScore={100}
                      />
                    </HStack>
                  );
                })}
              </Stack>
            }
          >
            {metadataScores.some(({ score }) => isNullish(score) || score < 50) ? (
              <InvalidIcon />
            ) : (
              <ValidIcon />
            )}
          </SmallPopover>
          {isNonNullish(idNumber) ? (
            <CopyToClipboardButton size="xs" fontSize="md" text={idNumber} />
          ) : null}
        </HStack>
        <PetitionRepliesMetadataText
          label={intl.formatMessage({
            id: "component.petition-replies-field-id-verification-reply.issuing-country",
            defaultMessage: "Issuing country",
          })}
          content={issuingCountry ? (getCountryName(issuingCountry) ?? issuingCountry) : null}
        />

        <PetitionRepliesMetadataDate
          label={intl.formatMessage({
            id: "component.petition-replies-field-id-verification-reply.date-of-issue",
            defaultMessage: "Date of issue",
          })}
          date={metadata.inferred_data.issueDate}
        />

        <PetitionRepliesMetadataDate
          label={intl.formatMessage({
            id: "component.petition-replies-field-id-verification-reply.expiry-date",
            defaultMessage: "Expiry date",
          })}
          date={metadata.inferred_data.expirationDate}
          rightIcon={
            metadata.inferred_data.unexpiredDocument === 0 ? (
              <SmallPopover
                content={
                  <Text>
                    <FormattedMessage
                      id="component.petition-replies-field-id-verification-reply.expired-document-poppover"
                      defaultMessage="This document has expired. You can reject the reply and request it again."
                    />
                  </Text>
                }
              >
                <InvalidIcon alignSelf="center" />
              </SmallPopover>
            ) : (
              <SmallPopover
                content={
                  <Text>
                    <FormattedMessage
                      id="component.petition-replies-field-id-verification-reply.unexpired-document-poppover"
                      defaultMessage="This document is valid"
                    />
                  </Text>
                }
              >
                <ValidIcon alignSelf="center" />
              </SmallPopover>
            )
          }
        />
      </Stack>
    </HStack>
  );
}

function LivenessView({
  reply,
}: {
  reply: PetitionRepliesFieldIdVerificationReply_PetitionFieldReplyFragment;
}) {
  const intl = useIntl();
  const metadata = reply.metadata as MetadataLiveness;
  return (
    <HStack paddingBottom={3}>
      <Stack>
        <HStack>
          <CameraIcon />
          <Text fontWeight={600}>
            <FormattedMessage
              id="component.petition-replies-field-id-verification-reply.selfie-completed"
              defaultMessage="Video/Selfie completed"
            />
          </Text>
        </HStack>
        <PetitionRepliesMetadataScore
          label={intl.formatMessage({
            id: "component.petition-replies-field-id-verification-reply.liveness",
            defaultMessage: "Liveness",
          })}
          score={metadata.inferred_data.liveness}
          maxScore={100}
          threshold={50}
        />
      </Stack>
    </HStack>
  );
}

function ErrorMessageContent() {
  return (
    <Text>
      <FormattedMessage
        id="component.petition-replies-field-reply.es-tax-documents-identity-verification-error-header"
        defaultMessage="Identity Verification"
      />
    </Text>
  );
}

function useMetadataScores(
  reply: PetitionRepliesFieldIdVerificationReply_PetitionFieldReplyFragment,
) {
  const intl = useIntl();

  const metadataScores = useMemo(() => {
    const metadata = reply.metadata as MetadataIDCard;

    if (isNullish(metadata.inferred_type) || isNonNullish(reply.content.error)) {
      return [];
    }

    return [
      {
        score: metadata.inferred_data.faceFrontSide,
        label: intl.formatMessage({
          id: "component.petition-replies-field-id-verification-reply.face-front-side",
          defaultMessage: "Face front side",
        }),
      },
      {
        score: metadata.inferred_data.uncompromisedDocument,
        label: intl.formatMessage({
          id: "component.petition-replies-field-id-verification-reply.uncompromised-document",
          defaultMessage: "Uncompromised document",
        }),
      },
      {
        score: metadata.inferred_data.notShownScreen,
        label: intl.formatMessage({
          id: "component.petition-replies-field-id-verification-reply.not-shown-screen",
          defaultMessage: "Not shown screen",
        }),
      },
      {
        score: metadata.inferred_data.checkedMRZ,
        label: intl.formatMessage({
          id: "component.petition-replies-field-id-verification-reply.checked-mrz",
          defaultMessage: "Checked MRZ",
        }),
      },
    ];
  }, [intl.locale]);

  return metadataScores;
}
