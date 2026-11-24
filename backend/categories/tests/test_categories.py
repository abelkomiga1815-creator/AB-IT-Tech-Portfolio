from categories.models import Category
from core.testing import BaseAPITestCase, client_for, create_admin
from projects.models import Project

API = "/api/v1"


class AdminCategoryTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.client = client_for(create_admin())

    def test_create_generates_slug(self):
        response = self.client.post(f"{API}/admin/categories/", {"name": "Mobile Apps", "description": "x"}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["slug"], "mobile-apps")

    def test_duplicate_name_is_rejected_case_insensitively(self):
        Category.objects.create(name="Websites")
        response = self.client.post(f"{API}/admin/categories/", {"name": "websites"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("name", response.data)

    def test_edit_category(self):
        category = Category.objects.create(name="Old")
        response = self.client.patch(f"{API}/admin/categories/{category.pk}/", {"name": "New"}, format="json")
        self.assertEqual(response.status_code, 200)
        category.refresh_from_db()
        self.assertEqual(category.name, "New")

    def test_delete_empty_category(self):
        category = Category.objects.create(name="Temp")
        self.assertEqual(self.client.delete(f"{API}/admin/categories/{category.pk}/").status_code, 204)
        self.assertFalse(Category.objects.filter(pk=category.pk).exists())

    def test_delete_category_with_projects_is_blocked(self):
        category = Category.objects.create(name="Busy")
        Project.objects.create(title="P", category=category)
        response = self.client.delete(f"{API}/admin/categories/{category.pk}/")
        self.assertEqual(response.status_code, 409)
        self.assertTrue(Category.objects.filter(pk=category.pk).exists())

    def test_list_includes_project_counts(self):
        category = Category.objects.create(name="Counted")
        Project.objects.create(title="A", category=category)
        Project.objects.create(title="B", category=category, publication_status="published")
        response = self.client.get(f"{API}/admin/categories/")
        self.assertEqual(response.data[0]["project_count"], 2)

    def test_anonymous_cannot_manage_categories(self):
        anon = self.client_class()
        self.assertEqual(anon.post(f"{API}/admin/categories/", {"name": "X"}, format="json").status_code, 401)


class PublicCategoryTests(BaseAPITestCase):
    def test_only_categories_with_published_projects_are_listed(self):
        live = Category.objects.create(name="Live")
        draft_only = Category.objects.create(name="Draft only")
        Category.objects.create(name="Empty")
        Project.objects.create(title="P1", category=live, publication_status="published")
        Project.objects.create(title="P2", category=live)  # draft
        Project.objects.create(title="P3", category=draft_only)  # draft
        response = self.client.get(f"{API}/categories/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([c["slug"] for c in response.data], ["live"])
        self.assertEqual(response.data[0]["project_count"], 1)
