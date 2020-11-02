import { BoxProps, Flex, Grid, Image, Text } from "@chakra-ui/core";
import { FormattedMessage } from "react-intl";
import { PublicContainer } from "./layout/PublicContainer";

export function PublicPress({ ...props }: BoxProps) {
  const items = [
    {
      image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/expansion.png`,
      name: "Expansión",
    },
    {
      image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/cinco_dias.png`,
      name: "CincoDías",
    },
    {
      image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/elreferente.png`,
      name: "ElReferente",
    },
    {
      image: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/seedrocket.png`,
      name: "Seedrocket",
    },
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
