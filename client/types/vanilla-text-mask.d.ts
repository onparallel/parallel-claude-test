declare module "vanilla-text-mask" {
  export function maskInput(props: {
    inputElement: HTMLInputElement;
    mask: Array<string | RegExp>;
    showMask?: boolean;
    keepCharPositions?: boolean;
    placeholderChar?: string;
  }): {
    destroy: () => void;
  };
}
