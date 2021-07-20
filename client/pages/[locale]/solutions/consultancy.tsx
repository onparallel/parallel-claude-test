import { Center, Heading, Image, Text } from "@chakra-ui/react";
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
    alt: intl.formatMessage({
      id: "public.consultancy.hero-alt",
      defaultMessage:
        "A picture showcasing the following templates from Parallel: KYC, Due Diligence, incorporation of a limited liability company, share capital increase and carve-out of a company.",
    }),
    ratio: 1394 / 976,
    title: intl.formatMessage({
      id: "public.consultancy.hero-title",
      defaultMessage: "Speed up the work with your clients",
    }),
    subtitle: intl.formatMessage({
      id: "public.consultancy.hero-subtitle",
      defaultMessage:
        "Work more efficiently with your client. Use templates to stop wasting time on repetitive tasks.",
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
        defaultMessage: "Digitize your services",
      }),
      text: intl.formatMessage({
        id: "public.consultancy.benefits-experience-message",
        defaultMessage:
          "Manage your matters more efficiently with Parallel. Forget about long email threads and the use of pen and paper.",
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
          "Standardize your processes to send your checklist quickly without mistakes.",
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
          "Automate monitoring and let us remind your clients to upload the requested information so you can focus on other matters.",
      }),
    },
  ];

  const logos = [
    {
      alt: "Gestoría Pons",
      href: "https://www.gestoriapons.com/",
      src: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/pons_black.png`,
      maxWidth: "190px",
    },
    {
      alt: "Delvy",
      href: "https://delvy.es/",
      src: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/delvy_black.png`,
      maxWidth: "185px",
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
          defaultMessage="Customize the experience for your clients with the use of conditional fields and other useful features."
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
          id="public.accounting.use-cases-reminders-title"
          defaultMessage="Automatic reminders"
        />
      ),
      description: (
        <FormattedMessage
          id="public.accounting.use-cases-reminders-description"
          defaultMessage="Forget about chasing clients. Set up periodic reminders and let Parallel handle it while you receive the information."
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
          defaultMessage="Request information for your campaigns from all your clients at once."
        />
      ),
    },
  ];

  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.consultancy.title",
        defaultMessage: "Software for consultancy",
      })}
    >
      <PublicHero {...hero} />
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
              defaultMessage="FY2020 Income Tax Return campaign with Parallel"
            />
          </Heading>
          <Text>
            <FormattedMessage
              id="public.consultancy.speed-up-body"
              defaultMessage="We helped manage more than 150 tax returns with our bulk processes features, speeding up the reception of the information. In less than 5 days our customer completed more than 40% of the processes."
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
            defaultMessage="Use our API to integrate Parallel into your workflow"
          />
        </Heading>
        <Center marginTop={14}>
          <Image
            maxWidth="730px"
            width="100%"
            src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/api/api_consultancy.png`}
          />
        </Center>
      </PublicContainer>
      <SolutionsDemoCta>
        <FormattedMessage
          id="public.law-firms.book-cta-title"
          defaultMessage="How can we help you?"
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
