import { Button, FormControl, FormLabel, Input, Stack, Text } from "@chakra-ui/react";
import { useFieldSelectReactSelectProps } from "@parallel/utils/react-select/hooks";
import { useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import Select from "react-select";

export type PublicSignupFormExperienceProps = {
  onBack: () => void;
  onFinish: () => void;
};

export function PublicSignupFormExperience({ onBack, onFinish }: PublicSignupFormExperienceProps) {
  const reactSelectProps = useFieldSelectReactSelectProps({});
  const intl = useIntl();

  const [industry, setIndustry] = useState({
    label: "",
    value: "",
  });

  const [role, setRole] = useState({
    label: "",
    value: "",
  });

  const industryOptions = useMemo(
    () => [
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.industry-advisory",
          defaultMessage: "Advisory",
        }),
        value: "Advisory",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.industry-consulting",
          defaultMessage: "Consulting",
        }),
        value: "Consulting",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.industry-e-commerce",
          defaultMessage: "E-commerce",
        }),
        value: "E-commerce",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.industry-education",
          defaultMessage: "Education",
        }),
        value: "Education",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.industry-entertainment",
          defaultMessage: "Shared",
        }),
        value: "Entertainment",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.industry-financial-services",
          defaultMessage: "Financial Services",
        }),
        value: "Financial Services",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.industry-government",
          defaultMessage: "Government",
        }),
        value: "Government",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.industry-healthcare",
          defaultMessage: "Healthcare",
        }),
        value: "Healthcare",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.industry-legal",
          defaultMessage: "Legal",
        }),
        value: "Legal",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.industry-outsourcing",
          defaultMessage: "Others",
        }),
        value: "Outsourcing",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.industry-real-estate",
          defaultMessage: "Real Estate",
        }),
        value: "Real Estate",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.industry-software",
          defaultMessage: "Software",
        }),
        value: "Software",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.industry-other",
          defaultMessage: "Other",
        }),
        value: "Other",
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
        value: "Administration",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-business-development",
          defaultMessage: "Business development",
        }),
        value: "Business development",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-compliance",
          defaultMessage: "Compliance",
        }),
        value: "Compliance",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-customer-service",
          defaultMessage: "Customer service",
        }),
        value: "Customer service",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-engineering",
          defaultMessage: "Engineering",
        }),
        value: "Engineering",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-finance",
          defaultMessage: "Finance",
        }),
        value: "Finance",
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
        value: "HR",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-it",
          defaultMessage: "IT",
        }),
        value: "IT",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-legal",
          defaultMessage: "Legal",
        }),
        value: "Legal",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-marketing",
          defaultMessage: "Marketing",
        }),
        value: "Marketing",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-operations",
          defaultMessage: "Operations",
        }),
        value: "Operations",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-procurement",
          defaultMessage: "Procurement",
        }),
        value: "Procurement",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-product",
          defaultMessage: "Product",
        }),
        value: "Product",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-sales",
          defaultMessage: "Sales",
        }),
        value: "Sales",
      },
      {
        label: intl.formatMessage({
          id: "component.public-signup-form-experience.role-other",
          defaultMessage: "Other",
        }),
        value: "Other",
      },
    ],
    [intl.locale]
  );

  return (
    <>
      <Text as="span" textStyle="muted" fontSize="sm">
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
            options={industryOptions}
            value={industry}
            isSearchable={true}
            onChange={(selected) => setIndustry(selected)}
            {...reactSelectProps}
          />
        </FormControl>
        <FormControl id="role">
          <FormLabel>
            <FormattedMessage
              id="component.public-signup-form.experience.role-label"
              defaultMessage="Which best describes your role?"
            />
          </FormLabel>
          <Select
            options={roleOptions}
            value={role}
            isSearchable={true}
            onChange={(selected) => setRole(selected)}
            {...reactSelectProps}
          />
        </FormControl>
        <FormControl id="position">
          <FormLabel>
            <FormattedMessage
              id="component.public-signup-form.experience.position-label"
              defaultMessage="And finally, what’s your position?"
            />
          </FormLabel>
          <Input name="position" type="text" placeholder="E.g: Financial Analyst" />
        </FormControl>
        <Stack spacing={4} paddingTop={4} direction={{ base: "column", md: "row" }}>
          <Button width="100%" variant="outline" size="md" fontSize="md" onClick={onBack}>
            <FormattedMessage
              id="component.public-signup-form-experience.go-back-button"
              defaultMessage="Go back"
            />
          </Button>
          <Button width="100%" colorScheme="purple" size="md" fontSize="md" onClick={onFinish}>
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
