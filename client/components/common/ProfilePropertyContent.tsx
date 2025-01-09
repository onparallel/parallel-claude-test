import { gql } from "@apollo/client";
import { Box, Button, Flex, HStack, List, ListItem, Text } from "@chakra-ui/react";
import { BusinessIcon, SearchIcon, UserIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Link } from "@parallel/components/common/Link";
import {
  ProfilePropertyContent_ProfileFieldFileFragment,
  ProfilePropertyContent_ProfileFieldValueFragment,
  ProfilePropertyContent_ProfileTypeFieldFragment,
} from "@parallel/graphql/__types";
import { EnumerateList } from "@parallel/utils/EnumerateList";
import { never } from "@parallel/utils/never";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { ProfileTypeFieldOptions } from "@parallel/utils/profileFields";
import { withError } from "@parallel/utils/promises/withError";
import { assertType } from "@parallel/utils/types";
import { useDownloadProfileFieldFile } from "@parallel/utils/useDownloadProfileFieldFile";
import { useIsGlobalKeyDown } from "@parallel/utils/useIsGlobalKeyDown";
import { MouseEvent } from "react";
import { FormattedDate, FormattedMessage, FormattedNumber, useIntl } from "react-intl";
import { isNonNullish, isNullish, pick } from "remeda";
import { assert } from "ts-essentials";
import { BackgroundCheckRiskLabel } from "../petition-common/BackgroundCheckRiskLabel";
import { BreakLines } from "./BreakLines";
import { LocalizableUserTextRender } from "./LocalizableUserTextRender";
import { OverflownText } from "./OverflownText";
import { SimpleFileButton } from "./SimpleFileButton";
import { SmallPopover } from "./SmallPopover";

export interface ProfilePropertyContentProps {
  profileId?: string;
  field: ProfilePropertyContent_ProfileTypeFieldFragment;
  files?: ProfilePropertyContent_ProfileFieldFileFragment[] | null;
  value?: ProfilePropertyContent_ProfileFieldValueFragment | null;
  singleLine?: boolean;
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
  function ProfileFieldFiles({ files, field, profileId, singleLine, ...props }, ref) {
    assert(files !== undefined, "files must be defined if field type is FILE");
    const downloadProfileFieldFile = useDownloadProfileFieldFile();
    const isShiftDown = useIsGlobalKeyDown("Shift");
    const buttons =
      files?.map((file) => (
        <SimpleFileButton
          key={undefined}
          {...pick(file.file!, ["filename", "contentType"])}
          onClick={
            isNonNullish(profileId) && isNonNullish(file.id)
              ? () =>
                  withError(downloadProfileFieldFile(profileId, field.id, file.id!, !isShiftDown))
              : undefined
          }
        />
      )) ?? [];
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
    ) : singleLine ? (
      <EnumerateList
        values={files ?? []}
        maxItems={1}
        renderItem={({ value }, index) => (
          <SimpleFileButton
            key={index}
            {...pick(value.file!, ["filename", "contentType"])}
            onClick={
              isNonNullish(profileId) && isNonNullish(value.id)
                ? (event) => {
                    event.stopPropagation();
                    withError(
                      downloadProfileFieldFile(profileId, field.id, value.id!, !isShiftDown),
                    );
                  }
                : undefined
            }
          />
        )}
        renderOther={({ children, remaining }) => (
          <SmallPopover
            content={
              <List display="flex" flexWrap="wrap" gap={1}>
                {remaining
                  .filter((file) => isNonNullish(file.file))
                  .map((file, i) => (
                    <ListItem key={i} minWidth={0} display="flex">
                      <SimpleFileButton
                        {...pick(file.file!, ["filename", "contentType"])}
                        onClick={
                          isNonNullish(profileId) && isNonNullish(file.id)
                            ? (event) => {
                                event.stopPropagation();
                                withError(
                                  downloadProfileFieldFile(
                                    profileId,
                                    field.id,
                                    file.id!,
                                    !isShiftDown,
                                  ),
                                );
                              }
                            : undefined
                        }
                      />
                    </ListItem>
                  ))}
              </List>
            }
          >
            <Link href="#">{children}</Link>
          </SmallPopover>
        )}
      />
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
  function ProfileFieldValue({ value, field, profileId, singleLine, ...props }, ref) {
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
      if (singleLine && ["SHORT_TEXT", "TEXT"].includes(field.type)) {
        const { noOfLines: _, ...rest } = props;
        //TODO pass ref
        return <OverflownText {...rest}>{content.value}</OverflownText>;
      } else if (field.type === "SHORT_TEXT") {
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
            width="fit-content"
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
        if (singleLine) {
          const values = content.value.map((v: string) => {
            assertType<ProfileTypeFieldOptions<"CHECKBOX">>(field.options);
            const option = field.options.values.find((o) => o.value === v);
            return isNullish(option) ? (
              v
            ) : (
              <LocalizableUserTextRender value={option.label} default={v} />
            );
          });
          const { noOfLines: _, ...rest } = props;
          return (
            <Flex gap={1} ref={ref} {...rest}>
              <EnumerateList
                values={values as string[]}
                maxItems={1}
                renderItem={({ value }, index) => (
                  <OverflownText key={index}>{value}</OverflownText>
                )}
                renderOther={({ children, remaining }) => (
                  <SmallPopover
                    content={
                      <List display="flex" flexWrap="wrap" gap={1}>
                        {remaining.map((value, i) => (
                          <ListItem key={i} minWidth={0} display="flex">
                            <Text as="span">{value}</Text>
                          </ListItem>
                        ))}
                      </List>
                    }
                  >
                    <Link href="#">{children}</Link>
                  </SmallPopover>
                )}
              />
            </Flex>
          );
        } else {
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
        }
      } else if (field.type === "BACKGROUND_CHECK") {
        const { noOfLines: _, ...rest } = props;
        return (
          <ProfileFieldBackgroundCheckValue
            value={value}
            field={field}
            profileId={profileId}
            {...rest}
          />
        );
      } else {
        never(`ProfileTypeFieldType ${field.type} not implemented`);
      }
    }
  },
);

