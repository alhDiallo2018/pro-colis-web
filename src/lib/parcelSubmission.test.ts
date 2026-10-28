import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearSubmissionStore, submissionStore } from "./parcelSubmission";
vi.mock("./api/client", () => ({ api: { post: vi.fn() } }));
beforeEach(async () => clearSubmissionStore());
describe("journal de publication", () => {
  it("retrouve la même demande et les médias après réouverture de la base", async () => {
    const pending = {
      requestId: "same-request",
      payload: { receiverName: "Awa" },
      media: [
        { id: "same-file", data: "data:image/png;base64,YQ==", sent: false },
      ],
    };
    await submissionStore("pending:u1", "put", pending);
    expect(await submissionStore("pending:u1", "get")).toEqual(pending);
    await submissionStore("pending:u1", "put", {
      ...pending,
      parcelId: "p1",
      media: [{ ...pending.media[0], sent: true }],
    });
    expect(await submissionStore("pending:u1", "get")).toMatchObject({
      requestId: "same-request",
      parcelId: "p1",
      media: [{ id: "same-file", sent: true }],
    });
    expect(await submissionStore("pending:u2", "get")).toBeUndefined();
  });
  it("purge les demandes et pièces jointes à la déconnexion", async () => {
    await submissionStore("pending:u1", "put", { requestId: "r1" });
    await submissionStore("media:u1", "put", { items: ["photo"] });
    await clearSubmissionStore();
    expect(await submissionStore("pending:u1", "get")).toBeUndefined();
    expect(await submissionStore("media:u1", "get")).toBeUndefined();
  });
  it("échoue si le stockage refuse l’ouverture", async () => {
    const spy = vi.spyOn(indexedDB, "open").mockImplementation(() => {
      throw new DOMException("Storage unavailable", "SecurityError");
    });
    await expect(submissionStore("pending:u1", "put", {})).rejects.toThrow(
      "Storage unavailable",
    );
    spy.mockRestore();
  });
});
