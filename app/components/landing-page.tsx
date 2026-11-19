import { ArrowRight, BookOpen, Clock3 } from "lucide-react";
import { Link } from "react-router";
import { CourseImage } from "~/components/course-image";
import { Button } from "~/components/ui/button";
import {
  getLandingPageContent,
  type LandingPageInput,
} from "~/modules/landing-page";

type LandingPageContent = ReturnType<typeof getLandingPageContent>;
type CourseCardContent = LandingPageContent["courses"][number];

export function LandingPage(props: LandingPageInput) {
  const { courses, spotlight, statistics } = getLandingPageContent(props);

  return (
    <main>
      <section
        aria-labelledby="landing-heading"
        className="border-b border-border bg-[#f6f7f2] dark:bg-muted/20"
      >
        <div className="mx-auto max-w-6xl px-6 pt-14 sm:pt-20">
          <div className="grid items-center gap-12 pb-14 lg:grid-cols-[1.2fr_1fr] lg:gap-16 lg:pb-20">
            <HeroIntro />
            {spotlight && <CourseSpotlight course={spotlight} />}
          </div>

          <dl className="grid gap-6 border-t border-border py-8 text-left sm:grid-cols-3 sm:gap-8">
            {statistics.map(({ label, value }) => (
              <div
                key={label}
                className="sm:border-l sm:border-border sm:pl-8 sm:first:border-0 sm:first:pl-0"
              >
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-3xl font-semibold tracking-tight">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {courses.length > 0 && <CourseCollection courses={courses} />}
    </main>
  );
}

function HeroIntro() {
  return (
    <div className="text-left">
      <p className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-900 dark:text-lime-300">
        <span
          aria-hidden="true"
          className="size-2 rounded-full bg-emerald-700 dark:bg-lime-300"
        />
        Learning, on your terms
      </p>
      <h1
        id="landing-heading"
        className="text-5xl font-semibold leading-[1.05] tracking-[-0.05em] sm:text-7xl"
      >
        Build skills.
        <br />
        <span className="text-emerald-800 dark:text-lime-300">
          At your pace.
        </span>
      </h1>
      <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
        Make room for your next big idea. Learn from experienced instructors,
        put your knowledge to work, and keep moving forward. One lesson at a
        time.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-5">
        <Button asChild size="lg" className="h-12 px-6">
          <Link to="/courses">
            Browse Courses <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock3 aria-hidden="true" className="size-4" />
          Your schedule. Your momentum.
        </span>
      </div>
    </div>
  );
}

function CourseCollection({ courses }: Pick<LandingPageContent, "courses">) {
  return (
    <section
      aria-labelledby="featured-heading"
      className="mx-auto max-w-6xl px-6 py-14 sm:py-20"
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Your next chapter
          </p>
          <h2
            id="featured-heading"
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Find your starting point.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Explore our latest courses and build on what you know.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/courses">
            View all courses <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <li key={course.id}>
            <CourseCard course={course} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function CourseSpotlight({ course }: { course: CourseCardContent }) {
  return (
    <aside
      aria-label="Course spotlight"
      className="rounded-2xl bg-[#19392e] p-5 text-white sm:p-6"
    >
      <p className="mb-5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-lime-200">
        <BookOpen aria-hidden="true" className="size-4" />
        In the spotlight
      </p>
      <CourseImage
        src={course.coverImageUrl}
        alt={course.title}
        className="aspect-video w-full rounded-lg object-cover"
      />
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-emerald-100">
        <span>{course.categoryName}</span>
        <span>{course.lessons}</span>
      </div>
      <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-tight">
        {course.title}
      </h2>
      <p className="mt-2 text-sm text-emerald-100">
        With {course.instructorName}
      </p>
      <Link
        to={course.href}
        className="mt-6 flex items-center justify-between gap-4 border-t border-white/20 pt-4 text-sm font-medium text-lime-200 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-200"
      >
        Explore course
        <ArrowRight aria-hidden="true" className="size-5" />
      </Link>
    </aside>
  );
}

function CourseCard({ course }: { course: CourseCardContent }) {
  return (
    <Link
      to={course.href}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      <CourseImage
        src={course.coverImageUrl}
        alt={course.title}
        className="aspect-video w-full object-cover"
      />
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium text-muted-foreground">
          {course.categoryName}
        </p>
        <h3 className="mt-2 font-semibold leading-snug group-hover:underline">
          {course.title}
        </h3>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {course.description}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-6 text-xs text-muted-foreground">
          <span>{course.instructorName}</span>
          <span className="flex items-center gap-1">
            <BookOpen aria-hidden="true" className="size-3" />
            {course.lessons}
          </span>
        </div>
      </div>
    </Link>
  );
}
