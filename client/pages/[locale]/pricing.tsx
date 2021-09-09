import { Heading } from "@chakra-ui/layout";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { useIntl } from "react-intl";

function Pricing() {
  const intl = useIntl();
  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.pricing.title",
        defaultMessage: "Pricing",
      })}
      description={intl.formatMessage({
        id: "public.login.meta-description",
        defaultMessage: "Find the right plan according to your needs",
      })}
    >
      <PublicContainer
        wrapper={{
          paddingY: 20,
          textAlign: "center",
          backgroundColor: "white",
        }}
      >
        <Heading>Find the right plan according to your needs</Heading>
      </PublicContainer>
    </PublicLayout>
  );
}

export default Pricing;
