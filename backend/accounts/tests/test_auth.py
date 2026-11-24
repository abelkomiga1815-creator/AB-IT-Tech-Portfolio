from django.test import override_settings

from core.testing import PASSWORD, BaseAPITestCase, client_for, create_admin, create_regular_user

API = "/api/v1"


class AuthenticationTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = create_admin()

    def login(self, username="admin", password=PASSWORD):
        return self.client.post(f"{API}/auth/login/", {"username": username, "password": password}, format="json")

    def test_admin_can_login_and_receives_tokens(self):
        response = self.login()
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["username"], "admin")

    def test_wrong_password_is_rejected(self):
        self.assertEqual(self.login(password="nope").status_code, 401)

    def test_non_staff_user_cannot_login(self):
        create_regular_user()
        self.assertEqual(self.login("visitor").status_code, 401)

    def test_me_requires_authentication(self):
        self.assertEqual(self.client.get(f"{API}/auth/me/").status_code, 401)

    def test_me_returns_profile_with_valid_token(self):
        access = self.login().data["access"]
        response = self.client.get(f"{API}/auth/me/", HTTP_AUTHORIZATION=f"Bearer {access}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["email"], "admin@example.com")

    def test_me_forbidden_for_non_staff(self):
        response = client_for(create_regular_user()).get(f"{API}/auth/me/")
        self.assertEqual(response.status_code, 403)

    def test_refresh_returns_new_access_token(self):
        refresh = self.login().data["refresh"]
        response = self.client.post(f"{API}/auth/refresh/", {"refresh": refresh}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)

    def test_logout_blacklists_refresh_token(self):
        refresh = self.login().data["refresh"]
        self.assertEqual(self.client.post(f"{API}/auth/logout/", {"refresh": refresh}, format="json").status_code, 204)
        again = self.client.post(f"{API}/auth/refresh/", {"refresh": refresh}, format="json")
        self.assertEqual(again.status_code, 401)

    def test_logout_with_garbage_token_is_bad_request(self):
        response = self.client.post(f"{API}/auth/logout/", {"refresh": "garbage"}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_login_is_rate_limited(self):
        statuses = [self.login(password="wrong").status_code for _ in range(6)]
        self.assertEqual(statuses[:5], [401] * 5)
        self.assertEqual(statuses[5], 429)

    def test_passwords_are_hashed(self):
        self.assertNotEqual(self.admin.password, PASSWORD)
        self.assertTrue(self.admin.check_password(PASSWORD))


class AdminAccessControlTests(BaseAPITestCase):
    PROTECTED = [
        ("get", f"{API}/admin/projects/"),
        ("post", f"{API}/admin/projects/"),
        ("get", f"{API}/admin/categories/"),
        ("post", f"{API}/admin/categories/"),
        ("get", f"{API}/admin/dashboard/"),
        ("post", f"{API}/admin/projects/reorder/"),
    ]

    def test_anonymous_requests_are_rejected(self):
        for method, url in self.PROTECTED:
            response = getattr(self.client, method)(url, {}, format="json")
            self.assertEqual(response.status_code, 401, f"{method.upper()} {url}")

    def test_non_staff_requests_are_forbidden(self):
        client = client_for(create_regular_user())
        for method, url in self.PROTECTED:
            response = getattr(client, method)(url, {}, format="json")
            self.assertEqual(response.status_code, 403, f"{method.upper()} {url}")

    def test_staff_can_access(self):
        client = client_for(create_admin())
        self.assertEqual(client.get(f"{API}/admin/dashboard/").status_code, 200)

    def test_deactivated_admin_token_is_rejected(self):
        admin = create_admin("temp")
        access = self.client.post(f"{API}/auth/login/", {"username": "temp", "password": PASSWORD}, format="json").data["access"]
        admin.is_active = False
        admin.save()
        response = self.client.get(f"{API}/admin/dashboard/", HTTP_AUTHORIZATION=f"Bearer {access}")
        self.assertEqual(response.status_code, 401)
