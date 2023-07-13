import {
  ProfileTypeFieldPermissionType,
  ProfileTypeFieldPermissionTypeValues,
} from "../db/__types";

export function isAtLeast(p1: ProfileTypeFieldPermissionType, p2: ProfileTypeFieldPermissionType) {
  return (
    ProfileTypeFieldPermissionTypeValues.indexOf(p1) >=
    ProfileTypeFieldPermissionTypeValues.indexOf(p2)
  );
}
