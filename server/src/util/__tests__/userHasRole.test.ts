import { userHasRole } from "../userHasRole";

describe("userHasRole", () => {
  it("ensures correct role order", () => {
    expect(userHasRole({ organization_role: "COLLABORATOR" }, "COLLABORATOR")).toEqual(true);
    expect(userHasRole({ organization_role: "COLLABORATOR" }, "NORMAL")).toEqual(false);
    expect(userHasRole({ organization_role: "COLLABORATOR" }, "ADMIN")).toEqual(false);
    expect(userHasRole({ organization_role: "COLLABORATOR" }, "OWNER")).toEqual(false);

    expect(userHasRole({ organization_role: "NORMAL" }, "COLLABORATOR")).toEqual(true);
    expect(userHasRole({ organization_role: "NORMAL" }, "NORMAL")).toEqual(true);
    expect(userHasRole({ organization_role: "NORMAL" }, "ADMIN")).toEqual(false);
    expect(userHasRole({ organization_role: "NORMAL" }, "OWNER")).toEqual(false);

    expect(userHasRole({ organization_role: "ADMIN" }, "COLLABORATOR")).toEqual(true);
    expect(userHasRole({ organization_role: "ADMIN" }, "NORMAL")).toEqual(true);
    expect(userHasRole({ organization_role: "ADMIN" }, "ADMIN")).toEqual(true);
    expect(userHasRole({ organization_role: "ADMIN" }, "OWNER")).toEqual(false);

    expect(userHasRole({ organization_role: "OWNER" }, "COLLABORATOR")).toEqual(true);
    expect(userHasRole({ organization_role: "OWNER" }, "NORMAL")).toEqual(true);
    expect(userHasRole({ organization_role: "OWNER" }, "ADMIN")).toEqual(true);
    expect(userHasRole({ organization_role: "OWNER" }, "OWNER")).toEqual(true);
  });
});
