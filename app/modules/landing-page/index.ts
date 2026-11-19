export type LandingPageInput = {
  featuredCourses: readonly {
    id: number;
    title: string;
    slug: string;
    description: string;
    coverImageUrl: string | null;
    instructorName: string | null;
    categoryName: string | null;
    lessonCount: number;
  }[];
  totalCourses: number;
  totalCategories: number;
};

export function getLandingPageContent({
  featuredCourses,
  totalCourses,
  totalCategories,
}: LandingPageInput) {
  const courses = featuredCourses.map((course) => ({
    id: course.id,
    title: course.title,
    href: `/courses/${course.slug}`,
    description: course.description,
    coverImageUrl: course.coverImageUrl,
    instructorName: course.instructorName ?? "Instructor",
    categoryName: course.categoryName,
    lessons: `${course.lessonCount} lessons`,
  }));

  return {
    courses,
    spotlight: courses[0] ?? null,
    statistics: [
      { label: "Available Courses", value: String(totalCourses) },
      { label: "Categories", value: String(totalCategories) },
      { label: "Learn on your schedule", value: "Self-paced" },
    ],
  };
}
