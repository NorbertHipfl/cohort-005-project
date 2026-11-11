// Three inbox layouts on /dashboard?prototype=notifications, switched with ?variant=A|B|C.
import { useState } from "react";
import { useSearchParams } from "react-router";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  CheckCheck,
  Circle,
  MessageSquare,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { getPrototypeVariant, PrototypeSwitcher } from "./prototype-switcher";

type Persona = "student" | "instructor";
type Filter = "all" | "unread";
type DemoNotification = {
  id: string;
  persona: Persona;
  course: string;
  kind: "reply" | "question" | "milestone" | "unavailable";
  title: string;
  body: string;
  time: string;
  minutesAgo: number;
  read: boolean;
  lesson: string;
};

const initialNotifications: DemoNotification[] = [
  {
    id: "s1",
    persona: "student",
    course: "TypeScript Foundations",
    kind: "reply",
    title: "Maya replied to your question",
    body: "Try narrowing the union before accessing that property. The example in lesson 4 walks through it.",
    time: "2 minutes ago",
    minutesAgo: 2,
    read: false,
    lesson: "Narrowing a union",
  },
  {
    id: "s2",
    persona: "student",
    course: "Practical React",
    kind: "milestone",
    title: "You're halfway through!",
    body: "You've completed 6 of 12 lessons. Your 50% Course Milestone is worth celebrating.",
    time: "18 minutes ago",
    minutesAgo: 18,
    read: false,
    lesson: "Course overview",
  },
  {
    id: "s3",
    persona: "student",
    course: "TypeScript Foundations",
    kind: "milestone",
    title: "Your first quarter, completed",
    body: "You've completed 3 of 12 lessons and passed your 25% Course Milestone.",
    time: "1 hour ago",
    minutesAgo: 60,
    read: true,
    lesson: "Course overview",
  },
  {
    id: "s4",
    persona: "student",
    course: "Practical React",
    kind: "reply",
    title: "Alex replied in your discussion",
    body: "The cleanup function runs before the next effect. That helped the example click for me.",
    time: "3 hours ago",
    minutesAgo: 180,
    read: false,
    lesson: "Understanding effects",
  },
  {
    id: "s5",
    persona: "student",
    course: "Testing with Confidence",
    kind: "unavailable",
    title: "This comment is no longer available",
    body: "The comment was deleted. Its original text is not retained in this preview.",
    time: "Yesterday",
    minutesAgo: 1440,
    read: false,
    lesson: "No destination",
  },
  {
    id: "s6",
    persona: "student",
    course: "Testing with Confidence",
    kind: "milestone",
    title: "Course completed. Nicely done.",
    body: "You've completed all 8 lessons. Your personal milestone remains even if your Enrollment ends.",
    time: "2 days ago",
    minutesAgo: 2880,
    read: true,
    lesson: "Course overview",
  },
  {
    id: "i1",
    persona: "instructor",
    course: "TypeScript Foundations",
    kind: "question",
    title: "A Student posted a new comment",
    body: "Could you explain when to choose unknown instead of any? I'm unsure about the trade-off.",
    time: "3 minutes ago",
    minutesAgo: 3,
    read: false,
    lesson: "Safer types",
  },
  {
    id: "i2",
    persona: "instructor",
    course: "Practical React",
    kind: "reply",
    title: "A Student followed up in a discussion",
    body: "Thanks! Does the same cleanup rule apply when the component unmounts?",
    time: "12 minutes ago",
    minutesAgo: 12,
    read: false,
    lesson: "Understanding effects",
  },
  {
    id: "i3",
    persona: "instructor",
    course: "TypeScript Foundations",
    kind: "question",
    title: "A Student posted a new comment",
    body: "The narrowing example finally makes sense. A second example with arrays would be helpful.",
    time: "1 hour ago",
    minutesAgo: 60,
    read: true,
    lesson: "Narrowing a union",
  },
  {
    id: "i4",
    persona: "instructor",
    course: "Testing with Confidence",
    kind: "unavailable",
    title: "This comment is no longer available",
    body: "There is no original comment text or active destination to expose.",
    time: "Yesterday",
    minutesAgo: 1440,
    read: false,
    lesson: "No destination",
  },
];

