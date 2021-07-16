import { Heading, List, ListIcon, ListItem, Text } from "@chakra-ui/react";
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
    title: intl.formatMessage({
      id: "public.law-firms.hero-title",
      defaultMessage: "Increase your team’s billing and return",
    }),
    subtitle: intl.formatMessage({
      id: "public.law-firms.hero-subtitle",
      defaultMessage:
        "Increase your team’s billable hours provinding them with a tool that takes care of repetitive processes and accelerates his project completion.",
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
      alt: "Cuatrecasas Acelera",
      href: "https://www.cuatrecasas.com",
      src: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/cuatrecasas_black.svg`,
    },
    {
      alt: "Andersen",
      href: "https://es.andersen.com/",
      src: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/andersen_black.svg`,
    },
    {
      alt: "Gestoría Pons",
      href: "https://www.gestoriapons.com/",
      src: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/pons_black.svg`,
    },
  ];

  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.law-firms.title",
        defaultMessage: "Increase your team’s billing and return",
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
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/solutions/lawfirms_usecase_${query.locale}.svg`}
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
      <PublicContainer
        paddingY={8}
        maxWidth="container.lg"
        wrapper={{ paddingY: 16, paddingBottom: 32 }}
      >
        <PublicShowcase
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/security.svg`}
          imageSize="300px"
          isReversed
        >
          <Heading
            as="h4"
            size="xs"
            lineHeight="24px"
            color="gray.600"
            textTransform="uppercase"
          >
            <FormattedMessage
              id="public.law-firms.security"
              defaultMessage="Security"
            />
          </Heading>
          <Heading as="h3" size="lg" color="gray.800" marginBottom={4}>
            <FormattedMessage
              id="public.law-firms.security-title"
              defaultMessage="We protect your client information"
            />
          </Heading>
          <Text marginBottom={2}>
            <FormattedMessage
              id="public.law-firms.security-body"
              defaultMessage="Our priority is to make the experience as agile and secure as possible for both you and yout clients."
            />
          </Text>
          <List spacing={3}>
            <ListItem display="flex" alignItems="center">
              <ListIcon as={CircleCheckIcon} color="green.600" />
              <FormattedMessage
                id="public.law-firms.security-encrypted"
                defaultMessage="Your information secure and encrypted"
              />
            </ListItem>
            <ListItem display="flex" alignItems="center">
              <ListIcon as={CircleCheckIcon} color="green.600" />
              <FormattedMessage
                id="public.law-firms.security-tls"
                defaultMessage="Security protocol TLS"
              />
            </ListItem>
            <ListItem display="flex" alignItems="center">
              <ListIcon as={CircleCheckIcon} color="green.600" />
              <FormattedMessage
                id="public.law-firms.security-two-factor"
                defaultMessage="Two-factor authentication"
              />
            </ListItem>
          </List>
        </PublicShowcase>
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

export default LawFirms;
