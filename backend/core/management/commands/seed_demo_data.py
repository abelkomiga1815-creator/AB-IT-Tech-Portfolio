from datetime import date

from django.core.management.base import BaseCommand

from categories.models import Category
from projects.models import Project
from projects.serializers import resolve_technologies

DEMO_PREFIX = "demo-"

DEMO_CATEGORIES = [
    ("Websites & Web Apps", "Corporate websites, portals and web applications."),
    ("Mobile Applications", "Android and iOS applications."),
    ("Management Systems", "School, business and operations management systems."),
]

DEMO_PROJECTS = [
    {
        "title": "Demo: Corporate Website",
        "slug": "demo-corporate-website",
        "category": "Websites & Web Apps",
        "technologies": ["Next.js", "TypeScript", "Tailwind CSS"],
        "featured": True,
        "published": True,
    },
    {
        "title": "Demo: School Management System",
        "slug": "demo-school-management-system",
        "category": "Management Systems",
        "technologies": ["Django", "PostgreSQL", "React"],
        "featured": True,
        "published": True,
    },
    {
        "title": "Demo: Field Reporting Mobile App",
        "slug": "demo-field-reporting-mobile-app",
        "category": "Mobile Applications",
        "technologies": ["Flutter", "REST API"],
        "featured": False,
        "published": True,
    },
    {
        "title": "Demo: Inventory Tracker (draft)",
        "slug": "demo-inventory-tracker",
        "category": "Management Systems",
        "technologies": ["Django", "PostgreSQL"],
        "featured": False,
        "published": False,
    },
]


class Command(BaseCommand):
    help = "Create clearly-labelled DEMO categories/projects for trying the dashboard. Use --clear to remove them."

    def add_arguments(self, parser):
        parser.add_argument("--clear", action="store_true", help="Delete the demo projects created by this command.")

    def handle(self, *args, **options):
        if options["clear"]:
            deleted, _ = Project.objects.filter(slug__startswith=DEMO_PREFIX).delete()
            self.stdout.write(self.style.SUCCESS(f"Removed demo projects ({deleted} rows). Categories were kept."))
            return

        categories = {}
        for name, description in DEMO_CATEGORIES:
            categories[name], _ = Category.objects.get_or_create(name=name, defaults={"description": description})

        for item in DEMO_PROJECTS:
            project, created = Project.objects.get_or_create(
                slug=item["slug"],
                defaults={
                    "title": item["title"],
                    "short_description": "Demonstration record - replace or delete it from the dashboard.",
                    "description": "This is demo content created by `manage.py seed_demo_data`. It is not a real client project.",
                    "objectives": "Show how the portfolio presents a project.",
                    "problem_statement": "Demo problem statement.",
                    "solution": "Demo solution description.",
                    "category": categories[item["category"]],
                    "is_featured": item["featured"],
                    "publication_status": "published" if item["published"] else "draft",
                    "client_name": "DEMO DATA",
                    "completion_date": date(2026, 1, 15),
                },
            )
            if created:
                project.technologies.set(resolve_technologies(item["technologies"]))
        self.stdout.write(self.style.SUCCESS("Demo data ready (slugs start with 'demo-'). Run with --clear to remove."))
