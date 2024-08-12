import { gql } from "@apollo/client";
import { HStack, IconProps, Stack, Text } from "@chakra-ui/react";
import { AlertCircleFilledIcon, CameraIcon, CircleCheckFilledIcon } from "@parallel/chakra/icons";
import { CopyToClipboardButton } from "@parallel/components/common/CopyToClipboardButton";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { PetitionRepliesFieldIdVerificationReply_PetitionFieldReplyFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useLoadCountryNames } from "@parallel/utils/useLoadCountryNames";
import { ReactNode, forwardRef, useMemo } from "react";
import { FormattedDate, FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";

interface PetitionRepliesFieldIdVerificationReplyProps {
  reply: PetitionRepliesFieldIdVerificationReply_PetitionFieldReplyFragment;
  editReplyIconButton: ReactNode;
}

interface MetadataLiveness {
  inferred_data: InferredDataLiveness;
}

interface InferredDataLiveness {
  liveness: number;
  onlyOneFace: number;
}

interface MetadataIDCard {
  inferred_data: InferredDataIDCard;
  inferred_type: string;
}

interface InferredDataIDCard {
  type: string;
  surname: string | null;
  idNumber: string | null;
  birthDate: string | null;
  createdAt: string;
  firstName: string | null;
  issueDate: string | null;
  birthPlace: string | null;
  checkedMRZ: number | null;
  nationality: string | null;
  coherentDates: number | null;
  faceFrontSide: number | null;
  expirationDate: string | null;
  issuingCountry: string | null;
  notShownScreen: number | null;
  unexpiredDocument: number | null;
  uncompromisedDocument: number | null;
  matchesExpectedDocument: number | null;
}

export function PetitionRepliesFieldIdVerificationReply({
  reply,
  editReplyIconButton,
}: PetitionRepliesFieldIdVerificationReplyProps) {
  if (isDefined(reply.content.error) && reply.content.error.length > 0) {
    return <ErrorMessageContent />;
  }

  if (isDefined(reply.metadata.inferred_type)) {
    return <IDCardView reply={reply} editReplyIconButton={editReplyIconButton} />;
  }

  return <LivenessView reply={reply} />;
}

PetitionRepliesFieldIdVerificationReply.fragments = {
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
  editReplyIconButton,
}: {
  reply: PetitionRepliesFieldIdVerificationReply_PetitionFieldReplyFragment;
  editReplyIconButton: ReactNode;
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
  const idNumber = metadata.inferred_data.idNumber;
  const firstName = metadata.inferred_data.firstName;
  const surname = metadata.inferred_data.surname;
  const hasName = isDefined(firstName) || isDefined(surname);
  const fullName = `${surname}, ${firstName}`;
  return (
    <HStack paddingBottom={3} flexWrap="wrap-reverse" width="100%" spacing={6}>
      <Stack marginEnd={{ base: 0, xl: 10 }}>
        <HStack>
          <Text fontWeight={600}>{hasName ? fullName : " - "}</Text>
          {hasName ? <CopyToClipboardButton size="xs" fontSize="md" text={fullName} /> : null}
        </HStack>

        <IdVerificatioText
          label={intl.formatMessage({
            id: "component.petition-replies-field-id-verification-reply.nationality",
            defaultMessage: "Nationality",
          })}
          content={nationality ? getCountryName(nationality) ?? nationality : null}
        />
        <IdVerificationDate
          label={intl.formatMessage({
            id: "component.petition-replies-field-id-verification-reply.date-of-birth",
            defaultMessage: "Date of birth",
          })}
          date={metadata.inferred_data.birthDate}
        />
        <IdVerificatioText
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
            {metadata.inferred_data.type === "PASSPORT" ? (
              <FormattedMessage
                id="component.petition-replies-field-id-verification-reply.passport-number"
                defaultMessage="Passport"
              />
            ) : metadata.inferred_data.type === "ID_CARD" ? (
              <FormattedMessage
                id="component.petition-replies-field-id-verification-reply.id-number"
                defaultMessage="ID"
              />
            ) : metadata.inferred_data.type === "DRIVER_LICENSE" ? (
              <FormattedMessage
                id="component.petition-replies-field-id-verification-reply.driver-license-number"
                defaultMessage="Driver license"
              />
            ) : metadata.inferred_data.type === "RESIDENCE_PERMIT" ? (
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
                      <ScoreWithIcon score={score} threshold={50} maxScore={100} />
                    </HStack>
                  );
                })}
              </Stack>
            }
          >
            {metadataScores.some(({ score }) => !isDefined(score) || score < 50) ? (
              <InvalidIcon />
            ) : (
              <ValidIcon />
            )}
          </SmallPopover>
          {isDefined(idNumber) ? (
            <CopyToClipboardButton size="xs" fontSize="md" text={idNumber} />
          ) : null}
        </HStack>
        <IdVerificatioText
          label={intl.formatMessage({
            id: "component.petition-replies-field-id-verification-reply.issuing-country",
            defaultMessage: "Issuing country",
          })}
          content={issuingCountry ? getCountryName(issuingCountry) ?? issuingCountry : null}
        />
        <IdVerificationDate
          label={intl.formatMessage({
            id: "component.petition-replies-field-id-verification-reply.date-of-issue",
            defaultMessage: "Date of issue",
          })}
          date={metadata.inferred_data.issueDate}
        />
        <IdVerificationDate
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
        <IdVerificationScore
          label={intl.formatMessage({
            id: "component.petition-replies-field-id-verification-reply.liveness",
            defaultMessage: "Liveness",
          })}
          score={metadata.inferred_data.liveness}
          maxScore={100}
          threshold={50}
        />
        <IdVerificationScore
          label={intl.formatMessage({
            id: "component.petition-replies-field-id-verification-reply.only-one-face",
            defaultMessage: "Only one face",
          })}
          score={metadata.inferred_data.onlyOneFace}
          maxScore={100}
          threshold={50}
        />
      </Stack>
    </HStack>
  );
}

