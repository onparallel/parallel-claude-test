import {
  Icon,
  IconButton,
  MenuButton,
  MenuList,
  Portal,
  SimpleGrid,
  useMenuOption,
  useMenuOptionGroup,
  UseMenuOptionGroupProps,
  UseMenuOptionProps,
} from "@chakra-ui/react";
import { Menu } from "@parallel/chakra/components";
import {
  AwardIcon,
  BookOpenIcon,
  BoxIcon,
  BriefcaseIcon,
  BusinessIcon,
  CarIcon,
  ClipboardIcon,
  DocumentIcon,
  HomeIcon,
  ProfilesIcon,
  SettingsIcon,
  ShopIcon,
  ShoppingCartIcon,
  UserCheckIcon,
  UserIcon,
  UsersIcon,
} from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { ProfileTypeIcon } from "@parallel/graphql/__types";
import { ValueProps } from "@parallel/utils/ValueProps";
import { ComponentType, forwardRef, useMemo } from "react";
import { useIntl } from "react-intl";

export function ProfileTypeIconSelect({ value, onChange }: ValueProps<ProfileTypeIcon, false>) {
  const intl = useIntl();

  const options = useProfileTypeIconSelectOptions();

  const selected = options.find((o) => o.key === value)!;

  return (
    <>
      <Menu>
        <MenuButton
          as={IconButtonWithTooltip}
          icon={<Icon as={selected.icon} boxSize={5} />}
          placement="bottom"
          label={intl.formatMessage({
            id: "component.profile-type-field-icon.button",
            defaultMessage: "Change icon",
          })}
          aria-label={
            selected.alt +
            ". " +
            intl.formatMessage({
              id: "component.profile-type-field-icon.button",
              defaultMessage: "Change icon",
            })
          }
        />
        <Portal>
          <MenuList minWidth="min-content" padding={2}>
            <MenuOptionGroup value={value} onChange={onChange as any}>
              {options.map((option) => {
                return (
                  <MenuItemOption
                    key={option.key}
                    value={option.key}
                    icon={option.icon}
                    alt={option.alt}
                  />
                );
              })}
            </MenuOptionGroup>
          </MenuList>
        </Portal>
      </Menu>
    </>
  );
}

function MenuOptionGroup(props: Pick<UseMenuOptionGroupProps, "value" | "onChange" | "children">) {
  const ownProps = useMenuOptionGroup({ ...props, type: "radio" });
  return <SimpleGrid justifyItems="center" columns={4} spacing={2} {...ownProps} />;
}

const MenuItemOption = forwardRef<
  HTMLElement,
  UseMenuOptionProps & { icon: ComponentType; alt: string }
>(function MenuItemOption({ alt, icon, ...props }, ref) {
  const optionProps = useMenuOption(props, ref);
  return (
    <IconButton
      variant="ghost"
      boxSize="40px"
      {...optionProps}
      _checked={{ backgroundColor: "blue.500", color: "white" }}
      _focusVisible={{ boxShadow: "none" }}
      _hover={{ backgroundColor: undefined }}
      _focus={{ backgroundColor: "gray.200", _checked: { backgroundColor: "blue.600" } }}
      icon={<Icon as={icon} boxSize={5} />}
      aria-label={alt}
    />
  );
});

(MenuItemOption as any).id = "MenuItemOption"; // this is needed to make internal menu chakra work correctly

function useProfileTypeIconSelectOptions() {
  const intl = useIntl();
  const options = useMemo<
    {
      key: ProfileTypeIcon;
      icon: ComponentType;
      alt: string;
    }[]
  >(
    () => [
      {
        key: "DATABASE",
        icon: ProfilesIcon,
        alt: intl.formatMessage({
          id: "component.profile-type-field-icon.database-icon",
          defaultMessage: "Database icon",
        }),
      },
      {
        key: "PERSON",
        icon: UserIcon,
        alt: intl.formatMessage({
          id: "component.profile-type-field-icon.person-icon",
          defaultMessage: "Person icon",
        }),
      },
      {
        key: "BUILDING",
        icon: BusinessIcon,
        alt: intl.formatMessage({
          id: "component.profile-type-field-icon.building-icon",
          defaultMessage: "Building icon",
        }),
      },
      {
        key: "DOCUMENT",
        icon: DocumentIcon,
        alt: intl.formatMessage({
          id: "component.profile-type-field-icon.document-icon",
          defaultMessage: "Document icon",
        }),
      },
      {
        key: "VERIFIED_PERSON",
        icon: UserCheckIcon,
        alt: intl.formatMessage({
          id: "component.profile-type-field-icon.verified-person-icon",
          defaultMessage: "Verified person icon",
        }),
      },
      {
        key: "PEOPLE",
        icon: UsersIcon,
        alt: intl.formatMessage({
          id: "component.profile-type-field-icon.people-icon",
          defaultMessage: "People icon",
        }),
      },
      {
        key: "STORE",
        icon: ShopIcon,
        alt: intl.formatMessage({
          id: "component.profile-type-field-icon.store-icon",
          defaultMessage: "Store icon",
        }),
      },
      {
        key: "SHOPPING_CART",
        icon: ShoppingCartIcon,
        alt: intl.formatMessage({
          id: "component.profile-type-field-icon.shopping-cart-icon",
          defaultMessage: "Shopping cart icon",
        }),
      },
      {
        key: "CLIPBOARD",
        icon: ClipboardIcon,
        alt: intl.formatMessage({
          id: "component.profile-type-field-icon.clipboard-icon",
          defaultMessage: "Clipboard icon",
        }),
      },
      {
        key: "SETTINGS",
        icon: SettingsIcon,
        alt: intl.formatMessage({
          id: "component.profile-type-field-icon.settings-icon",
          defaultMessage: "Settings icon",
        }),
      },
      {
        key: "BRIEFCASE",
        icon: BriefcaseIcon,
        alt: intl.formatMessage({
          id: "component.profile-type-field-icon.briefcase-icon",
          defaultMessage: "Briefcase icon",
        }),
      },
      {
        key: "PUBLICATION",
        icon: BookOpenIcon,
        alt: intl.formatMessage({
          id: "component.profile-type-field-icon.publication-icon",
          defaultMessage: "Publication icon",
        }),
      },
      {
        key: "HOUSE",
        icon: HomeIcon,
        alt: intl.formatMessage({
          id: "component.profile-type-field-icon.house-icon",
          defaultMessage: "House icon",
        }),
      },
      {
        key: "CAR",
        icon: CarIcon,
        alt: intl.formatMessage({
          id: "component.profile-type-field-icon.car-icon",
          defaultMessage: "Car icon",
        }),
      },
      {
        key: "CERTIFICATE",
        icon: AwardIcon,
        alt: intl.formatMessage({
          id: "component.profile-type-field-icon.certificate-icon",
          defaultMessage: "Certificate icon",
        }),
      },
      {
        key: "CUBE",
        icon: BoxIcon,
        alt: intl.formatMessage({
          id: "component.profile-type-field-icon.cube-icon",
          defaultMessage: "Cube icon",
        }),
      },
    ],
    [intl.locale],
  );

  return options;
}
