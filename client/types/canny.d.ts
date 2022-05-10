declare namespace Canny {
  type CannySettings = {
    appID: "string";
    position?: "top" | "bottom" | "left" | "right";
    align?: "top" | "bottom" | "left" | "right";
    labelIDs?: string[];
  };

  type CannyActions = "initChangelog" | "closeChangelog";
}

interface Window {
  Canny?: (action: CannyActions, settings?: CannySettings) => void;
}
