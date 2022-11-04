import { useMetadata } from "@parallel/utils/withMetadata";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

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
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { compose } from "@parallel/utils/compose";
import Head from "next/head";
import { useState } from "react";
import { isDefined } from "remeda";
import { PreviewFactivaTable } from "../PreviewFactivaTable";

type ExternalFieldKYCResearchProps = {
  htmlTitle: string;
  petitionId: string;
  fieldId: string;
};

function ExternalFieldKYCResearch({
  htmlTitle,
  petitionId,
  fieldId,
}: ExternalFieldKYCResearchProps) {
  const [formData, setFormData] = useState<formData | null>(null);
  const handleFormSubmit = async (data: formData) => {
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
        <PreviewFactivaTable
          name={formData.name}
          date={formData.dateOfBirth}
          onResetClick={handleResetSearch}
        />
      ) : (
        <Form onSubmit={handleFormSubmit} isDisabled={false} />
      )}
    </>
  );
}

export default compose(withDialogs)(ExternalFieldKYCResearch);

type FormProps = {
  onSubmit: (data: formData) => void;
  isDisabled?: boolean;
};

type formData = {
  name: string;
  dateOfBirth: string;
};

function Form({ onSubmit, isDisabled }: FormProps) {
  const { browserName } = useMetadata();
  const {
    handleSubmit,
    register,
    watch,
    formState: { errors },
  } = useForm<formData>({
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
              id="component.recipient-view-petition-field-kyc-research.fill-in-data"
              defaultMessage="Fill in the data to start the search"
            />
          </Heading>
          <Stack spacing={4}>
            <FormControl id="name" isInvalid={!!errors.name} isDisabled={isDisabled}>
              <FormLabel fontWeight="400">
                <FormattedMessage
                  id="component.recipient-view-petition-field-kyc-research.name-person-entity"
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
                  id="component.recipient-view-petition-field-kyc-research.date-of-birth"
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
              id="component.recipient-view-petition-field-kyc-research.search"
              defaultMessage="Search"
            />
          </Button>
          {/* {hasError ? (
            <HStack alignItems="center" marginTop={2} color="red.600">
              <ExclamationOutlineIcon boxSize={4} />
              <Text fontSize="sm">
                <FormattedMessage
                  id="component.recipient-view-petition-field-tax-documents.error-uploading"
                  defaultMessage="We have not found any files. Please try again."
                />
              </Text>
            </HStack>
          ) : null} */}
        </Stack>
      </Card>
    </Center>
  );
}

// type DetailsProps = {
//   onClickSave: () => void;
//   onClickDownload: () => void;
// };

// function Details({ onClickSave, onClickDownload }: DetailsProps) {
//   return (
//     <Card>
//       <Stack padding={4}>
//         <Text>SOME SHIT</Text>
//       </Stack>
//     </Card>
//   );
// }
