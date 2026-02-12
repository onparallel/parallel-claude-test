import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { Center, Heading, Image, Skeleton, Spinner, UnorderedList } from "@chakra-ui/react";
import { InfoCircleFilledIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { ExternalLink } from "@parallel/components/common/ExternalLink";
import { localizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { ScrollShadows } from "@parallel/components/common/ScrollShadows";
import {
  StandardListDetailsDialog_standardListDefinitionDocument,
  StandardListDetailsDialog_StandardListDefinitionFragment,
  UserLocale,
} from "@parallel/graphql/__types";
import { useRef } from "react";
import { FormattedDate, FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { Box, Button, HStack, Stack, Text } from "@parallel/components/ui";

export function useStandardListDetailsDialog() {
  return useDialog(StandardListDetailsDialog);
}

export function StandardListDetailsDialog({
  standardListId,
  isTemplate,
  ...props
}: DialogProps<{ standardListId: string; isTemplate: boolean }>) {
  const intl = useIntl();
  const focusRef = useRef<HTMLButtonElement>(null);
  const { data, loading } = useQuery(StandardListDetailsDialog_standardListDefinitionDocument, {
    variables: {
      id: standardListId,
      locale: intl.locale as UserLocale,
    },
    fetchPolicy: "cache-and-network",
  });
  const standardList = (data?.standardListDefinition ??
    {}) as StandardListDetailsDialog_StandardListDefinitionFragment;

  const { title, source, sourceUrl, listVersion, versionFormat, versionUrl, values } = standardList;

  return (
    <ConfirmDialog
      size="xl"
      scrollBehavior="inside"
      initialFocusRef={focusRef}
      header={
        <HStack>
          <InfoCircleFilledIcon color="blue.500" boxSize={6} />
          <Stack gap={0}>
            {loading ? (
              <Skeleton width="150px" height="20px" />
            ) : (
              <Heading size="md">
                {localizableUserTextRender({ intl, value: title, default: "" })}
              </Heading>
            )}

            <Text fontSize="md" fontWeight={400}>
              <FormattedMessage
                id="component.standard-list-details-dialog.source"
                defaultMessage="Source: {source}"
                values={{
                  source: sourceUrl ? (
                    <ExternalLink href={sourceUrl} display="inline-flex" alignItems="center">
                      {source}
                    </ExternalLink>
                  ) : (
                    source
                  ),
                }}
              />
            </Text>
          </Stack>
        </HStack>
      }
      body={
        loading ? (
          <Center minHeight="200px">
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="primary.500"
              size="xl"
            />
          </Center>
        ) : (
          <ScrollShadows as={Stack}>
            <HStack justify="space-between">
              <Text>
                <FormattedMessage
                  id="component.standard-list-details-dialog.options-included"
                  defaultMessage="Options included:"
                />
              </Text>
              {listVersion ? (
                <Text fontSize="sm">
                  <FormattedMessage
                    id="component.standard-list-details-dialog.list-version"
                    defaultMessage="List version: {version}"
                    values={{
                      version: versionUrl ? (
                        <ExternalLink href={versionUrl} display="inline-flex" alignItems="center">
                          <FormattedDate value={listVersion} {...versionFormat} />
                        </ExternalLink>
                      ) : (
                        <FormattedDate value={listVersion} {...versionFormat} />
                      ),
                    }}
                  />
                </Text>
              ) : null}
            </HStack>
            <UnorderedList paddingStart={3}>
              {values?.map((value) => {
                return (
                  <HStack as="li" key={value.key}>
                    <Image
                      alt={intl.formatMessage(
                        { id: "generic.flag-of", defaultMessage: "Flag of {country}" },
                        { country: value.label ?? value.key },
                      )}
                      boxSize={6}
                      src={`${
                        process.env.NEXT_PUBLIC_ASSETS_URL ?? ""
                      }/static/countries/flags/${value.key.toLowerCase()}.png`}
                    />

                    <Box as="span">
                      {[value.prefix, value.label ?? value.key, value.suffix]
                        .filter(isNonNullish)
                        .join(" - ")}
                    </Box>
                  </HStack>
                );
              })}
            </UnorderedList>
          </ScrollShadows>
        )
      }
      alternative={
        isTemplate ? (
          <Text fontSize="sm" fontStyle="italic" alignSelf="center">
            <FormattedMessage
              id="component.standard-list-details-dialog.alternative-text"
              defaultMessage="Parallels created from this template will retain the version currently in force."
            />
          </Text>
        ) : undefined
      }
      cancel={<></>}
      confirm={
        <Button ref={focusRef} onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.close" defaultMessage="Close" />
        </Button>
      }
      {...props}
    />
  );
}

const _fragments = {
  StandardListDefinition: gql`
    fragment StandardListDetailsDialog_StandardListDefinition on StandardListDefinition {
      id
      listVersion
      versionFormat
      versionUrl
      source
      sourceUrl
      title
      values {
        key
        label
        prefix
        suffix
      }
    }
  `,
};

const _queries = [
  gql`
    query StandardListDetailsDialog_standardListDefinition($id: GID!, $locale: UserLocale!) {
      standardListDefinition(id: $id, locale: $locale) {
        ...StandardListDetailsDialog_StandardListDefinition
      }
    }
  `,
];
