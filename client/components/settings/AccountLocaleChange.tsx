import { gql } from "@apollo/client";
import { Heading, Radio, RadioGroup, Stack, StackProps } from "@chakra-ui/react";
import { AccountLocaleChange_UserFragment, UserLocale } from "@parallel/graphql/__types";
import { useSupportedUserLocales } from "@parallel/utils/locales";
import { FormattedMessage } from "react-intl";

interface AccountLocaleChangeProps extends Omit<StackProps, "onChange"> {
  user: AccountLocaleChange_UserFragment;
  onChange: (locale: UserLocale) => void;
}

export function AccountLocaleChange({ user, onChange, ...props }: AccountLocaleChangeProps) {
  const locales = useSupportedUserLocales();
  return (
    <Stack {...props}>
      <Heading as="h4" size="md" marginBottom={2}>
        <FormattedMessage id="generic.language" defaultMessage="Language" />
      </Heading>
      <RadioGroup onChange={onChange} value={user.preferredLocale}>
        <Stack>
          {locales.map(({ key, localizedLabel }) => (
            <Radio backgroundColor="white" key={key} value={key}>
              {localizedLabel}
            </Radio>
          ))}
        </Stack>
      </RadioGroup>
    </Stack>
  );
}

const _fragments = {
  User: gql`
    fragment AccountLocaleChange_User on User {
      preferredLocale
    }
  `,
};
