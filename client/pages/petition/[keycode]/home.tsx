import { gql } from "@apollo/client";
import {
  Box,
  Center,
  Circle,
  Flex,
  Grid,
  Heading,
  HStack,
  Image,
  LinkBox,
  LinkOverlay,
  RadioProps,
  Spinner,
  Stack,
  Text,
  useRadio,
  useRadioGroup,
} from "@chakra-ui/react";
import {
  ArrowBackIcon,
  CheckIcon,
  ChevronRightIcon,
  PaperPlaneIcon,
  RepeatIcon,
  TimeIcon,
} from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { DateTime } from "@parallel/components/common/DateTime";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { Divider } from "@parallel/components/common/Divider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { NakedLink } from "@parallel/components/common/Link";
import { OverrideWithOrganizationTheme } from "@parallel/components/common/OverrideWithOrganizationTheme";
import { ProgressIndicator, ProgressTrack } from "@parallel/components/common/Progress";
import { SearchInput } from "@parallel/components/common/SearchInput";
import { ToneProvider, useTone } from "@parallel/components/common/ToneProvider";
import {
  RedirectError,
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { RecipientPortalHeader } from "@parallel/components/recipient-view/RecipientPortalHeader";
import {
  RecipientPortalStatusFilter,
  RecipientPortalStatusFilterValue,
} from "@parallel/components/recipient-view/RecipientPortalStatusFilter";
import {
  RecipientPortal_accessDocument,
  RecipientPortal_accessesDocument,
  RecipientPortal_PublicPetitionAccessFragment,
  RecipientPortal_PublicPetitionFieldFragment,
  RecipientPortal_statsDocument,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import {
  useAssertQuery,
  useAssertQueryOrPreviousData,
} from "@parallel/utils/apollo/useAssertQuery";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { compose } from "@parallel/utils/compose";
import { generateCssStripe } from "@parallel/utils/css";
import { FORMATS } from "@parallel/utils/dates";
import { useFieldVisibility } from "@parallel/utils/fieldVisibility/useFieldVisibility";
import { parseQuery, string, useQueryState, values } from "@parallel/utils/queryState";
import { UnwrapPromise } from "@parallel/utils/types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import Head from "next/head";
import { Fragment, useCallback, useMemo, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { FormattedMessage, useIntl } from "react-intl";
import { zip } from "remeda";

const QUERY_STATE = {
  search: string(),
  status: values<RecipientPortalStatusFilterValue>(["ALL", "PENDING", "COMPLETED"]).orDefault(
    "ALL"
  ),
};
const PAGE_SIZE = 20;

type RecipientPortalProps = UnwrapPromise<ReturnType<typeof RecipientPortal.getInitialProps>>;

function RecipientPortal({ keycode }: RecipientPortalProps) {
  const intl = useIntl();

  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const [search, setSearch] = useState(state.search ?? "");

  const {
    data: { access },
  } = useAssertQuery(RecipientPortal_accessDocument, { variables: { keycode } });

  const petition = access!.petition!;
  const granter = access!.granter!;
  const contact = access!.contact!;
  const { status } = state;

  const {
    data: {
      accesses: { items: accesses, totalCount },
    },
    fetchMore,
    refetch,
  } = useAssertQueryOrPreviousData(RecipientPortal_accessesDocument, {
    variables: {
      keycode,
      offset: 0,
      limit: PAGE_SIZE,
      search: state.search,
      status:
        state.status === "ALL"
          ? null
          : status === "PENDING"
          ? ["PENDING"]
          : ["COMPLETED", "CLOSED"],
    },
  });
  const {
    data: {
      total: { totalCount: total },
      pending: { totalCount: pending },
      completed: { totalCount: completed },
    },
    refetch: refetchStats,
  } = useAssertQueryOrPreviousData(RecipientPortal_statsDocument, {
    variables: {
      keycode,
      search: state.search,
    },
  });

  const hasMore = accesses.length < totalCount;

  const mainRef = useRef<HTMLDivElement>(null);

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "filter",
    value: status,
    defaultValue: status,
    onChange: (value: RecipientPortalStatusFilterValue) => handleStatusChange(value),
  });

  const handleLoadMore = useCallback(() => {
    fetchMore({ variables: { offset: accesses.length, limit: PAGE_SIZE } });
  }, [fetchMore, accesses]);

  const handleStatusChange = (status: RecipientPortalStatusFilterValue) => {
    mainRef.current!.scrollTo(0, 0);
    setQueryState((current) => ({
      ...current,
      status,
    }));
  };

  const debouncedSearch = useDebouncedCallback(
    (search: string) => {
      mainRef.current!.scrollTo(0, 0);
      setQueryState((current) => ({ ...current, search: search || null }));
    },
    300,
    []
  );

  const handleSearchChange = (search: string) => {
    mainRef.current!.scrollTo(0, 0);
    setSearch(search);
    debouncedSearch(search);
  };

  const titleOrgName = granter.organization.hasRemoveParallelBranding
    ? granter.organization.name
    : "Parallel";

  return (
    <ToneProvider value={petition.tone}>
      <OverrideWithOrganizationTheme
        cssVarsRoot="body"
        brandTheme={granter.organization.brandTheme}
      >
        <Head>
          <title>{`${intl.formatMessage({
            id: "recipient-view.client-portal.my-processes",
            defaultMessage: "My processes",
          })} | ${titleOrgName}`}</title>
        </Head>
        <Flex
          backgroundColor="primary.50"
          minHeight="100vh"
          zIndex={1}
          flexDirection="column"
          alignItems="center"
          paddingX={1.5}
          ref={mainRef}
        >
          <RecipientPortalHeader sender={granter} contact={contact} keycode={keycode} />
          <Flex width="100%" justifyContent="center">
            <Stack maxWidth="container.lg" width="100%" spacing={4} paddingY={4} paddingX={2.5}>
              <HStack>
                <NakedLink href={`/petition/${keycode}`}>
                  <IconButtonWithTooltip
                    as="a"
                    icon={<ArrowBackIcon />}
                    variant="ghost"
                    label={intl.formatMessage({
                      id: "generic.go-back",
                      defaultMessage: "Go back",
                    })}
                  />
                </NakedLink>

                <Heading as="h1" size="md">
                  <FormattedMessage
                    id="recipient-view.client-portal.my-processes"
                    defaultMessage="My processes"
                  />
                </Heading>
              </HStack>
              <Stack direction={{ base: "column", sm: "row" }} spacing={2}>
                <HStack width="100%">
                  <IconButtonWithTooltip
                    onClick={async () => {
                      await refetchStats();
                      await refetch();
                    }}
                    icon={<RepeatIcon />}
                    placement="bottom"
                    variant="outline"
                    label={intl.formatMessage({
                      id: "generic.reload-data",
                      defaultMessage: "Reload",
                    })}
                    backgroundColor="white"
                  />
                  <SearchInput
                    value={search}
                    onChange={(event) => handleSearchChange(event?.target.value)}
                    backgroundColor="white"
                    placeholder={intl.formatMessage({
                      id: "recipient-view.client-portal.search-placeholder",
                      defaultMessage: "Search...",
                    })}
                  />
                </HStack>
                <Box>
                  <RecipientPortalStatusFilter
                    width={{ base: "100%", sm: "220px" }}
                    value={status}
                    onChange={(value) => value && handleStatusChange(value)}
                    textAlign="left"
                  />
                </Box>
              </Stack>

              <Grid
                templateColumns={{
                  base: "repeat(2, 1fr)",
                  sm: "repeat(3, 1fr)",
                }}
                templateAreas={{
                  base: `'ALL ALL' 'PENDING COMPLETED' `,
                  sm: `'ALL PENDING COMPLETED'`,
                }}
                gap={{ base: 2, md: 4 }}
                paddingBottom={{ base: 2, md: 4 }}
                {...getRootProps()}
              >
                <RadioCard {...getRadioProps({ value: "ALL" })}>
                  <HStack>
                    <Text as="span" fontSize="3xl" fontWeight={600}>
                      {total}
                    </Text>
                    <PaperPlaneIcon boxSize={6} color="gray.600" />
                  </HStack>
                  <Text noOfLines={1} wordBreak="break-all">
                    <FormattedMessage id="recipient-view.client-portal.all" defaultMessage="All" />
                  </Text>
                </RadioCard>
                <RadioCard {...getRadioProps({ value: "PENDING" })}>
                  <HStack>
                    <Text as="span" fontSize="3xl" fontWeight={600}>
                      {pending}
                    </Text>
                    <TimeIcon boxSize={6} color="yellow.600" />
                  </HStack>
                  <Text noOfLines={1} wordBreak="break-all">
                    <FormattedMessage
                      id="recipient-view.client-portal.pending"
                      defaultMessage="Pending"
                    />
                  </Text>
                </RadioCard>
                <RadioCard {...getRadioProps({ value: "COMPLETED" })}>
                  <HStack>
                    <Text as="span" fontSize="3xl" fontWeight={600}>
                      {completed}
                    </Text>
                    <CheckIcon boxSize={8} color="green.400" />
                  </HStack>
                  <Text noOfLines={1} wordBreak="break-all">
                    <FormattedMessage
                      id="recipient-view.client-portal.completed"
                      defaultMessage="Completed"
                    />
                  </Text>
                </RadioCard>
              </Grid>

              <Petitions items={accesses} onLoadMore={handleLoadMore} hasMore={hasMore} />
            </Stack>
          </Flex>
        </Flex>
      </OverrideWithOrganizationTheme>
    </ToneProvider>
  );
}

function Petitions({
  items,
  onLoadMore,
  hasMore,
}: {
  items: RecipientPortal_PublicPetitionAccessFragment[];
  onLoadMore: () => void;
  hasMore: boolean;
}) {
  const tone = useTone();

  if (!items.length) {
    return (
      <Stack alignItems="center" textAlign="center" padding={4} spacing={4}>
        <Image
          maxWidth="166px"
          height="77px"
          width="100%"
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/search/empty-search.svg`}
        />
        <Text>
          <FormattedMessage
            id="recipient-view.client-portal.no-results"
            defaultMessage="No results found for your search"
            values={{
              tone,
            }}
          />
        </Text>
      </Stack>
    );
  }

  return (
    <InfiniteScroll
      dataLength={items.length}
      next={onLoadMore}
      hasMore={hasMore}
      loader={
        <Center height="100px" width="100%" zIndex="1">
          <Spinner
            thickness="3px"
            speed="0.65s"
            emptyColor="gray.200"
            color="primary.600"
            size="xl"
          />
        </Center>
      }
      scrollableTarget="main-container"
      style={{ overflow: "display" }}
    >
      <Card width="100%" overflow="hidden">
        {items.map((pa) => {
          return (
            <Fragment key={pa.keycode}>
              <PetitionCard access={pa} />
              <Divider />
            </Fragment>
          );
        })}
      </Card>
    </InfiniteScroll>
  );
}

function PetitionCard({ access }: { access: RecipientPortal_PublicPetitionAccessFragment }) {
  const intl = useIntl();

  const { message, granter, petition, keycode, createdAt } = access;

  const date = message?.sentAt ?? createdAt;

  const hasUnreadComments = petition.hasUnreadComments;

  const visibility = useFieldVisibility(petition.fields);
  const { replied, optional, total } = useMemo(() => {
    let replied = 0;
    let optional = 0;
    let total = 0;
    for (const [field, isVisible] of zip<RecipientPortal_PublicPetitionFieldFragment, boolean>(
      petition.fields,
      visibility
    )) {
      const fieldReplies = completedFieldReplies(field);

      const isHiddenToPublic = field.__typename === "PublicPetitionField" && field.isInternal;
      if (isVisible && !field.isReadOnly && !isHiddenToPublic) {
        replied += fieldReplies.length ? 1 : 0;
        optional += field.optional && !fieldReplies.length ? 1 : 0;
        total += 1;
      }
    }
    return { replied, optional, total };
  }, [petition.fields, visibility]);

  const title = message?.subject ?? petition.fields[0].title;

  return (
    <LinkBox>
      <HStack
        padding={4}
        spacing={0}
        gap={4}
        cursor="pointer"
        _hover={{
          backgroundColor: "gray.50",
        }}
        backgroundColor={hasUnreadComments ? "primary.50" : undefined}
      >
        <Box paddingLeft={2.5} position="relative">
          {hasUnreadComments ? (
            <Circle
              size="10px"
              background="primary.500"
              position="absolute"
              top="calc(50% - 5px)"
              left="-6px"
            />
          ) : null}
          {petition.status === "PENDING" ? (
            <TimeIcon boxSize={8} color="yellow.600" />
          ) : (
            <CheckIcon boxSize={8} color="green.400" />
          )}
        </Box>
        <Grid
          templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
          gap={{ base: 1, md: 4 }}
          width="100%"
        >
          <Stack spacing={0}>
            <NakedLink href={`/petition/${keycode}`} passHref>
              <LinkOverlay
                fontWeight={600}
                noOfLines={[2, 1]}
                wordBreak="break-all"
                color={title ? undefined : "gray.500"}
                fontStyle={title ? "normal" : "italic"}
              >
                {title ??
                  intl.formatMessage({
                    id: "generic.untitled",
                    defaultMessage: "Untitled",
                  })}
              </LinkOverlay>
            </NakedLink>
            <Text fontSize="sm" color="gray.600" noOfLines={2} wordBreak="break-all" zIndex={1}>
              <FormattedMessage
                id="recipient-view.client-portal.requested-by"
                defaultMessage="Requested by {name}, on {date}"
                values={{
                  name: granter?.fullName ?? "",
                  date: (
                    <DateTime
                      value={date}
                      format={FORMATS.L}
                      useRelativeTime={false}
                      title={intl.formatDate(date, FORMATS.LLL)}
                    />
                  ),
                }}
              />
            </Text>
          </Stack>
          <Stack
            direction={{ base: "row", md: "column" }}
            alignItems={{ base: "center", md: "start" }}
            width="100%"
          >
            <Text fontSize="sm" as="span">
              <Text as="span" display={{ base: "none", md: "inline-block" }}>
                <FormattedMessage id="recipient-view.progress" defaultMessage="Progress" />
              </Text>{" "}
              {replied}/{total}
            </Text>
            <ProgressTrack
              size="md"
              min={0}
              max={total}
              value={replied}
              borderRadius="full"
              backgroundColor="gray.200"
              width="100%"
            >
              <ProgressIndicator min={0} max={total} value={replied} backgroundColor="green.400" />
              <ProgressIndicator
                min={0}
                max={total}
                value={optional}
                backgroundColor="green.400"
                sx={generateCssStripe({
                  color: "gray.200",
                  size: "1rem",
                })}
              />
            </ProgressTrack>
          </Stack>
        </Grid>
        <Box display={{ base: "none", sm: "block" }}>
          <ChevronRightIcon boxSize={8} />
        </Box>
      </HStack>
    </LinkBox>
  );
}

function RadioCard(props: RadioProps) {
  const { getInputProps, getCheckboxProps } = useRadio(props);

  const input = getInputProps();
  const checkbox = getCheckboxProps();

  return (
    <Card
      as="label"
      {...checkbox}
      padding={4}
      cursor="pointer"
      isInteractive
      gridArea={props.value}
      _checked={{
        borderColor: "primary.500",
      }}
    >
      <input {...input} />
      <Stack alignItems="center" textAlign="center" spacing={0}>
        {props.children}
      </Stack>
    </Card>
  );
}

const _fragments = {
  get PublicPetitionField() {
    return gql`
      fragment RecipientPortal_PublicPetitionField on PublicPetitionField {
        id
        type
        title
        optional
        isInternal
        isReadOnly
        replies {
          id
        }
        ...useFieldVisibility_PublicPetitionField
        ...completedFieldReplies_PublicPetitionField
      }
      ${useFieldVisibility.fragments.PublicPetitionField}
      ${completedFieldReplies.fragments.PublicPetitionField}
    `;
  },
  get PublicPetition() {
    return gql`
      fragment RecipientPortal_PublicPetition on PublicPetition {
        id
        status
        tone
        hasUnreadComments
        fields {
          ...RecipientPortal_PublicPetitionField
        }
      }
      ${this.PublicPetitionField}
    `;
  },
  get PublicPetitionMessage() {
    return gql`
      fragment RecipientPortal_PublicPetitionMessage on PublicPetitionMessage {
        id
        subject
        sentAt
      }
    `;
  },
  get PublicUser() {
    return gql`
      fragment RecipientPortal_PublicUser on PublicUser {
        id
        fullName
        ...RecipientPortalHeader_PublicUser
        organization {
          id
          name
          hasRemoveParallelBranding
          brandTheme {
            ...OverrideWithOrganizationTheme_OrganizationBrandThemeData
          }
        }
      }
      ${RecipientPortalHeader.fragments.PublicUser}
      ${OverrideWithOrganizationTheme.fragments.OrganizationBrandThemeData}
    `;
  },
  get PublicPetitionAccess() {
    return gql`
      fragment RecipientPortal_PublicPetitionAccess on PublicPetitionAccess {
        keycode
        petition {
          ...RecipientPortal_PublicPetition
        }
        granter {
          ...RecipientPortal_PublicUser
        }
        contact {
          ...RecipientPortalHeader_PublicContact
        }
        message {
          ...RecipientPortal_PublicPetitionMessage
        }
        createdAt
      }
      ${this.PublicPetition}
      ${this.PublicPetitionMessage}
      ${this.PublicUser}
      ${RecipientPortalHeader.fragments.PublicContact}
    `;
  },
};

const _queries = [
  gql`
    query RecipientPortal_access($keycode: ID!) {
      access(keycode: $keycode) {
        ...RecipientPortal_PublicPetitionAccess
      }
    }
    ${_fragments.PublicPetitionAccess}
  `,
  gql`
    query RecipientPortal_stats($keycode: ID!, $search: String) {
      total: accesses(keycode: $keycode, search: $search, status: null) {
        totalCount
      }
      pending: accesses(keycode: $keycode, search: $search, status: [PENDING]) {
        totalCount
      }
      completed: accesses(keycode: $keycode, search: $search, status: [COMPLETED, CLOSED]) {
        totalCount
      }
    }
    ${_fragments.PublicPetitionAccess}
  `,
  gql`
    query RecipientPortal_accesses(
      $keycode: ID!
      $offset: Int
      $limit: Int
      $search: String
      $status: [PetitionStatus!]
    ) {
      accesses(
        keycode: $keycode
        offset: $offset
        limit: $limit
        search: $search
        status: $status
      ) {
        totalCount
        items {
          ...RecipientPortal_PublicPetitionAccess
        }
      }
    }
    ${_fragments.PublicPetitionAccess}
  `,
];

RecipientPortal.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const keycode = query.keycode as string;
  const state = parseQuery(query, QUERY_STATE);
  try {
    await Promise.all([
      fetchQuery(RecipientPortal_accessDocument, {
        variables: { keycode },
      }),
      fetchQuery(RecipientPortal_statsDocument, {
        variables: {
          keycode,
          search: state.search,
        },
      }),
      fetchQuery(RecipientPortal_accessesDocument, {
        variables: {
          keycode,
          offset: 0,
          limit: PAGE_SIZE,
          search: state.search,
          status:
            state.status === "ALL"
              ? null
              : state.status === "PENDING"
              ? ["PENDING"]
              : ["COMPLETED", "CLOSED"],
        },
      }),
    ]);
    return {
      keycode,
    };
  } catch (error) {
    if (error instanceof RedirectError) {
      throw error;
    }
    if (
      isApolloError(error, "PUBLIC_PETITION_NOT_AVAILABLE") ||
      isApolloError(error, "CONTACT_NOT_FOUND") ||
      isApolloError(error, "CONTACT_NOT_VERIFIED")
    ) {
      throw new RedirectError(`/petition/${keycode}`);
    }
    throw error;
  }
};

export default compose(withApolloData, withDialogs)(RecipientPortal);
