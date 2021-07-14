import { Box, BoxProps, Center, Grid, Spinner } from "@chakra-ui/react";
import { NewPetition_PetitionTemplateFragment } from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import InfiniteScroll from "react-infinite-scroll-component";
import { EmptyPetitionCard } from "./EmptyPetitionCard";
import { TemplateCard } from "./TemplateCard";

export interface NewPetitionTemplatesListProps extends BoxProps {
  items: NewPetition_PetitionTemplateFragment[];
  isPublic: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
  onClickTemplate: (args: Maybe<string>) => void;
}

export const NewPetitionTemplatesList = ({
  items,
  isPublic,
  onLoadMore,
  hasMore,
  onClickTemplate,
  ...props
}: NewPetitionTemplatesListProps) => {
  return (
    <Box pt={4} {...props}>
      <InfiniteScroll
        dataLength={items?.length ?? 0} //This is important field to render the next data
        next={onLoadMore}
        hasMore={hasMore}
        loader={
          <Center
            height="140px"
            width="100%"
            background="whiteAlpha.700"
            zIndex="1"
          >
            <Spinner
              thickness="2px"
              speed="0.65s"
              emptyColor="gray.200"
              color="gray.600"
              size="xl"
            />
          </Center>
        }
        scrollableTarget="main-container"
      >
        <Grid
          templateColumns={{
            md: "repeat(2, 1fr)",
            lg: "repeat(3, 1fr)",
          }}
          gap={4}
          paddingTop={4}
          paddingX={6}
          paddingBottom={12}
        >
          {!isPublic && items.length ? (
            <EmptyPetitionCard
              id="empty-petition-card"
              onPress={() => onClickTemplate(null)}
            />
          ) : null}
          {items.map((template: NewPetition_PetitionTemplateFragment) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPress={() => onClickTemplate(template.id)}
            />
          ))}
        </Grid>
      </InfiniteScroll>
    </Box>
  );
};
