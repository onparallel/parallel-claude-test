import { HStack, IconProps, Image, Stack, Text } from "@chakra-ui/react";
import { AlertCircleFilledIcon, CircleCheckFilledIcon } from "@parallel/chakra/icons";
import { CopyToClipboardButton } from "@parallel/components/common/CopyToClipboardButton";
import { FORMATS } from "@parallel/utils/dates";
import { useLoadCountryNames } from "@parallel/utils/useLoadCountryNames";
import { isValid } from "date-fns";
import { ReactNode, forwardRef } from "react";
import { FormattedDate, useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";

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

  // Check if date is valid
  const isValidDate = isNonNullish(date) && isValid(new Date(date));

  return (
    <Stack>
      <Text as="span" fontWeight={500} color="gray.600" fontSize="sm">
        {label}
      </Text>
      <HStack>
        {isNonNullish(date) ? (
          <CopyToClipboardButton
            size="xs"
            fontSize="md"
            text={isValidDate ? intl.formatDate(date, FORMATS.L) : date}
          />
        ) : null}
        <Text as="span">
          {isValidDate ? (
            <FormattedDate value={date} {...FORMATS.L} />
          ) : isNonNullish(date) ? (
            date
          ) : (
            "-"
          )}
        </Text>
        {rightIcon}
      </HStack>
    </Stack>
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
    <Stack>
      <Text as="span" fontWeight={500} color="gray.600" fontSize="sm">
        {label}
      </Text>
      <HStack>
        {isNonNullish(content) ? (
          <CopyToClipboardButton size="xs" fontSize="md" text={content} />
        ) : null}
        <Text as="span">{isNonNullish(content) ? content : "-"}</Text>
      </HStack>
    </Stack>
  );
}

export function PetitionRepliesMetadataCountry({
  label,
  countryCode,
}: {
  label: string;
  countryCode: string | null;
}) {
  const intl = useIntl();
  const { countries } = useLoadCountryNames(intl.locale);
  const countryName = isNonNullish(countryCode)
    ? (countries?.[countryCode] ?? countries?.[countryCode.toUpperCase()])
    : null;

  return (
    <Stack>
      <Text as="span" fontWeight={500} color="gray.600" fontSize="sm">
        {label}
      </Text>
      <HStack>
        {isNonNullish(countryCode) ? (
          <>
            <CopyToClipboardButton size="xs" fontSize="md" text={countryName ?? countryCode} />
            {isNonNullish(countryName) && (
              <Image
                alt={countryName}
                boxSize={6}
                src={`${
                  process.env.NEXT_PUBLIC_ASSETS_URL ?? ""
                }/static/countries/flags/${countryCode.toLowerCase()}.png`}
              />
            )}
          </>
        ) : null}
        <Text as="span">{isNonNullish(countryName) ? countryName : (countryCode ?? "-")}</Text>
      </HStack>
    </Stack>
  );
}

export function PetitionRepliesMetadataGender({
  label,
  gender,
}: {
  label: string;
  gender: string | null;
}) {
  const intl = useIntl();

  const genderText = isNonNullish(gender)
    ? gender === "M"
      ? intl.formatMessage({
          id: "component.petition-replies-metadata.gender-male",
          defaultMessage: "Male",
        })
      : gender === "F"
        ? intl.formatMessage({
            id: "component.petition-replies-metadata.gender-female",
            defaultMessage: "Female",
          })
        : gender
    : "-";

  return (
    <Stack>
      <Text as="span" fontWeight={500} color="gray.600" fontSize="sm">
        {label}
      </Text>
      <HStack>
        {isNonNullish(gender) ? (
          <CopyToClipboardButton size="xs" fontSize="md" text={genderText} />
        ) : null}
        <Text as="span">{genderText}</Text>
      </HStack>
    </Stack>
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
  if (isNullish(score)) return <Text>{"-"}</Text>;

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
