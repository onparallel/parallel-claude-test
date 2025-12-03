import { ComponentWithAs, IconProps } from "@chakra-ui/react";
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
import { ProfileTypeIcon } from "@parallel/graphql/__types";

export function getProfileTypeIcon(icon?: ProfileTypeIcon | null) {
  const ICONS = {
    DATABASE: ProfilesIcon,
    PERSON: UserIcon,
    BUILDING: BusinessIcon,
    DOCUMENT: DocumentIcon,
    VERIFIED_PERSON: UserCheckIcon,
    PEOPLE: UsersIcon,
    STORE: ShopIcon,
    SHOPPING_CART: ShoppingCartIcon,
    CLIPBOARD: ClipboardIcon,
    SETTINGS: SettingsIcon,
    BRIEFCASE: BriefcaseIcon,
    PUBLICATION: BookOpenIcon,
    HOUSE: HomeIcon,
    CAR: CarIcon,
    CERTIFICATE: AwardIcon,
    CUBE: BoxIcon,
  } as Record<ProfileTypeIcon, ComponentWithAs<"svg", IconProps>>;

  const selectedIcon = (icon || "DATABASE") as ProfileTypeIcon;

  return ICONS[selectedIcon] ?? ICONS["DATABASE"];
}
