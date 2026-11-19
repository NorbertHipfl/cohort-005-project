import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { LandingPage } from "./landing-page";

const courses = [
  {
    id: 1,
    title: "Practical TypeScript",
    slug: "practical-typescript",
    description: "Build a typed application from scratch.",
    coverImageUrl: "/typescript.png",
    instructorName: "Sarah Chen",
    categoryName: "Development",
    lessonCount: 12,
  },
  {
    id: 2,
    title: "Testing React",
    slug: "testing-react",
    description: "Write tests for real components.",
    coverImageUrl: null,
    instructorName: null,
    categoryName: "Testing",
    lessonCount: 8,
  },
];

function renderPage(
  featuredCourses: ComponentProps<
    typeof LandingPage
  >["featuredCourses"] = courses
) {
  return renderToStaticMarkup(
    <MemoryRouter>
      <LandingPage
        featuredCourses={featuredCourses}
        totalCourses={7}
        totalCategories={4}
      />
    </MemoryRouter>
  );
}

describe("LandingPage", () => {
  it("offers a catalogue entry point and displays the supplied totals", () => {
    const html = renderPage();

    expect(html).toContain("<main>");
    expect(html).toMatch(/<h1[^>]*>Build skills\./);
    expect(html).toMatch(/href="\/courses"[^>]*>Browse Courses/);
    expect(html).toMatch(/Available Courses<\/dt><dd[^>]*>7<\/dd>/);
    expect(html).toMatch(/Categories<\/dt><dd[^>]*>4<\/dd>/);
    expect(html).toContain("Self-paced");
  });

  it("spotlights the first supplied course with its real details and destination", () => {
    const html = renderPage();
    const spotlight = html.match(/<aside[\s\S]*?<\/aside>/)?.[0];

    expect(spotlight).toContain('aria-label="Course spotlight"');
    expect(spotlight).toContain("Practical TypeScript");
    expect(spotlight).toContain("Development");
    expect(spotlight).toContain("12 lessons");
    expect(spotlight).toContain("With Sarah Chen");
    expect(spotlight).toContain('src="/typescript.png"');
    expect(spotlight).toMatch(
      /href="\/courses\/practical-typescript"[^>]*>Explore course/
    );
    expect(spotlight).not.toContain("Testing React");
  });

  it("lists every featured course with its own destination and metadata", () => {
    const html = renderPage();
    const collection = html.match(/<ul[\s\S]*?<\/ul>/)?.[0];

    expect(collection?.match(/<li>/g)).toHaveLength(2);
    for (const course of courses) {
      expect(collection).toContain(`href="/courses/${course.slug}"`);
      expect(collection).toContain(course.title);
      expect(collection).toContain(course.description);
      expect(collection).toContain(course.categoryName);
      expect(collection).toContain(`${course.lessonCount} lessons`);
    }
    expect(collection).toContain("Sarah Chen");
    expect(collection).toContain("Instructor");
    expect(html).toMatch(/href="\/courses"[^>]*>View all courses/);
  });

  it("keeps browsing available without rendering empty course sections", () => {
    const html = renderPage([]);

    expect(html).toMatch(/href="\/courses"[^>]*>Browse Courses/);
    expect(html).not.toContain("<aside");
    expect(html).not.toContain('id="featured-heading"');
    expect(html).not.toContain("<ul");
    expect(html).not.toContain("Explore course");
  });

  it("handles a spotlight without an image, category or named instructor", () => {
    const html = renderPage([{ ...courses[1], categoryName: null }]);
    const spotlight = html.match(/<aside[\s\S]*?<\/aside>/)?.[0];

    expect(spotlight).toContain("Testing React");
    expect(spotlight).toContain("With Instructor");
    expect(spotlight).toContain("8 lessons");
    expect(spotlight).not.toContain("<img");
    expect(spotlight).not.toContain("null");
    expect(spotlight).toContain('href="/courses/testing-react"');
  });
});
