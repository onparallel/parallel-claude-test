import { gql } from "@apollo/client";
import { Center, Grid, Spinner } from "@chakra-ui/react";
import { NewPetitionTemplatesList_PetitionTemplateFragment } from "@parallel/graphql/__types";
import InfiniteScroll from "react-infinite-scroll-component";
import { TemplateCard } from "./TemplateCard";

export interface NewPetitionTemplatesListProps {
  items: NewPetitionTemplatesList_PetitionTemplateFragment[];
  onLoadMore: () => void;
  hasMore: boolean;
  onClickTemplate: (templateId: string) => void;
}

export const NewPetitionTemplatesList = ({
  items,
  onLoadMore,
  hasMore,
  onClickTemplate,
}: NewPetitionTemplatesListProps) => {
  return (
    <InfiniteScroll
      dataLength={items.length}
      next={onLoadMore}
      hasMore={hasMore}
      loader={
        <Center height="100px" width="100%" zIndex="1">
          <Spinner thickness="2px" speed="0.65s" emptyColor="gray.200" color="gray.600" size="xl" />
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
        paddingTop={2}
        paddingX={6}
        paddingBottom={8}
      >
        {items.map((template) => (
          <TemplateCard
            data-template-id={template.id}
            key={template.id}
            template={template}
            onPress={() => onClickTemplate(template.id)}
          />
        ))}
      </Grid>
    </InfiniteScroll>
  );
};

NewPetitionTemplatesList.fragments = {
  PetitionTemplate: gql`
    fragment NewPetitionTemplatesList_PetitionTemplate on PetitionTemplate {
      id
      ...TemplateCard_PetitionTemplate
    }
    ${TemplateCard.fragments.PetitionTemplate}
  `,
};
