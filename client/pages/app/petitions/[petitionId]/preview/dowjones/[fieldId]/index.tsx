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
import { SupportLink } from "@parallel/components/common/SupportLink";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import {
  DowJonesFieldSearch_petitionFieldDocument,
  DowJonesFieldSearch_userDocument,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { withMetadata } from "@parallel/utils/withMetadata";
import Head from "next/head";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

export interface DowJonesSearchFormData {
  name: string;
  dateOfBirth: string;
}

function DowJonesFieldSearch() {
  const router = useRouter();
  const intl = useIntl();

  const {
    data: { me },
  } = useAssertQuery(DowJonesFieldSearch_userDocument);
  const isDisabled = !me.hasDowJonesFeatureFlag;

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<DowJonesSearchFormData>({
    mode: "onSubmit",
    defaultValues: {
      name: "",
      dateOfBirth: "",
    },
  });

  return (
    <>
      <Head>
        <title>
          {
            // eslint-disable-next-line formatjs/no-literal-string-in-jsx
            "Dow Jones | Parallel"
          }
        </title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Center minHeight="100vh" backgroundColor="gray.50" padding={4}>
        <Stack>
          {isDisabled ? (
            <Alert status="warning" borderRadius="md" maxWidth="500px">
              <AlertIcon />
              <Stack>
                <AlertTitle>
                  <FormattedMessage
                    id="component.internal-field-kyc-research.disabled-feature-alert-title"
                    defaultMessage="Disabled feature"
                  />
                </AlertTitle>
                <AlertDescription>
                  <Text>
                    <FormattedMessage
                      id="component.internal-field-kyc-research.disabled-feature-alert-body"
                      defaultMessage="Your organization does not have access to this feature. <Link>Contact with our support team</Link> for more information."
                      values={{
                        Link: (chunks: any[]) => (
                          <SupportLink
                            message={intl.formatMessage({
                              id: "component.internal-field-kyc-research.disabled-feature-alert-message",
                              defaultMessage: "Hi, I am having issues with the Dow Jones field.",
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
            onSubmit={handleSubmit(({ name, dateOfBirth }) => {
              const { petitionId, fieldId } = router.query;
              router.push(
                `/app/petitions/${petitionId}/preview/dowjones/${fieldId}/results?${new URLSearchParams(
                  { name, dateOfBirth },
                )}`,
              );
            })}
            paddingX={8}
            paddingY={10}
            width="100%"
            maxWidth={"500px"}
          >
            <Stack spacing={6}>
              <Heading size="lg">
                <FormattedMessage
                  id="component.internal-field-kyc-research.fill-in-data"
                  defaultMessage="Fill in the data to start the search"
                />
              </Heading>
              <Stack spacing={4}>
                <FormControl id="name" isInvalid={!!errors.name} isDisabled={isDisabled}>
                  <FormLabel fontWeight="400">
                    <FormattedMessage
                      id="component.internal-field-kyc-research.name-person-entity"
                      defaultMessage="Name of the person/entity *"
                    />
                  </FormLabel>
                  <Input {...register("name", { required: true })} />
                  <FormErrorMessage>
                    <FormattedMessage
                      id="generic.forms.invalid-first-name-error"
                      defaultMessage="Please, enter the first name"
                    />
                  </FormErrorMessage>
                </FormControl>
                <FormControl isDisabled={isDisabled}>
                  <FormLabel fontWeight="400">
                    <FormattedMessage
                      id="component.internal-field-kyc-research.date-of-birth"
                      defaultMessage="Date of birth"
                    />
                  </FormLabel>
                  <Flex flex="1" position="relative" marginTop={2}>
                    <DateInput {...register("dateOfBirth")} />
                    <Center
                      boxSize={10}
                      position="absolute"
                      right={0}
                      bottom={0}
                      pointerEvents="none"
                    >
                      <FieldDateIcon fontSize="18px" />
                    </Center>
                  </Flex>
                </FormControl>
              </Stack>
              <Button colorScheme="primary" type="submit" isDisabled={isDisabled}>
                <FormattedMessage
                  id="component.internal-field-kyc-research.search"
                  defaultMessage="Search"
                />
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
    query DowJonesFieldSearch_petitionField($petitionId: GID!, $petitionFieldId: GID!) {
      petitionField(petitionId: $petitionId, petitionFieldId: $petitionFieldId) {
        id
        type
      }
    }
  `,
  gql`
    query DowJonesFieldSearch_user {
      metadata {
        browserName
      }
      me {
        id
        hasDowJonesFeatureFlag: hasFeatureFlag(featureFlag: DOW_JONES_KYC)
      }
    }
  `,
];

DowJonesFieldSearch.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const petitionId = query.petitionId as string;
  const petitionFieldId = query.fieldId as string;
  const [
    {
      data: { metadata },
    },
    {
      data: { petitionField },
    },
  ] = await Promise.all([
    fetchQuery(DowJonesFieldSearch_userDocument),
    fetchQuery(DowJonesFieldSearch_petitionFieldDocument, {
      variables: { petitionId, petitionFieldId },
      ignoreCache: true,
    }),
  ]);

  if (petitionField.type !== "DOW_JONES_KYC") {
    throw new Error("FORBIDDEN");
  }

  return { metadata };
};

export default compose(withMetadata, withDialogs, withApolloData)(DowJonesFieldSearch);
