import { gql, useMutation } from "@apollo/client";
import { Badge, Button, Divider, Flex, HStack, Stack, Switch, Text } from "@chakra-ui/react";
import { Card, CardHeader } from "@parallel/components/common/Card";
import { HelpCenterLink } from "@parallel/components/common/HelpCenterLink";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { SearchInput } from "@parallel/components/common/SearchInput";
import {
  FeatureFlag,
  FeatureFlagEntry,
  OrganizationFeaturesTab_OrganizationFragment,
  OrganizationFeaturesTab_updateFeatureFlagsDocument,
} from "@parallel/graphql/__types";
import { useFeatureFlagDescriptions } from "@parallel/utils/useFeatureFlagDescriptions";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, omit } from "remeda";

type FeaturesFormData = {
  features: FeatureFlagEntry[];
};

export function OrganizationFeaturesTab({
  organization,
}: {
  organization: OrganizationFeaturesTab_OrganizationFragment;
}) {
  const intl = useIntl();

  const [search, setSearch] = useState("");

  const {
    register,
    control,
    handleSubmit,
    reset,
    getFieldState,
    formState: { dirtyFields },
  } = useForm<FeaturesFormData>({
    defaultValues: {
      features: organization.features,
    },
    mode: "onSubmit",
  });

  const { fields } = useFieldArray({
    name: "features",
    control,
  });

  const [updateFeatureFlags, { loading: updatingFeatureFlags }] = useMutation(
    OrganizationFeaturesTab_updateFeatureFlagsDocument
  );

  async function handleSubmitFeatureFlags(formData: FeaturesFormData) {
    try {
      const dirtyFeatures = [] as FeatureFlagEntry[];
      formData?.features?.forEach((feature, index) => {
        const { isDirty } = getFieldState(`features.${index}.value`);
        if (isDirty) {
          dirtyFeatures.push(omit(feature, ["__typename"]));
        }
      });
      const { data } = await updateFeatureFlags({
        variables: { orgId: organization.id, featureFlags: dirtyFeatures },
      });

      const featureFlags = data?.updateFeatureFlags.features;
      if (isDefined(featureFlags)) {
        reset({
          features: featureFlags,
        });
      }
    } catch {}
  }

  const featureFlagDescriptions = useFeatureFlagDescriptions();

  return (
    <Card maxWidth="container.sm" as="form" onSubmit={handleSubmit(handleSubmitFeatureFlags)}>
      <CardHeader>
        <FormattedMessage
          id="page.oganizations.features-active"
          defaultMessage="Enabled features"
        />
      </CardHeader>
      <Stack paddingX={6} paddingY={4} spacing={4}>
        <SearchInput value={search ?? ""} onChange={(e) => setSearch(e.target.value)} />
        {fields.map((field, index) => {
          const { name } = field;

          const featureName = featureFlagDescriptions[name as FeatureFlag]?.name ?? name;

          const _search = search.toLowerCase().trim();
          if (
            _search &&
            !featureName.toLowerCase().includes(_search) &&
            !name.toLowerCase().includes(_search)
          ) {
            return null;
          }

          return (
            <HStack key={field.id} alignItems="center" justifyContent="space-between">
              <Flex alignItems="center">
                <Text as="span">{featureName}</Text>

                <HelpPopover popoverWidth="sm">
                  <Stack>
                    <Text fontSize="xs">{name}</Text>
                    <Divider />
                    <Text fontSize="sm">
                      {featureFlagDescriptions[name as FeatureFlag]?.description ??
                        intl.formatMessage({
                          id: "generic.no-description",
                          defaultMessage: "No description",
                        })}
                    </Text>

                    {isDefined(featureFlagDescriptions[name as FeatureFlag]?.articleId) ? (
                      <HelpCenterLink
                        articleId={featureFlagDescriptions[name as FeatureFlag]!.articleId!}
                        width="fit-content"
                      >
                        <FormattedMessage id="generic.help" defaultMessage="Help" />
                      </HelpCenterLink>
                    ) : null}
                  </Stack>
                </HelpPopover>
              </Flex>
              <HStack alignItems="center">
                {dirtyFields?.features?.[index]?.value ? (
                  <Badge colorScheme="yellow">
                    <FormattedMessage id="generic.edited-indicator" defaultMessage="Edited" />
                  </Badge>
                ) : null}
                <Switch {...register(`features.${index}.value`)} />
              </HStack>
            </HStack>
          );
        })}
        <HStack paddingTop={6} alignSelf="flex-end">
          <Button
            onClick={() => {
              reset({
                features: organization.features,
              });
            }}
            isDisabled={!dirtyFields?.features?.length}
          >
            <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
          </Button>
          <Button
            colorScheme="primary"
            type="submit"
            isDisabled={!dirtyFields?.features?.length}
            isLoading={updatingFeatureFlags}
          >
            <FormattedMessage id="generic.save-changes" defaultMessage="Save changes" />
          </Button>
        </HStack>
      </Stack>
    </Card>
  );
}

OrganizationFeaturesTab.fragments = {
  get Organization() {
    return gql`
      fragment OrganizationFeaturesTab_Organization on Organization {
        id
        features {
          name
          value
        }
      }
    `;
  },
};

OrganizationFeaturesTab.mutations = [
  gql`
    mutation OrganizationFeaturesTab_updateFeatureFlags(
      $orgId: GID!
      $featureFlags: [InputFeatureFlag!]!
    ) {
      updateFeatureFlags(orgId: $orgId, featureFlags: $featureFlags) {
        ...OrganizationFeaturesTab_Organization
      }
    }
    ${OrganizationFeaturesTab.fragments.Organization}
  `,
];
