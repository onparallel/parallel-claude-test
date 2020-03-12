import { Box, Heading, Text } from "@chakra-ui/core";
import { NormalLink } from "@parallel/components/common/Link";
import { Title } from "@parallel/components/common/Title";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import languages from "@parallel/lang/languages.json";
import { loadDoc } from "@parallel/utils/docs";
import Markdown from "markdown-to-jsx";
import { useIntl } from "react-intl";

interface LegalDocProps {
  content: string;
  doc: string;
}

function LegalDoc({ content, doc }: LegalDocProps) {
  const intl = useIntl();
  const titles: Record<string, string> = {
    terms: intl.formatMessage({
      id: "public.terms.title",
      defaultMessage: "Terms & conditions"
    }),
    privacy: intl.formatMessage({
      id: "public.privacy.title",
      defaultMessage: "Privacy policy"
    }),
    cookies: intl.formatMessage({
      id: "public.cookies.title",
      defaultMessage: "Cookie policy"
    })
  };
  return (
    <>
      <Title>{titles[doc]}</Title>
      <PublicLayout>
        <PublicContainer marginTop={8}>
          <Markdown
            options={{
              overrides: {
                a: {
                  component: NormalLink
                },
                h1: {
                  component: Heading,
                  props: {
                    as: "h2",
                    fontSize: "3xl"
                  }
                },
                h2: {
                  component: Heading,
                  props: {
                    as: "h3",
                    fontSize: "lg",
                    marginTop: 4
                  }
                },
                ul: {
                  component: Box,
                  props: {
                    as: "ul",
                    paddingLeft: 8
                  }
                },
                ol: {
                  component: Box,
                  props: {
                    as: "ol",
                    paddingLeft: 8
                  }
                },
                li: {
                  component: Text,
                  props: {
                    as: "li",
                    marginTop: 2
                  }
                },
                p: {
                  component: Text,
                  props: {
                    as: "div",
                    marginTop: 2
                  }
                }
              }
            }}
          >
            {content}
          </Markdown>
        </PublicContainer>
      </PublicLayout>
    </>
  );
}

const DOCS = ["terms", "privacy", "cookies"];

interface LegalDocParams {
  locale: string;
  doc: string;
}

export async function getStaticProps({
  params: { locale, doc }
}: {
  params: LegalDocParams;
}) {
  const content = await loadDoc(doc, locale);
  return { props: { content, doc } };
}

export function getStaticPaths() {
  return {
    paths: languages.flatMap(({ locale }) =>
      DOCS.map(doc => ({ params: { locale, doc } }))
    ),
    fallback: false
  };
}
export default LegalDoc;
