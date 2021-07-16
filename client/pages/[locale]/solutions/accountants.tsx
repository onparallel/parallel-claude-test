import { Heading, Text } from "@chakra-ui/react";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicHero } from "@parallel/components/public/PublicHero";
import { PublicShowcase } from "@parallel/components/public/PublicShowcase";
import { SolutionsBenefits } from "@parallel/components/public/solutions/SolutionsBenefits";
import { SolutionsDemoCta } from "@parallel/components/public/solutions/SolutionsDemoCta";
import { SolutionsPopularUseCases } from "@parallel/components/public/solutions/SolutionsPopularUseCases";
import { SolutionsTrust } from "@parallel/components/public/solutions/SolutionsTrust";
import languages from "@parallel/lang/languages.json";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";

function Accountants() {
  const intl = useIntl();
  const { query } = useRouter();

  const hero = {
    image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/hero/accountants_hero_${query.locale}`,
    title: intl.formatMessage({
      id: "public.accountants.hero-title",
      defaultMessage:
        "Accelerates processes by automating your clients services ",
    }),
    subtitle: intl.formatMessage({
      id: "public.accountants.hero-subtitle",
      defaultMessage:
        "Request easily the information your customers need. Set up the process in minutes and let automatic reminders help you to speed up them.",
    }),
    buttonText: intl.formatMessage({
      id: "public.book-demo-button",
      defaultMessage: "Book a demo",
    }),
    sectionTitle: intl.formatMessage({
      id: "public.accountants",
      defaultMessage: "BPO and Accounting",
    }),
    url: "/book-demo",
  };

  const benefitsImage = `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/solutions/accountants_benefits_${query.locale}.png`;
  const benefits = [
    {
      image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/ic/ic_efficiency.svg`,
      heading: intl.formatMessage({
        id: "public.law-firms.benefits-efficency-title",
        defaultMessage: "Enhance the efficiency of your team",
      }),
      text: intl.formatMessage({
        id: "public.law-firms.benefits-efficency-message",
        defaultMessage:
          "Use templates to reuse knowledge and reduce mistakes in your workflow.",
      }),
    },
    {
      image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/ic/ic_control.svg`,
      heading: intl.formatMessage({
        id: "public.law-firms.benefits-control-title",
        defaultMessage: "All your affairs under control",
      }),
      text: intl.formatMessage({
        id: "public.law-firms.benefits-control-message",
        defaultMessage:
          "Visualize the status of the on-going cases and remaining work of your team.",
      }),
    },
    {
      image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/ic/ic_experience.svg`,
      heading: intl.formatMessage({
        id: "public.law-firms.benefits-experience-title",
        defaultMessage: "Improve your customer experience",
      }),
      text: intl.formatMessage({
        id: "public.law-firms.benefits-experience-message",
        defaultMessage:
          "Provide a secure portal where your clients can colaborate and communicate with you.",
      }),
    },
  ];

  const logos = [
    {
      alt: "Gestoría Pons",
      href: "https://www.gestoriapons.com/",
      src: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/pons_black.svg`,
    },
    {
      alt: "Delvy",
      href: "https://delvy.es/",
      src: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/delvy_black.svg`,
    },
  ];

  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.accountants.title",
        defaultMessage:
          "Accelerates processes by automating your clients services",
      })}
    >
      <PublicHero
        image={hero.image}
        ratio={1394 / 976}
        title={hero.title}
        subtitle={hero.subtitle}
        buttonText={hero.buttonText}
        sectionTitle={hero.sectionTitle}
        url={hero.url}
      />
      <SolutionsTrust logos={logos} />
      <SolutionsBenefits image={benefitsImage} benefits={benefits} />
      <SolutionsPopularUseCases />
      <SolutionsDemoCta>
        <FormattedMessage
          id="public.law-firms.book-cta-title"
          defaultMessage="Can we help you?"
        />
      </SolutionsDemoCta>
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

export default Accountants;
