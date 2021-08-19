import { Heading, Image, List, ListIcon, ListItem, Text } from "@chakra-ui/react";
import { CircleCheckIcon } from "@parallel/chakra/icons";
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

function LawFirms() {
  const intl = useIntl();
  const { query } = useRouter();

  const hero = {
    image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/hero/lawfirms_hero_${query.locale}`,
    alt: intl.formatMessage({
      id: "public.law-firms.hero-alt",
      defaultMessage:
        "A picture showcasing the following templates from Parallel: KYC, income tax, incorporation of a limited liability company, share capital increase and carve-out of a company.",
    }),
    ratio: 1394 / 976,
    title: intl.formatMessage({
      id: "public.law-firms.hero-title",
      defaultMessage: "Increase your team’s billing and return",
    }),
    subtitle: intl.formatMessage({
      id: "public.law-firms.hero-subtitle",
      defaultMessage:
        "Increase your team’s billable hours providing them with a tool that takes care of repetitive processes and accelerates their project completion.",
    }),
    buttonText: intl.formatMessage({
      id: "public.book-demo-button",
      defaultMessage: "Book a demo",
    }),
    sectionTitle: intl.formatMessage({
      id: "public.law-firms",
      defaultMessage: "Law firms",
    }),
    url: "/book-demo",
  };

  const benefitsImage = `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/solutions/lawfirms_benefits_${query.locale}.svg`;
  const benefits = [
    {
      image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/ic/ic_efficiency.svg`,
      heading: intl.formatMessage({
        id: "public.law-firms.benefits-efficiency-title",
        defaultMessage: "Enhance the efficiency of your team",
      }),
      text: intl.formatMessage({
        id: "public.law-firms.benefits-efficiency-message",
        defaultMessage: "Use templates to reuse knowledge and reduce mistakes in your workflow.",
      }),
    },
    {
      image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/ic/ic_control.svg`,
      heading: intl.formatMessage({
        id: "public.law-firms.benefits-control-title",
        defaultMessage: "All your matters under control",
      }),
      text: intl.formatMessage({
        id: "public.law-firms.benefits-control-message",
        defaultMessage:
          "Visualize the status of the on-going cases and pending tasks of your team.",
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
      alt: "Cuatrecasas Acelera",
      href: "https://www.cuatrecasas.com",
      src: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/cuatrecasas_black.png`,
      maxWidth: "180px",
    },
    {
      alt: "Andersen",
      href: "https://es.andersen.com/",
      src: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/andersen_black.png`,
      maxWidth: "157px",
    },
    // {
    //   alt: "Gestoría Pons",
    //   href: "https://www.gestoriapons.com/",
    //   src: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/pons_black.png`,
    //   maxWidth: "190px",
    // },
  ];

  const solutions = [
    {
      image: (
        <Image src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/ic/ic_smart_forms.svg`} />
      ),
      header: (
        <FormattedMessage
          id="public.law-use-cases.smart-forms-title"
          defaultMessage="Smart forms"
        />
      ),
      description: (
        <FormattedMessage
          id="public.law-use-cases.smart-forms-description"
          defaultMessage="Use conditions to set up smart decisions and ensure that your clients only respond to what is needed."
        />
      ),
    },
    {
      image: (
        <Image src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/ic/ic_esignature.svg`} />
      ),
      header: (
        <FormattedMessage
          id="public.law-use-cases.esignature-title"
          defaultMessage="eSignature integration"
        />
      ),
      description: (
        <FormattedMessage
          id="public.law-use-cases.esignature-description"
          defaultMessage="Enable an advance eSignature to your proccess, completely secure and legally valid.."
        />
      ),
    },
    {
      image: (
        <Image src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/ic/ic_colaborate.svg`} />
      ),
      header: (
        <FormattedMessage
          id="public.law-use-cases.colaborate-title"
          defaultMessage="Colaborate with your team"
        />
      ),
      description: (
        <FormattedMessage
          id="public.law-use-cases.colaborate-description"
          defaultMessage="Share your cases with your colleagues to work efficiently."
        />
      ),
    },
  ];

  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.law-firms.title",
        defaultMessage: "Software for law firms",
      })}
    >
      <PublicHero {...hero} />
      <SolutionsTrust logos={logos} />
      <SolutionsBenefits image={benefitsImage} benefits={benefits} />
      <PublicContainer paddingY={8} maxWidth="container.xl" wrapper={{ paddingY: 16 }}>
        <PublicShowcase
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/solutions/lawfirms_usecase_${query.locale}.svg`}
          imageSize="330px"
          description={intl.formatMessage({
            id: "public.law-firms.actual-data-kyc",
            defaultMessage: "*Actual data in a KYC case.",
          })}
        >
          <Heading as="h4" size="xs" lineHeight="24px" color="gray.600" textTransform="uppercase">
            <FormattedMessage id="public.law-firms.use-case" defaultMessage="Use case" />
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
              id="public.law-firms.speed-up-title"
              defaultMessage="We speed up your new clients registration, quickly and securely"
            />
          </Heading>
          <Text>
            <FormattedMessage
              id="public.law-firms.speed-up-body"
              defaultMessage="Improves <b>control and monitoring of compliance</b> with the Prevention of Money Laundering, and avoids penalties for non-compliance."
            />
          </Text>
        </PublicShowcase>
      </PublicContainer>
      <SolutionsPopularUseCases
        heading={
          <FormattedMessage
            id="public.law-firms.solutions-title"
            defaultMessage="Solutions for law firms"
          />
        }
        features={solutions}
      />
      <PublicContainer
        paddingTop={8}
        paddingBottom={20}
        maxWidth="container.xl"
        wrapper={{ paddingY: 16, paddingBottom: 32 }}
      >
        <PublicShowcase
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/security.svg`}
          imageSize="300px"
          isReversed
        >
          <Heading as="h4" size="xs" lineHeight="24px" color="gray.600" textTransform="uppercase">
            <FormattedMessage id="public.solutions.security" defaultMessage="Security" />
          </Heading>
          <Heading as="h3" size="lg" color="gray.800" marginBottom={4}>
            <FormattedMessage
              id="public.solutions.security-title"
              defaultMessage="We protect your client information"
            />
          </Heading>
          <Text marginBottom={2}>
            <FormattedMessage
              id="public.solutions.security-body"
              defaultMessage="Our priority is to make the experience as agile and secure as possible for both you and your clients."
            />
          </Text>
          <List spacing={3}>
            <ListItem display="flex" alignItems="center">
              <ListIcon as={CircleCheckIcon} color="green.600" />
              <FormattedMessage
                id="public.solutions.security-encrypted"
                defaultMessage="Your information is secure and encrypted"
              />
            </ListItem>
            <ListItem display="flex" alignItems="center">
              <ListIcon as={CircleCheckIcon} color="green.600" />
              <FormattedMessage
                id="public.solutions.security-tls"
                defaultMessage="Security protocol TLS"
              />
            </ListItem>
            <ListItem display="flex" alignItems="center">
              <ListIcon as={CircleCheckIcon} color="green.600" />
              <FormattedMessage
                id="public.solutions.security-two-factor"
                defaultMessage="Two-factor authentication"
              />
            </ListItem>
          </List>
        </PublicShowcase>
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

export default LawFirms;
