import { ErrorState } from "@/components/ui/States";
import { CapabilitiesSection, CategoriesSection, CtaSection, FeaturedProjects } from "@/features/home/Sections";
import { Hero } from "@/features/home/Hero";
import { getCategories, getFeaturedProjects, getProjects } from "@/lib/api/public";
import type { Category, ProjectCardData } from "@/types/api";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let featured: ProjectCardData[] = [];
  let categories: Category[] = [];
  let total: number | null = null;
  let failed = false;

  try {
    const [featuredResult, categoriesResult, listResult] = await Promise.all([
      getFeaturedProjects(6),
      getCategories(),
      getProjects({ page_size: 1 }),
    ]);
    featured = featuredResult;
    categories = categoriesResult;
    total = listResult.count;
  } catch {
    failed = true;
  }

  return (
    <>
      <Hero projectCount={total} categories={categories} />
      {failed ? (
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <ErrorState message="The project catalogue is temporarily unavailable. Please refresh in a moment." />
        </div>
      ) : (
        <>
          <FeaturedProjects projects={featured} />
          <CategoriesSection categories={categories} />
        </>
      )}
      <CapabilitiesSection />
      <CtaSection />
    </>
  );
}