const ProfileFieldBackgroundCheckValue = chakraForwardRef<"div", ProfilePropertyContentProps>(
  function ProfileFieldBackgroundCheckValue({ value, field, profileId, ...props }, ref) {
    const intl = useIntl();
    const content = value!.content!;
    const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      try {
        const { entity, query } = content;
        const { name, date, type, country } = query ?? {};
        const url = `/${intl.locale}/app/background-check/${isNonNullish(entity) ? entity.id : "results"}?${new URLSearchParams(
          {
            token: btoa(JSON.stringify({ profileTypeFieldId: field.id, profileId })),
            ...(name ? { name } : {}),
            ...(date ? { date } : {}),
            ...(type ? { type } : {}),
            ...(country ? { country } : {}),
            readonly: "true",
          },
        )}`;
        await openNewWindow(url);
      } catch {}
    };

    const topics = content.entity?.properties?.topics ?? [];

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
              {topics.length > 3 ? (
                <HStack spacing={1}>
                  <EnumerateList
                    values={topics as string[]}
                    maxItems={1}
                    renderItem={({ value }, index) => (
                      <BackgroundCheckRiskLabel key={index} risk={value} />
                    )}
                    renderOther={({ children, remaining }) => (
                      <SmallPopover
                        content={
                          <List display="flex" flexWrap="wrap" gap={1.5}>
                            {remaining.map((value, i) => (
                              <ListItem key={i} minWidth={0} display="flex">
                                <BackgroundCheckRiskLabel risk={value} />
                              </ListItem>
                            ))}
                          </List>
                        }
                      >
                        <Link href="#">{children}</Link>
                      </SmallPopover>
                    )}
                  />
                </HStack>
              ) : (
                <HStack marginStart={1}>
                  {(content.entity?.properties?.topics as string[] | undefined)?.map((topic, i) => (
                    <BackgroundCheckRiskLabel key={i} risk={topic} />
                  ))}
                </HStack>
              )}
            </>
          ) : (
            <>
              <SearchIcon boxSize={3} />
              <HStack marginStart={1} spacing={1} display="inline-flex">
                {content.query.type === "PERSON" ? (
                  <UserIcon boxSize={4} />
                ) : content.query.type === "COMPANY" ? (
                  <BusinessIcon boxSize={4} />
                ) : null}
                <Box display="inline-flex" minWidth="40px" maxWidth="100px">
                  {'"'}
                  <OverflownText fontWeight="normal">{content.query.name}</OverflownText>
                  {'"'}
                </Box>
                <Box fontWeight="normal" fontStyle="italic">
                  <FormattedMessage
                    id="generic.x-results"
                    defaultMessage="{count, plural, =0 {No results} =1 {1 result} other {# results}}"
                    values={{
                      count: content.search?.totalCount ?? 0,
                    }}
                  />
                </Box>
              </HStack>
            </>
          )}
        </Button>
      </Flex>
    );
  },
);
