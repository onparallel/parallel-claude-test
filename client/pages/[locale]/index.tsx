import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicDemoCta } from "@parallel/components/public/PublicDemoCta";
import { PublicHeroPopularUseCases } from "@parallel/components/public/PublicHeroPopularUseCases";
import { PublicHowItWorksHero } from "@parallel/components/public/PublicHowItWorksHero";
import { PublicMainHero } from "@parallel/components/public/PublicMainHero";
import { PublicTrust } from "@parallel/components/public/PublicTrust";
import { PublicDataProtection } from "@parallel/components/public/PublicDataProtection";
import languages from "@parallel/lang/languages.json";
import { FormattedMessage, useIntl } from "react-intl";
import { PublicFigures } from "@parallel/components/public/PublicFigures";

function Home() {
  const intl = useIntl();
  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.home.title",
        defaultMessage: "Automate your workflows with clients",
      })}
    >
      <PublicMainHero />
      <PublicHeroPopularUseCases />
      <PublicFigures />
      <PublicHowItWorksHero />
      <PublicDataProtection />
      <PublicTrust />
      <PublicDemoCta>
        <FormattedMessage
          id="public.home.work-in-parallel"
          defaultMessage="Shall we work in parallel?"
        />
      </PublicDemoCta>
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
