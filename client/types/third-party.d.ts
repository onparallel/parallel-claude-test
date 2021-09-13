interface Zendesk {
  (action: string, property: string, parameters?: any): void;
  activate?: (parameters?: any) => void;
  hide?: () => void;
}

interface HubSpotConversations {
  widget: {
    refresh();
  };
}

declare interface Window {
  zE?: Zendesk;
  HubSpotConversations?: HubSpotConversations;
}
