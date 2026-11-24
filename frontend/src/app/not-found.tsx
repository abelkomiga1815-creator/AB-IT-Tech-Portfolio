import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="mt-3 font-display text-4xl font-semibold text-white">Page not found</h1>
      <p className="mt-3 max-w-md text-silver-400">The page you are looking for does not exist, or the project is no longer published.</p>
      <div className="mt-8 flex gap-3">
        <ButtonLink href="/">Back to home</ButtonLink>
        <ButtonLink href="/projects" variant="secondary">
          Browse projects
        </ButtonLink>
      </div>
    </main>
  );
}
