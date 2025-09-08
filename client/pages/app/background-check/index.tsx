import { gql } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  Center,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { FieldDateIcon } from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { DateInput } from "@parallel/components/common/DateInput";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { SimpleSelect } from "@parallel/components/common/SimpleSelect";
import { SupportLink } from "@parallel/components/common/SupportLink";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { BackgroundCheckEntityTypeSelect } from "@parallel/components/petition-preview/fields/background-check/BackgroundCheckEntityTypeSelect";
import {
  BackgroundCheckEntitySearchType,
  BackgroundCheckFieldSearch_userDocument,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { UnwrapPromise } from "@parallel/utils/types";
import { useBrowserMetadata } from "@parallel/utils/useBrowserMetadata";
import { useLoadCountryNames } from "@parallel/utils/useLoadCountryNames";
import Head from "next/head";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

export interface BackgroundCheckFormData {
  name: string | null;
  date: string | null;
  type: BackgroundCheckEntitySearchType | null;
  country: string | null;
  birthCountry: string | null;
}

type BackgroundCheckFieldSearchProps = UnwrapPromise<
  ReturnType<typeof BackgroundCheckFieldSearch.getInitialProps>
>;

function BackgroundCheckFieldSearch({
  name = "",
  date = "",
  type = null,
  country = null,
  birthCountry = null,
}: BackgroundCheckFieldSearchProps) {
  const router = useRouter();
  const intl = useIntl();

  const {
    data: { me },
  } = useAssertQuery(BackgroundCheckFieldSearch_userDocument);
  const isDisabled = !me.hasBackgroundCheck;

  const {
    handleSubmit,
    register,
    formState: { errors },
    control,
    watch,
  } = useForm<BackgroundCheckFormData>({
    mode: "onSubmit",
    defaultValues: {
      name,
      date,
      type,
      country,
      birthCountry,
    },
  });

  const selectedType = watch("type");

  const countryNames = useLoadCountryNames(intl.locale);

  const countryOptions = useMemo(() => {
    return countryNames.countries
      ? Object.entries(countryNames.countries).map(([code, name]) => ({
          value: code,
          label: name,
        }))
      : [];
  }, [countryNames]);

  return (
    <>
      <Head>
        <title>
          {
            // eslint-disable-next-line formatjs/no-literal-string-in-jsx
            `${intl.formatMessage({
              id: "generic.petition-field-type-background-check",
              defaultMessage: "Background check",
            })} | Parallel`
          }
        </title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Center minHeight="100vh" backgroundColor="gray.50" padding={4}>
        <Stack width="100%" maxWidth="500px">
          {isDisabled ? (
            <Alert status="warning" rounded="md">
              <AlertIcon />
              <Stack>
                <AlertTitle>
                  <FormattedMessage
                    id="page.background-check.disabled-feature-alert-title"
                    defaultMessage="Disabled feature"
                  />
                </AlertTitle>
                <AlertDescription>
                  <Text>
                    <FormattedMessage
                      id="page.background-check.disabled-feature-alert-body"
                      defaultMessage="Your organization does not have access to this feature. <Link>Contact with our support team</Link> for more information."
                      values={{
                        Link: (chunks: any[]) => (
                          <SupportLink
                            message={intl.formatMessage({
                              id: "page.background-check.disabled-feature-alert-message",
                              defaultMessage:
                                "Hi, I am having issues with the Background check field.",
                            })}
                          >
                            {chunks}
                          </SupportLink>
                        ),
                      }}
                    />
                  </Text>
                </AlertDescription>
              </Stack>
            </Alert>
          ) : null}
          <Card
            as="form"
            onSubmit={handleSubmit(({ name, date, type, country, birthCountry }) => {
              const { token, template } = router.query;
              router.push(
                `/app/background-check/results?${new URLSearchParams({
                  token: token as string,
                  ...(name ? { name } : {}),
                  ...(date ? { date } : {}),
                  ...(type ? { type } : {}),
                  ...(country ? { country } : {}),
                  ...(birthCountry ? { birthCountry } : {}),
                  ...(template === "true" ? { template: "true" } : {}),
                })}`,
              );
            })}
            paddingX={8}
            paddingY={10}
          >
            <Stack spacing={6}>
              <Heading size="lg">
                <FormattedMessage
                  id="page.background-check.fill-in-data"
                  defaultMessage="Run background check"
                />
              </Heading>
              <Stack spacing={4}>
                <FormControl>
                  <FormLabel fontWeight={400}>
                    <FormattedMessage
                      id="page.background-check.type-of-search-label"
                      defaultMessage="Type of search"
                    />
                  </FormLabel>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => <BackgroundCheckEntityTypeSelect {...field} />}
                  />
                </FormControl>
                <FormControl id="name" isInvalid={!!errors.name} isDisabled={isDisabled}>
                  <FormLabel fontWeight="400">
                    <FormattedMessage
                      id="page.background-check.name-person-entity"
                      defaultMessage="Name of the person / entity *"
                    />
                  </FormLabel>
                  <Input {...register("name", { required: true })} />
                  <FormErrorMessage>
                    <FormattedMessage
                      id="generic.invalid-first-name-error"
                      defaultMessage="Please, enter the first name"
                    />
                  </FormErrorMessage>
                </FormControl>
                <FormControl isDisabled={isDisabled}>
                  <FormLabel fontWeight="400">
                    {selectedType === "COMPANY" ? (
                      <FormattedMessage
                        id="page.background-check.date-of-registration"
                        defaultMessage="Date of registration"
                      />
                    ) : (
                      <FormattedMessage
                        id="page.background-check.date-of-birth"
                        defaultMessage="Date of birth"
                      />
                    )}
                  </FormLabel>
                  <Flex flex="1" position="relative" marginTop={2}>
                    <DateInput {...register("date")} />
                    <Center
                      boxSize={10}
                      position="absolute"
                      insetEnd={0}
                      bottom={0}
                      pointerEvents="none"
                    >
                      <FieldDateIcon fontSize="18px" />
                    </Center>
                  </Flex>
                </FormControl>
                <FormControl>
                  <FormLabel fontWeight={400}>
                    {selectedType === "PERSON" ? (
                      <FormattedMessage
                        id="page.background-check.nationality-label"
                        defaultMessage="Nationality"
                      />
                    ) : selectedType === "COMPANY" ? (
                      <FormattedMessage
                        id="page.background-check.country-of-jurisdiction-label"
                        defaultMessage="Country of jurisdiction"
                      />
                    ) : (
                      <FormattedMessage
                        id="page.background-check.country-label"
                        defaultMessage="Country (nationality / jurisdiction)"
                      />
                    )}
                  </FormLabel>
                  <Controller
                    name="country"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <SimpleSelect
                        isClearable
                        isSearchable
                        value={value}
                        onChange={onChange}
                        options={countryOptions}
                        placeholder={intl.formatMessage({
                          id: "page.background-check.select-country-placeholder",
                          defaultMessage: "Any country",
                        })}
                      />
                    )}
                  />
                </FormControl>
                {selectedType === "PERSON" ? (
                  <FormControl>
                    <FormLabel fontWeight={400}>
                      <FormattedMessage
                        id="page.background-check.birth-country-label"
                        defaultMessage="Country of birth"
                      />
                    </FormLabel>
                    <Controller
                      name="birthCountry"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <SimpleSelect
                          isClearable
                          isSearchable
                          value={value}
                          onChange={onChange}
                          options={countryOptions}
                          placeholder={intl.formatMessage({
                            id: "page.background-check.select-country-placeholder",
                            defaultMessage: "Any country",
                          })}
                        />
                      )}
                    />
                  </FormControl>
                ) : null}
              </Stack>
              <Button colorScheme="primary" type="submit" isDisabled={isDisabled}>
                <FormattedMessage id="page.background-check.search" defaultMessage="Search" />
              </Button>
            </Stack>
          </Card>
        </Stack>
      </Center>
    </>
  );
}

const _queries = [
  gql`
    query BackgroundCheckFieldSearch_petitionField($petitionId: GID!, $petitionFieldId: GID!) {
      petitionField(petitionId: $petitionId, petitionFieldId: $petitionFieldId) {
        id
        type
      }
    }
  `,
  gql`
    query BackgroundCheckFieldSearch_user {
      me {
        id
        hasBackgroundCheck: hasFeatureFlag(featureFlag: BACKGROUND_CHECK)
      }
      ...useBrowserMetadata_Query
    }
    ${useBrowserMetadata.fragments.Query}
  `,
];

BackgroundCheckFieldSearch.getInitialProps = async ({
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  const name = query.name as string | null | undefined;
  const date = query.date as string | null | undefined;
  const type = query.type as BackgroundCheckEntitySearchType | null | undefined;
  const country = query.country as string | null | undefined;
  const birthCountry = query.birthCountry as string | null | undefined;

  await fetchQuery(BackgroundCheckFieldSearch_userDocument);

  return { name, date, type, country, birthCountry };
};

export default compose(
  withDialogs,
  withFeatureFlag("BACKGROUND_CHECK"),
  withApolloData,
)(BackgroundCheckFieldSearch);
