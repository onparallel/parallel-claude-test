import { BoxProps, Heading } from "@chakra-ui/core";
import { FormattedMessage, useIntl } from "react-intl";
import { PublicContainer } from "./layout/PublicContainer";

export type PublicHeroProps = BoxProps;

export function PublicHeroBlackBanner({ ...props }: PublicHeroProps) {
  return (
    <PublicContainer
      {...props}
      paddingY={16}
      wrapper={{
        backgroundColor: "gray.900",
        textAlign: "center"
      }}
    >
      <Heading fontWeight="light" fontSize="3xl" color="white">
        <FormattedMessage
          id="public.home.hero-scale-services"
          defaultMessage="Who said professional services only scale with more human capital?"
        ></FormattedMessage>
      </Heading>
    </PublicContainer>
  );
}
