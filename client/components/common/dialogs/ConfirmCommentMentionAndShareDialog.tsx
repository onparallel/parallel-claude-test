import { gql, useFragment } from "@apollo/client";
import {
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  HStack,
  ListItem,
  Stack,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import { UserGroupReference } from "@parallel/components/petition-activity/UserGroupReference";
import { UserReference } from "@parallel/components/petition-activity/UserReference";
import { PetitionPermissionTypeSelect } from "@parallel/components/petition-common/PetitionPermissionTypeSelect";
import {
  ConfirmCommentMentionAndShareDialog_PetitionFragmentDoc,
  PetitionPermissionTypeRW,
  usePetitionCommentsMutations_getUsersOrGroupsQuery,
} from "@parallel/graphql/__types";
import { partitionOnTypename } from "@parallel/utils/apollo/typename";
import { Maybe } from "@parallel/utils/types";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { ConfirmDialog } from "./ConfirmDialog";
import { DialogProps, useDialog } from "./DialogProvider";

interface ConfirmCommentMentionAndShareDialogProps {
  petitionId: string;
  usersAndGroups: usePetitionCommentsMutations_getUsersOrGroupsQuery["getUsersOrGroups"];
  isInternal?: Maybe<boolean>;
}

type ConfirmCommentMentionAndShareDialogResult =
  | {
      sharePetition: false;
    }
  | {
      sharePetition: true;
      sharePetitionPermission: PetitionPermissionTypeRW;
      sharePetitionSubscribed: boolean;
    };

function ConfirmCommentMentionAndShareDialog({
  petitionId,
  usersAndGroups,
  isInternal,
  ...props
}: DialogProps<
  ConfirmCommentMentionAndShareDialogProps,
  ConfirmCommentMentionAndShareDialogResult
>) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const { data, complete } = useFragment({
    fragment: ConfirmCommentMentionAndShareDialog_PetitionFragmentDoc,
    from: {
      __typename: "Petition",
      id: petitionId,
    },
  });
  if (!complete) {
    throw new Error("Data should be cached");
  }
  const { permissionType, isSubscribed } = data!.myEffectivePermission!;
  const { control, register, handleSubmit } = useForm({
    defaultValues: {
      sharePetitionPermission: permissionType === "OWNER" ? "WRITE" : permissionType,
      sharePetitionSubscribed: isSubscribed,
    },
  });
  const intl = useIntl();
  const [users, groups] = partitionOnTypename(usersAndGroups, "User");
  return (
    <ConfirmDialog
      {...props}
      initialFocusRef={confirmRef}
      closeOnOverlayClick={false}
      closeOnEsc={false}
      header={
        <FormattedMessage
          id="component.confirm-comment-mention-and-share-dialog.header"
          defaultMessage="Users without access"
        />
      }
      body={
        <Stack>
          <FormattedMessage
            id="component.confirm-comment-mention-and-share-dialog.body"
            defaultMessage="The following {entries} won't be able to see your {isNote, select, true{note} other{comment}} because the parallel is not shared with them:"
            values={{
              isNote: isInternal,
              entries: intl.formatList(
                [
                  users.length > 0
                    ? intl
                        .formatMessage({ id: "generic.users", defaultMessage: "Users" })
                        .toLowerCase()
                    : null,
                  groups.length > 0
                    ? intl
                        .formatMessage({ id: "generic.groups", defaultMessage: "Teams" })
                        .toLowerCase()
                    : null,
                ].filter(isDefined),
                { type: "conjunction" },
              ),
            }}
          />
          <UnorderedList paddingStart={2}>
            {[...users, ...groups].map((t, i) => (
              <ListItem key={i}>
                {t.__typename === "User" ? (
                  <UserReference user={t} />
                ) : (
                  <UserGroupReference userGroup={t} />
                )}
              </ListItem>
            ))}
          </UnorderedList>

          <Text>
            <FormattedMessage
              id="component.confirm-comment-mention-and-share-dialog.body-confirm"
              defaultMessage="Do you want to share the parallel with them so the message can be read?"
            />
          </Text>

          {["OWNER", "WRITE"].includes(permissionType) ? (
            <FormControl as={HStack}>
              <FormLabel margin={0} fontWeight="normal" flex={1}>
                <FormattedMessage
                  id="component.confirm-comment-mention-and-share-dialog.body-share-as"
                  defaultMessage="Share parallel as:"
                />
              </FormLabel>
              <Controller
                name="sharePetitionPermission"
                control={control}
                render={({ field: { value, onChange, onBlur } }) => (
                  <PetitionPermissionTypeSelect
                    value={value}
                    onChange={(value) => onChange(value! as "WRITE" | "READ")}
                    onBlur={onBlur}
                    hideOwner
                    isSearchable={false}
                  />
                )}
              />
            </FormControl>
          ) : null}

          <FormControl>
            <Checkbox {...register("sharePetitionSubscribed")} defaultChecked>
              <FormattedMessage
                id="component.confirm-comment-mention-and-share-dialog.body-subscribe-to-notifications"
                defaultMessage="Subscribe to notifications"
              />
            </Checkbox>
          </FormControl>
        </Stack>
      }
      confirm={
        <Button
          ref={confirmRef}
          colorScheme="primary"
          onClick={handleSubmit((data) => {
            props.onResolve({
              sharePetition: true,
              ...data,
            });
          })}
        >
          <FormattedMessage
            id="component.confirm-comment-mention-and-share-dialog.confirm"
            defaultMessage="Share and continue"
          />
        </Button>
      }
      cancel={
        <Button
          onClick={handleSubmit(() => {
            props.onResolve({ sharePetition: false });
          })}
        >
          <FormattedMessage
            id="component.confirm-comment-mention-and-share-dialog.cancel"
            defaultMessage="Continue without sharing"
          />
        </Button>
      }
    />
  );
}

ConfirmCommentMentionAndShareDialog.fragments = {
  Petition: gql`
    fragment ConfirmCommentMentionAndShareDialog_Petition on Petition {
      myEffectivePermission {
        permissionType
        isSubscribed
      }
    }
  `,
};

export function useConfirmCommentMentionAndShareDialog() {
  return useDialog(ConfirmCommentMentionAndShareDialog);
}
