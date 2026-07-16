import { describe, expect, test } from "vitest";
import { parseDocument } from "./documentParser.js";

describe("document parser", () => {
  test("parses plain text and markdown buffers", async () => {
    await expect(
      parseDocument({
        filename: "notes.md",
        mimeType: "text/markdown",
        buffer: Buffer.from("# Refunds\nManual invoice review delays refunds."),
      })
    ).resolves.toMatchObject({
      filename: "notes.md",
      mimeType: "text/markdown",
      text: "# Refunds\nManual invoice review delays refunds.",
    });
  });

  test("rejects empty parsed documents", async () => {
    await expect(
      parseDocument({
        filename: "empty.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("   "),
      })
    ).rejects.toThrow("No text could be extracted");
  });

  test("rejects unsupported file types", async () => {
    await expect(
      parseDocument({
        filename: "image.png",
        mimeType: "image/png",
        buffer: Buffer.from("fake image bytes"),
      })
    ).rejects.toThrow("Unsupported document type");
  });
});
