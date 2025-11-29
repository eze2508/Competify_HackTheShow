const requireClubMember = require("../../src/middlewares/requireClubMember");
const db = require("../../src/db/supabase");

jest.mock("../../src/db/supabase");

describe("requireClubMember middlewares", () => {
  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  it("should fail if clubId missing", async () => {
    const req = { params: {}, user: { id: "u1" } };
    const res = mockRes();

    await requireClubMember(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "clubId_required" });
  });

  it("should fail if not a member", async () => {
    db.isMember.mockResolvedValue(false);

    const req = { params: { clubId: "c1" }, user: { id: "u1" } };
    const res = mockRes();

    await requireClubMember(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("should call next() if member", async () => {
    db.isMember.mockResolvedValue(true);

    const req = { params: { clubId: "c1" }, user: { id: "u1" } };
    const res = mockRes();
    const next = jest.fn();

    await requireClubMember(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
