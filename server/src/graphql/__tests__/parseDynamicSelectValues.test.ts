import { parseDynamicSelectValues } from "../helpers/parseDynamicSelectValues";

describe("parseDynamicSelectValues", () => {
  it("parses data", () => {
    expect(
      parseDynamicSelectValues([
        ["Comunidad autónoma", "Provincia", "Municipio"],
        ["Cataluña", "Barcelona", "Barcelona"],
        ["Cataluña", "Barcelona", "L'hospitalet de Llobregat"],
        ["Cataluña", "Barcelona", "Badalona"],
        ["Cataluña", "Barcelona", "Terrassa"],
        ["Cataluña", "Tarragona", "Tarragona"],
        ["Cataluña", "Tarragona", "Valls"],
        ["Cataluña", "Tarragona", "Salou"],
        ["Castilla y León", "Burgos", "Burgos"],
        ["Castilla y León", "Burgos", "Aranda de Duero"],
        ["Castilla y León", "Burgos", "Torresandino"],
        ["Castilla y León", "Soria", "Soria"],
        ["Castilla y León", "Soria", "El Burgo de Osma"],
      ])
    ).toEqual({
      labels: ["Comunidad autónoma", "Provincia", "Municipio"],
      values: [
        [
          "Cataluña",
          [
            [
              "Barcelona",
              [
                "Barcelona",
                "L'hospitalet de Llobregat",
                "Badalona",
                "Terrassa",
              ],
            ],
            ["Tarragona", ["Tarragona", "Valls", "Salou"]],
          ],
        ],
        [
          "Castilla y León",
          [
            ["Burgos", ["Burgos", "Aranda de Duero", "Torresandino"]],
            ["Soria", ["Soria", "El Burgo de Osma"]],
          ],
        ],
      ],
    });
  });

  it("skips empty lines", () => {
    expect(
      parseDynamicSelectValues([
        ["Comunidad autónoma", "Provincia", "Municipio"],
        ["Cataluña", "Barcelona", "Barcelona"],
        ["Cataluña", "Barcelona", "L'hospitalet de Llobregat"],
        ["Cataluña", "Barcelona", "Badalona"],
        ["Cataluña", "Barcelona", "Terrassa"],
        ["Cataluña", "Tarragona", "Tarragona"],
        ["Cataluña", "Tarragona", "Valls"],
        ["Cataluña", "Tarragona", "Salou"],
        ["Castilla y León", "Burgos", "Burgos"],
        ["Castilla y León", "Burgos", "Aranda de Duero"],
        ["Castilla y León", "Burgos", "Torresandino"],
        ["Castilla y León", "Soria", "Soria"],
        ["Castilla y León", "Soria", "El Burgo de Osma"],
        ["", "", ""],
        ["Castilla y León", "Soria", "Almazán"],
        ["", "", ""],
        ["", "", ""],
      ])
    ).toEqual({
      labels: ["Comunidad autónoma", "Provincia", "Municipio"],
      values: [
        [
          "Cataluña",
          [
            [
              "Barcelona",
              [
                "Barcelona",
                "L'hospitalet de Llobregat",
                "Badalona",
                "Terrassa",
              ],
            ],
            ["Tarragona", ["Tarragona", "Valls", "Salou"]],
          ],
        ],
        [
          "Castilla y León",
          [
            ["Burgos", ["Burgos", "Aranda de Duero", "Torresandino"]],
            ["Soria", ["Soria", "El Burgo de Osma", "Almazán"]],
          ],
        ],
      ],
    });
  });

  it("throws on missing value", () => {
    expect(() =>
      parseDynamicSelectValues([
        ["Comunidad autónoma", "Provincia", "Municipio"],
        ["Cataluña", "Barcelona", "Barcelona"],
        ["Cataluña", "Barcelona", "L'hospitalet de Llobregat"],
        ["Cataluña", "Barcelona", "Badalona"],
        ["Cataluña", "", "Terrassa"],
        ["Cataluña", "Tarragona", "Tarragona"],
        ["Cataluña", "Tarragona", "Valls"],
        ["Cataluña", "Tarragona", "Salou"],
        ["Castilla y León", "Burgos", "Burgos"],
        ["Castilla y León", "Burgos", "Aranda de Duero"],
        ["Castilla y León", "Burgos", "Torresandino"],
        ["Castilla y León", "Soria", "Soria"],
        ["Castilla y León", "Soria", "El Burgo de Osma"],
      ])
    ).toThrowError("Missing value at (4, 1)");
  });

  it("throws when not enough columns", () => {
    expect(() =>
      parseDynamicSelectValues([
        ["Municipio"],
        ["Barcelona"],
        ["L'hospitalet de Llobregat"],
        ["Badalona"],
        ["Terrassa"],
        ["Tarragona"],
        ["Valls"],
        ["Salou"],
        ["Burgos"],
        ["Aranda de Duero"],
        ["Torresandino"],
        ["Soria"],
        ["El Burgo de Osma"],
      ])
    ).toThrowError("Not enough columns");
  });
});
