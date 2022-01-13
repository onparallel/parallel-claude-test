import { Button, FormControl, FormLabel, Input, Select, Stack, Text } from "@chakra-ui/react";
import { Maybe } from "@parallel/utils/types";
import { useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

export type PublicSignupFormExperienceProps = {
  isLoading: boolean;
  onBack: () => void;
  onFinish: ({
    industry,
    role,
    position,
  }: {
    industry?: Maybe<string> | undefined;
    role?: Maybe<string> | undefined;
    position?: Maybe<string> | undefined;
  }) => void;
};

export function PublicSignupFormExperience({
  onBack,
  onFinish,
  isLoading,
}: PublicSignupFormExperienceProps) {
  const intl = useIntl();
  const [industry, setIndustry] = useState("");
  const [role, setRole] = useState("");
  const [position, setPosition] = useState("");

  const handleComplete = () => {
    onFinish({
      industry: industry || undefined,
      role: role || undefined,
      position: position || undefined,
    });
  };

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
    <>
      <Text as="span" color="gray.500" fontSize="sm">
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
              id="component.public-signup-form.experience.industry-label"
              defaultMessage="What industry do you work at?"
            />
          </FormLabel>
          <Select
            onChange={(e) => setIndustry(e.target.value)}
            placeholder={intl.formatMessage({
              id: "component.public-signup-form.experience.industry-placeholder",
              defaultMessage: "Select an industry",
            })}
            sx={{
              "&": {
                color: industry === "" ? "gray.400" : "inherit",
              },
              "& option": { color: "gray.800" },
              "& option[value='']": { color: "gray.400" },
            }}
            iconColor="gray.800"
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
              id="component.public-signup-form.experience.role-label"
              defaultMessage="Which best describes your role?"
            />
          </FormLabel>
          <Select
            onChange={(e) => setRole(e.target.value)}
            placeholder={intl.formatMessage({
              id: "component.public-signup-form.experience.role-placeholder",
              defaultMessage: "Select a role",
            })}
            sx={{
              "&": {
                color: role === "" ? "gray.400" : "inherit",
              },
              "& option": { color: "gray.800" },
              "& option[value='']": { color: "gray.400" },
            }}
            iconColor="gray.800"
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
              id="component.public-signup-form.experience.position-label"
              defaultMessage="And finally, what’s your position?"
            />
          </FormLabel>
          <Input
            name="position"
            autoComplete="off"
            type="text"
            placeholder={intl.formatMessage({
              id: "component.public-signup-form.experience.position-placeholder",
              defaultMessage: "E.g., Financial Analyst",
            })}
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
        </FormControl>
        <Stack spacing={4} paddingTop={4} direction={{ base: "column-reverse", md: "row" }}>
          <Button width="100%" variant="outline" size="md" fontSize="md" onClick={onBack}>
            <FormattedMessage
              id="component.public-signup-form-experience.go-back-button"
              defaultMessage="Go back"
            />
          </Button>
          <Button
            width="100%"
            colorScheme="purple"
            size="md"
            fontSize="md"
            onClick={handleComplete}
            isLoading={isLoading}
          >
            <FormattedMessage
              id="component.public-signup-form-experience.complete-button"
              defaultMessage="Complete registration"
            />
          </Button>
        </Stack>
      </Stack>
    </>
  );
}
