import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("organization", (t) => {
    t.jsonb("pdf_document_theme").nullable().defaultTo(null);
  });

  await knex.from("organization").update(
    "pdf_document_theme",
    JSON.stringify({
      marginLeft: 10,
      marginRight: 10,
      marginTop: 10,
      marginBottom: 15,
      showLogo: true,
      title1FontFamily: "IBM Plex Sans",
      title1Color: "#000000",
      title1FontSize: 16,
      title2FontFamily: "IBM Plex Sans",
      title2Color: "#000000",
      title2FontSize: 14,
      textFontFamily: "IBM Plex Sans",
      textColor: "#000000",
      textFontSize: 12,
      logoPosition: "center",
      paginationPosition: "right",
      legalText: {
        es: [
          {
            type: "paragraph",
            children: [
              {
                text: "Declaro que los datos y la documentación facilitados, así como las copias o fotocopias enviadas, reproducen fielmente los documentos originales y la información actual de identificación.",
                italic: true,
              },
            ],
          },
        ],
        en: [
          {
            type: "paragraph",
            children: [
              {
                text: "I declare that the data and documentation provided, as well as the copies or photocopies sent, faithfully reproduce the original documents and current identification information.",
                italic: true,
              },
            ],
          },
        ],
      },
    })
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("organization", (t) => {
    t.dropColumn("pdf_document_theme");
  });
}
