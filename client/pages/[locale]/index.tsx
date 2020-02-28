import { useToast } from "@chakra-ui/core";
import { Title } from "@parallel/components/common/Title";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import {
  PublicHero,
  RequestInviteForm
} from "@parallel/components/public/PublicHero";
import languages from "@parallel/lang/languages.json";
import { useIntl } from "react-intl";

function Home() {
  const intl = useIntl();
  const toast = useToast();
  async function handleRequestInvite({ email }: RequestInviteForm) {
    toast({
      title: intl.formatMessage({
        id: "public.hero-invite.toast-title",
        defaultMessage: "Thank you!"
      }),
      description: intl.formatMessage({
        id: "public.hero-invite.toast-description",
        defaultMessage: "We will get in touch with you very soon."
      }),
      status: "success",
      isClosable: true
    });
  }
  return (
    <>
      <Title></Title>
      <PublicLayout>
        <PublicHero
          onRequestInvite={handleRequestInvite}
          marginTop={12}
        ></PublicHero>
      </PublicLayout>
    </>
  );
}

export function getStaticProps() {
  return {};
}

export function getStaticPaths() {
  return {
    paths: languages.map(({ locale }) => ({ params: { locale } })),
    fallback: false
  };
}

export default Home;
