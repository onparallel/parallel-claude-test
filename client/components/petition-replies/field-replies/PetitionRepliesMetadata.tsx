import { HStack, IconProps, Text } from "@chakra-ui/react";
import { AlertCircleFilledIcon, CircleCheckFilledIcon } from "@parallel/chakra/icons";
import { CopyToClipboardButton } from "@parallel/components/common/CopyToClipboardButton";
import { FORMATS } from "@parallel/utils/dates";
import { ReactNode, forwardRef } from "react";
import { FormattedDate, useIntl } from "react-intl";
import { isDefined } from "remeda";

export function PetitionRepliesMetadataDate({
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

export function PetitionRepliesMetadataText({
  label,
  content,
}: {
  label: string;
  content: string | null;
}) {
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

export const InvalidIcon = forwardRef<SVGSVGElement, IconProps>(function InvalidIcon(
  { ...props },
  ref,
) {
  return <AlertCircleFilledIcon ref={ref} {...props} color="yellow.500" />;
});

export const ValidIcon = forwardRef<SVGSVGElement, IconProps>(function ValidIcon(
  { ...props },
  ref,
) {
  return <CircleCheckFilledIcon ref={ref} {...props} color="green.500" />;
});

export function PetitionRepliesMetadataScore({
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
      <PetitionRepliesMetadataScoreIcon score={score} threshold={threshold} maxScore={maxScore} />
    </HStack>
  );
}

export function PetitionRepliesMetadataScoreIcon({
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
