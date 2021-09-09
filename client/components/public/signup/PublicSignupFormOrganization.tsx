import {
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
  const [isEmptyOrganizationName, setIsEmptyOrganizationName] = useState(false);

  const [organizationLogo, setOrganizationLogo] = useState<Maybe<File> | undefined>(undefined);

  useEffect(() => {
    if (isEmptyOrganizationName) setIsEmptyOrganizationName(false);
  }, [organizationName]);

  const handleNext = () => {
    if (!organizationName) {
      setIsEmptyOrganizationName(true);
    } else {
      onNext({ organizationName, organizationLogo });
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
        <FormControl id="company-name" isInvalid={isEmptyOrganizationName}>
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
          />
          <FormErrorMessage>
            <FormattedMessage
              id="component.public-signup-form-organization.invalid-company-name-error"
              defaultMessage="Please, enter a company name"
            />
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
  setOrganizationLogo: (arg0: File | undefined) => void;
}) {
  const intl = useIntl();
  const [isMaxSizeExceeded, setIsMaxSizeExceeded] = useState(false);
  const organizationLogoInputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (files: Maybe<FileList>) => {
    const maxSize = 1024 * 50; //50 kB
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

  const handleRemoveLogo = () => {
    setOrganizationLogo(undefined);
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
              defaultMessage="Upload another logo"
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
          position="relative"
        >
          <Image
            maxHeight="140px"
            width="min-content"
            src={URL.createObjectURL(organizationLogo)}
          />
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
            onClick={handleRemoveLogo}
            icon={<CloseIcon />}
          />
        </Center>
      )}
    </FormControl>
  );
}
