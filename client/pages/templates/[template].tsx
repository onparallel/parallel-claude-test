import { gql } from "@apollo/client";
import {
  Box,
  Button,
  Center,
  Grid,
  Heading,
  HStack,
  Image,
  ListItem,
  OrderedList,
  Stack,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import { DateTime } from "@parallel/components/common/DateTime";
import { HtmlBlock } from "@parallel/components/common/HtmlBlock";
import { Link, NakedLink } from "@parallel/components/common/Link";
import { PaddedCollapse } from "@parallel/components/common/PaddedCollapse";
import { Spacer } from "@parallel/components/common/Spacer";
import { UserAvatar } from "@parallel/components/common/UserAvatar";
import { PetitionFieldTitleContent } from "@parallel/components/petition-common/dialogs/TemplateDetailsModal";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { LandingTemplateCard } from "@parallel/components/public/templates/LandingTemplateCard";
import {
  LandingTemplateCard_LandingTemplateFragment,
  LandingTemplateDetails_landingTemplateBySlugDocument,
  LandingTemplateDetails_LandingTemplateFragment,
  LandingTemplateDetails_landingTemplatesDocument,
  PetitionLocale,
} from "@parallel/graphql/__types";
import { createApolloClient } from "@parallel/utils/apollo/client";
import { FORMATS } from "@parallel/utils/dates";
import { EnumerateList } from "@parallel/utils/EnumerateList";
import { useFieldsWithIndices } from "@parallel/utils/fieldIndices";
import { usePublicTemplateCategories } from "@parallel/utils/usePublicTemplateCategories";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { Fragment, useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, zip } from "remeda";
import { assert } from "ts-essentials";

function LandingTemplateDetails({
  template,
  relatedTemplates,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const intl = useIntl();

  const {
    slug,
    name,
    imageUrl,
    backgroundColor,
    ownerFullName,
    ownerAvatarUrl,
    organizationName,
    fieldCount,
    hasConditionals,
    descriptionHtml,
    shortDescription,
    updatedAt,
    fields,
  } = template!;

  const [showFields, setShowFields] = useState(false);
  const handleToggle = () => setShowFields(!showFields);

  useEffect(() => {
    setShowFields(false);
  }, [slug]);

  const categoryList = usePublicTemplateCategories();
  const categories = (template.categories ?? [])
    .map((c) => categoryList.find((category) => category.slug === c))
    .filter(isNonNullish);

  const owner = { fullName: ownerFullName, avatarUrl: ownerAvatarUrl };

  const fieldsWithIndices = useFieldsWithIndices(
    useMemo(
      () => ({
        ...template,
        fields: template.fields.filter((field) =>
          field.type === "HEADING" && !field.title ? false : true,
        ),
      }),
      [template],
    ),
  );

  function handleClickPreview() {
    window.analytics?.track("Preview Template Clicked", {
      templateId: template.id,
      url: template.publicLinkUrl!,
    });
  }

  return (
    <PublicLayout
      title={name as string}
      description={shortDescription as string}
      og={{ image: template.imageUrl }}
      canonicalLocale={template.locale}
    >
      <PublicContainer
        maxWidth="container.xl"
        wrapper={{
          paddingY: 16,
          backgroundColor: "gray.50",
        }}
      >
        <Stack spacing={{ base: 20, md: 28 }}>
          <Stack spacing={12} direction={{ base: "column", md: "row" }}>
            <Grid templateRows="auto 1fr auto" width="100%" flex="1" gap={1}>
              <Text fontSize="sm" color="gray.600">
                <FormattedMessage
                  id="public.template-details.last-updated-on"
                  defaultMessage="Last updated on {date}"
                  values={{
                    date: (
                      <DateTime
                        value={updatedAt}
                        format={FORMATS.LL}
                        title={intl.formatDate(updatedAt, FORMATS.LLL)}
                      />
                    ),
                  }}
                />
              </Text>
              <Stack spacing={4}>
                <Heading size="xl" as="h1">
                  {name}
                </Heading>
                <Text fontSize="lg">
                  <FormattedMessage
                    id="public.template-details.designed-for"
                    defaultMessage="Designed for {categories}"
                    values={{
                      categories: (
                        <EnumerateList
                          maxItems={7}
                          values={categories}
                          renderItem={({ value }) => (
                            <Link
                              key={value.slug}
                              locale={template.locale}
                              href={`/templates/categories/${value.slug}`}
                            >
                              {`${value.label}`}
                            </Link>
                          )}
                          type="conjunction"
                        />
                      ),
                    }}
                  />
                </Text>
                <HStack paddingTop={4}>
                  {/* <NakedLink href="/signup">
                    <Button as="a" colorScheme="primary">
                      <FormattedMessage
                        id="public.try-for-free-button"
                        defaultMessage="Try for free"
                      />
                    </Button>
                  </NakedLink> */}
                  {template.publicLinkUrl ? (
                    <NakedLink href={template.publicLinkUrl}>
                      <Button as="a" variant="outline" target="_blank" onClick={handleClickPreview}>
                        <FormattedMessage id="public.preview-button" defaultMessage="Preview" />
                      </Button>
                    </NakedLink>
                  ) : null}
                </HStack>
                <Spacer />
                <HStack spacing={2}>
                  <UserAvatar showImage boxSize="40px" user={owner} />
                  <Text>
                    <FormattedMessage
                      id="public.template-card.created-by"
                      defaultMessage="Created by {name} on {orgName}"
                      values={{
                        name: ownerFullName,
                        orgName: <Text as="strong">{organizationName}</Text>,
                      }}
                    />
                  </Text>
                </HStack>
              </Stack>
            </Grid>
            <Center
              height="min-content"
              backgroundColor={backgroundColor ?? "gray.100"}
              flex="1"
              padding={8}
            >
              <Image
                width="100%"
                height="100%"
                objectFit="contain"
                maxHeight="225px"
                alt={intl.formatMessage({
                  id: "component.public-template-card.image-alt",
                  defaultMessage: "Example of question you will find in this template.",
                })}
                src={
                  imageUrl ??
                  `${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/templates/${intl.locale}_radio_button.png`
                }
              />
            </Center>
          </Stack>
          <Stack spacing={20} direction={{ base: "column", md: "row" }}>
            <Box
              borderRadius="lg"
              backgroundColor="gray.75"
              paddingX={6}
              paddingY={8}
              height="min-content"
            >
              <Text fontSize="xl" fontWeight="bold">
                <FormattedMessage
                  id="public.template-details.list-includes"
                  defaultMessage="This template includes"
                />
              </Text>
              <UnorderedList paddingX={3} spacing={2} paddingTop={5}>
                <ListItem>
                  <FormattedMessage
                    id="public.template-details.list-number-fields"
                    defaultMessage="{count} question fields"
                    values={{ count: fieldCount }}
                  />
                </ListItem>
                {hasConditionals ? (
                  <ListItem>
                    <FormattedMessage
                      id="public.template-details.conditional-fields"
                      defaultMessage="Conditional fields"
                    />
                  </ListItem>
                ) : null}
                <ListItem>
                  <FormattedMessage
                    id="public.template-details.possibility-esignature"
                    defaultMessage="Possibility to enable eSignature"
                  />
                </ListItem>
                <ListItem>
                  <FormattedMessage
                    id="public.template-details.personalized-message"
                    defaultMessage="Personalized message"
                  />
                </ListItem>
              </UnorderedList>
            </Box>
            <Stack flex="1" spacing={2}>
              <Text fontSize="x-large" fontWeight="bold" paddingBottom={4}>
                <FormattedMessage
                  id="component.template-details-modal.about"
                  defaultMessage="About this template"
                />
              </Text>
              {descriptionHtml ? (
                <HtmlBlock dangerousInnerHtml={descriptionHtml} />
              ) : (
                <Text textStyle="hint">
                  <FormattedMessage
                    id="component.template-details-modal.no-description-provided"
                    defaultMessage="No description provided."
                  />
                </Text>
              )}
              <Heading size="md" paddingTop={8} paddingBottom={4}>
                <FormattedMessage
                  id="component.template-details-modal.fields-list"
                  defaultMessage="Information list"
                />
              </Heading>
              <PaddedCollapse
                startingHeight={"300px"}
                open={fields.length <= 10 ? true : showFields}
              >
                <OrderedList>
                  {fieldsWithIndices.map(([field, fieldIndex, childrenFieldIndices]) => {
                    if (field.type === "HEADING") {
                      if (!field.title) {
                        return null;
                      } else {
                        return (
                          <Text key={field.id} fontWeight="bold" marginBottom={2}>
                            {fieldIndex}.{" "}
                            <Text as="span" fontWeight="bold">
                              {field.title}
                            </Text>
                          </Text>
                        );
                      }
                    }
                    return (
                      <Fragment key={field.id}>
                        <PetitionFieldTitleContent
                          field={field}
                          index={fieldIndex}
                          marginStart={4}
                          marginBottom={2}
                        />
                        {field.type === "FIELD_GROUP" && field.children?.length
                          ? zip(field.children!, childrenFieldIndices!).map(
                              ([field, fieldIndex]) => (
                                <PetitionFieldTitleContent
                                  key={field.id}
                                  field={field}
                                  index={fieldIndex}
                                  marginStart={7}
                                  marginBottom={2}
                                />
                              ),
                            )
                          : null}
                      </Fragment>
                    );
                  })}
                </OrderedList>
              </PaddedCollapse>
              {fields.length > 10 ? (
                <Box
                  paddingTop={4}
                  paddingStart={4}
                  sx={{
                    boxShadow: showFields ? undefined : "0px -23px 50px 45px #fff",
                  }}
                >
                  <Button size="sm" onClick={handleToggle} variant="outline">
                    <FormattedMessage
                      id="generic.show-more-less"
                      defaultMessage="Show {more, select, true {more} other {less}}"
                      values={{ more: !showFields }}
                    />
                  </Button>
                </Box>
              ) : null}
            </Stack>
          </Stack>
          <Stack spacing={12}>
            <Text fontSize="x-large" fontWeight="bold" textAlign={{ base: "left", md: "center" }}>
              <FormattedMessage
                id="public.template-details.other-similar-templates"
                defaultMessage="Other similar templates"
              />
            </Text>

            <Grid
              templateColumns={{
                lg: "repeat(2, 1fr)",
                xl: "repeat(3, 1fr)",
              }}
              gap={6}
            >
              {relatedTemplates
                .filter((t) => t.slug !== slug)
                .slice(0, 3)
                .map((t) => (
                  <LandingTemplateCard key={t.id} template={t} />
                ))}
            </Grid>
          </Stack>
        </Stack>
      </PublicContainer>
    </PublicLayout>
  );
}

const _fragments = {
  LandingTemplate: gql`
    fragment LandingTemplateDetails_LandingTemplate on LandingTemplate {
      id
      name
      slug
      locale
      imageUrl
      backgroundColor
      categories
      ownerFullName
      ownerAvatarUrl
      organizationName
      fieldCount
      hasConditionals
      descriptionHtml
      shortDescription
      updatedAt
      publicLinkUrl
      fields {
        id
        type
        title
        ...PetitionFieldTitleContent_LandingTemplateField
        children {
          type
          ...PetitionFieldTitleContent_LandingTemplateField
        }
      }
      ...useFieldsWithIndices_LandingTemplate
    }
  `,
};

LandingTemplateDetails.queries = [
  gql`
    query LandingTemplateDetails_landingTemplateBySlug($slug: String!) {
      landingTemplateBySlug(slug: $slug) {
        ...LandingTemplateDetails_LandingTemplate
      }
    }
  `,
  gql`
    query LandingTemplateDetails_landingTemplates(
      $offset: Int!
      $limit: Int!
      $locale: PetitionLocale!
      $categories: [String!]
    ) {
      landingTemplates(offset: $offset, limit: $limit, locale: $locale, categories: $categories) {
        items {
          ...LandingTemplateCard_LandingTemplate
        }
        totalCount
      }
    }
  `,
];

export const getServerSideProps: GetServerSideProps<{
  template: LandingTemplateDetails_LandingTemplateFragment;
  relatedTemplates: LandingTemplateCard_LandingTemplateFragment[];
}> = async function getServerSideProps({ req, ...ctx }) {
  const slug = ctx.query.template as string;
  const locale = ctx.locale as PetitionLocale;
  if (slug.includes("_")) {
    return {
      redirect: {
        destination: `/${locale}/templates/${slug.replaceAll("_", "-")}`,
        permanent: true,
      },
    };
  }
  try {
    const client = createApolloClient({}, { req });

    const { data: templateData } = await client.query({
      query: LandingTemplateDetails_landingTemplateBySlugDocument,
      variables: { slug },
    });

    assert(
      isNonNullish(templateData),
      "Result data in LandingTemplateDetails_landingTemplateBySlugDocument is missing",
    );

    if (!templateData?.landingTemplateBySlug) {
      throw new Error();
    }

    const categories = templateData.landingTemplateBySlug.categories;

    const { data } = await client.query({
      query: LandingTemplateDetails_landingTemplatesDocument,
      variables: { offset: 0, limit: 4, locale, categories },
    });

    assert(
      isNonNullish(data),
      "Result data in LandingTemplateDetails_landingTemplatesDocument is missing",
    );

    return {
      props: {
        template: templateData.landingTemplateBySlug,
        relatedTemplates: data.landingTemplates.items,
      },
    };
  } catch (err) {
    return { notFound: true };
  }
};

export default LandingTemplateDetails;
