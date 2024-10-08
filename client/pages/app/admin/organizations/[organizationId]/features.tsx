import { gql, useMutation } from "@apollo/client";
import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import { AdminOrganizationsLayout } from "@parallel/components/admin-organizations/AdminOrganizationsLayout";
import { Card, CardHeader } from "@parallel/components/common/Card";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { HelpCenterLink } from "@parallel/components/common/HelpCenterLink";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { HighlightText } from "@parallel/components/common/HighlightText";
import { SearchInput } from "@parallel/components/common/SearchInput";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withSuperAdminAccess } from "@parallel/components/common/withSuperAdminAccess";
import {
  AdminOrganizationsFeatures_queryDocument,
  AdminOrganizationsFeatures_updateFeatureFlagsDocument,
  FeatureFlagNameValue,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { UnwrapPromise } from "@parallel/utils/types";
import { useFeatureFlags } from "@parallel/utils/useFeatureFlags";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { isNonNullish, omit } from "remeda";

type AdminOrganizationsFeaturesProps = UnwrapPromise<
  ReturnType<typeof AdminOrganizationsFeatures.getInitialProps>
>;

interface FeaturesFormData {
  features: FeatureFlagNameValue[];
}

function AdminOrganizationsFeatures({ organizationId }: AdminOrganizationsFeaturesProps) {
  const { data: queryObject } = useAssertQuery(AdminOrganizationsFeatures_queryDocument, {
    variables: { id: organizationId },
  });
  const organization = queryObject.organization!;

  const [search, setSearch] = useState("");

  const { register, control, handleSubmit, reset, formState } = useForm<FeaturesFormData>({
    defaultValues: {
      features: organization.features.map(omit(["__typename"])),
    },
  });

  const { fields } = useFieldArray({ name: "features", control });

  const [updateFeatureFlags] = useMutation(AdminOrganizationsFeatures_updateFeatureFlagsDocument);
  async function handleSubmitFeatureFlags(formData: FeaturesFormData) {
    try {
      const { data } = await updateFeatureFlags({
        variables: {
          orgId: organization.id,
          featureFlags: formData.features.filter(
            (_, i) => formState.dirtyFields.features?.[i]?.value,
          ),
        },
      });
      reset({ features: data!.updateFeatureFlags.features.map(omit(["__typename"])) });
    } catch {}
  }

  const featureFlagsCategories = useFeatureFlags();

  return (
    <AdminOrganizationsLayout
      currentTabKey="features"
      queryObject={queryObject}
      organization={organization}
    >
      <Box padding={4}>
        <Card maxWidth="container.sm" as="form" onSubmit={handleSubmit(handleSubmitFeatureFlags)}>
          <CardHeader>
            <FormattedMessage
              id="page.organizations.features-active"
              defaultMessage="Enabled features"
            />
          </CardHeader>
          <Stack paddingX={6} paddingY={4} spacing={4}>
            <SearchInput value={search ?? ""} onChange={(e) => setSearch(e.target.value)} />
            {featureFlagsCategories
              .filter(({ featureFlags }) => {
                const _search = search.toLowerCase().trim();
                return featureFlags.some(
                  ({ name, title }) =>
                    name.toLowerCase().includes(_search) || title.toLowerCase().includes(_search),
                );
              })
              .map(({ category, featureFlags }) => {
                return (
                  <Stack key={category}>
                    <Text fontWeight={500}>{category}</Text>
                    {featureFlags.map(({ name, title, description, articleId, disabled }) => {
                      const index = fields.findIndex((f) => f.name === name)!;
                      return (
                        <FormControl key={fields[index].id} as={HStack} alignItems="center">
                          <Flex flex={1} alignItems="center">
                            <FormLabel margin={0} fontWeight={400} marginStart={2}>
                              <HighlightText as="span" search={search}>
                                {title}
                              </HighlightText>
                            </FormLabel>
                            <HelpPopover popoverWidth="xs">
                              <Text fontSize="sm">{description}</Text>
                              {isNonNullish(articleId) ? (
                                <HelpCenterLink articleId={articleId} width="fit-content">
                                  <FormattedMessage
                                    id="generic.help-center-article"
                                    defaultMessage="Help center article"
                                  />
                                </HelpCenterLink>
                              ) : null}
                            </HelpPopover>
                          </Flex>
                          <HStack alignItems="center">
                            {formState.dirtyFields?.features?.[index]?.value ? (
                              <Badge colorScheme="yellow">
                                <FormattedMessage
                                  id="generic.edited-indicator"
                                  defaultMessage="Edited"
                                />
                              </Badge>
                            ) : null}
                            <Switch
                              {...register(`features.${index}.value`)}
                              isDisabled={disabled}
                            />
                          </HStack>
                        </FormControl>
                      );
                    })}
                  </Stack>
                );
              })}

            <HStack paddingTop={6} alignSelf="flex-end">
              <Button
                onClick={() => reset({ features: organization.features })}
                isDisabled={!formState.isDirty}
              >
                <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
              </Button>
              <Button colorScheme="primary" type="submit" isDisabled={!formState.isDirty}>
                <FormattedMessage id="generic.save-changes" defaultMessage="Save changes" />
              </Button>
            </HStack>
          </Stack>
        </Card>
      </Box>
    </AdminOrganizationsLayout>
  );
}

AdminOrganizationsFeatures.fragments = {
  get Organization() {
    return gql`
      fragment AdminOrganizationsFeatures_Organization on Organization {
        id
        features {
          name
          value
        }
        ...AdminOrganizationsLayout_Organization
      }
      ${AdminOrganizationsLayout.fragments.Organization}
    `;
  },
};

const _queries = [
  gql`
    query AdminOrganizationsFeatures_query($id: GID!) {
      ...AdminOrganizationsLayout_Query
      organization(id: $id) {
        ...AdminOrganizationsFeatures_Organization
      }
    }
    ${AdminOrganizationsLayout.fragments.Query}
    ${AdminOrganizationsFeatures.fragments.Organization}
  `,
];

const _mutations = [
  gql`
    mutation AdminOrganizationsFeatures_updateFeatureFlags(
      $orgId: GID!
      $featureFlags: [InputFeatureFlagNameValue!]!
    ) {
      updateFeatureFlags(orgId: $orgId, featureFlags: $featureFlags) {
        ...AdminOrganizationsFeatures_Organization
      }
    }
    ${AdminOrganizationsFeatures.fragments.Organization}
  `,
];

AdminOrganizationsFeatures.getInitialProps = async ({
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  await fetchQuery(AdminOrganizationsFeatures_queryDocument, {
    variables: { id: query.organizationId as string },
  });
  return { organizationId: query.organizationId as string };
};

export default compose(
  withSuperAdminAccess,
  withDialogs,
  withApolloData,
)(AdminOrganizationsFeatures);
