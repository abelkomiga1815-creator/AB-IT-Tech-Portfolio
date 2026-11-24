.PHONY: backend-install backend-migrate backend-run backend-test frontend-install frontend-run frontend-test docker-up

backend-install:
	cd backend && python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt

backend-migrate:
	cd backend && . .venv/bin/activate && python manage.py migrate

backend-run:
	cd backend && . .venv/bin/activate && python manage.py runserver 0.0.0.0:8000

backend-test:
	cd backend && . .venv/bin/activate && python manage.py test --settings=config.test_settings -v 2

frontend-install:
	cd frontend && npm install

frontend-run:
	cd frontend && npm run dev

frontend-test:
	cd frontend && npm run typecheck && npm test

docker-up:
	docker compose up --build
