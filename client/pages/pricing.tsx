import { Heading } from "@chakra-ui/layout";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicPricingCards } from "@parallel/components/public/pricing/PublicPricingCards";
import { PublicPricingTable } from "@parallel/components/public/pricing/PublicPricingTable";
import { PublicSwitchValues } from "@parallel/components/public/pricing/PublicSwitchPricing";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

function Pricing() {
  const intl = useIntl();

  const [billing, setBilling] = useState<PublicSwitchValues>("monthly");

  const handleSwitchBillingTime = (e: PublicSwitchValues) => {
    setBilling(e);
  };

  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.pricing.title",
        defaultMessage: "Pricing",
      })}
      description={intl.formatMessage({
        id: "public.pricing.meta-description",
        defaultMessage: "Find the right plan according to your needs",
      })}
    >
      <PublicContainer
        wrapper={{
          paddingY: 20,
          backgroundColor: "white",
          display: "flex",
        }}
      >
        <Heading textAlign="center">
          <FormattedMessage
            id="public.pricing.heading"
            defaultMessage="Find the right plan according to your needs"
          />
        </Heading>
        {/* <Center p={10}>
          <PublicSwitchPricing onChange={handleSwitchBillingTime} />
        </Center> */}
        <PublicPricingCards marginTop={14} marginBottom={20} billing={billing} />
        <PublicPricingTable display={{ base: "none", md: "block" }} />
      </PublicContainer>
    </PublicLayout>
  );
}

export default Pricing;
