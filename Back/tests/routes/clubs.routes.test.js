const request = require("supertest");
const express = require("express");
const clubsRoutes = require("../../src/routes/clubs.routes");
const db = require("../../src/db/supabase");

jest.mock("../../src/db/supabase");
jest.mock("../../src/db/supabaseClient");

const app = express();
app.use(express.json());

// Fake auth middleware
app.use((req, res, next) => {
  req.user = { id: "user-123" };
  next();
});

app.use("/clubs", clubsRoutes);

jest.mock("../../src/middlewares/authMiddleware", () => {
  return (req, res, next) => {
    req.user = { id: "test-user" };  // lo que necesite tu app
    next();
  };
});

describe("POST /clubs/create", () => {
  it("should return 400 if name is missing", async () => {
    const res = await request(app).post("/clubs/create").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("club_name_required");
  });

  it("should return 400 if user already belongs to a club", async () => {
    db.getMemberByUserId.mockResolvedValue({ data: { club_id: "c1" }, error: null });

    const res = await request(app).post("/clubs/create").send({ name: "Test Club" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("already_in_club");
  });

  it("should create a club and add the user", async () => {
    db.getMemberByUserId.mockResolvedValue({ data: null, error: null });
    db.getClubByName.mockResolvedValue({ data: null, error: null });

    db.createClub.mockResolvedValue({ data: { id: "club-1", name: "Test Club" }, error: null });
    db.addMember.mockResolvedValue({ data: { user_id: "user-123", club_id: "club-1" }, error: null });

    const res = await request(app).post("/clubs/create").send({ name: "Test Club" });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("club-1");
  });

  it("should rollback if addMember fails", async () => {
    db.getMemberByUserId.mockResolvedValue({ data: null, error: null });
    db.getClubByName.mockResolvedValue({ data: null, error: null });

    db.createClub.mockResolvedValue({ data: { id: "club-1", name: "Test Club" }, error: null });
    db.addMember.mockResolvedValue({ data: null, error: { code: "server_error" } });
    db.deleteClub = jest.fn().mockResolvedValue({ data: null, error: null });

    const res = await request(app).post("/clubs/create").send({ name: "Test Club" });

    expect(db.deleteClub).toHaveBeenCalledWith("club-1");
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("server_error");
  });
});


describe("POST /clubs/join", () => {
  it("should fail if user already in a club", async () => {
    db.getClubByUserId.mockResolvedValue({ data: { id: "c1" }, error: null });

    const res = await request(app)
      .post("/clubs/join")
      .send({ clubId: "c2" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("already_in_club");
  });

  it("should fail if club doesn't exist", async () => {
    db.getClubByUserId.mockResolvedValue(null);
    db.getClubById.mockResolvedValue(null);

    const res = await request(app)
      .post("/clubs/join")
      .send({ clubId: "c2" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("club_not_found");
  });

  it("should join successfully", async () => {
    db.getClubByUserId.mockResolvedValue(null);
    db.getClubById.mockResolvedValue({ id: "c2" });
    db.addMember.mockResolvedValue({ data: true, error: null });


    const res = await request(app)
      .post("/clubs/join")
      .send({ clubId: "c2" });

    expect(res.status).toBe(200);
    expect(res.body.joined).toBe(true);
  });
});

describe("POST /clubs/leave", () => {
  it("should fail if user not in a club", async () => {
    db.getClubByUserId.mockResolvedValue(null);

    const res = await request(app).post("/clubs/leave");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("not_in_club");
  });

  it("should delete club if last member", async () => {
    db.getMemberByUserId.mockResolvedValue({ data: { club_id: "club-1" }, error: null });
    db.removeMember.mockResolvedValue({ data: null, error: null });
    db.getMembersByClubId.mockResolvedValue({ data: [], error: null }); // simula que quedó vacío
    db.deleteClubIfEmpty.mockResolvedValue({ data: null, error: null });

    const res = await request(app).post("/clubs/leave");

    expect(res.status).toBe(200);
  });
});

describe("GET /clubs/search", () => {
  it("should fail if name missing", async () => {
    const res = await request(app).get("/clubs/search");
    expect(res.status).toBe(400);
  });

  it("should return search results", async () => {
    db.searchClubsByName.mockResolvedValue({ data: [{ id: "c1", name: "Rock" }], error: null });
    db.getClubMemberCountMap.mockResolvedValue({ c1: 5 }); // OK

    const res = await request(app).get("/clubs/search?name=ro");

    expect(res.status).toBe(200);
    expect(res.body[0].name).toBe("Rock");
    expect(res.body[0].cantidad_de_miembros).toBe(5);
  });
});
