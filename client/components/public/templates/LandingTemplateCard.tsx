import { gql } from "@apollo/client";
import { Center, Image, LinkBox, LinkOverlay, Stack, Text } from "@chakra-ui/react";
import { NakedLink } from "@parallel/components/common/Link";
import { LandingTemplateCard_LandingTemplateFragment } from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { Card } from "../../common/Card";

export interface LandingTemplateCardProps {
  template: LandingTemplateCard_LandingTemplateFragment;
}

export function LandingTemplateCard({ template }: LandingTemplateCardProps) {
  const intl = useIntl();

  const { name, slug, locale, imageUrl, backgroundColor, ownerFullName, organizationName } =
    template;

  return (
    <LinkBox as={Card} outline="none" isInteractive cursor="pointer" overflow="hidden">
      <Stack spacing={0}>
        <Center height="130px" padding={5} backgroundColor={backgroundColor ?? "gray.200"}>
          <Image
            loading="lazy"
            width="100%"
            height="100%"
            objectFit="contain"
            alt={intl.formatMessage({
              id: "public.template-card.image-alt",
              defaultMessage: "Example of question you will find in this template.",
            })}
            src={
              imageUrl ??
              `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/templates/${intl.locale}_radio_button.png`
            }
          />
        </Center>
        <Stack padding={4} gap={2}>
          <NakedLink locale={locale} passHref href={`/templates/${slug}`}>
            <LinkOverlay display="block" height="72px" fontWeight="semibold" noOfLines={3}>
              {name}
            </LinkOverlay>
          </NakedLink>
          <Text color="gray.600" fontSize="sm">
            <FormattedMessage
              id="public.template-card.created-by"
              defaultMessage="Created by {name} on {orgName}"
              values={{
                name: ownerFullName,
                orgName: <Text as="b">{organizationName}</Text>,
              }}
            />
          </Text>
        </Stack>
      </Stack>
    </LinkBox>
  );
}

LandingTemplateCard.fragments = {
  LandingTemplate: gql`
    fragment LandingTemplateCard_LandingTemplate on LandingTemplate {
      id
      locale
      name
      slug
      imageUrl(small: true)
      backgroundColor
      ownerFullName
      organizationName
    }
  `,
};
