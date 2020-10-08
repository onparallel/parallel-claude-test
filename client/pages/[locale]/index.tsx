import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicHeroClaim } from "@parallel/components/public/PublicHeroClaim";
import { PublicHowItWorksHero } from "@parallel/components/public/PublicHowItWorksHero";
import { PublicMainHero } from "@parallel/components/public/PublicMainHero";
import { PublicPress } from "@parallel/components/public/PublicPress";
import { PublicTrust } from "@parallel/components/public/PublicTrust";
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
      <PublicHowItWorksHero />
      <PublicHeroClaim />
      {/* <PublicHeroPopularUseCases /> */}
      <PublicTrust />
      <PublicPress />
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
