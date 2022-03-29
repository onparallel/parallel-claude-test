import { gql } from "@apollo/client";
import { Heading, Radio, RadioGroup, Stack, StackProps } from "@chakra-ui/react";
import { AccountLocaleChange_UserFragment } from "@parallel/graphql/__types";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import { FormattedMessage, useIntl } from "react-intl";

interface AccountLocaleChangeProps extends Omit<StackProps, "onChange"> {
  user: AccountLocaleChange_UserFragment;
  onChange: (locale: string) => void;
}

export function AccountLocaleChange({ user, onChange, ...props }: AccountLocaleChangeProps) {
  const intl = useIntl();
  const locales = useSupportedLocales();
  return (
    <Stack {...props}>
      <Heading as="h4" size="md" marginBottom={2}>
        <FormattedMessage id="settings.account.language" defaultMessage="Language" />
      </Heading>
      <RadioGroup onChange={onChange} value={user.preferredLocale ?? intl.locale}>
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

AccountLocaleChange.fragments = {
  User: gql`
    fragment AccountLocaleChange_User on User {
      preferredLocale
    }
  `,
};
