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

const EMAIL_REGEX =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

/**
 * Run heuristic validation for email addresses to catch common issues
 */
export function isValidEmail(email: string) {
  if (!EMAIL_REGEX.test(email)) {
    return false;
  } else {
    const [local, domain] = email.toLowerCase().split("@");

    if (domain === "gmail.com") {
      /*
      https://support.google.com/mail/answer/9211434?hl=en
      
      Gmail allows +tags for aliasing (user+tag@gmail.com delivers to user@gmail.com)
      - Username: 6-30 characters (excluding dots)
      - Allowed: letters, numbers, dots, plus sign (for aliasing)
      - Not allowed: consecutive dots, dots at start/end, certain special characters
      */
      const [_, username, _plusTag] = local.match(/^([^+]+)(\+.*)?$/) ?? [];
      if (!username) {
        return false;
      }
      const cleanUsername = username.replaceAll(".", "");
      if (cleanUsername.length > 30 || cleanUsername.length < 6) {
        return false;
      }
      // Check for invalid characters and consecutive periods
      if (username.match(/[&=_'\-+,<>]/) || username.includes("..")) {
        return false;
      }
      // Check that username starts and ends with alphanumeric (not period)
      if (!username.match(/^[a-z0-9].*[a-z0-9]$/)) {
        return false;
      }
    } else if (["outlook.", "hotmail.", "live."].some((prefix) => domain.startsWith(prefix))) {
      /*
       https://learn.microsoft.com/en-us/troubleshoot/microsoft-365-apps/office-suite-issues/username-contains-special-character
       
       Outlook/Hotmail allows + characters as literal characters (no aliasing)
       - Allowed: letters, numbers, dots, underscores, hyphens, plus signs, and some special chars
       - Not allowed: ampersand (&), dots at end, certain other characters
       - Max length: 64 characters
       */
      if (local.match(/[^a-z0-9._\-!#^~']/i)) {
        return false;
      }
      if (local.includes("&")) {
        return false;
      }
      if (local.endsWith(".")) {
        return false;
      }
      if (local.length > 64) {
        return false;
      }
    } else if (["yahoo.", "myyahoo."].some((prefix) => domain.startsWith(prefix))) {
      /*
       Yahoo allows + characters as literal characters (no aliasing)
       - Allowed: letters, numbers, dots, underscores, hyphens, plus signs
       - Multiple + signs allowed anywhere
       - Max length: 32 characters
       */
      if (local.match(/[^a-z0-9._\-]/)) {
        return false;
      }
      if (local.length > 32) {
        return false;
      }
    } else if (domain === "icloud.com" || domain === "me.com") {
      /*
       iCloud does NOT allow + characters at all
       - Allowed: letters, numbers, dots, underscores, hyphens
       - Not allowed: plus signs, consecutive dots, dots at start/end
       - Max length: 32 characters
       */
      if (local.match(/[^a-z0-9._\-]/)) {
        return false;
      }
      if (local.includes("..")) {
        return false;
      }
      if (local.startsWith(".") || local.endsWith(".")) {
        return false;
      }
      if (local.length > 32) {
        return false;
      }
    }

    // Return true if all validations pass
    return true;
  }
}
