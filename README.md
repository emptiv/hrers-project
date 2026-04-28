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

	Run every file except `reset_schema.sql`.

	A sensible order is:

	- `users.sql`
	- `departments.sql`
	- the remaining table/data scripts needed for your environment

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
