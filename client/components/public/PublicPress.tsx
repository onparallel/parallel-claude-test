import { BoxProps, Flex, Grid, Image, Text } from "@chakra-ui/core";
import { FormattedMessage } from "react-intl";
import { PublicContainer } from "./layout/PublicContainer";

export function PublicPress({ ...props }: BoxProps) {
  const items = [
    { image: "/static/logos/expansion.png", name: "Expansión" },
    { image: "/static/logos/cinco_dias.png", name: "CincoDías" },
    { image: "/static/logos/elreferente.png", name: "ElReferente" },
    { image: "/static/logos/seedrocket.png", name: "Seedrocket" },
  ];
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
        />
      </Text>
      <Grid
        marginTop={{ base: 4, md: 8 }}
        alignItems="center"
        justifyContent="space-evenly"
        templateColumns={{
          base: "minmax(auto, 320px)",
          md: "repeat(2, minmax(auto, 320px))",
          lg: "repeat(4, minmax(auto, 320px))",
        }}
        gridGap={4}
      >
        {items.map((item, index) => (
          <Flex key={index} minHeight="100px" backgroundColor={"red"}>
            <Image
              src={item.image}
              width="200px"
              margin="auto"
              alt={item.name}
            />
          </Flex>
        ))}
      </Grid>
    </PublicContainer>
  );
}
