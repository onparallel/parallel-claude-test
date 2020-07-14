import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicHeroClaim } from "@parallel/components/public/PublicHeroClaim";
import { PublicHeroPopularUseCases } from "@parallel/components/public/PublicHeroPopularUseCases";
import { PublicHowItWorksHero } from "@parallel/components/public/PublicHowItWorksHero";
import { PublicMainHero } from "@parallel/components/public/PublicMainHero";
import languages from "@parallel/lang/languages.json";
import { useIntl } from "react-intl";

function Home() {
  const intl = useIntl();
  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.home.title",
        defaultMessage: "Collect information efficiently",
      })}
    >
      <PublicMainHero />
      <PublicHeroClaim />
      <PublicHeroPopularUseCases />
      <PublicHowItWorksHero />
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

export default Home;
