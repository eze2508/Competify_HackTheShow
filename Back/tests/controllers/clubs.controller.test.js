const controller = require("../../src/controllers/clubs.controller");
const services = require("../../src/services/clubs");

jest.mock("../../src/services/clubs");

const mockRes = () => {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res;
};

describe("createClub controller", () => {
  it("should return error message", async () => {
    const req = { body: { name: "" }, user: { id: "u1" } };
    const res = mockRes();

    services.createClubService.mockResolvedValue({ data: null, error: { code: "already_in_club" } });


    await controller.createClub(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "name_required" });
  });

  it("should return club payload", async () => {
    const req = { body: { name: "Rock" }, user: { id: "u1" } };
    const res = mockRes();

    services.createClubService.mockResolvedValue({ data: null, error: { code: "already_in_club" } });


    await controller.createClub(req, res);

      expect(res.json).toHaveBeenCalledWith({
        id: "c1",
        name: "Rock",
        member: { user_id: "u1" },
    });
  });
});
