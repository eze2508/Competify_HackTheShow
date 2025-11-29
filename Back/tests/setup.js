const db = require("../src/services/clubs.js");

// Limpieza global
beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

// Mock global de Supabase para que ningún test explote
jest.mock("../src/services/clubs", () => ({
  getClubByUserId: jest.fn(),
  getClubByName: jest.fn(),
  getClubById: jest.fn(),
  createClub: jest.fn(),
  addMember: jest.fn(),
  countMembers: jest.fn(),
  searchClubs: jest.fn(),
}));

jest.mock("../src/db/supabaseClient", () => ({
  auth: {
    getUser: jest.fn(),
    getSession: jest.fn(),
    refreshSession: jest.fn(),
  }
}));