type Group = { course: string; items: DemoNotification[] };
type LayoutProps = {
  groups: Group[];
  selected: DemoNotification | undefined;
  onOpen: (item: DemoNotification) => void;
  onToggleRead: (item: DemoNotification) => void;
  persona: Persona;
};

function NotificationIcon({ kind }: { kind: DemoNotification["kind"] }) {
  const Icon = kind === "milestone" ? Trophy : MessageSquare;
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full",
        kind === "milestone"
          ? "bg-amber-100 text-amber-800"
          : "bg-indigo-100 text-indigo-800"
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}

function NotificationItem({
  item,
  compact = false,
  selected,
  onOpen,
  onToggleRead,
}: {
  item: DemoNotification;
  compact?: boolean;
  selected: boolean;
  onOpen: LayoutProps["onOpen"];
  onToggleRead: LayoutProps["onToggleRead"];
}) {
  return (
    <article
      data-notification-id={item.id}
      className={cn(
        "relative rounded-lg border p-3",
        selected
          ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
          : "border-border",
        !item.read && !selected && "bg-muted/40"
      )}
    >
      <div className="flex items-start gap-3">
        <NotificationIcon kind={item.kind} />
        <div className="min-w-0 flex-1">
          <button
            onClick={() => onOpen(item)}
            className="w-full text-left focus-visible:outline-2 focus-visible:outline-indigo-500"
          >
            <span
              className={cn("block text-sm", !item.read && "font-semibold")}
            >
              {item.title}
              {!item.read && (
                <span
                  className="ml-2 inline-block size-2 rounded-full bg-indigo-600"
                  aria-label="Unread"
                />
              )}
            </span>
            <span
              className={cn(
                "mt-1 block text-sm text-muted-foreground",
                compact && "line-clamp-2"
              )}
            >
              {item.body}
            </span>
            <span className="mt-2 block text-xs text-muted-foreground">
              {item.time} / {item.lesson}
            </span>
          </button>
          <button
            onClick={() => onToggleRead(item)}
            className="mt-3 text-xs font-medium text-indigo-700 underline-offset-4 hover:underline dark:text-indigo-300"
            aria-label={`Mark ${item.title} ${item.read ? "unread" : "read"}`}
          >
            Mark {item.read ? "unread" : "read"}
          </button>
        </div>
      </div>
    </article>
  );
}

function EmptyInbox() {
  return (
    <div className="rounded-xl border border-dashed px-6 py-12 text-center">
      <CheckCheck className="mx-auto mb-3 size-8 text-muted-foreground" />
      <h3 className="font-semibold">You're all caught up</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Switch to All to revisit read notifications.
      </p>
    </div>
  );
}

function DestinationPreview({ item }: { item: DemoNotification | undefined }) {
  return (
    <section
      aria-label="Mock destination preview"
      className="rounded-xl border bg-card p-5"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
        Synthetic destination preview / no navigation
      </p>
      {!item ? (
        <div className="py-12 text-center text-muted-foreground">
          <BookOpen className="mx-auto mb-3 size-8" />
          <p>Open a notification to preview where it would take you.</p>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">{item.course}</p>
          <h3 className="mt-1 text-xl font-semibold">
            {item.kind === "unavailable" ? item.title : item.lesson}
          </h3>
          <p className="mt-4 rounded-lg bg-muted p-4 text-sm leading-relaxed">
            {item.body}
          </p>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            {item.kind === "unavailable"
              ? "No active destination. You can still change this item's read state."
              : item.kind === "milestone"
                ? "In the real feature this opens the course overview, without granting course access."
                : "In the real feature this opens this specific comment in its lesson discussion. Reading does not answer or resolve it."}
          </p>
        </div>
      )}
    </section>
  );
}

