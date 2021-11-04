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
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";

export default function RealEstate() {
  const intl = useIntl();
  const { locale } = useRouter();

  const hero = {
    image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/hero/realestate_hero_${locale}`,
    alt: intl.formatMessage({
      id: "public.real-estate.hero-alt",
      defaultMessage:
        "A picture showcasing the following templates from Parallel: KYC, Deposit Agreement, Real Estate Mediation Agreement, Visit Sheet and Rental Data Request.",
    }),
    ratio: 1394 / 976,
    title: intl.formatMessage({
      id: "public.real-estate.hero-title",
      defaultMessage: "Sell and rent properties faster with the best client experience",
    }),
    subtitle: intl.formatMessage({
      id: "public.real-estate.hero-subtitle",
      defaultMessage:
        "Parallel is the software that accelerates the processes from end to end, including the owner’s mandate, buyers visit sheets, and the signature of the purchase agreement. Everything in an easy, totally secure and instant way.",
    }),
    buttonText: intl.formatMessage({
      id: "public.book-demo-button",
      defaultMessage: "Book a demo",
    }),
    sectionTitle: intl.formatMessage({
      id: "public.real-estate",
      defaultMessage: "Real Estate",
    }),
    url: "/book-demo",
  };

  const logos = [
    {
      alt: "Exp España",
      href: "https://www.expglobalspain.com/Home?lan=es-ES",
      src: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/exp_black.png`,
      maxWidth: "180px",
    },
    {
      alt: "Tecnotramit",
      href: "https://web.tecnotramit.com/",
      src: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/tecnotramit_black.png`,
      maxWidth: "155px",
    },
  ];

  const benefitsImage = `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/solutions/real_estate_benefits_${locale}.png`;
  const benefits = [
    {
      image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/ic/ic_efficiency.svg`,
      heading: intl.formatMessage({
        id: "public.real-estate.benefits-efficiency-title",
        defaultMessage: "More transactions, less paperwork",
      }),
      text: intl.formatMessage({
        id: "public.real-estate.benefits-efficiency-message",
        defaultMessage:
          "Parallel helps you manage the real estate transaction lifecycle in a fast and digital way. Say no more to physical paper and to email threads.",
      }),
    },
    {
      image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/ic/ic_technology.svg`,
      heading: intl.formatMessage({
        id: "public.real-estate.benefits-technology-title",
        defaultMessage: "Technology + flexible",
      }),
      text: intl.formatMessage({
        id: "public.real-estate.benefits-technology-message",
        defaultMessage:
          "Automate your processes without putting in check the flexibility of requesting anything you need, the documents you generate and the signers you name.",
      }),
    },
    {
      image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/ic/ic_communication.svg`,
      heading: intl.formatMessage({
        id: "public.real-estate.benefits-communication-title",
        defaultMessage: "Make communications between the office and the commercial team easier",
      }),
      text: intl.formatMessage({
        id: "public.real-estate.benefits-communication-message",
        defaultMessage:
          "Avoid chaos in long email threads. Centralize communications in a single place where you work with the information and the documents.",
      }),
    },
  ];

  const solutions = [
    {
      image: (
        <Image src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/ic/ic_smart_forms.svg`} />
      ),
      header: (
        <FormattedMessage
          id="public.real-estate.smart-forms-title"
          defaultMessage="Smart forms and documents"
        />
      ),
      description: (
        <FormattedMessage
          id="public.real-estate.smart-forms-description"
          defaultMessage="Make processes and technology adapt to your needs and your clients needs, not the way around."
        />
      ),
    },
    {
      image: (
        <Image src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/ic/ic_esignature.svg`} />
      ),
      header: (
        <FormattedMessage
          id="public.real-estate.esignature-title"
          defaultMessage="Advanced eSignature"
        />
      ),
      description: (
        <FormattedMessage
          id="public.real-estate.esignature-description"
          defaultMessage="Execute contracts with an advanced eSignature in a simple, completely secure and with legal certainty way."
        />
      ),
    },
    {
      image: (
        <Image src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/ic/ic_experience.svg`} />
      ),
      header: (
        <FormattedMessage
          id="public.real-estate.accessible-title"
          defaultMessage="Accessible from anywhere"
        />
      ),
      description: (
        <FormattedMessage
          id="public.real-estate.accessible-description"
          defaultMessage="From your computer or mobile phone, your team and your clients can fill, review and sign all the forms and documents that you need."
        />
      ),
    },
  ];

  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.real-estate.title",
        defaultMessage: "Software for Real Estate",
      })}
      description={intl.formatMessage({
        id: "public.real-estate.meta-description",
        defaultMessage:
          "Software to automate back-office and legal tasks, from the collection of information to the signature of contracts, in an easy, secure and instant way.",
      })}
    >
      <PublicHero {...hero} />
      <SolutionsTrust logos={logos} />
      <SolutionsBenefits image={benefitsImage} benefits={benefits} />
      <PublicContainer paddingY={8} maxWidth="container.xl" wrapper={{ paddingY: 16 }}>
        <PublicShowcase
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/solutions/realestate_usecase_${locale}.svg`}
          imageSize="330px"
        >
          <Heading as="h4" size="xs" lineHeight="24px" color="gray.600" textTransform="uppercase">
            <FormattedMessage id="public.real-estate.use-case" defaultMessage="Use case" />
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
              id="public.real-estate.speed-up-title"
              defaultMessage="Add a new property to your portfolio in less than 15 minutes"
            />
          </Heading>
          <Text>
            <FormattedMessage
              id="public.real-estate.speed-up-body"
              defaultMessage="Surprise your clients in the same visit of the property and leave with a signed mandate and all the information you need."
            />
          </Text>
        </PublicShowcase>
      </PublicContainer>
      <SolutionsPopularUseCases
        heading={
          <FormattedMessage
            id="public.real-estate.solutions-title"
            defaultMessage="Solutions for Real Estate Agencies"
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
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/solutions/document.svg`}
          imageSize="300px"
          isReversed
        >
          <Heading as="h4" size="xs" lineHeight="24px" color="gray.600" textTransform="uppercase">
            <FormattedMessage
              id="public.real-estate.end-to-end-solution"
              defaultMessage="End-to-end solution"
            />
          </Heading>
          <Heading as="h2" size="xl" color="gray.800" marginBottom={4}>
            <FormattedMessage
              id="public.real-estate.end-to-end-title"
              defaultMessage="A single solution for all the paperwork"
            />
          </Heading>
          <Text marginBottom={2}>
            <FormattedMessage
              id="public.real-estate.end-to-end-body"
              defaultMessage="Centralize your real estate transactions processes from end-to-end with:"
            />
          </Text>
          <List spacing={3} marginBottom={2}>
            <ListItem display="flex" alignItems="center">
              <ListIcon as={CircleCheckIcon} color="green.600" />
              <FormattedMessage
                id="public.real-estate.customized-request"
                defaultMessage="Customized and automated request of information of the owners and the properties"
              />
            </ListItem>
            <ListItem display="flex" alignItems="center">
              <ListIcon as={CircleCheckIcon} color="green.600" />
              <FormattedMessage
                id="public.real-estate.smart-document"
                defaultMessage="Smart document generation"
              />
            </ListItem>
            <ListItem display="flex" alignItems="center">
              <ListIcon as={CircleCheckIcon} color="green.600" />
              <FormattedMessage
                id="public.real-estate.advanced-esignature"
                defaultMessage="Advanced eSignature of documents"
              />
            </ListItem>
          </List>
          <Text>
            <FormattedMessage
              id="public.real-estate.end-to-end-footer"
              defaultMessage="Everything for you and your clients, in an easy, organized, secure and 100% online way."
            />
          </Text>
        </PublicShowcase>
      </PublicContainer>
      <SolutionsDemoCta>
        <FormattedMessage
          id="public.solutions.book-cta-title"
          defaultMessage="How can we help you?"
        />
      </SolutionsDemoCta>
    </PublicLayout>
  );
}
