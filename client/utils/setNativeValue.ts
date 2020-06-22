/**
 * Due to react's implementation, setting the value of an input element directly
 * and dispatching an input event is not enough to make the onChange handler to
 * be called.
 * Use this method instead of `input.value = 'foo'`.
 */
export function setNativeValue(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string
) {
  const valueSetter = Object.getOwnPropertyDescriptor(element, "value")!.set!;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(
    prototype,
    "value"
  )!.set!;

  if (valueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else {
    valueSetter.call(element, value);
  }
  element.dispatchEvent(new Event("input", { bubbles: true }));
}
