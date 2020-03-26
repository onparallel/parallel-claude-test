import { Title } from "@parallel/components/common/Title";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicHeroBlackBanner } from "@parallel/components/public/PublicHeroBlackBanner";
import { PublicHeroHowItWorks } from "@parallel/components/public/PublicHeroHowItWorks";
import { PublicHeroPC } from "@parallel/components/public/PublicHeroPc";
import { PublicHeroPopularUseCases } from "@parallel/components/public/PublicHeroPopularUseCases";
import languages from "@parallel/lang/languages.json";
import { useIntl } from "react-intl";

function Home() {
  const intl = useIntl();
  return (
    <>
      <Title>
        {intl.formatMessage({
          id: "public.home.title",
          defaultMessage: "Collect information efficiently",
        })}
      </Title>
      <PublicLayout>
        <PublicHeroPC />
        <PublicHeroBlackBanner />
        <PublicHeroPopularUseCases />
        <PublicHeroHowItWorks />
      </PublicLayout>
    </>
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

export default Home;
