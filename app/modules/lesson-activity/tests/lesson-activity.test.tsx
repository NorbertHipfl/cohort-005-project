import { renderToStaticMarkup } from "react-dom/server";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LessonActivity } from "../index";

const fetcherResponse = vi.hoisted(
  (): {
    state: "idle" | "submitting" | "loading";
    data: { ok: boolean; error?: string } | undefined;
  } => ({ state: "idle", data: undefined })
);

vi.mock("react-router", async (importOriginal) => {
  const original = await importOriginal<typeof import("react-router")>();
  return {
    ...original,
    useFetcher: () => ({ ...original.useFetcher(), ...fetcherResponse }),
  };
});

beforeEach(() => {
  fetcherResponse.state = "idle";
  fetcherResponse.data = undefined;
});

function renderActivity({
  currentUserId = 5,
  note = null,
}: {
  currentUserId?: number | null;
  note?: { body: string; updatedAt: string } | null;
} = {}) {
  const router = createMemoryRouter([
    {
      path: "/",
      element: (
        <LessonActivity
          comments={[]}
          currentUserId={currentUserId}
          canModerate={false}
          canPost
          instructorName="Sarah"
          note={note}
        />
      ),
    },
  ]);
  return renderToStaticMarkup(<RouterProvider router={router} />);
}

describe("lesson activity", () => {
  it("groups notes with Discussion, showing Discussion first and keeping both drafts mounted", () => {
    const html = renderActivity();

    expect(html).toContain('aria-label="Lesson activity"');
    expect(html).toMatch(/aria-selected="true"[^>]*>.*?Discussion/);
    expect(html).toMatch(/aria-selected="false"[^>]*>.*?Your notes/);
    expect(html).toContain('name="intent" value="create-comment"');
    expect(html).toContain('name="intent" value="save-note"');
    expect(html).toContain(
      'class="flex-1 outline-none data-[state=inactive]:hidden"'
    );
  });

  it("offers a labelled empty private note without an edited timestamp", () => {
    const html = renderActivity();

    expect(html).toContain('aria-label="Your notes"');
    expect(html).toMatch(
      /<textarea[^>]*aria-label="Your notes"[^>]*><\/textarea>/
    );
    expect(html).toContain('aria-describedby="lesson-note-privacy"');
    expect(html).toContain('id="lesson-note-privacy"');
    expect(html).toContain("Only you can read these notes.");
    expect(html).toContain("Save note");
    expect(html).not.toContain("Last edited");
    expect(html).not.toContain('role="alert"');
  });

  it("loads the saved note as plain text with its last-edited status", () => {
    const html = renderActivity({
      note: {
        body: "<script>private takeaway</script>",
        updatedAt: "2026-10-06T12:00:00.000Z",
      },
    });

    expect(html).toContain("&lt;script&gt;private takeaway&lt;/script&gt;");
    expect(html).toContain("Last edited");
    expect(html).not.toContain("<script>");
  });

  it("keeps Discussion available without exposing a notes tab or editor when signed out", () => {
    const html = renderActivity({ currentUserId: null });

    expect(html).toContain("Questions &amp; Discussion");
    expect(html).not.toContain("Your notes");
    expect(html).not.toContain('value="save-note"');
  });

  it.each(["submitting", "loading"] as const)(
    "disables saving while a note is %s",
    (state) => {
      fetcherResponse.state = state;
      const html = renderActivity();

      expect(html).toMatch(
        /<button[^>]*disabled=""[^>]*>Saving\.\.\.<\/button>/
      );
      expect(html).not.toContain(">Save note</button>");
    }
  );

  it("announces a failed save instead of showing the previous saved timestamp", () => {
    fetcherResponse.data = { ok: false, error: "Your note was not saved." };
    const html = renderActivity({
      note: { body: "Previous note", updatedAt: "2026-10-06T12:00:00.000Z" },
    });

    expect(html).toMatch(/role="alert"[^>]*>Your note was not saved\.<\/span>/);
    expect(html).not.toContain("Last edited");
    expect(html).toContain(">Save note</button>");
  });
});
