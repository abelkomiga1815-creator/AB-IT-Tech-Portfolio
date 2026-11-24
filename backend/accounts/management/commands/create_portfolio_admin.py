import os

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = (
        "Create (or promote) a dashboard administrator non-interactively. "
        "Reads ADMIN_USERNAME, ADMIN_EMAIL and ADMIN_PASSWORD from the environment unless options are given."
    )

    def add_arguments(self, parser):
        parser.add_argument("--username")
        parser.add_argument("--email")
        parser.add_argument("--password", help="Prefer the ADMIN_PASSWORD env var so it stays out of shell history.")

    def handle(self, *args, **options):
        username = options["username"] or os.environ.get("ADMIN_USERNAME")
        email = options["email"] or os.environ.get("ADMIN_EMAIL")
        password = options["password"] or os.environ.get("ADMIN_PASSWORD")
        if not (username and email and password):
            raise CommandError("username, email and password are required (options or ADMIN_* environment variables).")

        User = get_user_model()
        try:
            validate_password(password, User(username=username, email=email))
        except ValidationError as exc:
            raise CommandError("Weak password: " + " ".join(exc.messages))

        user, created = User.objects.get_or_create(username=username, defaults={"email": email})
        if not created:
            self.stdout.write(f"User '{username}' already exists; updating password and privileges.")
        user.email = email
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(password)
        user.save()
        self.stdout.write(self.style.SUCCESS(f"Administrator '{username}' is ready."))
