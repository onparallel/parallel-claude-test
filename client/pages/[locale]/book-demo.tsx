import {
  Box,
  Heading,
  Image,
  List,
  ListItem,
  Stack,
  Text,
} from "@chakra-ui/core";
import { Card } from "@parallel/components/common/Card";
import { Link } from "@parallel/components/common/Link";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import languages from "@parallel/lang/languages.json";
import { useHubspotForm } from "@parallel/utils/useHubspotForm";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";

function BookDemo() {
  const intl = useIntl();
  const { query } = useRouter();
  useHubspotForm(
    query.locale
      ? {
          target: "#form-container",
          ...({
            es: {
              portalId: "6692004",
              formId: "4b9ef922-fd64-4407-9f50-3b46e38b67ab",
            },
            en: {
              portalId: "6692004",
              formId: "2d514566-d722-4e0a-93f3-a39322da9374",
            },
          } as any)[query.locale as string],
        }
      : null
  );
  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.book-demo.title",
        defaultMessage: "Book a demo",
      })}
    >
      <PublicContainer paddingY={{ base: 8, md: 16 }}>
        <Stack spacing={8} direction={{ base: "column", md: "row" }}>
          <Box flex="1" textAlign="left">
            <Heading as="h1" size="2xl">
              <FormattedMessage
                id="public.book-demo.request-invite"
                defaultMessage="Book a demo!"
              />
            </Heading>
            <Text marginTop={8}>
              <FormattedMessage
                id="public.book-demo.contact-soon"
                defaultMessage="Someone from our team will contact you as soon as possible."
              />
            </Text>
            <Heading size="md" marginTop={8}>
              <FormattedMessage
                id="public.book-demo.what-we-explain"
                defaultMessage="In this demo we will explain:"
              />
            </Heading>
            <List
              as="ol"
              listStyleType="decimal"
              spacing={4}
              marginTop={8}
              marginLeft={5}
              listStylePosition="outside"
            >
              <ListItem>
                <FormattedMessage
                  id="public.book-demo.basic-functions"
                  defaultMessage="<b>Basic functions of our platform:</b> petitions, contacts and document management."
                  values={{
                    b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
                  }}
                />
              </ListItem>
              <ListItem>
                <FormattedMessage
                  id="public.book-demo.checklist"
                  defaultMessage="<b>How to send a checklist:</b> to several recipients, types of information fields."
                  values={{
                    b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
                  }}
                />
              </ListItem>
              <ListItem>
                <FormattedMessage
                  id="public.book-demo.follow"
                  defaultMessage="<b>Follow the status of your requests:</b> progress, delivery and read receipts."
                  values={{
                    b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
                  }}
                />
              </ListItem>
              <ListItem>
                <FormattedMessage
                  id="public.book-demo.review-and-download"
                  defaultMessage="<b>Reviewing and downloading received information:</b> review completed checklists and download documents."
                  values={{
                    b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
                  }}
                />
              </ListItem>
              <ListItem>
                <FormattedMessage
                  id="public.book-demo.other-functionalities"
                  defaultMessage="<b>Other functionalities:</b> additional security layers, reminders."
                  values={{
                    b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
                  }}
                />
              </ListItem>
            </List>
            <Box>
              <Image
                maxWidth="50%"
                marginX="auto"
                marginY={8}
                src="/static/images/undraw_steps.svg"
                role="presentation"
              />
            </Box>
            <Text marginTop={8}>
              <FormattedMessage
                id="public.invite.consent"
                defaultMessage="Parallel needs the contact information you provide to us to contact you about our products. You may unsubscribe from these communications at any time."
              />
            </Text>
            <Text marginTop={4}>
              <FormattedMessage
                id="public.invite.review-privacy"
                defaultMessage="For more information, please review our <a>Privacy Policy</a>."
                values={{
                  a: (chunks: any[]) => (
                    <Link href="/legal/[doc]" as="/legal/privacy">
                      {chunks}
                    </Link>
                  ),
                }}
              />
            </Text>
          </Box>
          <Box flex="1">
            <Card
              id="form-container"
              maxWidth={{ base: "auto", lg: "500px" }}
              marginX="auto"
              borderColor="purple.100"
              padding={8}
            />
          </Box>
        </Stack>
      </PublicContainer>
    </PublicLayout>
  );
}

export function getStaticProps() {
  return { props: {} };
}

export function getStaticPaths() {
  return {
    paths: languages.map(({ locale }) => ({ params: { locale } })),
    fallback: false,
  };
}

export default BookDemo;
