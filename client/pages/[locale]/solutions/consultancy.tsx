import { Heading, Image, Text, Center } from "@chakra-ui/react";
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

function Consultancy() {
  const intl = useIntl();
  const { query } = useRouter();

  const hero = {
    image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/hero/consultancy_hero_${query.locale}`,
    title: intl.formatMessage({
      id: "public.consultancy.hero-title",
      defaultMessage: "Speeds up the work with your clients",
    }),
    subtitle: intl.formatMessage({
      id: "public.consultancy.hero-subtitle",
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

  const benefitsImage = `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/solutions/consultancy_benefits_${query.locale}.png`;
  const benefits = [
    {
      image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/ic/ic_experience.svg`,
      heading: intl.formatMessage({
        id: "public.consultancy.benefits-experience-title",
        defaultMessage: "Digitize yours services",
      }),
      text: intl.formatMessage({
        id: "public.consultancy.benefits-experience-message",
        defaultMessage:
          "Manage your matters with Parallel for more efficiency. It completely replaces the use of paper and email chains.",
      }),
    },
    {
      image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/ic/ic_template.svg`,
      heading: intl.formatMessage({
        id: "public.consultancy.benefits-template-title",
        defaultMessage: "Create templates for your daily proccesses",
      }),
      text: intl.formatMessage({
        id: "public.consultancy.benefits-template-message",
        defaultMessage:
          "Standardize your processes to send your checklist quickly and avoid mistakes.",
      }),
    },
    {
      image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/ic/ic_control.svg`,
      heading: intl.formatMessage({
        id: "public.consultancy.benefits-control-title",
        defaultMessage: "Save time for your team",
      }),
      text: intl.formatMessage({
        id: "public.consultancy.benefits-control-message",
        defaultMessage:
          "Automate monitoring and we will remember your clients to upload de informations requested so you can focus on other matters.",
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

  const solutions = [
    {
      image: (
        <Image
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/ic/ic_smart_forms.svg`}
        />
      ),
      header: (
        <FormattedMessage
          id="public.consultancy.use-cases-smart-form-title"
          defaultMessage="Smart templates"
        />
      ),
      description: (
        <FormattedMessage
          id="public.consultancy.use-cases-smart-form-description"
          defaultMessage="Personalize your customers experience by using conditionals and other useful features."
        />
      ),
    },
    {
      image: (
        <Image
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/ic/ic_reminders.svg`}
        />
      ),
      header: (
        <FormattedMessage
          id="public.accounting.use-cases-remainders-title"
          defaultMessage="Configurable reminders"
        />
      ),
      description: (
        <FormattedMessage
          id="public.accounting.use-cases-remainders-description"
          defaultMessage="Forget about chasing customers. Set up periodic reminders and let Parallel handle it while you receive the information."
        />
      ),
    },
    {
      image: (
        <Image
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/ic/ic_mailing.svg`}
        />
      ),
      header: (
        <FormattedMessage
          id="public.consultancy.use-cases-mailing-title"
          defaultMessage="Mass mailing"
        />
      ),
      description: (
        <FormattedMessage
          id="public.consultancy.use-cases-mailing-description"
          defaultMessage="Request information for your campaigns from all your customers at the same time."
        />
      ),
    },
  ];

  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.consultancy.title",
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
        maxWidth="container.xl"
        wrapper={{ paddingY: 16 }}
      >
        <PublicShowcase
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/solutions/consultancy_usecase_${query.locale}.svg`}
          imageSize="330px"
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
            size="xl"
            color="gray.800"
            lineHeight="1.5"
            letterSpacing="-0,019em"
            marginBottom={4}
          >
            <FormattedMessage
              id="public.consultancy.speed-up-title"
              defaultMessage="Management of Income Tax 2020 with Parallel "
            />
          </Heading>
          <Text>
            <FormattedMessage
              id="public.consultancy.speed-up-body"
              defaultMessage="We facilitate the management and masive mailing of more than 150 rents. Speeding up the receive of information and having, in less than 5 days, 40% of the processes completed."
            />
          </Text>
        </PublicShowcase>
      </PublicContainer>
      <SolutionsPopularUseCases
        heading={
          <FormattedMessage
            id="public.consultancy.solutions-title"
            defaultMessage="Solutions for Consultancy"
          />
        }
        features={solutions}
      />
      <PublicContainer
        paddingY={8}
        maxWidth="container.xl"
        wrapper={{
          paddingY: 16,
          textAlign: "center",
          backgroundColor: "white",
          paddingBottom: 28,
        }}
      >
        <Heading as="h2" size="xl" fontWeight="bold">
          <FormattedMessage
            id="public.consultancy.api-title"
            defaultMessage="Use our API to integrate it into your workflow"
          />
        </Heading>
        <Center marginTop={14}>
          <Image
            maxWidth="730px"
            src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/api/api_consultancy.png`}
          />
        </Center>
      </PublicContainer>
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

export default Consultancy;
