export function getHardcodedSignatures(templateId: string) {
  const signers: { fullName: string; signatureImageUrl?: string }[] = [];
  if (
    [
      "EAwW2jXkP4C9LjU2b3",
      "EAwW2jXkP4C9LjU2fS",
      "EAwW2jXkP4C9Lf4DDK",
      "zas25KHxAByKWUZSNGc",
    ].includes(templateId)
  ) {
    signers.push({
      fullName: "Guillermo Preckler",
      signatureImageUrl:
        "https://static.onparallel.com/static/images/signatures/guillermo-preckler-brickbro.png",
    });
  } else if (templateId === "EAwW2jXkP4C9LbfNRp") {
    signers.push({
      fullName: "TIKO",
      signatureImageUrl: "https://static.onparallel.com/static/images/signatures/sello-tiko.png",
    });
  } else if (["zas25KHxAByKWUgG8U2", "zas25KHxAByKWUhxeC6"].includes(templateId)) {
    signers.push({
      fullName: "Marta Blanco Maseda",
      signatureImageUrl:
        "https://static.onparallel.com/static/images/signatures/marta-blanco-maseda-imasd.png",
    });
  } else if (
    [
      "zas25KHxAByKWmEFbpV",
      "zas25KHxAByKWmEFbpU",
      "zas25KHxAByKWmEFbpT",
      "zas25KHxAByKWmM6rrm",
    ].includes(templateId)
  ) {
    signers.push({
      fullName: "Carlos Guerrero Martín",
      signatureImageUrl:
        "https://static.onparallel.com/static/images/signatures/carlos-guerrero-martin-debify.png",
    });
  } else if (
    [
      "zas25KHxAByKWmFx9gf",
      "zas25KHxAByKWmHefVF",
      "zas25KHxAByKWmHefVH",
      "zas25KHxAByKWmHefVK",
      "zas25KHxAByKWmHefZj",
      "zas25KHxAByKWmHefZm",
      "zas25KHxAByKWmHguoJ",
      "zas25KHxAByKWmHgusw",
      "zas25KHxAByKWmHguxV",
      "zas25KHxAByKX3mJq5E",
      "zas25KHxAByKX3usjzq",
      "zas25KHxAByKXKL5aMA",
      "zas25KHxAByKXKJPAzn",
      "zas25KHxAByKXBVeaGh",
      "6Y8DSH92uxPaJ4BA9cFya",
      "6Y8DSH92uxPaJ4BA7srgb",
      "6Y8DSH92uxPaJ4BA2oVXZ",
    ].includes(templateId)
  ) {
    signers.push({
      fullName: "Jorge Arturo Cáceres Quezada",
      signatureImageUrl:
        "https://static.onparallel.com/static/images/signatures/jorge-arturo-caceres-rive.png",
    });
  } else if (
    ["zas25KHxAByKWmKNDXb", "zas25KHxAByKWmKRZgb", "zas25KHxAByKX3mKDNQ"].includes(templateId)
  ) {
    signers.push({
      fullName: "Dña Ana Isabel Martín",
      signatureImageUrl:
        "https://static.onparallel.com/static/images/signatures/ana-martin-adlanter.png",
    });
  } else if (["zas25KHxAByKWu4g76M"].includes(templateId)) {
    signers.push({
      fullName: "Fernando López Clemente",
      signatureImageUrl:
        "https://static.onparallel.com/static/images/signatures/fernando-lopez-clemente-anticipa.png",
    });
  } else if (["zas25KHxAByKXKJNo2z"].includes(templateId)) {
    signers.push(
      {
        fullName: "D. Álvaro Gámez Serracarbassa",
        signatureImageUrl:
          "https://static.onparallel.com/static/images/signatures/alvaro-gamez-serracarbassa-broseta.png",
      },
      {
        fullName: "D. Claudio Aguiló Casanova",
        signatureImageUrl:
          "https://static.onparallel.com/static/images/signatures/claudio-aguilo-casanova-broseta.png",
      },
    );
  } else if (
    [
      "zas25KHxAByKXKRCYU4",
      "zas25KHxAByKXKUbz48",
      "6Y8DSH92uxPaJ4B9sFhHo",
      "6Y8DSH92uxPaJ4B9sFhSu",
    ].includes(templateId)
  ) {
    signers.push({
      fullName: "Juan Francisco Sahuquillo Cebrián",
      signatureImageUrl:
        "https://static.onparallel.com/static/images/signatures/juan-francisco-sahuquillo-cebrian-tiko.png",
    });
  } else if (["zas25KHxAByKXaxCQoK"].includes(templateId)) {
    signers.push({
      fullName: "Manuel Holstein",
      signatureImageUrl:
        "https://static.onparallel.com/static/images/signatures/manuel-holstein-tiko.png",
    });
  } else if (["zas25KHxAByKX3yGfeP", "zas25KHxAByKXBXLcU6"].includes(templateId)) {
    signers.push({
      fullName: "Miguel Acosta",
      signatureImageUrl:
        "https://static.onparallel.com/static/images/signatures/miguel-acosta-aliseda.png",
    });
  }
  return signers;
}
