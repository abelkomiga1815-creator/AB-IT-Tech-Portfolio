from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings

from categories.models import Category
from core.models import ActivityLog
from core.testing import BaseAPITestCase, client_for, create_admin, create_regular_user, make_image
from projects.models import Project

API = "/api/v1"
URL = f"{API}/admin/projects/"


class AdminProjectTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = create_admin()
        self.client = client_for(self.admin)
        self.category = Category.objects.create(name="Web")

    def payload(self, **extra):
        data = {
            "title": "My Project",
            "short_description": "Short",
            "description": "Long description",
            "category": self.category.pk,
            "technologies": ["Django", "Next.js"],
        }
        data.update(extra)
        return data

    def create(self, **extra):
        response = self.client.post(URL, self.payload(**extra), format="json")
        self.assertEqual(response.status_code, 201, response.data)
        return response.data

    # --- create / edit / delete ------------------------------------------------
    def test_create_draft_project(self):
        data = self.create()
        self.assertEqual(data["publication_status"], "draft")
        self.assertEqual(data["slug"], "my-project")
        self.assertEqual(sorted(data["technologies"]), ["Django", "Next.js"])
        self.assertEqual(data["category_detail"]["slug"], "web")
        self.assertEqual(Project.objects.get(pk=data["id"]).created_by, self.admin)

    def test_create_requires_title(self):
        response = self.client.post(URL, {"short_description": "x"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("title", response.data)

    def test_duplicate_titles_get_unique_slugs(self):
        self.create()
        self.assertEqual(self.create()["slug"], "my-project-2")

    def test_technologies_are_reused_case_insensitively(self):
        self.create(technologies=["Django"])
        self.create(title="Second", technologies="django, Redis")
        from projects.models import Technology

        self.assertEqual(Technology.objects.filter(name__iexact="django").count(), 1)

    def test_invalid_url_is_rejected(self):
        response = self.client.post(URL, self.payload(live_demo_url="not a url"), format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("live_demo_url", response.data)

    def test_edit_project_keeps_slug_and_updates_fields(self):
        data = self.create()
        response = self.client.patch(f"{URL}{data['id']}/", {"title": "Renamed", "technologies": ["Go"]}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["title"], "Renamed")
        self.assertEqual(response.data["slug"], "my-project")
        self.assertEqual(response.data["technologies"], ["Go"])

    def test_clearing_technologies_with_empty_string(self):
        data = self.create()
        response = self.client.patch(f"{URL}{data['id']}/", {"technologies": ""}, format="json")
        self.assertEqual(response.data["technologies"], [])

    def test_delete_project(self):
        data = self.create()
        self.assertEqual(self.client.delete(f"{URL}{data['id']}/").status_code, 204)
        self.assertFalse(Project.objects.filter(pk=data["id"]).exists())
        self.assertTrue(ActivityLog.objects.filter(action="deleted", target_label="My Project").exists())

    def test_multipart_create_with_comma_separated_technologies(self):
        response = self.client.post(
            URL,
            {"title": "Form Project", "technologies": "React, Node", "is_featured": "true", "completion_date": ""},
            format="multipart",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertTrue(response.data["is_featured"])
        self.assertEqual(sorted(response.data["technologies"]), ["Node", "React"])
        self.assertIsNone(response.data["completion_date"])

    # --- publishing -----------------------------------------------------------
    def test_publish_and_unpublish(self):
        data = self.create()
        published = self.client.post(f"{URL}{data['id']}/publish/")
        self.assertEqual(published.status_code, 200)
        self.assertEqual(published.data["publication_status"], "published")
        self.assertIsNotNone(published.data["published_at"])
        unpublished = self.client.post(f"{URL}{data['id']}/unpublish/")
        self.assertEqual(unpublished.data["publication_status"], "draft")
        self.assertIsNone(unpublished.data["published_at"])

    def test_cannot_publish_without_description(self):
        data = self.create(description="")
        response = self.client.post(f"{URL}{data['id']}/publish/")
        self.assertEqual(response.status_code, 400)
        self.assertIn("description", response.data)

    def test_cannot_create_published_without_short_description(self):
        response = self.client.post(URL, self.payload(short_description="", publication_status="published"), format="json")
        self.assertEqual(response.status_code, 400)

    def test_drafts_are_invisible_to_public_until_published(self):
        data = self.create()
        public = self.client_class()
        self.assertEqual(public.get(f"{API}/projects/").data["count"], 0)
        self.assertEqual(public.get(f"{API}/projects/{data['slug']}/").status_code, 404)
        self.client.post(f"{URL}{data['id']}/publish/")
        self.assertEqual(public.get(f"{API}/projects/").data["count"], 1)
        self.assertEqual(public.get(f"{API}/projects/{data['slug']}/").status_code, 200)
        self.client.post(f"{URL}{data['id']}/unpublish/")
        self.assertEqual(public.get(f"{API}/projects/{data['slug']}/").status_code, 404)

    def test_admin_list_includes_drafts_and_filters(self):
        self.create(title="Draft one")
        published = self.create(title="Live one")
        self.client.post(f"{URL}{published['id']}/publish/")
        self.assertEqual(self.client.get(URL).data["count"], 2)
        self.assertEqual(self.client.get(URL, {"publication_status": "draft"}).data["count"], 1)
        self.assertEqual(self.client.get(URL, {"search": "Live"}).data["count"], 1)

    def test_featured_toggle_via_patch(self):
        data = self.create()
        response = self.client.patch(f"{URL}{data['id']}/", {"is_featured": True}, format="json")
        self.assertTrue(response.data["is_featured"])

    # --- ordering --------------------------------------------------------------
    def test_new_projects_are_appended_and_reorder_works(self):
        ids = [self.create(title=f"P{i}")["id"] for i in range(3)]
        orders = list(Project.objects.order_by("id").values_list("display_order", flat=True))
        self.assertEqual(orders, sorted(orders))
        response = self.client.post(f"{URL}reorder/", {"ids": list(reversed(ids))}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([p["id"] for p in self.client.get(URL).data["results"]], list(reversed(ids)))

    def test_reorder_rejects_unknown_and_duplicate_ids(self):
        data = self.create()
        self.assertEqual(self.client.post(f"{URL}reorder/", {"ids": [data["id"], 9999]}, format="json").status_code, 400)
        self.assertEqual(self.client.post(f"{URL}reorder/", {"ids": [data["id"], data["id"]]}, format="json").status_code, 400)

    # --- permissions ------------------------------------------------------------
    def test_non_staff_cannot_create(self):
        client = client_for(create_regular_user())
        self.assertEqual(client.post(URL, self.payload(), format="json").status_code, 403)

    # --- cover images ------------------------------------------------------------
    def test_cover_image_upload(self):
        response = self.client.post(URL, {"title": "With cover", "cover_image": make_image()}, format="multipart")
        self.assertEqual(response.status_code, 201, response.data)
        self.assertIn("/media/projects/covers/", response.data["cover_image"])

    def test_cover_rejects_non_image_content(self):
        fake = SimpleUploadedFile("fake.png", b"this is not an image", content_type="image/png")
        response = self.client.post(URL, {"title": "Bad", "cover_image": fake}, format="multipart")
        self.assertEqual(response.status_code, 400)
        self.assertIn("cover_image", response.data)

    def test_cover_rejects_svg(self):
        svg = SimpleUploadedFile("logo.svg", b"<svg xmlns='http://www.w3.org/2000/svg'/>", content_type="image/svg+xml")
        response = self.client.post(URL, {"title": "Bad", "cover_image": svg}, format="multipart")
        self.assertEqual(response.status_code, 400)

    @override_settings(MAX_IMAGE_UPLOAD_MB=0)
    def test_cover_rejects_oversized_files(self):
        response = self.client.post(URL, {"title": "Big", "cover_image": make_image()}, format="multipart")
        self.assertEqual(response.status_code, 400)
        self.assertIn("cover_image", response.data)

    def test_remove_cover_image(self):
        data = self.client.post(URL, {"title": "Cover", "cover_image": make_image()}, format="multipart").data
        response = self.client.patch(f"{URL}{data['id']}/", {"remove_cover_image": "true"}, format="multipart")
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.data["cover_image"])

    def test_replacing_cover_deletes_the_old_file(self):
        data = self.client.post(URL, {"title": "Cover", "cover_image": make_image("a.png")}, format="multipart").data
        old_path = Project.objects.get(pk=data["id"]).cover_image.path
        with self.captureOnCommitCallbacks(execute=True):
            self.client.patch(f"{URL}{data['id']}/", {"cover_image": make_image("b.png")}, format="multipart")
        import os

        self.assertFalse(os.path.exists(old_path))
        self.assertTrue(os.path.exists(Project.objects.get(pk=data["id"]).cover_image.path))
