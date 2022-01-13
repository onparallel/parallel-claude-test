import {
  Box,
  Button,
  Center,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Select,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useMemo } from "react";
import ReCaptcha from "react-google-recaptcha";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

type PublicSignupFormExperienceData = {
  industry: string | undefined;
  role: string | undefined;
  position: string | undefined;
  captcha: string;
};

export type PublicSignupFormExperienceProps = {
  isLoading: boolean;
  onBack: () => void;
  onFinish: (data: PublicSignupFormExperienceData) => void;
};

export function PublicSignupFormExperience({
  onBack,
  onFinish,
  isLoading,
}: PublicSignupFormExperienceProps) {
  const intl = useIntl();
  const {
    handleSubmit,
    register,
    control,
    watch,
    formState: { errors },
  } = useForm<PublicSignupFormExperienceData>({
    defaultValues: {
      industry: "",
      role: "",
      position: "",
      captcha: undefined,
    },
  });
  const { role, industry } = watch();

  const industryOptions = useMemo(
    () => [
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.industry-advisory",
          defaultMessage: "Advisory",
        }),
        value: "advisory",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.industry-consulting",
          defaultMessage: "Consulting",
        }),
        value: "consulting",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.industry-e-commerce",
          defaultMessage: "E-commerce",
        }),
        value: "e-commerce",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.industry-education",
          defaultMessage: "Education",
        }),
        value: "education",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.industry-entertainment",
          defaultMessage: "Entertainment",
        }),
        value: "entertainment",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.industry-financial-services",
          defaultMessage: "Financial Services",
        }),
        value: "financial-services",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.industry-government",
          defaultMessage: "Government",
        }),
        value: "government",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.industry-healthcare",
          defaultMessage: "Healthcare",
        }),
        value: "healthcare",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.industry-legal",
          defaultMessage: "Legal",
        }),
        value: "legal",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.industry-outsourcing",
          defaultMessage: "Outsourcing",
        }),
        value: "outsourcing",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.industry-real-estate",
          defaultMessage: "Real Estate",
        }),
        value: "real-estate",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.industry-software",
          defaultMessage: "Software",
        }),
        value: "software",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.industry-other",
          defaultMessage: "Other",
        }),
        value: "other",
      },
    ],
    [intl.locale]
  );

  const roleOptions = useMemo(
    () => [
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-administration",
          defaultMessage: "Administration",
        }),
        value: "administration",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-business-development",
          defaultMessage: "Business development",
        }),
        value: "business-development",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-compliance",
          defaultMessage: "Compliance",
        }),
        value: "compliance",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-customer-service",
          defaultMessage: "Customer service",
        }),
        value: "customer-service",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-engineering",
          defaultMessage: "Engineering",
        }),
        value: "engineering",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-finance",
          defaultMessage: "Finance",
        }),
        value: "finance",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-general-management",
          defaultMessage: "General Management",
        }),
        value: "General Management",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-hr",
          defaultMessage: "HR",
        }),
        value: "hr",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-it",
          defaultMessage: "IT",
        }),
        value: "it",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-legal",
          defaultMessage: "Legal",
        }),
        value: "legal",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-marketing",
          defaultMessage: "Marketing",
        }),
        value: "marketing",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-operations",
          defaultMessage: "Operations",
        }),
        value: "operations",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-procurement",
          defaultMessage: "Procurement",
        }),
        value: "procurement",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-product",
          defaultMessage: "Product",
        }),
        value: "product",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-sales",
          defaultMessage: "Sales",
        }),
        value: "sales",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-other",
          defaultMessage: "Other",
        }),
        value: "other",
      },
    ],
    [intl.locale]
  );

  return (
    <Box
      as="form"
      onSubmit={handleSubmit((data) => {
        onFinish({
          industry: data.industry || undefined,
          role: data.role || undefined,
          position: data.position || undefined,
          captcha: data.captcha,
        });
      })}
    >
      <Text color="gray.500" fontSize="sm">
        3/3
      </Text>
      <Stack spacing={4}>
        <Text as="h1" fontSize="2xl" fontWeight="bold" marginTop={0}>
          <FormattedMessage
            id="component.public-signup-form-experience.heading"
            defaultMessage="Help us improve your experience"
          />
        </Text>
        <Text marginBottom={2}>
          <FormattedMessage
            id="component.public-signup-form-experience.description"
            defaultMessage="We will ask you some questions to get to know you better and offer you the best possible experience."
          />
        </Text>
        <FormControl id="industry">
          <FormLabel>
            <FormattedMessage
              id="component.public-signup-form-experience.industry-label"
              defaultMessage="What industry do you work at?"
            />
          </FormLabel>
          <Select
            {...register("industry")}
            placeholder={intl.formatMessage({
              id: "component.public-signup-form-experience.industry-placeholder",
              defaultMessage: "Select an industry",
            })}
            sx={{
              "&": { color: industry === "" ? "gray.400" : "inherit" },
              "& option": { color: "gray.800" },
              "& option[value='']": { color: "gray.400" },
            }}
          >
            {industryOptions.map((industry, index) => (
              <option key={index} value={industry.value}>
                {industry.label}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl id="role">
          <FormLabel>
            <FormattedMessage
              id="component.public-signup-form-experience.role-label"
              defaultMessage="Which best describes your role?"
            />
          </FormLabel>
          <Select
            {...register("role")}
            placeholder={intl.formatMessage({
              id: "component.public-signup-form-experience.role-placeholder",
              defaultMessage: "Select a role",
            })}
            sx={{
              "&": { color: role === "" ? "gray.400" : "inherit" },
              "& option": { color: "gray.800" },
              "& option[value='']": { color: "gray.400" },
            }}
          >
            {roleOptions.map((role, index) => (
              <option key={index} value={role.value}>
                {role.label}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl id="position">
          <FormLabel>
            <FormattedMessage
              id="component.public-signup-form-experience.position-label"
              defaultMessage="And finally, what is your position?"
            />
          </FormLabel>
          <Input
            {...register("position")}
            autoComplete="off"
            placeholder={intl.formatMessage({
              id: "component.public-signup-form.experience.position-placeholder",
              defaultMessage: "E.g., Financial Analyst",
            })}
          />
        </FormControl>
      </Stack>
      <FormControl as={Center} marginTop={8} isInvalid={!!errors.captcha}>
        <Stack>
          <Controller
            name="captcha"
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange } }) => (
              <ReCaptcha
                hl={intl.locale}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                onChange={onChange}
              />
            )}
          />
          <FormErrorMessage>
            <FormattedMessage
              id="component.public-signup-form-experience.captcha-error"
              defaultMessage="Please, complete the captcha"
            />
          </FormErrorMessage>
        </Stack>
      </FormControl>
      <Stack spacing={4} marginTop={8} direction={{ base: "column-reverse", md: "row" }}>
        <Button width="100%" variant="outline" onClick={onBack}>
          <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
        </Button>
        <Button width="100%" colorScheme="purple" type="submit" isLoading={isLoading}>
          <FormattedMessage
            id="component.public-signup-form-experience.complete-button"
            defaultMessage="Complete registration"
          />
        </Button>
      </Stack>
    </Box>
  );
}
