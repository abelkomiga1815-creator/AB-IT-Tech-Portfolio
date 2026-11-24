from categories.models import Category
from core.models import ActivityLog
from core.testing import BaseAPITestCase, client_for, create_admin
from projects.models import Project

API = "/api/v1"


class DashboardTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = create_admin()
        self.client = client_for(self.admin)

    def test_stats_reflect_database_state(self):
        category = Category.objects.create(name="Web")
        Project.objects.create(title="A", publication_status="published", is_featured=True, category=category)
        Project.objects.create(title="B", publication_status="published")
        Project.objects.create(title="C")
        stats = self.client.get(f"{API}/admin/dashboard/").data["stats"]
        self.assertEqual(stats["total_projects"], 3)
        self.assertEqual(stats["published_projects"], 2)
        self.assertEqual(stats["draft_projects"], 1)
        self.assertEqual(stats["featured_projects"], 1)
        self.assertEqual(stats["categories"], 1)

    def test_recent_activity_records_admin_actions(self):
        response = self.client.post(f"{API}/admin/projects/", {"title": "Logged"}, format="json")
        self.assertEqual(response.status_code, 201)
        activity = self.client.get(f"{API}/admin/dashboard/").data["recent_activity"]
        self.assertEqual(activity[0]["action"], "created")
        self.assertEqual(activity[0]["target_label"], "Logged")
        self.assertEqual(activity[0]["actor_name"], "admin")

    def test_empty_dashboard(self):
        data = self.client.get(f"{API}/admin/dashboard/").data
        self.assertEqual(data["stats"]["total_projects"], 0)
        self.assertEqual(data["recent_activity"], [])
        self.assertEqual(ActivityLog.objects.count(), 0)
