import { enumType, inputObjectType } from "nexus";

export const ImageOptions = inputObjectType({
  name: "ImageOptions",
  definition(t) {
    t.nullable.field("resize", {
      type: inputObjectType({
        name: "ImageOptionsResize",
        definition(t) {
          t.nullable.int("width");
          t.nullable.int("height");
          t.nullable.field("fit", {
            type: enumType({
              name: "ImageOptionsResizeFit",
              members: ["fill", "inside", "contain", "cover", "outside"],
            }),
          });
        },
      }),
    });
    t.nullable.field("flatten", {
      type: inputObjectType({
        name: "ImageOptionsFlatten",
        definition(t) {
          t.nullable.string("background");
        },
      }),
    });
    t.nullable.field("toFormat", {
      type: enumType({
        name: "ImageOptionsToFormat",
        members: ["png", "jpeg", "webp"],
      }),
    });
  },
});
