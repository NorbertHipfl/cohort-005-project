import { describe, expect, it } from "vitest";
import { getLandingPageContent, type LandingPageInput } from "..";

const course = {
  id: 8,
  title: "Build with TypeScript",
  slug: "build-with-typescript",
  description: "Practical skills for your next project.",
  coverImageUrl: "/typescript.png",
  instructorName: "Sarah Chen",
  categoryName: "Programming",
  lessonCount: 12,
};

function content(overrides: Partial<LandingPageInput> = {}) {
  return getLandingPageContent({
    featuredCourses: [course],
    totalCourses: 9,
    totalCategories: 5,
    ...overrides,
  });
}

describe("getLandingPageContent", () => {
  it("prepares course details and the destination without changing the source", () => {
    const result = content();

    expect(result.courses).toEqual([
      {
        id: 8,
        title: "Build with TypeScript",
        href: "/courses/build-with-typescript",
        description: "Practical skills for your next project.",
        coverImageUrl: "/typescript.png",
        instructorName: "Sarah Chen",
        categoryName: "Programming",
        lessons: "12 lessons",
      },
    ]);
    expect(course.slug).toBe("build-with-typescript");
    expect(course.lessonCount).toBe(12);
  });

  it("spotlights the first supplied course without reordering the collection", () => {
    const result = content({
      featuredCourses: [{ ...course, id: 10, slug: "newest-course" }, course],
    });

    expect(result.courses.map(({ id }) => id)).toEqual([10, 8]);
    expect(result.spotlight).toEqual(result.courses[0]);
    expect(result.spotlight?.href).toBe("/courses/newest-course");
  });

  it("uses catalogue totals rather than the number of featured courses", () => {
    expect(content().statistics).toEqual([
      { label: "Available Courses", value: "9" },
      { label: "Categories", value: "5" },
      { label: "Learn on your schedule", value: "Self-paced" },
    ]);
  });

  it("supports an empty catalogue without inventing a spotlight", () => {
    const result = content({
      featuredCourses: [],
      totalCourses: 0,
      totalCategories: 0,
    });

    expect(result.courses).toEqual([]);
    expect(result.spotlight).toBeNull();
    expect(result.statistics.slice(0, 2).map(({ value }) => value)).toEqual([
      "0",
      "0",
    ]);
  });

  it("keeps courses usable when optional display information is missing", () => {
    const result = content({
      featuredCourses: [
        {
          ...course,
          instructorName: null,
          coverImageUrl: null,
          categoryName: null,
          lessonCount: 0,
        },
      ],
    });

    expect(result.spotlight).toMatchObject({
      instructorName: "Instructor",
      coverImageUrl: null,
      categoryName: null,
      lessons: "0 lessons",
    });
  });
});
