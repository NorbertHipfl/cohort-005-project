import type { ComponentProps } from "react";
import { useFetcher } from "react-router";
import { LockKeyhole, MessageSquare, NotebookPen } from "lucide-react";
import { CommentThread } from "~/components/comment-thread";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { formatRelativeTime } from "~/lib/utils";

type Note = { body: string; updatedAt: string } | null;

export function LessonActivity({
  note,
  ...discussion
}: ComponentProps<typeof CommentThread> & { note: Note }) {
  return (
    <section aria-label="Lesson activity" className="border-t pt-6">
      <Tabs defaultValue="discussion" className="gap-4">
        <TabsList aria-label="Lesson activity">
          <TabsTrigger value="discussion">
            <MessageSquare />
            Discussion
          </TabsTrigger>
          {discussion.currentUserId && (
            <TabsTrigger value="notes">
              <NotebookPen />
              Your notes
            </TabsTrigger>
          )}
        </TabsList>
        {/* Keep drafts mounted while switching between private and shared writing. */}
        <TabsContent
          value="discussion"
          forceMount
          className="data-[state=inactive]:hidden"
        >
          <CommentThread {...discussion} />
        </TabsContent>
        {discussion.currentUserId && (
          <TabsContent
            value="notes"
            forceMount
            className="data-[state=inactive]:hidden"
          >
            <LessonNote note={note} />
          </TabsContent>
        )}
      </Tabs>
    </section>
  );
}

function LessonNote({ note }: { note: Note }) {
  const fetcher = useFetcher<{ ok: boolean; error?: string }>();
  const isSaving = fetcher.state !== "idle";
  const error = fetcher.data?.error;

  return (
    <Card className="mb-8">
      <CardContent className="space-y-4 p-6">
        <NoteHeading />
        <fetcher.Form method="post" className="space-y-4">
          <input type="hidden" name="intent" value="save-note" />
          <Textarea
            name="body"
            aria-label="Your notes"
            aria-describedby="lesson-note-privacy"
            rows={5}
            defaultValue={note?.body ?? ""}
            placeholder="Capture a takeaway or something to revisit..."
            className="resize-y"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save note"}
            </Button>
            {error && (
              <span role="alert" className="text-sm text-destructive">
                {error}
              </span>
            )}
            {!error && note && (
              <span
                suppressHydrationWarning
                className="text-xs text-muted-foreground"
              >
                Last edited {formatRelativeTime(note.updatedAt)}
              </span>
            )}
          </div>
        </fetcher.Form>
      </CardContent>
    </Card>
  );
}

function NoteHeading() {
  return (
    <div>
      <div className="flex items-center gap-2">
        <NotebookPen className="size-5 text-primary" />
        <h2 className="text-xl font-semibold">Your notes</h2>
      </div>
      <p
        id="lesson-note-privacy"
        className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <LockKeyhole className="size-3.5 shrink-0" />
        Only you can read these notes.
      </p>
    </div>
  );
}
