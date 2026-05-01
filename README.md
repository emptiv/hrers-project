# HRERS Project

HRERS is a FastAPI-based HR and employee records system backed by MySQL.

## Requirements

- Python 3.10+
- MySQL 8+

## Setup

1. Install the Python dependencies.

	```bash
	pip install -r requirements.txt
	```

2. Create a `.env` file in the project root.

	```env
	DATABASE_URL=mysql+pymysql://root:your_password@localhost:3306/hrers_project
	SECRET_KEY=change-this-in-production
	JWT_ALGORITHM=HS256
	ACCESS_TOKEN_EXPIRE_MINUTES=60
	CORS_ORIGINS=*
	```

3. Create the MySQL database.

	```sql
	CREATE DATABASE hrers_project;
	```

4. Initialize the schema by running the `.sql` files in `database_schema/` against `hrers_project`.

	This step creates the tables and seed data that the app expects. If you skip it, the app will start with missing tables and you may see an internal server error.

	The easiest way on Windows is to run the setup script from the project root:

	```powershell
	powershell -ExecutionPolicy Bypass -File .\setup-schema.ps1
	```

	The script reads `DATABASE_URL` from `.env`, imports the schema files in the correct order, and stops if one file fails.

	If you prefer to do it manually, import the files in this order:

	1. `users.sql`
	2. `departments.sql`
	3. `user_profiles.sql`
	4. `employment_history.sql`
	5. `attendance_records.sql`
	6. `leave_requests.sql`
	7. `position_change_requests.sql`
	8. `profile_documents.sql`
	9. `training_sessions.sql`
	10. `training_registrations.sql`
	11. `audit_logs.sql`

	Do not run `reset_schema.sql` unless you want to wipe the database first.

	If you are using MySQL Workbench, open a query tab, load one file at a time, and click Run. Start with `users.sql`, then `departments.sql`, then continue through the list above.

5. Start the app.

	```bash
	python -m uvicorn main:app --reload
	```

## Default Accounts

All seeded accounts use the password `test1234`.

- `admin`
- `director`
- `hr_evaluator`
- `hr_head`
- `dept_head_acad`
- `dept_head_it`
- `employee1`
- `employee2`

These accounts are seeded with `must_change_password = 1`, so they will be prompted to change the password on first login.

## Notes

- The app loads environment variables from `.env` in the project root.
- Static files are served from `static/` and templates from `templates/`.
- If you need to reset the schema, review `database_schema/reset_schema.sql` before running it because it is destructive.
