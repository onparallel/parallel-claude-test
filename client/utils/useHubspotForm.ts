import { useCallback } from "react";

declare const hbspt: any;

export type HubspotFormProps = {
  target: string;
  portalId: string;
  formId: string;
  onFormSubmit?: () => any;
};

export function useHubspotForm(data: HubspotFormProps | null) {
  return useCallback(() => {
    if (!data) {
      return;
    }
    const element = document.querySelector(data.target);
    while (element && element.lastChild) {
      element.removeChild(element.lastChild);
    }
    if (typeof hbspt !== "undefined") {
      hbspt.forms.create(data);
    } else {
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://js.hsforms.net/forms/v2.js";
      script.onload = () => {
        hbspt!.forms.create(data);
        console.log("create");
      };
      document.head.appendChild(script);
    }
    // Hubspot expects jQuery when using onFormSubmit so we fake it out here
    (window as any).jQuery = function (nodeOrSelector: string | Element) {
      if (typeof nodeOrSelector === "string") {
        return document.querySelector(nodeOrSelector);
      }
      return nodeOrSelector;
    };
  }, [data?.target, data?.portalId, data?.formId]);
}
