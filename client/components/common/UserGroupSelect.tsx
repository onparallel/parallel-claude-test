import { Image, Stack, Text } from "@chakra-ui/react";
import { UserSelect_UserGroupFragment } from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { NoticeProps } from "react-select";
import { UserSelect, UserSelectProps } from "./UserSelect";

interface UserGroupSelectProps<IsMulti extends boolean>
  extends UserSelectProps<IsMulti, true, false, UserSelect_UserGroupFragment> {}

export function UserGroupSelect<IsMulti extends boolean>({
  includeGroups,
  isMulti,
  ...props
}: UserGroupSelectProps<IsMulti>) {
  const intl = useIntl();
  return (
    <UserSelect
      isMulti={isMulti}
      includeGroups
      components={{ NoOptionsMessage } as any}
      placeholder={intl.formatMessage({
        id: "component.user-group-select.placeholder",
        defaultMessage: "Select teams from your organization",
      })}
      {...props}
    />
  );
}

function NoOptionsMessage(props: NoticeProps) {
  const {
    selectProps: { inputValue: search },
  } = props;
  return (
    <Stack alignItems="center" textAlign="center" padding={4} spacing={4}>
      {search ? (
        <>
          <Image
            maxWidth="166px"
            height="77px"
            width="100%"
            src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/search/empty-search.svg`}
          />
          <Text as="strong">
            <FormattedMessage
              id="component.user-group-select.no-options"
              defaultMessage="No teams have been found"
            />
          </Text>
        </>
      ) : (
        <Text as="div" color="gray.400">
          <FormattedMessage
            id="component.user-group-select.search-hint-teams"
            defaultMessage="Search for existing teams"
          />
        </Text>
      )}
    </Stack>
  );
}
