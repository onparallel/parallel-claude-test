import { parseDynamicSelectValues } from "../helpers/parseDynamicSelectValues";

describe("parseDynamicSelectValues", () => {
  it("parses data", () => {
    expect(
      parseDynamicSelectValues([
        ["Comunidad autónoma", "Provincia", "Municipio"],
        ["Castilla y León", "Burgos", "Aranda de Duero"],
        ["Castilla y León", "Burgos", "Burgos"],
        ["Castilla y León", "Burgos", "Torresandino"],
        ["Castilla y León", "Soria", "El Burgo de Osma"],
        ["Castilla y León", "Soria", "Soria"],
        ["Cataluña", "Barcelona", "Badalona"],
        ["Cataluña", "Barcelona", "Barcelona"],
        ["Cataluña", "Barcelona", "L'hospitalet de Llobregat"],
        ["Cataluña", "Barcelona", "Terrassa"],
        ["Cataluña", "Tarragona", "Salou"],
        ["Cataluña", "Tarragona", "Tarragona"],
        ["Cataluña", "Tarragona", "Valls"],
      ])
    ).toEqual({
      labels: ["Comunidad autónoma", "Provincia", "Municipio"],
      values: [
        [
          "Castilla y León",
          [
            ["Burgos", ["Aranda de Duero", "Burgos", "Torresandino"]],
            ["Soria", ["El Burgo de Osma", "Soria"]],
          ],
        ],
        [
          "Cataluña",
          [
            [
              "Barcelona",
              [
                "Badalona",
                "Barcelona",
                "L'hospitalet de Llobregat",
                "Terrassa",
              ],
            ],
            ["Tarragona", ["Salou", "Tarragona", "Valls"]],
          ],
        ],
      ],
    });
  });

  it("skips empty lines", () => {
    expect(
      parseDynamicSelectValues([
        ["Comunidad autónoma", "Provincia", "Municipio"],
        ["Castilla y León", "Burgos", "Aranda de Duero"],
        ["", "", ""],
        ["Castilla y León", "Burgos", "Burgos"],
        ["Castilla y León", "Burgos", "Torresandino"],
        ["Castilla y León", "Soria", "El Burgo de Osma"],
        ["Castilla y León", "Soria", "Soria"],
        ["Cataluña", "Barcelona", "Badalona"],
        ["Cataluña", "Barcelona", "Barcelona"],
        ["Cataluña", "Barcelona", "L'hospitalet de Llobregat"],
        ["Cataluña", "Barcelona", "Terrassa"],
        ["Cataluña", "Tarragona", "Salou"],
        ["", "", ""],
        ["Cataluña", "Tarragona", "Tarragona"],
        ["Cataluña", "Tarragona", "Valls"],
        ["", "", ""],
        ["", "", ""],
      ])
    ).toEqual({
      labels: ["Comunidad autónoma", "Provincia", "Municipio"],
      values: [
        [
          "Castilla y León",
          [
            ["Burgos", ["Aranda de Duero", "Burgos", "Torresandino"]],
            ["Soria", ["El Burgo de Osma", "Soria"]],
          ],
        ],
        [
          "Cataluña",
          [
            [
              "Barcelona",
              [
                "Badalona",
                "Barcelona",
                "L'hospitalet de Llobregat",
                "Terrassa",
              ],
            ],
            ["Tarragona", ["Salou", "Tarragona", "Valls"]],
          ],
        ],
      ],
    });
  });

  it("sorts the listings alphabetically", () => {
    expect(
      parseDynamicSelectValues([
        ["Comunidad autónoma", "Provincia", "Municipio"],
        ["Cataluña", "Barcelona", "Barcelona"],
        ["Castilla y León", "Soria", "Soria"],
        ["Cataluña", "Barcelona", "L'hospitalet de Llobregat"],
        ["Cataluña", "Tarragona", "Tarragona"],
        ["Cataluña", "Tarragona", "Valls"],
        ["Cataluña", "Tarragona", "Salou"],
        ["Castilla y León", "Burgos", "Burgos"],
        ["Cataluña", "Barcelona", "Badalona"],
        ["Castilla y León", "Burgos", "Aranda de Duero"],
        ["Castilla y León", "Burgos", "Torresandino"],
        ["Cataluña", "Barcelona", "Terrassa"],
        ["Castilla y León", "Soria", "El Burgo de Osma"],
      ])
    ).toEqual({
      labels: ["Comunidad autónoma", "Provincia", "Municipio"],
      values: [
        [
          "Castilla y León",
          [
            ["Burgos", ["Aranda de Duero", "Burgos", "Torresandino"]],
            ["Soria", ["El Burgo de Osma", "Soria"]],
          ],
        ],
        [
          "Cataluña",
          [
            [
              "Barcelona",
              [
                "Badalona",
                "Barcelona",
                "L'hospitalet de Llobregat",
                "Terrassa",
              ],
            ],
            ["Tarragona", ["Salou", "Tarragona", "Valls"]],
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

  it("throws on incomplete row", () => {
    expect(() =>
      parseDynamicSelectValues([
        ["Comunidad autónoma", "Provincia", "Municipio"],
        ["Cataluña", "Barcelona", "Barcelona"],
        ["Cataluña", "Barcelona", "L'hospitalet de Llobregat"],
        ["Cataluña", "Barcelona", "Badalona"],
        ["Cataluña", "Barcelona", "Terrassa"],
        ["Cataluña", "Tarragona"],
      ])
    ).toThrowError("Not enough data at row 5");
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
