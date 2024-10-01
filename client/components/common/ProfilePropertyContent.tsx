import { gql } from "@apollo/client";
import { Box, Button, Flex, HStack, List, ListItem, Text } from "@chakra-ui/react";
import { BusinessIcon, SearchIcon, UserIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  ProfilePropertyContent_ProfileFieldFileFragment,
  ProfilePropertyContent_ProfileFieldValueFragment,
  ProfilePropertyContent_ProfileTypeFieldFragment,
} from "@parallel/graphql/__types";
import { getEntityTypeLabel } from "@parallel/utils/getEntityTypeLabel";
import { never } from "@parallel/utils/never";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { ProfileTypeFieldOptions } from "@parallel/utils/profileFields";
import { withError } from "@parallel/utils/promises/withError";
import { assertType } from "@parallel/utils/types";
import { useDownloadProfileFieldFile } from "@parallel/utils/useDownloadProfileFieldFile";
import { useIsGlobalKeyDown } from "@parallel/utils/useIsGlobalKeyDown";
import { FormattedDate, FormattedMessage, FormattedNumber, useIntl } from "react-intl";
import { isNonNullish, isNullish, pick } from "remeda";
import { assert } from "ts-essentials";
import { BackgroundCheckRiskLabel } from "../petition-common/BackgroundCheckRiskLabel";
import { BreakLines } from "./BreakLines";
import { Divider } from "./Divider";
import { LocalizableUserTextRender } from "./LocalizableUserTextRender";
import { OverflownText } from "./OverflownText";
import { SimpleFileButton } from "./SimpleFileButton";

export interface ProfilePropertyContentProps {
  profileId?: string;
  field: ProfilePropertyContent_ProfileTypeFieldFragment;
  files?: ProfilePropertyContent_ProfileFieldFileFragment[] | null;
  value?: ProfilePropertyContent_ProfileFieldValueFragment | null;
}

export const ProfilePropertyContent = Object.assign(
  chakraForwardRef<"p" | "span" | "ul" | "div", ProfilePropertyContentProps>(
    function ProfileFieldValueContent(props, ref) {
      if (props.field.type === "FILE") {
        return <ProfileFieldFiles ref={ref} {...(props as any)} />;
      } else {
        return <ProfileFieldValue ref={ref} {...(props as any)} />;
      }
    },
  ),
  {
    fragments: {
      ProfileTypeField: gql`
        fragment ProfilePropertyContent_ProfileTypeField on ProfileTypeField {
          id
          type
          options
        }
      `,
      ProfileFieldValue: gql`
        fragment ProfilePropertyContent_ProfileFieldValue on ProfileFieldValue {
          content
        }
      `,
      // make id optional so "fake" values can be passed
      ProfileFieldFile: gql`
        fragment ProfilePropertyContent_ProfileFieldFile on ProfileFieldFile {
          id @include(if: true)
          file {
            filename
            contentType
          }
        }
      `,
    },
  },
);

const ProfileFieldFiles = chakraForwardRef<"ul" | "div", ProfilePropertyContentProps>(
  function ProfileFieldFiles({ files, field, profileId, ...props }, ref) {
    assert(isNonNullish(files), "files must be defined if field type is FILE");
    const downloadProfileFieldFile = useDownloadProfileFieldFile();
    const isShiftDown = useIsGlobalKeyDown("Shift");
    const buttons = files.map((file) => (
      <SimpleFileButton
        key={undefined}
        {...pick(file.file!, ["filename", "contentType"])}
        onClick={
          isNonNullish(profileId) && isNonNullish(file.id)
            ? () => withError(downloadProfileFieldFile(profileId, field.id, file.id!, !isShiftDown))
            : undefined
        }
      />
    ));
    return buttons.length === 0 ? (
      <Box ref={ref} textStyle="hint" {...props}>
        <FormattedMessage
          id="component.petition-field-replies-content.no-value"
          defaultMessage="No value"
        />
      </Box>
    ) : buttons.length === 1 ? (
      <Flex ref={ref} {...(props as any)}>
        {buttons[0]}
      </Flex>
    ) : (
      <List ref={ref} display="flex" flexWrap="wrap" gap={1} {...(props as any)}>
        {buttons.map((button, i) => (
          <ListItem key={i} minWidth={0} display="flex">
            {button}
          </ListItem>
        ))}
      </List>
    );
  },
);

