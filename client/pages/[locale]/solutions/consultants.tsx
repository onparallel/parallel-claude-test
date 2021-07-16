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

function Consultants() {
  const intl = useIntl();
  const { query } = useRouter();

  const hero = {
    image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/hero/consultants_hero_${query.locale}`,
    title: intl.formatMessage({
      id: "public.consultants.hero-title",
      defaultMessage: "Speeds up the work with your clients",
    }),
    subtitle: intl.formatMessage({
      id: "public.consultants.hero-subtitle",
      defaultMessage:
        "Platform to work efficiently with your client. Use templates to reduce your team’s time on repetitive tasks.",
    }),
    buttonText: intl.formatMessage({
      id: "public.book-demo-button",
      defaultMessage: "Book a demo",
    }),
    sectionTitle: intl.formatMessage({
      id: "public.consultancy",
      defaultMessage: "Consultancy",
    }),
    url: "/book-demo",
  };

  const benefitsImage = `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/solutions/consultants_benefits_${query.locale}.png`;
  const benefits = [
    {
      image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/ic/ic_experience.svg`,
      heading: intl.formatMessage({
        id: "public.consultants.benefits-experience-title",
        defaultMessage: "Digitize yours services",
      }),
      text: intl.formatMessage({
        id: "public.consultants.benefits-experience-message",
        defaultMessage:
          "Manage your matters with Parallel for more efficiency. It completely replaces the use of paper and email chains.",
      }),
    },
    {
      image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/ic/ic_template.svg`,
      heading: intl.formatMessage({
        id: "public.consultants.benefits-template-title",
        defaultMessage: "Create templates for your daily proccesses",
      }),
      text: intl.formatMessage({
        id: "public.consultants.benefits-template-message",
        defaultMessage:
          "Standardize your processes to send your checklist quickly and avoid mistakes.",
      }),
    },
    {
      image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/ic/ic_control.svg`,
      heading: intl.formatMessage({
        id: "public.consultants.benefits-control-title",
        defaultMessage: "Save time for your team",
      }),
      text: intl.formatMessage({
        id: "public.consultants.benefits-control-message",
        defaultMessage:
          "Automate monitoring and we will remember your clients to upload de informations requested so you can focus on other matters.",
      }),
    },
  ];

  const logos = [
    {
      alt: "Tecnotramit logo",
      href: "https://web.tecnotramit.com/",
      src: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/tecnotramit_black.svg`,
    },
    {
      alt: "Prontopiso logo",
      href: "https://prontopiso.com/",
      src: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/prontopiso_black.svg`,
    },
    {
      alt: "Gestoría Pons logo",
      href: "https://www.gestoriapons.com/",
      src: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/pons_black.svg`,
    },
  ];

  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.consultants.title",
        defaultMessage: "Speeds up the work with your clients",
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
      <PublicContainer
        paddingY={8}
        maxWidth="container.lg"
        wrapper={{ paddingY: 16 }}
      >
        <PublicShowcase
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/solutions/consultants_usecase_${query.locale}.svg`}
          imageSize="330px"
          description={intl.formatMessage({
            id: "public.law-firms.actual-data-kyc",
            defaultMessage: "*Actual data in a KYC case.",
          })}
        >
          <Heading
            as="h4"
            size="xs"
            lineHeight="24px"
            color="gray.600"
            textTransform="uppercase"
          >
            <FormattedMessage
              id="public.law-firms.use-case"
              defaultMessage="Use case"
            />
          </Heading>
          <Heading
            as="h3"
            size="lg"
            color="gray.800"
            lineHeight="1.5"
            letterSpacing="-0,019em"
            marginBottom={4}
          >
            <FormattedMessage
              id="public.law-firms.speed-up-title"
              defaultMessage="Speed up your new clients registration, quickly and securely. "
            />
          </Heading>
          <Text>
            <FormattedMessage
              id="public.law-firms.speed-up-body"
              defaultMessage="Improves <b>control and monitoring of compliance</b> with the Prevention of Money Laundering, and avoids penalties for non-compliance."
              values={{
                b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
              }}
            />
          </Text>
        </PublicShowcase>
      </PublicContainer>
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

export default Consultants;
