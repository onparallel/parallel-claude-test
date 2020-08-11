import {
  Box,
  IconButton,
  List,
  ListItem,
  Text,
  IconButtonProps,
} from "@chakra-ui/core";
import { ArrowBack, ArrowForward, MoreIcon } from "@parallel/chakra/icons";
import { ExtendChakra } from "@parallel/chakra/utils";
import { useIntl } from "react-intl";
import { Spacer } from "../common/Spacer";
import { range } from "remeda";
import { NakedLink } from "../common/Link";
import { useRouter } from "next/router";
import { useMemo, useRef } from "react";

export type RecipientViewPaginationProps = ExtendChakra<{
  currentPage: number;
  pageCount: number;
}>;

export function RecipientViewPagination({
  currentPage,
  pageCount,
  ...props
}: RecipientViewPaginationProps) {
  const intl = useIntl();
  const pages = usePagination({ currentPage, pageCount });
  return (
    <Box as="nav" role="navigation" {...props}>
      <List display="flex">
        <ListItem
          paddingRight={1}
          display={{ base: pageCount > 5 ? "none" : "block", sm: "block" }}
        >
          <PageLink
            page={currentPage - 1}
            icon={<ArrowBack />}
            variant="outline"
            isDisabled={currentPage === 1}
            aria-label={intl.formatMessage({
              id: "generic.previous-page",
              defaultMessage: "Previous page",
            })}
          />
        </ListItem>
        <Spacer />
        {pages.map((page) =>
          typeof page === "number" ? (
            <ListItem key={page} paddingX={1}>
              <PageLink
                page={page}
                isActive={page === currentPage}
                icon={<Text>{page}</Text>}
                aria-label={intl.formatMessage(
                  {
                    id: "generic.go-to-page",
                    defaultMessage: "Go to page {page}",
                  },
                  { page }
                )}
              />
            </ListItem>
          ) : (
            <ListItem
              display="flex"
              key={page}
              role="separator"
              paddingX={1}
              height={10}
              alignItems="center"
              color="gray.400"
            >
              <MoreIcon />
            </ListItem>
          )
        )}
        <Spacer />
        <ListItem
          paddingLeft={1}
          display={{ base: pageCount > 5 ? "none" : "block", sm: "block" }}
        >
          <PageLink
            page={currentPage + 1}
            icon={<ArrowForward />}
            isDisabled={currentPage === pageCount}
            aria-label={intl.formatMessage({
              id: "generic.next-page",
              defaultMessage: "Next page",
            })}
          />
        </ListItem>
      </List>
    </Box>
  );
}

function PageLink({
  page,
  isActive,
  ...props
}: IconButtonProps & { isActive?: boolean; page: number }) {
  const { query } = useRouter();
  const ref = useRef<HTMLButtonElement>(null);
  const button = (
    <IconButton
      as="a"
      ref={ref}
      variant={isActive ? "solid" : "outline"}
      colorScheme={isActive ? "purple" : "gray"}
      aria-current={isActive}
      onClick={() => ref.current!.blur()}
      {...props}
    />
  );
  return props.isDisabled ? (
    button
  ) : (
    <NakedLink
      href="/petition/[keycode]/[page]"
      as={`/petition/${query.keycode}/${page}`}
    >
      {button}
    </NakedLink>
  );
}

function usePagination({
  pageCount,
  currentPage,
  boundaryCount = 1,
  siblingCount = 1,
}: {
  pageCount: number;
  currentPage: number;
  boundaryCount?: number;
  siblingCount?: number;
}) {
  return useMemo(() => {
    const startPages = range(1, Math.min(boundaryCount, pageCount) + 1);
    const endPages = range(
      Math.max(pageCount - boundaryCount + 1, boundaryCount + 1),
      pageCount + 1
    );

    const siblingsStart = Math.max(
      Math.min(
        // Natural start
        currentPage - siblingCount,
        // Lower boundary when page is high
        pageCount - boundaryCount - siblingCount * 2 - 1
      ),
      // Greater than startPages
      boundaryCount + 2
    );

    const siblingsEnd = Math.min(
      Math.max(
        // Natural end
        currentPage + siblingCount,
        // Upper boundary when page is low
        boundaryCount + siblingCount * 2 + 2
      ),
      // Less than endPages
      endPages.length > 0 ? endPages[0] - 2 : pageCount - 1
    );

    // Basic list of items to render
    // e.g. itemList = [1, 'ellipsis', 4, 5, 6, 'ellipsis', 10s]
    return [
      ...startPages,
      // Start ellipsis
      // eslint-disable-next-line no-nested-ternary
      ...(siblingsStart > boundaryCount + 2
        ? ["start-ellipsis"]
        : boundaryCount + 1 < pageCount - boundaryCount
        ? [boundaryCount + 1]
        : []),

      // Sibling pages
      ...range(siblingsStart, siblingsEnd + 1),

      // End ellipsis
      // eslint-disable-next-line no-nested-ternary
      ...(siblingsEnd < pageCount - boundaryCount - 1
        ? ["end-ellipsis"]
        : pageCount - boundaryCount > boundaryCount
        ? [pageCount - boundaryCount]
        : []),

      ...endPages,
    ];
  }, [pageCount, currentPage, boundaryCount, siblingCount]);
}
