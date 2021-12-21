interface Zendesk {
  (action: string, property: string, parameters?: any): void;
  activate?: (parameters?: any) => void;
  hide?: () => void;
}

declare interface Window {
  zE?: Zendesk;
}
