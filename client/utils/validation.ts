export const EMAIL_REGEX =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export const PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/; // lowercase, uppercase, numbers and 8 chars

export const REFERENCE_REGEX = /^[a-z_][a-z0-9_]*$/i;

export const isValidDateString = (value: string | string[] | undefined) => {
  return (
    typeof value === "string" &&
    /\d{4}-\d{2}-\d{2}/.test(value) &&
    !isNaN(new Date(value).valueOf())
  );
};

export function isFirstCharacterNumber(str: string) {
  return /^\d/.test(str);
}
