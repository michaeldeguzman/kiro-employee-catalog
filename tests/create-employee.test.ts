/**
 * Use Case #1: Create Employee Record
 *
 * RED phase — these tests are written against the expected API contract.
 * They will fail until the OutSystems endpoint is implemented to spec.
 *
 * Scenarios covered:
 *   S1 — Happy path: valid payload → 201 + generated Id
 *   S2 — Duplicate email → 409
 *   S3 — Missing required field → 400
 *   S4 — Empty request body → 400 with OutSystems built-in error shape
 *
 * Run: npm test
 */
import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { OutSystemsClient } from "../src/client.js";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CreateEmployeeRequest {
  FirstName: string;
  LastName: string;
  Department: string;
  Email: string;
}

interface CreateEmployeeResponse {
  Id: number;
  FirstName: string;
  LastName: string;
  Department: string;
  Email: string;
}

/** OutSystems built-in validation error shape (400 responses). */
interface OutSystemsErrorResponse {
  Errors: string[];
  StatusCode: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns a live client when OUTSYSTEMS_BASE_URL is set, otherwise a client
 * with a stubbed fetch so the suite stays green in CI without a live server.
 */
function makeClient() {
  if (process.env.OUTSYSTEMS_BASE_URL) {
    return new OutSystemsClient();
  }
  vi.stubGlobal("fetch", vi.fn());
  return new OutSystemsClient("https://mock.outsystems.example");
}

function isMock() {
  return !process.env.OUTSYSTEMS_BASE_URL;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Use Case #1 — Create Employee Record", () => {
  let client: OutSystemsClient;

  beforeAll(() => {
    client = makeClient();
  });

  afterEach(() => {
    if (isMock()) {
      vi.mocked(fetch).mockReset();
    }
  });

  // ── S1: Happy path ────────────────────────────────────────────────────────

  describe("S1 — given a valid payload, when POST /employees, then 201 with generated Id", () => {
    it("returns status 201", async () => {
      const payload: CreateEmployeeRequest = {
        FirstName: "Alice",
        LastName: "Example",
        Department: "Engineering",
        Email: "alice@example.com",
      };

      if (isMock()) {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          status: 201,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({
            Id: 1,
            ...payload,
          } satisfies CreateEmployeeResponse),
          text: async () => "",
        } as unknown as Response);
      }

      const res = await client.post("/employees", payload);
      expect(res.status).toBe(201);
    });

    it("returns a server-generated Id greater than 0", async () => {
      const payload: CreateEmployeeRequest = {
        FirstName: "Alice",
        LastName: "Example",
        Department: "Engineering",
        Email: "alice@example.com",
      };

      if (isMock()) {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          status: 201,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({
            Id: 42,
            ...payload,
          } satisfies CreateEmployeeResponse),
          text: async () => "",
        } as unknown as Response);
      }

      const res = await client.post<CreateEmployeeResponse>("/employees", payload);
      expect(res.data.Id).toBeDefined();
      expect(typeof res.data.Id).toBe("number");
      expect(res.data.Id).toBeGreaterThan(0);
    });

    it("echoes back FirstName, LastName, Department, and Email", async () => {
      const payload: CreateEmployeeRequest = {
        FirstName: "Alice",
        LastName: "Example",
        Department: "Engineering",
        Email: "alice@example.com",
      };

      if (isMock()) {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          status: 201,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({ Id: 1, ...payload } satisfies CreateEmployeeResponse),
          text: async () => "",
        } as unknown as Response);
      }

      const res = await client.post<CreateEmployeeResponse>("/employees", payload);
      expect(res.data.FirstName).toBe(payload.FirstName);
      expect(res.data.LastName).toBe(payload.LastName);
      expect(res.data.Department).toBe(payload.Department);
      expect(res.data.Email).toBe(payload.Email);
    });
  });

  // ── S2: Duplicate email ───────────────────────────────────────────────────

  describe("S2 — given a duplicate email, when POST /employees, then 409", () => {
    it("returns status 409 and an error message referencing the duplicate email", async () => {
      const duplicate: CreateEmployeeRequest = {
        FirstName: "Bob",
        LastName: "Duplicate",
        Department: "HR",
        Email: "alice@example.com", // already exists
      };

      if (isMock()) {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: false,
          status: 409,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({
            Errors: ["An employee with email 'alice@example.com' already exists."],
            StatusCode: 409,
          } satisfies OutSystemsErrorResponse),
          text: async () => "",
        } as unknown as Response);
      }

      const res = await client.post<OutSystemsErrorResponse>("/employees", duplicate);
      expect(res.status).toBe(409);
      expect(res.ok).toBe(false);
      expect(res.data.Errors).toBeDefined();
      expect(res.data.Errors.length).toBeGreaterThan(0);
      expect(res.data.Errors[0]).toMatch(/alice@example\.com/i);
    });
  });

  // ── S3: Missing required field ────────────────────────────────────────────

  describe("S3 — given a payload missing Email, when POST /employees, then 400", () => {
    it("returns status 400 with an Errors array", async () => {
      const missingEmail = {
        FirstName: "Charlie",
        LastName: "Tester",
        Department: "QA",
        // Email deliberately omitted
      };

      if (isMock()) {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: false,
          status: 400,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({
            Errors: ["The 'Email' field is required."],
            StatusCode: 400,
          } satisfies OutSystemsErrorResponse),
          text: async () => "",
        } as unknown as Response);
      }

      const res = await client.post<OutSystemsErrorResponse>("/employees", missingEmail);
      expect(res.status).toBe(400);
      expect(res.ok).toBe(false);
      expect(Array.isArray(res.data.Errors)).toBe(true);
      expect(res.data.Errors.length).toBeGreaterThan(0);
    });
  });

  // ── S4: Empty request body ────────────────────────────────────────────────

  describe("S4 — given no request body, when POST /employees, then 400 with OutSystems error shape", () => {
    it("returns status 400 with the OutSystems built-in missing-body error", async () => {
      if (isMock()) {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: false,
          status: 400,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({
            Errors: ["The request body is missing."],
            StatusCode: 400,
          } satisfies OutSystemsErrorResponse),
          text: async () => "",
        } as unknown as Response);
      }

      // Pass undefined body — OutSystems returns its built-in missing-body error
      const res = await client.post<OutSystemsErrorResponse>("/employees", undefined);
      expect(res.status).toBe(400);
      expect(res.ok).toBe(false);
      expect(res.data.Errors).toContain("The request body is missing.");
      expect(res.data.StatusCode).toBe(400);
    });
  });
});
