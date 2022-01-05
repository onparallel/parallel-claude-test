import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicClientsReviews } from "@parallel/components/public/PublicClientsReviews";
import { PublicDataProtection } from "@parallel/components/public/PublicDataProtection";
import { PublicDemoCta } from "@parallel/components/public/PublicDemoCta";
import { PublicFigures } from "@parallel/components/public/PublicFigures";
import { PublicHero } from "@parallel/components/public/PublicHero";
import { PublicHeroPopularUseCases } from "@parallel/components/public/PublicHeroPopularUseCases";
import { PublicHowItWorksHero } from "@parallel/components/public/PublicHowItWorksHero";
import { PublicTrust } from "@parallel/components/public/PublicTrust";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";

export default function Home() {
  const intl = useIntl();
  const { locale } = useRouter();

  const hero = {
    image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/hero/showcase_hero_${locale}`,
    alt: intl.formatMessage({
      id: "public.showcase-hero-alt",
      defaultMessage: "A screenshot of the app showcasing the information received using Parallel",
    }),
    ratio: 1426 / 1140,
    title: intl.formatMessage({
      id: "public.home.hero-title",
      defaultMessage: "Collaborative process management software for back-office and sales teams",
    }),
    subtitle: intl.formatMessage({
      id: "public.home.hero-subtitle",
      defaultMessage: "Accelerate by 80% your processes.",
    }),
    subtitle2: intl.formatMessage({
      id: "public.home.hero-subtitle2",
      defaultMessage: "Eliminate errors by automating time-consuming back-office and legal tasks.",
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
      <PublicTrust />
      <PublicHeroPopularUseCases />
      <PublicFigures />
      <PublicHowItWorksHero />
      <PublicDataProtection />
      <PublicClientsReviews />
      <PublicDemoCta>
        <FormattedMessage
          id="public.home.work-in-parallel"
          defaultMessage="Shall we work in parallel?"
        />
      </PublicDemoCta>
    </PublicLayout>
  );
}
