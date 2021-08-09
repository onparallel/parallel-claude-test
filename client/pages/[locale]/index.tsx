import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicDataProtection } from "@parallel/components/public/PublicDataProtection";
import { PublicDemoCta } from "@parallel/components/public/PublicDemoCta";
import { PublicFigures } from "@parallel/components/public/PublicFigures";
import { PublicHero } from "@parallel/components/public/PublicHero";
import { PublicHeroPopularUseCases } from "@parallel/components/public/PublicHeroPopularUseCases";
import { PublicHowItWorksHero } from "@parallel/components/public/PublicHowItWorksHero";
import { PublicTrust } from "@parallel/components/public/PublicTrust";
import languages from "@parallel/lang/languages.json";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";

function Home() {
  const intl = useIntl();
  const { query } = useRouter();

  const hero = {
    image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/hero/showcase_hero_${query.locale}`,
    alt: intl.formatMessage({
      id: "public.showcase-hero-alt",
      defaultMessage: "A screenshot of the app showcasing the information received using Parallel",
    }),
    ratio: 1426 / 1140,
    title: intl.formatMessage({
      id: "public.home.hero-title",
      defaultMessage: "Automate your workflows with clients",
    }),
    subtitle: intl.formatMessage({
      id: "public.home.hero-subtitle",
      defaultMessage:
        "With Parallel you can easily automate forms with documents and make it an agile and safe process.",
    }),
    buttonText: intl.formatMessage({
      id: "public.book-demo-button",
      defaultMessage: "Book a demo",
    }),
    url: "/book-demo",
  };

  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.home.title",
        defaultMessage: "Automate your workflows with clients",
      })}
    >
      <PublicHero {...hero} />
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
