import { lazy, Suspense } from "react";
import { PhoneFormatterProps } from "react-headless-phone-input/types/PhoneFormatterProps";
const PhoneFormatter = lazy(() => import("react-headless-phone-input"));
/**
 * Lazy version of PhoneFormatter, using React.Suspense for progressive enhancement.
 */
export default function LazyPhoneFormatter(props: PhoneFormatterProps) {
  return (
    <Suspense
      fallback={
        <>
          {props.children({
            inputValue: props.value || "",
            onInputChange(v) {
              props.onChange(v);
            },
            onBlur() {
              /* no-op */
            },
          })}
        </>
      }
    >
      <PhoneFormatter {...props} />
    </Suspense>
  );
}
