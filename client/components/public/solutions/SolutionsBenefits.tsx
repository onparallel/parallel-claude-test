import { Box, BoxProps, Heading, Image, Stack, Text } from "@chakra-ui/react";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicShowcase } from "@parallel/components/public/PublicShowcase";

interface SolutionsBenefitsProps extends BoxProps {
  image: string;
  benefits: BenefitProps[];
}

export const SolutionsBenefits = ({
  image,
  benefits,
  ...props
}: SolutionsBenefitsProps) => {
  return (
    <PublicContainer
      paddingY={8}
      maxWidth="container.xl"
      wrapper={{ paddingY: 16, backgroundColor: "purple.50" }}
      {...props}
    >
      <PublicShowcase imageUrl={image} imageSize="350px" isReversed>
        <Stack
          direction="column"
          spacing={12}
          paddingX={{ base: 4, sm: 8, md: 12 }}
        >
          {benefits.map((benefit, index) => (
            <Benefit key={index} {...benefit} />
          ))}
        </Stack>
      </PublicShowcase>
    </PublicContainer>
  );
};

type BenefitProps = {
  image: string;
  heading: string;
  text: string;
};

function Benefit({ image, heading, text }: BenefitProps) {
  return (
    <Stack direction="row" spacing={4}>
      <Box>
        <Image
          src={image}
          loading="lazy"
          minWidth="52px"
          role="presentation"
          objectFit="contain"
        />
      </Box>
      <Box>
        <Heading as="h3" size="md" color="gray.800" marginBottom={2}>
          {heading}
        </Heading>
        <Text marginBottom={2}>{text}</Text>
      </Box>
    </Stack>
  );
}
