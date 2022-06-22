import {
  Box,
  Button,
  Center,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  IconButton,
  Image,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { CloseIcon } from "@parallel/chakra/icons";
import { fileSize } from "@parallel/components/common/FileSize";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { Maybe } from "@parallel/utils/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

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
  const [isInvalid, setIsInvalid] = useState(false);

  const [organizationLogo, setOrganizationLogo] = useState<Maybe<File>>(null);

  useEffect(() => {
    if (isInvalid) setIsInvalid(false);
  }, [organizationName]);

  const handleNext = () => {
    if (!organizationName) {
      setIsInvalid(true);
    } else {
      onNext({ organizationName, organizationLogo });
    }
  };

  return (
    <Box>
      <Text color="gray.500" fontSize="sm">
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
            defaultMessage="Fill out your organization's profile that your customers will see in your communications."
          />
        </Text>
        <FormControl id="company-name" isInvalid={isInvalid}>
          <FormLabel>
            <FormattedMessage
              id="component.public-signup-form-organization.company-name-label"
              defaultMessage="Company name*"
            />
            <HelpPopover>
              <FormattedMessage
                id="component.public-signup-form-organization.company-name-description"
                defaultMessage="This is the name that will appear in your petitions, so make sure it is the one your customers will recognize."
              />
            </HelpPopover>
          </FormLabel>
          <Input
            name="company-name"
            autoComplete="off"
            autoFocus
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
          />
          <FormErrorMessage>
            <FormattedMessage
              id="component.public-signup-form-organization.invalid-company-name-error"
              defaultMessage="Please, enter a company name"
            />
          </FormErrorMessage>
        </FormControl>
        <SelectLogoInput logo={organizationLogo} onChangeLogo={setOrganizationLogo} />
      </Stack>
      <Stack spacing={4} marginTop={8} direction={{ base: "column-reverse", md: "row" }}>
        <Button width="100%" variant="outline" onClick={onBack}>
          <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
        </Button>
        <Button width="100%" colorScheme="primary" onClick={handleNext}>
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      </Stack>
    </Box>
  );
}

function SelectLogoInput({
  logo,
  onChangeLogo: onChangeLogo,
}: {
  logo: Maybe<File> | undefined;
  onChangeLogo: (file: File | null) => void;
}) {
  const intl = useIntl();

  const maxSize = 1024 * 1024;

  const [isMaxSizeExceeded, setIsMaxSizeExceeded] = useState(false);
  const organizationLogoInputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (files: Maybe<FileList>) => {
    if (files?.length) {
      if (files[0].size <= maxSize) {
        onChangeLogo(files[0]);
        setIsMaxSizeExceeded(false);
      } else {
        setIsMaxSizeExceeded(true);
      }
    } else {
      setIsMaxSizeExceeded(false);
    }
  };

  const objectUrl = useMemo(() => {
    return logo ? URL.createObjectURL(logo) : null;
  }, [logo]);

  return (
    <FormControl id="organizationLogo">
      <FormLabel marginBottom={3}>
        <FormattedMessage
          id="component.public-signup-form-organization.organization-logo-label"
          defaultMessage="Logo"
        />
        <Text fontSize="sm" color="gray.600" fontWeight="normal">
          <FormattedMessage
            id="component.public-signup-form-organization.organization-logo-label-help"
            defaultMessage="Attach an image you want to show in your emails."
          />
        </Text>
      </FormLabel>

      <HStack position="relative">
        <Input
          ref={organizationLogoInputRef}
          position="absolute"
          width="100%"
          height="100%"
          opacity={0}
          name="organizationLogo"
          type="file"
          onChange={(e) => handleFileChange(e.target.files)}
          accept=".png"
        />
        <Button
          size="sm"
          fontSize="md"
          fontWeight="normal"
          onClick={() => organizationLogoInputRef?.current?.click()}
        >
          {logo ? (
            <FormattedMessage
              id="component.public-signup-form-organization.upload-other-organization-logo-button"
              defaultMessage="Upload another logo"
            />
          ) : (
            <FormattedMessage
              id="component.public-signup-form-organization.upload-organization-logo-button"
              defaultMessage="Upload logo"
            />
          )}
        </Button>
        <Text fontSize="sm" color="gray.600">
          {logo?.name ? (
            logo.name
          ) : (
            <FormattedMessage
              id="component.public-signup-form-organization.upload-organization-logo-text"
              defaultMessage="Maximum image size: {size}"
              values={{
                size: fileSize(intl, maxSize),
              }}
            />
          )}
        </Text>
      </HStack>
      {isMaxSizeExceeded && (
        <Text fontSize="sm" color="red.600" paddingTop={4}>
          <FormattedMessage
            id="component.public-signup-form-organization.upload-organization-logo-size-error"
            defaultMessage="File too heavy. Attach a file up to {size}"
            values={{
              size: fileSize(intl, maxSize),
            }}
          />
        </Text>
      )}
      {logo && (
        <Center
          paddingX={6}
          paddingY={2}
          rounded="md"
          border="2px dashed"
          borderColor="gray.200"
          marginTop={4}
          width="fit-content"
          position="relative"
        >
          <Image maxHeight="140px" width="min-content" src={objectUrl!} />
          <IconButton
            pos="absolute"
            size="sm"
            variant="outline"
            backgroundColor="white"
            rounded="full"
            top="-1rem"
            right="-1rem"
            fontSize="0.75rem"
            aria-label={intl.formatMessage({
              id: "component.public-signup-form-organization.remove-image",
              defaultMessage: "Remove image",
            })}
            onClick={() => onChangeLogo(null)}
            icon={<CloseIcon />}
          />
        </Center>
      )}
    </FormControl>
  );
}
