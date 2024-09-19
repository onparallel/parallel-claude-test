import { parse as parseCookie, serialize as serializeCookie } from "cookie";
import {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const CookieContext = createContext<string>("");

export const CookieProvider = CookieContext.Provider;

export function useCookie<S>(name: string, defaultValue: S): [S, Dispatch<SetStateAction<S>>] {
  const cookie = useContext(CookieContext);
  const cookies = useMemo(() => parseCookie(cookie), [cookie]);
  const initialValue =
    typeof cookies === "object" && cookies.hasOwnProperty(name)
      ? (JSON.parse(cookies[name]) as S)
      : defaultValue;
  const [value, setValue] = useState(initialValue);
  return [
    value,
    useCallback(
      (dispatch: SetStateAction<S>) => {
        setValue((current) => {
          const value =
            typeof dispatch === "function"
              ? (dispatch as (prevState: S) => S)(current)
              : (dispatch as S);
          document.cookie = serializeCookie(name, JSON.stringify(value), { path: "/" });
          return value;
        });
      },
      [name, setValue],
    ),
  ];
}
