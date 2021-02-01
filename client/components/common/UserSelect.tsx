import { gql } from "@apollo/client";
import { Image, Stack, Text } from "@chakra-ui/react";
import { UserSelect_UserFragment } from "@parallel/graphql/__types";
import {
  useReactSelectProps,
  UseReactSelectProps,
} from "@parallel/utils/useReactSelectProps";
import { forwardRef, memo, ReactNode, useCallback, useMemo } from "react";
import { FormattedMessage } from "react-intl";
import { components, OptionProps } from "react-select";
import AsyncSelect, { Props as AsyncSelectProps } from "react-select/async";
import { NormalLink } from "./Link";

export type UserSelectSelection = UserSelect_UserFragment;

export type UserSelectInstance<IsMulti extends boolean> = AsyncSelect<
  UserSelectSelection,
  IsMulti
>;

type AsyncUserSelectProps<IsMulti extends boolean> = AsyncSelectProps<
  UserSelectSelection,
  IsMulti
>;

interface UserSelectProps<IsMulti extends boolean>
  extends Omit<AsyncUserSelectProps<IsMulti>, "value" | "onChange">,
    UseReactSelectProps {
  value?: IsMulti extends true ? UserSelectSelection[] : UserSelectSelection;
  onChange?: IsMulti extends true
    ? (users: UserSelectSelection[]) => void
    : (user: UserSelectSelection) => void;

  onSearchUsers: (
    search: string,
    exclude: string[]
  ) => Promise<UserSelectSelection[]>;
}

const fragments = {
  User: gql`
    fragment UserSelect_User on User {
      id
      fullName
      email
    }
  `,
};

function userSelect<IsMulti extends boolean>(isMulti: IsMulti) {
  return forwardRef<UserSelectInstance<IsMulti>, UserSelectProps<IsMulti>>(
    function ({ value, onSearchUsers, onChange, ...props }, ref) {
      const loadOptions = useCallback(
        async (search) => {
          const exclude = [];
          if (isMulti) {
            for (const user of (value ?? []) as UserSelectSelection[]) {
              exclude.push(user.id);
            }
          } else if (value) {
            exclude.push((value as UserSelectSelection).id);
          }
          return await onSearchUsers(search, exclude);
        },
        [onSearchUsers, value]
      );

      const reactSelectProps = useUserSelectReactSelectProps<IsMulti>(props);

      return (
        <AsyncSelect<UserSelectSelection, IsMulti>
          ref={ref}
          value={value}
          onChange={onChange as any}
          isMulti={isMulti}
          loadOptions={loadOptions}
          {...props}
          {...reactSelectProps}
        />
      );
    }
  );
}

export const UserMultiSelect = Object.assign(userSelect(true), { fragments });

export const UserSingleSelect = Object.assign(userSelect(false), { fragments });

function useUserSelectReactSelectProps<IsMulti extends boolean>(
  props: UseReactSelectProps
) {
  const reactSelectProps = useReactSelectProps<UserSelectSelection>(props);
  return useMemo(
    () =>
      ({
        ...reactSelectProps,
        components: {
          ...reactSelectProps.components,
          NoOptionsMessage: memo(({ selectProps }) => {
            const search = selectProps.inputValue;
            return (
              <Stack alignItems="center" textAlign="center" padding={4}>
                {search ? (
                  <>
                    <Image
                      width="120px"
                      src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/undraw_void.svg`}
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
                            <NormalLink href={`mailto:${chunks[0]}`}>
                              {chunks}
                            </NormalLink>
                          ),
                        }}
                      />
                    </Text>
                  </>
                ) : (
                  <Text as="div" color="gray.400">
                    <FormattedMessage
                      id="component.user-select.search-hint"
                      defaultMessage="Search for existing users"
                    />
                  </Text>
                )}
              </Stack>
            );
          }),
          SingleValue: memo(({ children, ...props }) => {
            const { fullName, email } = props.data;
            return (
              <components.SingleValue {...props}>
                <Text as="span">
                  {fullName ? `${fullName} <${email}>` : email}
                </Text>
              </components.SingleValue>
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
                <components.MultiValueLabel {...(props as any)}>
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
          }: Omit<OptionProps<UserSelectSelection, IsMulti>, "data"> & {
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
      } as Partial<AsyncUserSelectProps<IsMulti>>),
    [reactSelectProps]
  );
}
