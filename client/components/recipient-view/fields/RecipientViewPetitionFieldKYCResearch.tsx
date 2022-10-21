import {
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Progress,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ExclamationOutlineIcon, FieldDateIcon } from "@parallel/chakra/icons";
import { useTone } from "@parallel/components/common/ToneProvider";
import { useMetadata } from "@parallel/utils/withMetadata";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { useRecipientViewPetitionFieldKYCResearchDialog } from "../dialogs/RecipientViewPetitionFieldKYCResearchDialog";
import {
  RecipientViewPetitionFieldCard,
  RecipientViewPetitionFieldCardProps,
} from "./RecipientViewPetitionFieldCard";

export interface RecipientViewPetitionFieldKYCResearchProps
  extends Omit<
    RecipientViewPetitionFieldCardProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  isDisabled: boolean;
  onDeleteReply: (replyId: string) => void;
  isCacheOnly?: boolean;
}

type formData = {
  name: string;
  date: string;
};

export function RecipientViewPetitionFieldKYCResearch({
  field,
  isDisabled,
  isInvalid,
  onDeleteReply,
  onDownloadAttachment,
  onCommentsButtonClick,
  isCacheOnly,
}: RecipientViewPetitionFieldKYCResearchProps) {
  const tone = useTone();
  const [state, setState] = useState<"IDLE" | "ERROR" | "FETCHING">("IDLE");
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
      date: "",
    },
  });

  const showSearchResultsDialog = useRecipientViewPetitionFieldKYCResearchDialog();

  const date = watch("date");

  function randomRange(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const handleCancelClick = () => {
    setState("IDLE");
  };

  const handleSearchError = () => {
    setState("ERROR");
  };

  const handleSearchFetching = async ({ name, date }: formData) => {
    try {
      setState("FETCHING");
      await showSearchResultsDialog({ tone, name, date });
    } catch {}
  };

  const searchIsDisabled = isDisabled || state === "FETCHING";

  return (
    <RecipientViewPetitionFieldCard
      field={field}
      isInvalid={isInvalid}
      onCommentsButtonClick={onCommentsButtonClick}
      onDownloadAttachment={onDownloadAttachment}
      tone={tone}
    >
      <Stack
        spacing={2}
        as="form"
        onSubmit={handleSubmit((data) => {
          console.log("Data: ", data);
          if (randomRange(1, 10) < 4) {
            handleSearchError();
          } else {
            handleSearchFetching(data);
          }
        })}
      >
        <FormControl id="name" isInvalid={!!errors.name} isDisabled={searchIsDisabled}>
          <FormLabel fontWeight="400">
            <FormattedMessage
              id="component.recipient-view-petition-field-kyc-research.full-name"
              defaultMessage="Full name:"
            />
            {"*"}
          </FormLabel>
          <Input {...register("name", { required: true })} />
          <FormErrorMessage>
            <FormattedMessage
              id="generic.forms.invalid-first-name-error"
              defaultMessage="Please, enter the first name"
            />
          </FormErrorMessage>
        </FormControl>
        <FormControl isDisabled={searchIsDisabled}>
          <FormLabel fontWeight="400">
            <FormattedMessage
              id="component.recipient-view-petition-field-kyc-research.date-of-birth"
              defaultMessage="Date of birth:"
            />
          </FormLabel>
          <Flex flex="1" position="relative" marginTop={2}>
            <Input
              type="date"
              {...register("date")}
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
              <FieldDateIcon fontSize="18px" color={searchIsDisabled ? "gray.400" : undefined} />
            </Center>
          </Flex>
        </FormControl>
        <Box>
          <Button variant="outline" type="submit" isDisabled={searchIsDisabled}>
            <FormattedMessage
              id="component.recipient-view-petition-field-kyc-research.search"
              defaultMessage="Search"
            />
          </Button>
        </Box>
      </Stack>
      {state === "FETCHING" ? (
        <Stack marginTop={4} spacing={0}>
          <Text fontSize="sm">
            <FormattedMessage
              id="component.recipient-view-petition-field-kyc-research.searching-data"
              defaultMessage="Please wait while we perform the search..."
            />
          </Text>
          <HStack>
            <Progress
              size="md"
              isIndeterminate
              colorScheme="green"
              borderRadius="full"
              width="100%"
            />
            <Button size="sm" fontWeight="normal" onClick={handleCancelClick}>
              <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
            </Button>
          </HStack>
        </Stack>
      ) : null}
      {state === "ERROR" ? (
        <HStack alignItems="center" marginTop={2} color="red.600">
          <ExclamationOutlineIcon boxSize={4} />
          <Text fontSize="sm">
            <FormattedMessage
              id="component.recipient-view-petition-field-tax-documents.error-uploading"
              defaultMessage="We have not found any files. Please try again."
            />
          </Text>
        </HStack>
      ) : null}
    </RecipientViewPetitionFieldCard>
  );
}
