import { gql } from "@apollo/client";
import { Image, Stack, Text } from "@chakra-ui/react";
import { UserSelect_UserFragment } from "@parallel/graphql/__types";
import {
  useReactSelectProps,
  UseReactSelectProps,
} from "@parallel/utils/react-select/hooks";
import { CustomAsyncSelectProps } from "@parallel/utils/react-select/types";
import {
  ForwardedRef,
  forwardRef,
  memo,
  ReactElement,
  ReactNode,
  RefAttributes,
  useCallback,
  useMemo,
} from "react";
import { FormattedMessage } from "react-intl";
import { components } from "react-select";
import AsyncSelect, { Props as AsyncSelectProps } from "react-select/async";
import { NormalLink } from "./Link";

export type UserSelectSelection = UserSelect_UserFragment;

export type UserSelectInstance<IsMulti extends boolean> = AsyncSelect<
  UserSelectSelection,
  IsMulti,
  never
>;

interface UserSelectProps<IsMulti extends boolean = false>
  extends UseReactSelectProps,
    CustomAsyncSelectProps<UserSelectSelection, IsMulti, never> {
  isMulti?: IsMulti;
  onSearch: (
    search: string,
    exclude: string[]
  ) => Promise<UserSelectSelection[]>;
}

export const UserSelect = Object.assign(
  forwardRef(function UserSelect<IsMulti extends boolean = false>(
    { value, onSearch, onChange, isMulti, ...props }: UserSelectProps<IsMulti>,
    ref: ForwardedRef<UserSelectInstance<IsMulti>>
  ) {
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
        return await onSearch(search, exclude);
      },
      [onSearch, value]
    );

    const reactSelectProps = useUserSelectReactSelectProps<IsMulti>(props);

    return (
      <AsyncSelect<UserSelectSelection, IsMulti, never>
        ref={ref}
        value={value}
        onChange={onChange as any}
        isMulti={isMulti ?? (false as any)}
        loadOptions={loadOptions}
        {...reactSelectProps}
      />
    );
  }) as <IsMulti extends boolean = false>(
    props: UserSelectProps<IsMulti> & RefAttributes<UserSelectInstance<IsMulti>>
  ) => ReactElement | null,
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

type AsyncUserSelectProps<IsMulti extends boolean> = AsyncSelectProps<
  UserSelectSelection,
  IsMulti,
  never
>;

function useUserSelectReactSelectProps<IsMulti extends boolean>(
  props: UseReactSelectProps
): AsyncUserSelectProps<IsMulti> {
  const reactSelectProps =
    useReactSelectProps<UserSelectSelection, IsMulti>(props);
  return useMemo<AsyncUserSelectProps<IsMulti>>(
    () => ({
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
                      defaultMessage="Contact us via email on <a>support@onparallel.com</a> or the support chat and we will create them an account"
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
          const { fullName, email } = props.data as UserSelectSelection;
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
        Option: ({ children, ...props }) => {
          const data = props.data as UserSelectSelection;
          return (
            <components.Option {...props}>
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
        const user = option as UserSelectSelection;
        if ((user as any).__isNew__) {
          return (user as any).label;
        } else {
          return user.email;
        }
      },
      getOptionValue: (option) => {
        const user = option as UserSelectSelection;
        return user.id;
      },
    }),
    [reactSelectProps]
  );
}