function ScoreWithIcon({
  score,
  threshold,
  maxScore,
}: {
  score: number | null;
  threshold: number;
  maxScore: number;
}) {
  if (!isDefined(score)) return <Text>{"-"}</Text>;

  return score >= threshold ? (
    <HStack spacing={1}>
      <ValidIcon />
      <Text as="span" color="green.500">
        {Math.trunc(score)}/{maxScore}
      </Text>
    </HStack>
  ) : (
    <HStack spacing={1}>
      <InvalidIcon />
      <Text as="span">
        {Math.trunc(score)}/{maxScore}
      </Text>
    </HStack>
  );
}

function IdVerificationScore({
  label,
  score,
  threshold,
  maxScore,
}: {
  label: string;
  score: number | null;
  threshold: number;
  maxScore: number;
}) {
  return (
    <HStack alignItems="flex-end">
      <Text as="span" fontWeight={500} color="gray.600" fontSize="sm">
        {label}:
      </Text>
      <ScoreWithIcon score={score} threshold={threshold} maxScore={maxScore} />
    </HStack>
  );
}

function IdVerificationDate({
  label,
  date,
  rightIcon,
}: {
  label: string;
  date: string | null;
  rightIcon?: ReactNode;
}) {
  const intl = useIntl();
  return (
    <HStack alignItems="flex-end">
      <Text as="span" fontWeight={500} color="gray.600" fontSize="sm">
        {label}:
      </Text>
      <Text as="span">{isDefined(date) ? <FormattedDate value={date} {...FORMATS.L} /> : "-"}</Text>
      {rightIcon}
      {isDefined(date) ? (
        <CopyToClipboardButton size="xs" fontSize="md" text={intl.formatDate(date, FORMATS.L)} />
      ) : null}
    </HStack>
  );
}

function IdVerificatioText({ label, content }: { label: string; content: string | null }) {
  return (
    <HStack alignItems="flex-end">
      <Text as="span" fontWeight={500} color="gray.600" fontSize="sm">
        {label}:
      </Text>
      <Text as="span">{isDefined(content) ? content : "-"}</Text>
      {isDefined(content) ? <CopyToClipboardButton size="xs" fontSize="md" text={content} /> : null}
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

    if (!isDefined(metadata.inferred_type) || isDefined(reply.content.error)) {
      return [];
    }

    return [
      {
        score: metadata.inferred_data.matchesExpectedDocument,
        label: intl.formatMessage({
          id: "component.petition-replies-field-id-verification-reply.matched-expected-document",
          defaultMessage: "Matched expected document",
        }),
      },
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
        score: metadata.inferred_data.coherentDates,
        label: intl.formatMessage({
          id: "component.petition-replies-field-id-verification-reply.coherent-dates",
          defaultMessage: "Coherent dates",
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

const InvalidIcon = forwardRef<SVGSVGElement, IconProps>(function InvalidIcon({ ...props }, ref) {
  return <AlertCircleFilledIcon ref={ref} {...props} color="yellow.500" />;
});

const ValidIcon = forwardRef<SVGSVGElement, IconProps>(function ValidIcon({ ...props }, ref) {
  return <CircleCheckFilledIcon ref={ref} {...props} color="green.500" />;
});
