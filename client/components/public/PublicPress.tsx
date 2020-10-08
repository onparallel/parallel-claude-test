import { BoxProps, Flex, Grid, Image, Text } from "@chakra-ui/core";
import { FormattedMessage } from "react-intl";
import { PublicContainer } from "./layout/PublicContainer";

export function PublicPress({ ...props }: BoxProps) {
  return (
    <PublicContainer
      {...props}
      paddingY={8}
      wrapper={{
        textAlign: "left",
      }}
    >
      <Text fontSize="xl" fontWeight="light">
        <FormattedMessage
          id="public.home.press"
          defaultMessage="You may also remember us from..."
        ></FormattedMessage>
      </Text>
      <Grid
        marginTop={{ base: 4, md: 8 }}
        // flexDirection={{ base: "column", md: "row" }}
        alignItems="center"
        justifyContent="space-evenly"
        templateColumns={{
          base: "minmax(auto, 320px)",
          md: "repeat(2, minmax(auto, 320px))",
          lg: "repeat(4, minmax(auto, 320px))",
        }}
      >
        <Flex minHeight="100px">
          <Image
            src="/static/logos/expansion.png"
            width="150px"
            margin="auto"
            alt="Expansión"
          />
        </Flex>
        <Flex minHeight="100px">
          <Image
            src="/static/logos/cinco_dias.jpg"
            width="150px"
            margin="auto"
            alt="CincoDías"
          />
        </Flex>
        <Flex minHeight="100px">
          <Image
            src="/static/logos/elreferente.png"
            width="150px"
            margin="auto"
            alt="ElReferente"
          />
        </Flex>
        <Flex minHeight="100px">
          <Image
            src="/static/logos/seedrocket.jpg"
            width="150px"
            margin="auto"
            alt="Seedrocket"
          />
        </Flex>
      </Grid>
    </PublicContainer>
  );
}
