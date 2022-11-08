import { useMetadata } from "@parallel/utils/withMetadata";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

import { gql } from "@apollo/client";
import {
  Button,
  Center,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Stack,
} from "@chakra-ui/react";
import { FieldDateIcon } from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { InternalFieldKYCResearch_PetitionFieldReplyFragment } from "@parallel/graphql/__types";
import Head from "next/head";
import { useState } from "react";
import { isDefined } from "remeda";
import { DowJonesSearchResult } from "./DowJonesSearchResult";

type InternalFieldKYCResearchProps = {
  htmlTitle: string;
  petitionId: string;
  fieldId: string;
  replies: InternalFieldKYCResearch_PetitionFieldReplyFragment[];
};

export function InternalFieldKYCResearch({
  htmlTitle,
  petitionId,
  fieldId,
  replies,
}: InternalFieldKYCResearchProps) {
  const [formData, setFormData] = useState<DowJonesSearchFormData | null>(null);
  const handleFormSubmit = async (data: DowJonesSearchFormData) => {
    setFormData(data);
  };

  const handleResetSearch = async () => {
    setFormData(null);
  };

  return (
    <>
      <Head>
        <title>{htmlTitle}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      {isDefined(formData) ? (
        <DowJonesSearchResult
          name={formData.name}
          date={formData.dateOfBirth}
          petitionId={petitionId}
          fieldId={fieldId}
          replies={replies}
          onResetClick={handleResetSearch}
        />
      ) : (
        <DowJonesSearchForm onSubmit={handleFormSubmit} isDisabled={false} />
      )}
    </>
  );
}

InternalFieldKYCResearch.fragments = {
  PetitionFieldReply: gql`
    fragment InternalFieldKYCResearch_PetitionFieldReply on PetitionFieldReply {
      ...DowJonesSearchResult_PetitionFieldReply
    }
    ${DowJonesSearchResult.fragments.PetitionFieldReply}
  `,
};

type DowJonesSearchFormProps = {
  onSubmit: (data: DowJonesSearchFormData) => void;
  isDisabled?: boolean;
};

type DowJonesSearchFormData = {
  name: string;
  dateOfBirth: string;
};

function DowJonesSearchForm({ onSubmit, isDisabled }: DowJonesSearchFormProps) {
  const { browserName } = useMetadata();
  const {
    handleSubmit,
    register,
    watch,
    formState: { errors },
  } = useForm<DowJonesSearchFormData>({
    mode: "onSubmit",
    defaultValues: {
      name: "",
      dateOfBirth: "",
    },
  });

  const date = watch("dateOfBirth");

  return (
    <Center height="100vh" padding={4}>
      <Card paddingX={8} paddingY={10} width="100%" maxWidth={"500px"}>
        <Stack spacing={6} as="form" onSubmit={handleSubmit(onSubmit)}>
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
                <Input
                  type="date"
                  {...register("dateOfBirth")}
                  sx={{
                    paddingRight: 1.5,
                    "&::-webkit-calendar-picker-indicator": {
                      color: "transparent",
                      background: "transparent",
                    },
                    ...(browserName === "Safari" // Safari does stupid things
                      ? {
                          color: "gray.800",
                          ...(date ? {} : { "&:not(:focus)": { color: "rgba(0,0,0,0.3)" } }),
                        }
                      : {}),
                  }}
                />
                <Center boxSize={10} position="absolute" right={0} bottom={0} pointerEvents="none">
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
    </Center>
  );
}
