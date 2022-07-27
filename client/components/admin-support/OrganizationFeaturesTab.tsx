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
import { FormEvent, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { equals, isDefined } from "remeda";

export function OrganizationFeaturesTab({
  organization,
}: {
  organization: OrganizationFeaturesTab_OrganizationFragment;
}) {
  const intl = useIntl();
  const [featureFlags, setFeatureFlags] = useState(organization.features);
  const [editedFeatures, setEditedFeatures] = useState<FeatureFlagEntry[]>([]);
  const [featureSearch, setFeatureSearch] = useState("");
  const originalFeatureFlags = useRef(organization.features);

  function handleChangeFeature(name: FeatureFlag, value: boolean) {
    setFeatureFlags((currentFeatures) => {
      return currentFeatures.map((f) => {
        if (f.name === name) {
          return { ...f, value };
        }
        return f;
      });
    });

    const originalFeature = originalFeatureFlags.current.find((f) => f.name === name);
    if (equals({ name: originalFeature?.name, value: originalFeature?.value }, { name, value })) {
      setEditedFeatures((ef) => ef.filter((f) => f.name !== name));
    } else {
      setEditedFeatures((ef) => [...ef, { name, value }]);
    }
  }

  const [updateFeatureFlags, { loading: updatingFeatureFlags }] = useMutation(
    OrganizationFeaturesTab_updateFeatureFlagsDocument
  );

  async function handleSubmitFeatureFlags(event: FormEvent) {
    event.preventDefault();
    try {
      const { data } = await updateFeatureFlags({
        variables: { orgId: organization.id, featureFlags: editedFeatures },
      });

      const featureFlags = data?.updateFeatureFlags.features;
      if (isDefined(featureFlags)) {
        originalFeatureFlags.current = featureFlags;
        setFeatureFlags(featureFlags);
        setEditedFeatures([]);
      }
    } catch {}
  }

  const featureFlagDescriptions = useFeatureFlagDescriptions();

  return (
    <Card maxWidth="container.sm" as="form" onSubmit={handleSubmitFeatureFlags}>
      <CardHeader>
        <FormattedMessage
          id="page.oganizations.features-active"
          defaultMessage="Enabled features"
        />
      </CardHeader>
      <Stack paddingX={6} paddingY={4} spacing={4}>
        <SearchInput
          value={featureSearch ?? ""}
          onChange={(e) => setFeatureSearch(e.target.value)}
        />
        {featureFlags.map(({ name, value }) => {
          const featureName = featureFlagDescriptions[name as FeatureFlag]?.name ?? name;

          const search = featureSearch.toLowerCase().trim();
          if (
            search &&
            !featureName.toLowerCase().includes(search) &&
            !name.toLowerCase().includes(search)
          ) {
            return null;
          }

          const isEdited = editedFeatures.some((f) => f.name === name);

          return (
            <HStack key={name} alignItems="center" justifyContent="space-between">
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
                {isEdited ? (
                  <Badge colorScheme="yellow">
                    <FormattedMessage id="generic.edited-indicator" defaultMessage="Edited" />
                  </Badge>
                ) : null}
                <Switch
                  isChecked={value}
                  onChange={(event) => {
                    handleChangeFeature(name, event.target.checked);
                  }}
                />
              </HStack>
            </HStack>
          );
        })}
        <HStack paddingTop={6} alignSelf="flex-end">
          <Button
            onClick={() => {
              setFeatureFlags(originalFeatureFlags.current);
              setEditedFeatures([]);
            }}
            isDisabled={!editedFeatures.length}
          >
            <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
          </Button>
          <Button
            colorScheme="primary"
            type="submit"
            isDisabled={!editedFeatures.length}
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