const ProfileFieldValue = chakraForwardRef<"p" | "span" | "div", ProfilePropertyContentProps>(
  function ProfileFieldValue({ value, field, profileId, ...props }, ref) {
    if (isNullish(value)) {
      return (
        <Box ref={ref} as="span" textStyle="hint" {...props}>
          <FormattedMessage
            id="component.profile-property-content.no-value"
            defaultMessage="No value"
          />
        </Box>
      );
    } else {
      assert(isNonNullish(value), `value must be defined if field type is ${field.type}`);
      const content = value.content!;
      if (field.type === "SHORT_TEXT") {
        return (
          <Box as="span" ref={ref} {...props}>
            {content.value}
          </Box>
        );
      } else if (field.type === "TEXT") {
        return (
          <Text ref={ref} {...props}>
            <BreakLines>{content.value}</BreakLines>
          </Text>
        );
      } else if (field.type === "SELECT") {
        assertType<ProfileTypeFieldOptions<"SELECT">>(field.options);
        const option = field.options.values.find((o) => o.value === content.value);
        return isNullish(option) ? (
          <Box as="span" ref={ref} {...props}>
            {content.value}
          </Box>
        ) : field.options.showOptionsWithColors ? (
          <Box
            as="span"
            ref={ref}
            display="inline-block"
            color="gray.800"
            paddingInline={2}
            lineHeight={6}
            height={6}
            fontSize="sm"
            backgroundColor={option.color}
            borderRadius="full"
            {...props}
          >
            <LocalizableUserTextRender value={option.label} default={content.value} />
          </Box>
        ) : (
          <Box as="span" ref={ref} {...props}>
            <LocalizableUserTextRender value={option.label} default={content.value} />
          </Box>
        );
      } else if (field.type === "DATE") {
        return (
          <Box as="span" ref={ref} {...props}>
            <FormattedDate value={content.value} />
          </Box>
        );
      } else if (field.type === "PHONE") {
        return (
          <Box as="span" ref={ref} {...props}>
            {content.pretty}
          </Box>
        );
      } else if (field.type === "NUMBER") {
        return (
          <Box as="span" ref={ref} {...props}>
            <FormattedNumber value={content.value} />
          </Box>
        );
      } else if (field.type === "CHECKBOX") {
        return (
          <List key={undefined}>
            {content.value.map((v: string) => {
              assertType<ProfileTypeFieldOptions<"CHECKBOX">>(field.options);
              const option = field.options.values.find((o) => o.value === v);
              return (
                <ListItem key={v}>
                  {isNullish(option) ? (
                    v
                  ) : (
                    <LocalizableUserTextRender value={option.label} default={v} />
                  )}
                </ListItem>
              );
            })}
          </List>
        );
      } else if (field.type === "BACKGROUND_CHECK") {
        return (
          <ProfileFieldBackgroundCheck
            value={value}
            field={field}
            profileId={profileId}
            {...props}
          />
        );
      } else {
        never(`ProfileTypeFieldType ${field.type} not implemented`);
      }
    }
  },
);

const ProfileFieldBackgroundCheck = chakraForwardRef<"div", ProfilePropertyContentProps>(
  function ProfileFieldBackgroundCheck({ value, field, profileId, ...props }, ref) {
    const intl = useIntl();
    const content = value!.content!;
    const handleClick = async () => {
      try {
        const { entity, query } = content;
        const { name, date, type } = query ?? {};
        const url = `/${intl.locale}/app/background-check/${isNonNullish(entity) ? entity.id : "results"}?${new URLSearchParams(
          {
            token: btoa(JSON.stringify({ profileTypeFieldId: field.id, profileId })),
            ...(name ? { name } : {}),
            ...(date ? { date } : {}),
            ...(type ? { type } : {}),
            readonly: "true",
          },
        )}`;
        await openNewWindow(url);
      } catch {}
    };
    return (
      <Flex ref={ref} {...props}>
        <Button
          variant="outline"
          size="sm"
          backgroundColor="white"
          alignItems="center"
          height="auto"
          paddingX={2}
          paddingY={1}
          onClick={handleClick}
        >
          {isNonNullish(content.entity) ? (
            <>
              {content.entity.type === "Person" ? (
                <UserIcon boxSize={4} />
              ) : (
                <BusinessIcon boxSize={4} />
              )}
              <OverflownText marginStart={1} minWidth="40px">
                {content.entity.name}
              </OverflownText>
              <HStack marginStart={1}>
                {(content.entity?.properties?.topics as string[] | undefined)?.map((topic, i) => (
                  <BackgroundCheckRiskLabel key={i} risk={topic} />
                ))}
              </HStack>
            </>
          ) : (
            <>
              <SearchIcon />
              <HStack
                display="inline-flex"
                divider={<Divider isVertical height={3.5} color="gray.500" />}
              >
                <Box>{getEntityTypeLabel(intl, content.query.type)}</Box>
                <OverflownText minWidth="40px">{content.query.name}</OverflownText>
              </HStack>
            </>
          )}
        </Button>
      </Flex>
    );
  },
);
