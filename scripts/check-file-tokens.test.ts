import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const script = fileURLToPath(
  new URL("./check-file-tokens.js", import.meta.url)
);
let directory: string;

beforeEach(() => {
  directory = mkdtempSync(path.join(tmpdir(), "check-file-tokens-"));
  mkdirSync(path.join(directory, ".github", "workflows"), { recursive: true });
  writeFileSync(
    path.join(directory, ".github", "workflows", "large.yml"),
    "#".repeat(20001)
  );
});

afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
});

function check(file: string) {
  return spawnSync(process.execPath, [script, file], {
    cwd: directory,
    encoding: "utf8",
  });
}

describe("file token limit", () => {
  it("exempts workflows passed as relative paths", () => {
    expect(check(".github/workflows/large.yml").status).toBe(0);
  });

  it("exempts workflows passed as native absolute paths by lint-staged", () => {
    expect(
      check(path.join(directory, ".github", "workflows", "large.yml")).status
    ).toBe(0);
  });

  it("exempts workflows passed as slash-separated absolute paths", () => {
    const file = path.join(directory, ".github", "workflows", "large.yml");
    expect(check(file.replaceAll("\\", "/")).status).toBe(0);
  });

  it("still rejects oversized non-exempt files", () => {
    const file = path.join(directory, "large.ts");
    writeFileSync(file, "x".repeat(20001));
    const result = check(file);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("large.ts: ~5001 tokens");
  });
});
