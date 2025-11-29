const service = require("../../src/services/clubs.js");
const db = require("../../src/db/supabase.js");

jest.mock("../../src/db/supabase.js");

describe("createClubService", () => {
  it("should fail if name empty", async () => {
    const result = await service.createClubService({ userId: "u1", name: "" });
    expect(result.error.code).toBe("name_required"); // o lo que uses
  });

  it("should fail if already in a club", async () => {
    db.getMemberByUserId.mockResolvedValue({ id: "c1" });

    const result = await service.createClubService({ userId: "u1", name: "Rock" });
    expect(result.error.code).toBe("already_in_club");
  });

  it("should create club and add member", async () => {
    db.getMemberByUserId.mockResolvedValue(null);
    db.getClubByName.mockResolvedValue(null);

    db.createClub.mockResolvedValue({ data: { id: "c1" } });
    db.addMember.mockResolvedValue({ data: true });

    const result = await service.createClubService({ userId: "u1", name: "Rock" });

    expect(result.data.id).toBe("c1");
  });

  it("should rollback if addMember fails", async () => {
    db.getMemberByUserId.mockResolvedValue(null);
    db.getClubByName.mockResolvedValue(null);

    db.createClub.mockResolvedValue({ data: { id: "c1" } });
    db.addMember.mockResolvedValue({ error: new Error("fail") });

    // mock delete
    supabase.from = jest.fn(() => ({
      delete: () => ({
        eq: () => ({})
      })
    }));

    const result = await service.createClubService({ userId: "u1", name: "Rock" });

    expect(result.error.code).toBe("server_error");
  });
});
