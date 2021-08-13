import {
  Button,
  Center,
  FormControl,
  FormLabel,
  HStack,
  Image,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { Maybe } from "@parallel/utils/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";

export type PublicSignupFormOrganizationProps = {
  onBack: () => void;
  onNext: ({ companyName, logo }: { companyName: string; logo: Maybe<File> }) => void;
};

export function PublicSignupFormOrganization({
  onBack,
  onNext,
}: PublicSignupFormOrganizationProps) {
  const [companyName, setCompanyName] = useState("");
  const [isInvalidCompanyName, setIsInvalidCompanyName] = useState(false);
  const [logo, setLogo] = useState<Maybe<File>>(null);

  useEffect(() => {
    if (isInvalidCompanyName) setIsInvalidCompanyName(false);
  }, [companyName]);

  const handleNext = () => {
    if (!companyName) {
      setIsInvalidCompanyName(true);
    } else {
      onNext({ companyName, logo });
    }
  };

  const MemoizedLogoInput = useMemo(() => {
    return <SelectLogoInput logo={logo} setLogo={setLogo} />;
  }, [logo, setLogo]);

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
        <FormControl id="company-name">
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
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            isInvalid={isInvalidCompanyName}
          />
          {isInvalidCompanyName && (
            <Text fontSize="sm" color="red.600" paddingTop={1}>
              <FormattedMessage
                id="component.public-signup-form-organization.invalid-company-name-error"
                defaultMessage="Please, enter a company name"
              />
            </Text>
          )}
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

function SelectLogoInput({ logo, setLogo }: { logo: Maybe<File>; setLogo: (arg0: File) => void }) {
  const [isMaxSizeExceeded, setIsMaxSizeExceeded] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (files: Maybe<FileList>) => {
    const maxSize = 50000; //50 kB
    if (files?.length) {
      if (files[0].size <= maxSize) {
        setLogo(files[0] as any);
        setIsMaxSizeExceeded(false);
      } else {
        setIsMaxSizeExceeded(true);
      }
    } else {
      setIsMaxSizeExceeded(false);
    }
  };

  return (
    <FormControl id="logo">
      <FormLabel marginBottom={3}>
        <FormattedMessage
          id="component.public-signup-form-organization.logo-label"
          defaultMessage="Logo"
        />
        <Text fontSize="sm" color="gray.600" fontWeight="normal">
          <FormattedMessage
            id="component.public-signup-form-organization.logo-label-help"
            defaultMessage="Attach an image you want to show in your emails."
          />
        </Text>
      </FormLabel>

      <HStack position="relative">
        <Input
          ref={logoInputRef}
          position="absolute"
          name="logo"
          type="file"
          hidden
          onChange={(e) => handleFileChange(e.target.files)}
          accept=".png"
        />
        <Button
          size="sm"
          fontSize="md"
          fontWeight="normal"
          onClick={() => logoInputRef?.current?.click()}
        >
          {logo ? (
            <FormattedMessage
              id="component.public-signup-form-organization.upload-other-logo-button"
              defaultMessage="Upload other logo"
            />
          ) : (
            <FormattedMessage
              id="component.public-signup-form-organization.upload-logo-button"
              defaultMessage="Upload logo"
            />
          )}
        </Button>
        <Text fontSize="sm" color="gray.600">
          {logo?.name ? (
            logo.name
          ) : (
            <FormattedMessage
              id="component.public-signup-form-organization.upload-logo-text"
              defaultMessage="(PNG file of size up 50kB)"
            />
          )}
        </Text>
      </HStack>
      {isMaxSizeExceeded && (
        <Text fontSize="sm" color="red.600" paddingTop={4}>
          <FormattedMessage
            id="component.public-signup-form-organization.upload-logo-size-error"
            defaultMessage="File too heavy. Attach a file up to 50kB"
          />
        </Text>
      )}
      {process.browser && logo && (
        <Center
          paddingX={6}
          paddingY={2}
          rounded="md"
          border="2px dashed"
          borderColor="gray.200"
          marginTop={4}
          width="fit-content"
        >
          <Image maxHeight="140px" width="min-content" src={URL.createObjectURL(logo)} />
        </Center>
      )}
    </FormControl>
  );
}
