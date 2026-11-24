import os

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings

from core.testing import BaseAPITestCase, client_for, create_admin, create_regular_user, make_image
from gallery.models import ProjectImage
from projects.models import Project

API = "/api/v1/admin"


class GalleryTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.client = client_for(create_admin())
        self.project = Project.objects.create(title="Gallery project")
        self.url = f"{API}/projects/{self.project.pk}/images/"

    def upload(self, *files, **extra):
        return self.client.post(self.url, {"images": list(files), **extra}, format="multipart")

    def test_upload_multiple_images_in_order(self):
        response = self.upload(make_image("a.png"), make_image("b.jpg", fmt="JPEG"), caption="Shot", alt_text="A screenshot")
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual([i["order"] for i in response.data], [1, 2])
        self.assertEqual(response.data[0]["caption"], "Shot")
        self.assertEqual(self.project.images.count(), 2)

    def test_subsequent_uploads_append(self):
        self.upload(make_image())
        response = self.upload(make_image("c.png"))
        self.assertEqual(response.data[0]["order"], 2)

    def test_invalid_file_rejects_whole_batch(self):
        bad = SimpleUploadedFile("evil.png", b"not-an-image", content_type="image/png")
        response = self.upload(make_image(), bad)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.project.images.count(), 0)

    def test_wrong_extension_is_rejected(self):
        gif_as_bmp = SimpleUploadedFile("x.bmp", make_image(fmt="GIF").read(), content_type="image/bmp")
        self.assertEqual(self.upload(gif_as_bmp).status_code, 400)

    @override_settings(MAX_IMAGE_UPLOAD_MB=0)
    def test_oversized_file_is_rejected(self):
        self.assertEqual(self.upload(make_image()).status_code, 400)

    @override_settings(MAX_GALLERY_FILES_PER_REQUEST=1)
    def test_per_request_limit(self):
        self.assertEqual(self.upload(make_image("a.png"), make_image("b.png")).status_code, 400)

    @override_settings(MAX_GALLERY_IMAGES_PER_PROJECT=1)
    def test_per_project_limit(self):
        self.assertEqual(self.upload(make_image("a.png")).status_code, 201)
        self.assertEqual(self.upload(make_image("b.png")).status_code, 400)

    def test_missing_files_is_bad_request(self):
        self.assertEqual(self.client.post(self.url, {}, format="multipart").status_code, 400)

    def test_list_images(self):
        self.upload(make_image("a.png"), make_image("b.png"))
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

    def test_update_caption_alt_text_and_order(self):
        image = self.upload(make_image()).data[0]
        response = self.client.patch(f"{API}/images/{image['id']}/", {"caption": "New", "alt_text": "Alt", "order": 5}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual((response.data["caption"], response.data["alt_text"], response.data["order"]), ("New", "Alt", 5))

    def test_replace_image_file_removes_old_file(self):
        image = self.upload(make_image("a.png")).data[0]
        old_path = ProjectImage.objects.get(pk=image["id"]).image.path
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.patch(f"{API}/images/{image['id']}/", {"image": make_image("b.png")}, format="multipart")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertFalse(os.path.exists(old_path))
        self.assertTrue(os.path.exists(ProjectImage.objects.get(pk=image["id"]).image.path))

    def test_delete_image_removes_record_and_file(self):
        image = self.upload(make_image()).data[0]
        path = ProjectImage.objects.get(pk=image["id"]).image.path
        with self.captureOnCommitCallbacks(execute=True):
            self.assertEqual(self.client.delete(f"{API}/images/{image['id']}/").status_code, 204)
        self.assertFalse(ProjectImage.objects.filter(pk=image["id"]).exists())
        self.assertFalse(os.path.exists(path))

    def test_deleting_project_removes_gallery_files(self):
        self.upload(make_image())
        path = self.project.images.first().image.path
        with self.captureOnCommitCallbacks(execute=True):
            self.client.delete(f"{API}/projects/{self.project.pk}/")
        self.assertFalse(os.path.exists(path))

    def test_reorder_images(self):
        ids = [i["id"] for i in self.upload(make_image("a.png"), make_image("b.png"), make_image("c.png")).data]
        response = self.client.post(f"{self.url}reorder/", {"ids": list(reversed(ids))}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([i["id"] for i in self.client.get(self.url).data], list(reversed(ids)))

    def test_reorder_requires_every_image(self):
        ids = [i["id"] for i in self.upload(make_image("a.png"), make_image("b.png")).data]
        self.assertEqual(self.client.post(f"{self.url}reorder/", {"ids": ids[:1]}, format="json").status_code, 400)

    def test_upload_to_unknown_project_is_404(self):
        self.assertEqual(self.client.post(f"{API}/projects/9999/images/", {"images": [make_image()]}, format="multipart").status_code, 404)

    def test_anonymous_and_non_staff_cannot_upload(self):
        anon = self.client_class()
        self.assertEqual(anon.post(self.url, {"images": [make_image()]}, format="multipart").status_code, 401)
        visitor = client_for(create_regular_user())
        self.assertEqual(visitor.post(self.url, {"images": [make_image()]}, format="multipart").status_code, 403)

    def test_public_detail_exposes_gallery_only_when_published(self):
        self.upload(make_image())
        public = self.client_class()
        self.assertEqual(public.get(f"/api/v1/projects/{self.project.slug}/").status_code, 404)
        self.project.publication_status = "published"
        self.project.short_description = "s"
        self.project.description = "d"
        self.project.save()
        data = public.get(f"/api/v1/projects/{self.project.slug}/").data
        self.assertEqual(len(data["images"]), 1)
