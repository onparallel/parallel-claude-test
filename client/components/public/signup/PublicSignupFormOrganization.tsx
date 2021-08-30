import { gql, useApolloClient } from "@apollo/client";
import {
  Button,
  Center,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Image,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import {
  PublicSignupFormOrganization_organizationNameIsAvailableQuery,
  PublicSignupFormOrganization_organizationNameIsAvailableQueryVariables,
} from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";

export type PublicSignupFormOrganizationProps = {
  onBack: () => void;
  onNext: ({
    organizationName,
    organizationLogo,
  }: {
    organizationName: string;
    organizationLogo: Maybe<File> | undefined;
  }) => void;
};

export function PublicSignupFormOrganization({
  onBack,
  onNext,
}: PublicSignupFormOrganizationProps) {
  const [organizationName, setOrganizationName] = useState("");
  const [isInvalidCompanyName, setIsInvalidCompanyName] = useState(false);
  const [organizationNameIsAvailable, setOrganizationNameIsAvailable] = useState(true);

  const [organizationLogo, setOrganizationLogo] = useState<Maybe<File> | undefined>(undefined);

  useEffect(() => {
    if (isInvalidCompanyName) setIsInvalidCompanyName(false);
  }, [organizationName]);

  const handleNext = () => {
    if (!organizationName) {
      setIsInvalidCompanyName(true);
    } else {
      onNext({ organizationName, organizationLogo });
    }
  };

  const apollo = useApolloClient();
  const debouncedOrganizationIsAvailable = useDebouncedAsync(
    async (name: string) => {
      const { data } = await apollo.query<
        PublicSignupFormOrganization_organizationNameIsAvailableQuery,
        PublicSignupFormOrganization_organizationNameIsAvailableQueryVariables
      >({
        query: gql`
          query PublicSignupFormOrganization_organizationNameIsAvailable($name: String!) {
            organizationNameIsAvailable(name: $name)
          }
        `,
        variables: { name },
        fetchPolicy: "no-cache",
      });
      return data.organizationNameIsAvailable;
    },
    300,
    []
  );

  const handleCompanyNameValidate = async () => {
    try {
      const data = await debouncedOrganizationIsAvailable(organizationName);
      setOrganizationNameIsAvailable(data);
    } catch (e) {
      // "DEBOUNCED" error means the search was cancelled because user kept typing
      if (e === "DEBOUNCED") {
        return "DEBOUNCED";
      } else {
        throw e;
      }
    }
  };

  const MemoizedLogoInput = useMemo(() => {
    return (
      <SelectLogoInput
        organizationLogo={organizationLogo}
        setOrganizationLogo={setOrganizationLogo}
      />
    );
  }, [organizationLogo, setOrganizationLogo]);

  return (
    <>
      <Text as="span" color="gray.500" fontSize="sm">
        2/3
      </Text>
      <Stack spacing={4}>
        <Text as="h1" fontSize="2xl" fontWeight="bold" marginTop={0}>
          <FormattedMessage
            id="component.public-signup-form-organization.heading"
            defaultMessage="Set up your organization"
          />
        </Text>
        <Text marginBottom={2}>
          <FormattedMessage
            id="component.public-signup-form-organization.description"
            defaultMessage="Fill out your organization’s profile that your customers will see in your communications."
          />
        </Text>
        <FormControl
          id="company-name"
          isInvalid={isInvalidCompanyName || !organizationNameIsAvailable}
        >
          <FormLabel>
            <FormattedMessage
              id="component.public-signup-form-organization.company-name-label"
              defaultMessage="Company name*"
            />
            <HelpPopover marginLeft={2}>
              <Text fontSize="sm">
                <FormattedMessage
                  id="component.public-signup-form-organization.company-name-description"
                  defaultMessage="This is the name that will appear in your petitions, so make sure it is the one your customers will recognize."
                />
              </Text>
            </HelpPopover>
          </FormLabel>
          <Input
            name="company-name"
            type="text"
            autoComplete="off"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            onBlur={handleCompanyNameValidate}
          />
          <FormErrorMessage>
            {organizationNameIsAvailable ? (
              <FormattedMessage
                id="component.public-signup-form-organization.invalid-company-name-error"
                defaultMessage="Please, enter a company name"
              />
            ) : (
              <FormattedMessage
                id="component.public-signup-form-organization.organization-name-not-available"
                defaultMessage="This company name is not available"
              />
            )}
          </FormErrorMessage>
        </FormControl>
        {MemoizedLogoInput}
        <Stack spacing={4} paddingTop={4} direction={{ base: "column-reverse", md: "row" }}>
          <Button width="100%" variant="outline" size="md" fontSize="md" onClick={onBack}>
            <FormattedMessage
              id="component.public-signup-form-organization.go-back-button"
              defaultMessage="Go back"
            />
          </Button>
          <Button width="100%" colorScheme="purple" size="md" fontSize="md" onClick={handleNext}>
            <FormattedMessage
              id="component.public-signup-form-organization.continue-button"
              defaultMessage="Continue"
            />
          </Button>
        </Stack>
      </Stack>
    </>
  );
}

function SelectLogoInput({
  organizationLogo,
  setOrganizationLogo,
}: {
  organizationLogo: Maybe<File> | undefined;
  setOrganizationLogo: (arg0: File) => void;
}) {
  const [isMaxSizeExceeded, setIsMaxSizeExceeded] = useState(false);
  const organizationLogoInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (files: Maybe<FileList>) => {
    const maxSize = 50000; //50 kB
    if (files?.length) {
      if (files[0].size <= maxSize) {
        setOrganizationLogo(files[0] as any);
        setIsMaxSizeExceeded(false);
      } else {
        setIsMaxSizeExceeded(true);
      }
    } else {
      setIsMaxSizeExceeded(false);
    }
  };

  return (
    <FormControl id="organizationLogo">
      <FormLabel marginBottom={3}>
        <FormattedMessage
          id="component.public-signup-form-organization.organizationLogo-label"
          defaultMessage="Logo"
        />
        <Text fontSize="sm" color="gray.600" fontWeight="normal">
          <FormattedMessage
            id="component.public-signup-form-organization.organizationLogo-label-help"
            defaultMessage="Attach an image you want to show in your emails."
          />
        </Text>
      </FormLabel>

      <HStack position="relative">
        <Input
          ref={organizationLogoInputRef}
          position="absolute"
          name="organizationLogo"
          type="file"
          hidden
          onChange={(e) => handleFileChange(e.target.files)}
          accept=".png"
        />
        <Button
          size="sm"
          fontSize="md"
          fontWeight="normal"
          onClick={() => organizationLogoInputRef?.current?.click()}
        >
          {organizationLogo ? (
            <FormattedMessage
              id="component.public-signup-form-organization.upload-other-organizationLogo-button"
              defaultMessage="Upload other logo"
            />
          ) : (
            <FormattedMessage
              id="component.public-signup-form-organization.upload-organizationLogo-button"
              defaultMessage="Upload logo"
            />
          )}
        </Button>
        <Text fontSize="sm" color="gray.600">
          {organizationLogo?.name ? (
            organizationLogo.name
          ) : (
            <FormattedMessage
              id="component.public-signup-form-organization.upload-organizationLogo-text"
              defaultMessage="(PNG file of size up 50kB)"
            />
          )}
        </Text>
      </HStack>
      {isMaxSizeExceeded && (
        <Text fontSize="sm" color="red.600" paddingTop={4}>
          <FormattedMessage
            id="component.public-signup-form-organization.upload-organizationLogo-size-error"
            defaultMessage="File too heavy. Attach a file up to 50kB"
          />
        </Text>
      )}
      {typeof window !== "undefined" && organizationLogo && (
        <Center
          paddingX={6}
          paddingY={2}
          rounded="md"
          border="2px dashed"
          borderColor="gray.200"
          marginTop={4}
          width="fit-content"
        >
          <Image
            maxHeight="140px"
            width="min-content"
            src={URL.createObjectURL(organizationLogo)}
          />
        </Center>
      )}
    </FormControl>
  );
}
