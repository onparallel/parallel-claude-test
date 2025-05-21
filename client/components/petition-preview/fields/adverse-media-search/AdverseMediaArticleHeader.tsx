import { gql } from "@apollo/client";
import { Box, Button, Flex, HStack, MenuButton, MenuItem, MenuList, Text } from "@chakra-ui/react";
import { Menu } from "@parallel/chakra/components";
import {
  CheckIcon,
  ForbiddenIcon,
  ListIcon,
  StarEmptyIcon,
  StarIcon,
  UserXIcon,
} from "@parallel/chakra/icons";
import { ButtonWithMoreOptions } from "@parallel/components/common/ButtonWithMoreOptions";
import { Divider } from "@parallel/components/common/Divider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import {
  AdverseMediaArticleHeader_AdverseMediaArticleFragment,
  AdverseMediaArticleRelevance,
} from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";

export function AdverseMediaArticleHeader({
  article,
  onClassifyArticle,
  onBackToList,
  isReadOnly,
}: {
  article: AdverseMediaArticleHeader_AdverseMediaArticleFragment;
  onClassifyArticle: (classification: AdverseMediaArticleRelevance) => void;
  onBackToList?: () => void;
  isReadOnly: boolean;
}) {
  const intl = useIntl();

  return (
    <>
      <Flex
        as="header"
        minHeight="56px"
        paddingY={2}
        paddingX={4}
        flexDirection={{ base: "column-reverse", lg: "row" }}
        gap={{ base: 2, lg: 6 }}
        alignItems={{ base: "flex-start", lg: "center" }}
        overflow="auto"
      >
        {article?.header ? (
          <Text
            flex="1"
            fontSize="lg"
            fontWeight={500}
            noOfLines={1}
            dangerouslySetInnerHTML={{ __html: article.header }}
          />
        ) : null}
        <HStack
          justifyContent={{ base: "space-between", lg: "flex-end" }}
          width={{ base: "100%", lg: "auto" }}
        >
          {onBackToList && (
            <IconButtonWithTooltip
              icon={<ListIcon boxSize={4} />}
              size="sm"
              variant="outline"
              onClick={onBackToList}
              display={{ base: "flex", lg: "none" }}
              label={intl.formatMessage({
                id: "component.adverse-media-article-header.back-to-article-list",
                defaultMessage: "Back to article list",
              })}
            />
          )}
          {isNonNullish(article) ? (
            article.classification !== null ? (
              <Menu>
                <MenuButton
                  as={Button}
                  variant="outline"
                  leftIcon={<CheckIcon color="green.500" />}
                  fontWeight={500}
                  fontSize="md"
                  size="sm"
                  isDisabled={isReadOnly}
                >
                  {article.classification === "RELEVANT" ? (
                    <FormattedMessage
                      id="component.adverse-media-article-header.saved-as-relevant"
                      defaultMessage="Saved as relevant"
                    />
                  ) : article.classification === "IRRELEVANT" ? (
                    <FormattedMessage
                      id="component.adverse-media-article-header.saved-as-not-relevant"
                      defaultMessage="Non-relevant article"
                    />
                  ) : article.classification === "DISMISSED" ? (
                    <FormattedMessage
                      id="component.adverse-media-article-header.saved-as-not-the-person"
                      defaultMessage="Not the person"
                    />
                  ) : null}
                </MenuButton>
                <MenuList minWidth="fit-content">
                  <MenuItem
                    isDisabled={article.classification === "RELEVANT"}
                    onClick={() => onClassifyArticle("RELEVANT")}
                    icon={
                      article.classification === "RELEVANT" ? (
                        <StarIcon boxSize={4} />
                      ) : (
                        <StarEmptyIcon boxSize={4} />
                      )
                    }
                  >
                    <FormattedMessage
                      id="component.adverse-media-article-header.save-as-relevant"
                      defaultMessage="Save as relevant"
                    />
                  </MenuItem>
                  <MenuItem
                    isDisabled={article.classification === "IRRELEVANT"}
                    onClick={() => onClassifyArticle("IRRELEVANT")}
                    icon={<ForbiddenIcon boxSize={4} />}
                  >
                    <FormattedMessage
                      id="component.adverse-media-article-header.not-relevant"
                      defaultMessage="Not relevant"
                    />
                  </MenuItem>
                  <MenuItem
                    icon={<UserXIcon boxSize={4} />}
                    isDisabled={article.classification === "DISMISSED"}
                    onClick={() => onClassifyArticle("DISMISSED")}
                  >
                    <FormattedMessage
                      id="component.adverse-media-article-header.not-the-person"
                      defaultMessage="Not the person"
                    />
                  </MenuItem>
                </MenuList>
              </Menu>
            ) : (
              <>
                <HStack display={{ base: "none", xl: "flex" }}>
                  <Button
                    size="sm"
                    fontSize="md"
                    colorScheme="primary"
                    fontWeight={500}
                    onClick={() => onClassifyArticle("RELEVANT")}
                    leftIcon={<StarEmptyIcon />}
                    isDisabled={isReadOnly}
                  >
                    <FormattedMessage
                      id="component.adverse-media-article-header.relevant"
                      defaultMessage="Relevant"
                    />
                  </Button>
                  <Button
                    size="sm"
                    fontSize="md"
                    variant="outline"
                    fontWeight={500}
                    onClick={() => onClassifyArticle("IRRELEVANT")}
                    leftIcon={<ForbiddenIcon />}
                    isDisabled={isReadOnly}
                  >
                    <FormattedMessage
                      id="component.adverse-media-article-header.not-relevant"
                      defaultMessage="Not relevant"
                    />
                  </Button>
                  <Button
                    size="sm"
                    fontSize="md"
                    fontWeight={500}
                    leftIcon={<UserXIcon />}
                    onClick={() => onClassifyArticle("DISMISSED")}
                    isDisabled={isReadOnly}
                  >
                    <FormattedMessage
                      id="component.adverse-media-article-header.not-the-person"
                      defaultMessage="Not the person"
                    />
                  </Button>
                </HStack>
                <Box display={{ base: "flex", xl: "none" }}>
                  <ButtonWithMoreOptions
                    size="sm"
                    colorScheme="primary"
                    leftIcon={<StarEmptyIcon />}
                    onClick={() => onClassifyArticle("RELEVANT")}
                    isDisabled={isReadOnly}
                    options={
                      <MenuList minWidth={0}>
                        <MenuItem
                          onClick={() => onClassifyArticle("IRRELEVANT")}
                          icon={<ForbiddenIcon display="block" boxSize={4} />}
                        >
                          <FormattedMessage
                            id="component.adverse-media-article-header.not-relevant"
                            defaultMessage="Not relevant"
                          />
                        </MenuItem>
                        <MenuItem
                          onClick={() => onClassifyArticle("DISMISSED")}
                          icon={<UserXIcon display="block" boxSize={4} />}
                        >
                          <FormattedMessage
                            id="component.adverse-media-article-header.not-the-person"
                            defaultMessage="Not the person"
                          />
                        </MenuItem>
                      </MenuList>
                    }
                  >
                    <FormattedMessage
                      id="component.adverse-media-article-header.relevant"
                      defaultMessage="Relevant"
                    />
                  </ButtonWithMoreOptions>
                </Box>
              </>
            )
          ) : null}
        </HStack>
      </Flex>
      <Divider />
    </>
  );
}

AdverseMediaArticleHeader.fragments = {
  AdverseMediaArticle: gql`
    fragment AdverseMediaArticleHeader_AdverseMediaArticle on AdverseMediaArticle {
      id
      header
      classification
    }
  `,
};
