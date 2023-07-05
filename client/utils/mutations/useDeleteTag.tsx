import { gql, useMutation } from "@apollo/client";
import { Stack, Text } from "@chakra-ui/react";
import { useConfirmDeleteDialog } from "@parallel/components/common/dialogs/ConfirmDeleteDialog";
import { useDeleteTag_deleteTagDocument } from "@parallel/graphql/__types";
import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { isApolloError } from "../apollo/isApolloError";

export function useDeleteTag() {
  const [deleteTag] = useMutation(useDeleteTag_deleteTagDocument);

  const showConfirmDeleteTag = useConfirmDeleteTagDialog();

  return async function ({ id, name }: { id: string; name: string }) {
    try {
      const { data } = await deleteTag({
        variables: { id },
        update(cache) {
          cache.evict({ fieldName: "me" });
          cache.evict({ fieldName: "tags" });
          cache.evict({ fieldName: "petitions" });
          cache.evict({ id });
          cache.gc();
        },
      });

      return data!.deleteTag;
    } catch (e) {
      if (isApolloError(e, "TAG_IS_USED")) {
        await showConfirmDeleteTag({
          name,
          extra: (e.graphQLErrors[0].extensions as any)?.data ?? [],
        });
        const { data } = await deleteTag({
          variables: { id, force: true },
          update(cache) {
            cache.evict({ fieldName: "me" });
            cache.evict({ fieldName: "tags" });
            cache.evict({ fieldName: "petitions" });
            cache.evict({ id });
            cache.gc();
          },
        });

        return data!.deleteTag;
      }
    }
  };
}

useDeleteTag.mutations = [
  gql`
    mutation useDeleteTag_deleteTag($id: GID!, $force: Boolean) {
      deleteTag(id: $id, force: $force)
    }
  `,
];

function useConfirmDeleteTagDialog() {
  const intl = useIntl();
  const showDialog = useConfirmDeleteDialog();
  return useCallback(
    async ({
      name,
      extra,
    }: {
      name: string;
      extra: {
        fullName: string;
        email: string;
        petitionCount: number;
        templateCount: number;
        petitionListViewCount: number;
      }[];
    }) => {
      return await showDialog({
        size: "lg",
        header: (
          <FormattedMessage
            id="component.use-delete-tag.confirm-tag-header"
            defaultMessage='Delete "{tag}"'
            values={{ tag: name }}
          />
        ),
        description: (
          <Stack>
            <Text>
              <FormattedMessage
                id="component.use-delete-tag.users-with-tag"
                defaultMessage="The following users are using the selected tag:"
              />
            </Text>
            <Stack as="ul" paddingLeft={8} spacing={0}>
              {extra.map((data, i) => {
                const { fullName, email, petitionCount, templateCount, petitionListViewCount } =
                  data;

                return (
                  <Text as="li" key={i}>{`${fullName} <${email}> (${intl.formatList(
                    [
                      petitionCount
                        ? intl.formatMessage(
                            {
                              id: "generic.petition-count",
                              defaultMessage:
                                "{count, plural, =1 {# parallel} other {# parallels}}",
                            },
                            { count: petitionCount }
                          )
                        : null,
                      templateCount
                        ? intl.formatMessage(
                            {
                              id: "generic.template-count",
                              defaultMessage:
                                "{count, plural, =1 {# template} other {# templates}}",
                            },
                            { count: templateCount }
                          )
                        : null,
                      petitionListViewCount
                        ? intl.formatMessage(
                            {
                              id: "component.use-delete-tag.views-count",
                              defaultMessage: "{count, plural, =1 {# view} other {# views}}",
                            },
                            { count: petitionListViewCount }
                          )
                        : null,
                    ].filter(isDefined)
                  )})`}</Text>
                );
              })}
            </Stack>
            <Text>
              <FormattedMessage
                id="component.use-delete-tag.deleting-tag-parallels-views"
                defaultMessage="Deleting the tag will remove it from the parallels and views that are using it."
              />
            </Text>
          </Stack>
        ),
      });
    },
    []
  );
}
