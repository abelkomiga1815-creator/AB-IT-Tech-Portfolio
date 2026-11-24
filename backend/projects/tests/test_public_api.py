from datetime import date

from categories.models import Category
from core.testing import BaseAPITestCase
from gallery.models import ProjectImage
from projects.models import Project
from projects.serializers import resolve_technologies

API = "/api/v1"


def make_project(title, *, published=True, category=None, techs=(), featured=False, **extra):
    project = Project.objects.create(
        title=title,
        short_description=f"{title} short",
        description=f"{title} description",
        category=category,
        is_featured=featured,
        publication_status="published" if published else "draft",
        **extra,
    )
    project.technologies.set(resolve_technologies(list(techs)))
    return project


class PublicProjectApiTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.web = Category.objects.create(name="Web")
        self.mobile = Category.objects.create(name="Mobile")

    def test_list_returns_only_published_projects(self):
        make_project("Live", category=self.web)
        make_project("Hidden", published=False, category=self.web)
        response = self.client.get(f"{API}/projects/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([p["title"] for p in response.data["results"]], ["Live"])

    def test_list_is_public_and_does_not_leak_admin_fields(self):
        make_project("Live")
        item = self.client.get(f"{API}/projects/").data["results"][0]
        self.assertNotIn("publication_status", item)
        self.assertNotIn("display_order", item)
        self.assertNotIn("description", item)

    def test_filter_by_category_slug(self):
        make_project("A", category=self.web)
        make_project("B", category=self.mobile)
        response = self.client.get(f"{API}/projects/", {"category": "mobile"})
        self.assertEqual([p["title"] for p in response.data["results"]], ["B"])

    def test_filter_by_technology_slug(self):
        make_project("A", techs=["Django"])
        make_project("B", techs=["Flutter"])
        response = self.client.get(f"{API}/projects/", {"technology": "flutter"})
        self.assertEqual([p["title"] for p in response.data["results"]], ["B"])

    def test_filter_featured_and_status(self):
        make_project("A", featured=True)
        make_project("B", project_status="in_progress")
        self.assertEqual(self.client.get(f"{API}/projects/", {"featured": "true"}).data["count"], 1)
        self.assertEqual(self.client.get(f"{API}/projects/", {"status": "in_progress"}).data["count"], 1)

    def test_search_matches_title_description_technology_and_category(self):
        make_project("Inventory Tracker", category=self.web, techs=["PostgreSQL"])
        make_project("Other", category=self.mobile)
        for term in ("inventory", "Tracker description", "postgres", "Web"):
            response = self.client.get(f"{API}/projects/", {"search": term})
            self.assertEqual(response.data["count"], 1, term)
        self.assertEqual(self.client.get(f"{API}/projects/", {"search": "zzzz"}).data["count"], 0)

    def test_search_does_not_return_duplicates_for_multiple_technology_matches(self):
        make_project("Multi", techs=["Python", "Pythonic"])
        self.assertEqual(self.client.get(f"{API}/projects/", {"search": "python"}).data["count"], 1)

    def test_pagination(self):
        for i in range(5):
            make_project(f"P{i}")
        first = self.client.get(f"{API}/projects/", {"page_size": 2})
        self.assertEqual(first.data["count"], 5)
        self.assertEqual(len(first.data["results"]), 2)
        self.assertIsNotNone(first.data["next"])
        last = self.client.get(f"{API}/projects/", {"page_size": 2, "page": 3})
        self.assertEqual(len(last.data["results"]), 1)
        self.assertIsNone(last.data["next"])
        self.assertEqual(self.client.get(f"{API}/projects/", {"page_size": 2, "page": 9}).status_code, 404)

    def test_ordering_parameter(self):
        make_project("Bravo")
        make_project("Alpha")
        response = self.client.get(f"{API}/projects/", {"ordering": "title"})
        self.assertEqual([p["title"] for p in response.data["results"]], ["Alpha", "Bravo"])

    def test_featured_endpoint(self):
        make_project("F1", featured=True)
        make_project("F2", featured=True, published=False)
        make_project("Normal")
        response = self.client.get(f"{API}/projects/featured/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([p["title"] for p in response.data], ["F1"])

    def test_featured_limit_parameter(self):
        for i in range(4):
            make_project(f"F{i}", featured=True)
        self.assertEqual(len(self.client.get(f"{API}/projects/featured/", {"limit": 2}).data), 2)

    def test_detail_includes_full_content_images_and_related(self):
        project = make_project(
            "Main",
            category=self.web,
            techs=["Django"],
            objectives="Obj",
            problem_statement="Prob",
            solution="Sol",
            completion_date=date(2026, 3, 1),
        )
        make_project("Sibling", category=self.web)
        make_project("Draft sibling", category=self.web, published=False)
        ProjectImage.objects.create(project=project, image="projects/gallery/x.png", caption="Cap", alt_text="Alt", order=1)
        response = self.client.get(f"{API}/projects/{project.slug}/")
        self.assertEqual(response.status_code, 200)
        data = response.data
        self.assertEqual((data["objectives"], data["problem_statement"], data["solution"]), ("Obj", "Prob", "Sol"))
        self.assertEqual(data["completion_date"], "2026-03-01")
        self.assertEqual(data["images"][0]["caption"], "Cap")
        self.assertEqual([p["title"] for p in data["related_projects"]], ["Sibling"])

    def test_unknown_slug_returns_404(self):
        self.assertEqual(self.client.get(f"{API}/projects/does-not-exist/").status_code, 404)

    def test_public_endpoints_are_read_only(self):
        self.assertEqual(self.client.post(f"{API}/projects/", {"title": "x"}, format="json").status_code, 405)
        project = make_project("Live")
        self.assertEqual(self.client.delete(f"{API}/projects/{project.slug}/").status_code, 405)

    def test_technologies_endpoint_lists_only_used_by_published(self):
        make_project("A", techs=["Django"])
        make_project("B", published=False, techs=["Secret"])
        names = [t["name"] for t in self.client.get(f"{API}/technologies/").data]
        self.assertEqual(names, ["Django"])

    def test_health_endpoint(self):
        self.assertEqual(self.client.get(f"{API}/health/").data, {"status": "ok"})

    def test_openapi_schema_and_docs_are_served(self):
        self.assertEqual(self.client.get("/api/schema/").status_code, 200)
        self.assertEqual(self.client.get("/api/docs/").status_code, 200)
        self.assertEqual(self.client.get("/api/redoc/").status_code, 200)
