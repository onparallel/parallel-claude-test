import { Box, Heading, Text } from "@chakra-ui/react";
import { NormalLink } from "@parallel/components/common/Link";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import languages from "@parallel/lang/languages.json";
import { loadDoc } from "@parallel/utils/docs";
import Markdown from "markdown-to-jsx";
import { GetStaticProps } from "next";
import { useIntl } from "react-intl";
import { isDefined } from "remeda";

interface LegalDocProps {
  content: string;
  doc: string;
}

export default function LegalDoc({ content, doc }: LegalDocProps) {
  const intl = useIntl();
  const titles: Record<string, string> = {
    terms: intl.formatMessage({
      id: "public.terms.title",
      defaultMessage: "Terms & Conditions",
    }),
    privacy: intl.formatMessage({
      id: "public.privacy.title",
      defaultMessage: "Privacy policy",
    }),
    cookies: intl.formatMessage({
      id: "public.cookies.title",
      defaultMessage: "Cookie policy",
    }),
  };
  return (
    <PublicLayout title={titles[doc]}>
      <PublicContainer marginTop={8}>
        <Markdown
          options={{
            overrides: {
              a: {
                component: NormalLink,
              },
              h1: {
                component: Heading,
                props: {
                  as: "h2",
                  fontSize: "3xl",
                },
              },
              h2: {
                component: Heading,
                props: {
                  as: "h3",
                  fontSize: "lg",
                  marginTop: 4,
                },
              },
              ul: {
                component: Box,
                props: {
                  as: "ul",
                  paddingLeft: 8,
                },
              },
              ol: {
                component: Box,
                props: {
                  as: "ol",
                  paddingLeft: 8,
                },
              },
              li: {
                component: Text,
                props: {
                  as: "li",
                  marginTop: 2,
                },
              },
              p: {
                component: Text,
                props: {
                  as: "div",
                  marginTop: 2,
                },
              },
            },
          }}
        >
          {content}
        </Markdown>
      </PublicContainer>
    </PublicLayout>
  );
}

const DOCS = ["terms", "privacy", "cookies"];

export const getStaticProps: GetStaticProps<LegalDocProps, { doc: string }> = async ({
  params,
  locale,
}) => {
  if (isDefined(params) && DOCS.includes(params.doc)) {
    const content = await loadDoc(params.doc, locale!);
    return { props: { content, doc: params.doc } };
  }
  return { notFound: true };
};

export function getStaticPaths() {
  return {
    paths: languages.flatMap(({ locale }) => DOCS.map((doc) => ({ params: { doc }, locale }))),
    fallback: false,
  };
}