function VariantA(props: LayoutProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 border-l-4 border-indigo-600 pl-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          A / Course activity journal
        </p>
        <h2 className="mt-1 text-2xl font-bold">Your courses, in the loop.</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A focused reading page with generous space for context.
        </p>
      </div>
      {props.groups.length === 0 && <EmptyInbox />}
      <div className="space-y-8">
        {props.groups.map((group) => (
          <section key={group.course} aria-label={group.course}>
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <BookOpen className="size-4" />
              {group.course}
            </h3>
            <div className="space-y-3 border-l-2 border-muted pl-4">
              {group.items.map((item) => (
                <div key={item.id}>
                  <NotificationItem
                    item={item}
                    selected={props.selected?.id === item.id}
                    onOpen={props.onOpen}
                    onToggleRead={props.onToggleRead}
                  />
                  {props.selected?.id === item.id && (
                    <div className="mt-2">
                      <DestinationPreview item={item} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function MockDashboard({ persona }: { persona: Persona }) {
  return (
    <section aria-label="Synthetic dashboard context" className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Demo dashboard / fake data
      </p>
      <h2 className="mt-2 text-3xl font-bold">
        {persona === "student"
          ? "Keep your momentum."
          : "Your teaching, at a glance."}
      </h2>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
        {persona === "student"
          ? "Pick up where you left off. Course conversations and personal milestones live alongside your learning."
          : "Stay close to course conversations. Notifications help you find activity; your questions queue tracks what still needs an answer."}
      </p>
      <div className="mt-8 grid gap-4 xl:grid-cols-2">
        {["TypeScript Foundations", "Practical React"].map((course, index) => (
          <div
            key={course}
            className="overflow-hidden rounded-xl border bg-card"
          >
            <div
              className={cn(
                "flex h-24 items-center justify-between p-5",
                index === 0
                  ? "bg-indigo-100 text-indigo-900"
                  : "bg-amber-100 text-amber-900"
              )}
            >
              <BookOpen className="size-8" />
              <span className="text-4xl font-black opacity-30">
                0{index + 1}
              </span>
            </div>
            <div className="p-5">
              <h3 className="font-semibold">{course}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {persona === "student"
                  ? `${index === 0 ? 25 : 50}% of lessons completed`
                  : "Course discussion activity"}
              </p>
              <div className="mt-4 h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-indigo-600"
                  style={{ width: `${index === 0 ? 25 : 50}%` }}
                />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Context only / navigation disabled
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function VariantB(props: LayoutProps) {
  return (
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="xl:sticky xl:top-6">
        <MockDashboard persona={props.persona} />
        <p className="mt-6 text-sm text-muted-foreground">
          B / An inbox side panel keeps the dashboard in view.
        </p>
        {props.selected && (
          <div className="mt-6">
            <DestinationPreview item={props.selected} />
          </div>
        )}
      </div>
      <aside
        aria-label="Notification side panel"
        className="rounded-xl border bg-card p-4 shadow-sm"
      >
        <h2 className="mb-5 text-lg font-bold">Course updates</h2>
        {props.groups.length === 0 && <EmptyInbox />}
        <div className="space-y-6">
          {props.groups.map((group) => (
            <section key={group.course} aria-label={group.course}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.course}
              </h3>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <NotificationItem
                    key={item.id}
                    compact
                    item={item}
                    selected={props.selected?.id === item.id}
                    onOpen={props.onOpen}
                    onToggleRead={props.onToggleRead}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </aside>
    </div>
  );
}

function VariantC(props: LayoutProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b bg-muted/40 px-5 py-4">
        <h2 className="font-bold">C / Split-view workbench</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Comments and achievements, separated within each course. Preview on
          the right.
        </p>
      </div>
      <div className="grid lg:grid-cols-[minmax(18rem,2fr)_minmax(0,3fr)]">
        <div className="space-y-5 p-4 lg:border-r">
          {props.groups.length === 0 && <EmptyInbox />}
          {props.groups.map((group) => (
            <section key={group.course} aria-label={group.course}>
              <h3 className="mb-2 text-sm font-semibold">{group.course}</h3>
              <div className="space-y-4">
                {(["comments", "achievements"] as const).map((category) => {
                  const items = group.items.filter((item) =>
                    category === "achievements"
                      ? item.kind === "milestone"
                      : item.kind !== "milestone"
                  );
                  if (items.length === 0) return null;
                  const label =
                    category === "achievements"
                      ? "Achievements"
                      : "Comments & replies";
                  const Icon =
                    category === "achievements" ? Trophy : MessageSquare;
                  return (
                    <section
                      key={category}
                      aria-label={`${group.course}: ${label}`}
                    >
                      <h4 className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Icon className="size-3.5" />
                        {label}
                        <span className="rounded-full bg-muted px-1.5 py-0.5">
                          {items.length}
                        </span>
                      </h4>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <NotificationItem
                            key={item.id}
                            compact
                            item={item}
                            selected={props.selected?.id === item.id}
                            onOpen={props.onOpen}
                            onToggleRead={props.onToggleRead}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        <div className="bg-muted/20 p-5">
          <div className="lg:sticky lg:top-6">
            <DestinationPreview item={props.selected} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationInboxPrototype() {
  const [params, setParams] = useSearchParams();
  const variant = getPrototypeVariant(params.get("variant"));
  const persona: Persona =
    params.get("persona") === "instructor" ? "instructor" : "student";
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inboxOpen, setInboxOpen] = useState(true);
  const [lastAction, setLastAction] = useState(
    "Initial synthetic data loaded. Nothing is persisted."
  );
  const personalItems = notifications.filter(
    (item) => item.persona === persona
  );
  const unreadCount = personalItems.filter((item) => !item.read).length;
  const visibleItems = personalItems
    .filter((item) => filter === "all" || !item.read)
    .sort((left, right) => left.minutesAgo - right.minutesAgo);
  const groups: Group[] = [];
  for (const item of visibleItems) {
    const group = groups.find((candidate) => candidate.course === item.course);
    if (group) group.items.push(item);
    else groups.push({ course: item.course, items: [item] });
  }
  const selected = personalItems.find((item) => item.id === selectedId);

  function openItem(item: DemoNotification) {
    setNotifications((previous) =>
      previous.map((entry) =>
        entry.id === item.id ? { ...entry, read: true } : entry
      )
    );
    setSelectedId(item.id);
    setLastAction(
      `Opened ${item.id}; marked read. Destination is a synthetic preview only.`
    );
  }

  function toggleRead(item: DemoNotification) {
    setNotifications((previous) =>
      previous.map((entry) =>
        entry.id === item.id ? { ...entry, read: !entry.read } : entry
      )
    );
    setLastAction(
      `Marked ${item.id} ${item.read ? "unread" : "read"}. No conversation was resolved.`
    );
  }

  const layoutProps: LayoutProps = {
    groups,
    selected,
    onOpen: openItem,
    onToggleRead: toggleRead,
    persona,
  };

  if (!import.meta.env.DEV) return null;

  return (
    <div className="pb-28">
      <div className="border-b bg-amber-50 px-5 py-3 text-sm text-amber-950">
        <strong>THROWAWAY UI PROTOTYPE.</strong> Which course-grouped inbox
        layout feels best? Fake people and courses; memory only; no provider,
        real mutations, or backend guarantees. Surrounding sidebar navigation is
        disabled.
      </div>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b px-5 py-5 lg:px-8">
        <div>
          <p className="text-xs text-muted-foreground">
            Cadence / {persona === "student" ? "Student" : "Instructor"} preview
          </p>
          <h1 className="mt-1 text-2xl font-bold">Notifications</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm">
            Preview as{" "}
            <select
              aria-label="Preview as"
              value={persona}
              onChange={(event) => {
                const next = event.target.value;
                setSelectedId(null);
                setParams(
                  (previous) => {
                    const updated = new URLSearchParams(previous);
                    updated.set("persona", next);
                    return updated;
                  },
                  { replace: true, preventScrollReset: true }
                );
                setLastAction(
                  `Changed perspective to ${next}. Each persona has separate fake notifications.`
                );
              }}
              className="ml-1 rounded-md border bg-background p-2"
            >
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
            </select>
          </label>
          <Button
            variant="outline"
            aria-label={`Notifications, ${unreadCount} unread`}
            aria-expanded={inboxOpen}
            onClick={() => {
              setInboxOpen((open) => !open);
              setLastAction(
                "Toggled the inbox without changing any read state."
              );
            }}
          >
            <Bell />
            <span data-testid="unread-count">{unreadCount}</span>
          </Button>
        </div>
      </header>
      <div className="p-5 lg:p-8">
        {inboxOpen ? (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div
                className="inline-flex rounded-lg bg-muted p-1"
                role="group"
                aria-label="Notification filter"
              >
                {(["all", "unread"] as const).map((value) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={filter === value ? "outline" : "ghost"}
                    aria-pressed={filter === value}
                    onClick={() => {
                      setFilter(value);
                      setLastAction(
                        `Filter set to ${value}. Read state is unchanged.`
                      );
                    }}
                  >
                    {value === "all" ? "All" : `Unread (${unreadCount})`}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={unreadCount === 0}
                onClick={() => {
                  setNotifications((previous) =>
                    previous.map((item) =>
                      item.persona === persona ? { ...item, read: true } : item
                    )
                  );
                  setLastAction(
                    `Marked all ${persona} inbox items read across every course. The other persona is unchanged.`
                  );
                }}
              >
                <CheckCheck />
                Mark all read
              </Button>
            </div>
            {variant === "A" && <VariantA {...layoutProps} />}
            {variant === "B" && <VariantB {...layoutProps} />}
            {variant === "C" && <VariantC {...layoutProps} />}
            {filter === "unread" && selected?.read && (
              <p className="mt-4 text-sm text-muted-foreground" role="status">
                Opened item marked read and removed from the Unread list. Find
                it again under All.
              </p>
            )}
          </>
        ) : (
          <MockDashboard persona={persona} />
        )}
        <section
          aria-label="Prototype state"
          className="mt-10 rounded-xl border border-dashed bg-muted/30 p-4 text-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold uppercase tracking-wide">
              Live prototype state
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setNotifications(initialNotifications);
                setFilter("all");
                setSelectedId(null);
                setInboxOpen(true);
                setLastAction(
                  "Reset both personas to the original synthetic data."
                );
              }}
            >
              <RotateCcw />
              Reset demo
            </Button>
          </div>
          <p className="mt-3" role="status">
            {lastAction}
          </p>
          <dl className="mt-3 grid gap-2 sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Layout / perspective</dt>
              <dd>
                {variant} / {persona}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Inbox / filter / unread</dt>
              <dd>
                {inboxOpen ? "open" : "closed"} / {filter} / {unreadCount}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Selected item</dt>
              <dd>
                {selected?.id ?? "none"} / {selected?.kind ?? "none"}
              </dd>
            </div>
          </dl>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {personalItems.map((item) => (
              <li key={item.id} className="flex items-center gap-2">
                <Circle
                  className={cn(
                    "size-2",
                    !item.read && "fill-indigo-600 text-indigo-600"
                  )}
                />
                {item.id}: {item.read ? "read" : "unread"} / {item.course}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-muted-foreground">
            All samples are accessible and younger than 90 days. This UI does
            not simulate real authorization, durable writes, retries, expiry
            jobs, capacity, or cross-device synchronization.
          </p>
          <p className="mt-2 flex items-center gap-1 text-muted-foreground">
            <ArrowUpRight className="size-3" />
            Layout changes preserve in-memory state. Reloading resets it;
            variant and perspective stay in the URL.
          </p>
        </section>
      </div>
      <PrototypeSwitcher />
    </div>
  );
}
