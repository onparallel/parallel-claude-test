import { gql } from "@apollo/client";
import { Image, Link as ChakraLink, Stack, Text } from "@chakra-ui/core";
import { UserSelect_UserFragment } from "@parallel/graphql/__types";
import { forwardRef, memo, ReactNode, Ref, useCallback, useMemo } from "react";
import { FormattedMessage } from "react-intl";
import { components, OptionProps } from "react-select";
import AsyncSelect, { Props as AsyncSelectProps } from "react-select/async";
import {
  useReactSelectStyle,
  UserReactSelectStyleProps,
} from "../../utils/useReactSelectStyle";

export type UserSelectSelection = UserSelect_UserFragment;

export type UserSelectProps = Omit<
  AsyncSelectProps<UserSelectSelection>,
  "value" | "onChange"
> & {
  value?: UserSelectSelection[];
  onChange?: (users: UserSelectSelection[]) => void;
  isInvalid?: boolean;
  onSearchUsers: (
    search: string,
    exclude: string[]
  ) => Promise<UserSelectSelection[]>;
};

export type UserSelectInstance = AsyncSelect<UserSelectSelection>;

export const UserSelect = Object.assign(
  forwardRef(function (
    { value, isInvalid, onSearchUsers, onChange, ...props }: UserSelectProps,
    ref: Ref<UserSelectInstance>
  ) {
    const loadOptions = useCallback(
      async (search) => {
        const exclude = [];
        for (const user of value ?? []) {
          exclude.push(user.id);
        }
        return await onSearchUsers(search, exclude);
      },
      [onSearchUsers, value]
    );

    const reactSelectProps = useReactSelectProps({ isInvalid });

    return (
      <AsyncSelect<UserSelectSelection>
        ref={ref}
        value={value}
        onChange={(value) => onChange?.((value as any) ?? [])}
        isMulti
        loadOptions={loadOptions}
        {...reactSelectProps}
        {...props}
      />
    );
  }),
  {
    fragments: {
      User: gql`
        fragment UserSelect_User on User {
          id
          fullName
          email
        }
      `,
    },
  }
);

function useReactSelectProps(props: UserReactSelectStyleProps) {
  const styleProps = useReactSelectStyle<UserSelectSelection>(props);
  return useMemo(
    () =>
      ({
        ...styleProps,
        components: {
          ...styleProps.components,
          NoOptionsMessage: memo(({ selectProps }) => {
            const search = selectProps.inputValue;
            return (
              <Stack alignItems="center" textAlign="center" padding={4}>
                {search ? (
                  <>
                    <Image
                      width="120px"
                      src="/static/images/undraw_void.svg"
                      role="presentation"
                    />
                    <Text as="strong">
                      <FormattedMessage
                        id="component.user-select.no-options"
                        defaultMessage="Can't find someone?"
                      />
                    </Text>
                    <Text>
                      <FormattedMessage
                        id="component.user-select.no-options-contact-us"
                        defaultMessage="Contact us via email on <a>support@parallel.so</a> or the support chat and we will create them an account"
                        values={{
                          a: (chunks: any[]) => (
                            <ChakraLink href={`mailto:${chunks[0]}`}>
                              {chunks}
                            </ChakraLink>
                          ),
                        }}
                      />
                    </Text>
                  </>
                ) : (
                  <Text as="div" color="gray.400">
                    <FormattedMessage
                      id="component.user-select.search-hint"
                      defaultMessage="Search for exisiting users"
                    />
                  </Text>
                )}
              </Stack>
            );
          }),
          MultiValueLabel: memo(
            ({
              data,
              children,
              ...props
            }: {
              data: UserSelectSelection;
              children: ReactNode;
            }) => {
              const { fullName, email } = data;
              return (
                <components.MultiValueLabel {...props}>
                  <Text as="span" marginLeft={1}>
                    {fullName ? `${fullName} <${email}>` : email}
                  </Text>
                </components.MultiValueLabel>
              );
            }
          ),
          Option: ({
            children,
            data,
            ...props
          }: Omit<OptionProps<UserSelectSelection>, "data"> & {
            data: UserSelectSelection;
          }) => {
            return (
              <components.Option data={data} {...props}>
                {data.fullName ? (
                  <Text as="span" verticalAlign="baseline">
                    <Text as="span">{data.fullName}</Text>
                    <Text as="span" display="inline-block" width={2} />
                    <Text as="span" fontSize="sm" color="gray.500">
                      {data.email}
                    </Text>
                  </Text>
                ) : (
                  <Text as="span">{data.email}</Text>
                )}
              </components.Option>
            );
          },
        },
        getOptionLabel: (option) => {
          if ((option as any).__isNew__) {
            return (option as any).label;
          } else {
            return option.email;
          }
        },
        getOptionValue: (option) => option.id,
      } as Partial<AsyncSelectProps<UserSelectSelection>>),
    [styleProps]
  );
}
