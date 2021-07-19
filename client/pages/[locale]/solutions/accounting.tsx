import {
  Center,
  Heading,
  Image,
  List,
  ListIcon,
  ListItem,
  Text,
} from "@chakra-ui/react";
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

function Accounting() {
  const intl = useIntl();
  const { query } = useRouter();

  const hero = {
    image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/hero/accounting_hero_${query.locale}`,
    alt: intl.formatMessage({
      id: "public.showcase-hero-alt",
      defaultMessage:
        "A screenshot of the app showcasing the information received using Parallel",
    }),
    ratio: 1394 / 976,
    title: intl.formatMessage({
      id: "public.accounting.hero-title",
      defaultMessage:
        "Accelerates processes by automating your clients services ",
    }),
    subtitle: intl.formatMessage({
      id: "public.accounting.hero-subtitle",
      defaultMessage:
        "Request easily the information your customers need. Set up the process in minutes and let automatic reminders help you to speed up them.",
    }),
    buttonText: intl.formatMessage({
      id: "public.book-demo-button",
      defaultMessage: "Book a demo",
    }),
    sectionTitle: intl.formatMessage({
      id: "public.accounting",
      defaultMessage: "BPO and Accounting",
    }),
    url: "/book-demo",
  };

  const benefitsImage = `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/solutions/accounting_benefits_${query.locale}.png`;
  const benefits = [
    {
      image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/ic/ic_efficiency.svg`,
      heading: intl.formatMessage({
        id: "public.accounting.benefits-efficiency-title",
        defaultMessage: "Manage the work more efficiently",
      }),
      text: intl.formatMessage({
        id: "public.accounting.benefits-efficiency-message",
        defaultMessage:
          "A platform designed to send and manage multiple processes without effort.",
      }),
    },
    {
      image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/ic/ic_accelerate.svg`,
      heading: intl.formatMessage({
        id: "public.accounting.benefits-accelerate-title",
        defaultMessage: "Accelerates project completion",
      }),
      text: intl.formatMessage({
        id: "public.accounting.benefits-accelerate-message",
        defaultMessage:
          "We help you make it easy for your recipient to receive all the information as soon as possible.",
      }),
    },
    {
      image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/ic/ic_colaborate.svg`,
      heading: intl.formatMessage({
        id: "public.accounting.benefits-collaborate-title",
        defaultMessage: "Work in teams",
      }),
      text: intl.formatMessage({
        id: "public.accounting.benefits-collaborate-message",
        defaultMessage:
          "Assign work to your team and keep track of the progress any times.",
      }),
    },
  ];
  const logos = [
    {
      alt: "Tecnotramit logo",
      href: "https://web.tecnotramit.com/",
      src: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/tecnotramit_black.png`,
      maxWidth: "155px",
    },
    {
      alt: "Prontopiso logo",
      href: "https://prontopiso.com/",
      src: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/prontopiso_black.png`,
      maxWidth: "180px",
    },
    {
      alt: "Gestoría Pons logo",
      href: "https://www.gestoriapons.com/",
      src: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/pons_black.png`,
      maxWidth: "190px",
    },
  ];

  const solutions = [
    {
      image: (
        <Image
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/ic/ic_mailing.svg`}
        />
      ),
      header: (
        <FormattedMessage
          id="public.accounting.use-cases-mailing-title"
          defaultMessage="Mass mailing"
        />
      ),
      description: (
        <FormattedMessage
          id="public.accounting.use-cases-mailing-description"
          defaultMessage="Request information for your campaigns from all your customers at the same time."
        />
      ),
    },
    {
      image: (
        <Image
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/ic/ic_control.svg`}
        />
      ),
      header: (
        <FormattedMessage
          id="public.accounting.use-cases-control-title"
          defaultMessage="Control and monitor the process"
        />
      ),
      description: (
        <FormattedMessage
          id="public.accounting.use-cases-control-description"
          defaultMessage="Get control of the information you receive and you can track the status changes of your processes."
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
          defaultMessage="Forget about chasing customers. Set up periodic reminders and let Parallel handle it while you receive the information."
        />
      ),
    },
  ];

  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.accounting.title",
        defaultMessage:
          "Accelerates processes by automating your clients services",
      })}
    >
      <PublicHero {...hero} />
      <SolutionsTrust logos={logos} />
      <SolutionsBenefits image={benefitsImage} benefits={benefits} />
      <PublicContainer
        paddingY={8}
        maxWidth="container.xl"
        wrapper={{ paddingY: 16, paddingBottom: 20 }}
      >
        <PublicShowcase
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/security.svg`}
          imageSize="300px"
        >
          <Heading
            as="h4"
            size="xs"
            lineHeight="24px"
            color="gray.600"
            textTransform="uppercase"
          >
            <FormattedMessage
              id="public.solutions.security"
              defaultMessage="Security"
            />
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
              defaultMessage="Our priority is to make the experience as agile and secure as possible for both you and yout clients."
            />
          </Text>
          <List spacing={3}>
            <ListItem display="flex" alignItems="center">
              <ListIcon as={CircleCheckIcon} color="green.600" />
              <FormattedMessage
                id="public.solutions.security-encrypted"
                defaultMessage="Your information secure and encrypted"
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
      <SolutionsPopularUseCases
        heading={
          <FormattedMessage
            id="public.accounting.solutions-title"
            defaultMessage="Solutions for BPOs and Accountings"
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
            id="public.accounting.api-title"
            defaultMessage="Use our API to integrate it with your sistems"
          />
        </Heading>
        <Center marginTop={14}>
          <Image
            maxWidth="730px"
            width="100%"
            src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/api/api_accounting.png`}
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

export default Accounting;
