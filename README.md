# QuickPulse – Polling and Survey Application

QuickPulse is a web application for creating polls and surveys, collecting responses, and viewing results. It is designed for use by students, faculty, clubs, and other groups that need a simple way to gather opinions or feedback.

The project was developed as an individual college mini project using Node.js, Express, EJS, PostgreSQL, and Sequelize.

## Features

### Accounts and access
- User registration, login, and logout.
- Session-based authentication.
- Separate permissions for regular users and administrators.
- Users can manage their own polls and surveys.

### Polls
- Create polls with multiple answer options.
- Configure polls to allow single-choice or multiple-choice voting.
- Set a closing time and manage whether a poll is open or closed.
- Browse and search public polls.
- View vote totals and result charts.

### Surveys
- Create surveys with multiple questions.
- Support single-choice, multiple-choice, short-text, long-text, rating, and yes/no questions.
- Mark questions as required or optional.
- Collect responses and view results.
- Export survey responses to CSV.
- Restrict changes to survey questions after responses have been submitted, where implemented.

### Dashboard and administration
- View poll and survey activity from the dashboard.
- View charts and response summaries.
- Provide administrators with account-management and moderation options.

## Technology Used

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | Web server and routing |
| EJS | Server-rendered HTML templates |
| PostgreSQL | Relational database |
| Sequelize | Database models, queries, and migrations |
| express-session | Login session management |
| bcryptjs | Password hashing |
| Chart.js | Charts for poll and survey results |
| Bootstrap and custom CSS | Responsive user interface |
| Node.js test runner and Supertest | Automated tests |

## How the Application Works

The browser sends a request to the Express application. Routes direct the request to the appropriate controller, which validates the input and calls the relevant service or database model. Sequelize communicates with the database, and the server returns an EJS page or a file such as a CSV export.

The main parts of the project are:

- **Routes:** Define the application's URLs and HTTP methods.
- **Controllers:** Handle incoming requests and prepare responses.
- **Services:** Contain poll, survey, analytics, and CSV-related logic.
- **Models:** Represent database entities and their relationships.
- **Views:** EJS templates used to display pages.
- **Middleware:** Handles authentication, authorization, CSRF checks, rate limiting, and errors.
- **Migrations:** Create and update the database schema.

## Database Overview

The application uses PostgreSQL with Sequelize. Its main entities include:

- **Users:** Account details, password hashes, and user roles.
- **Polls and poll options:** Poll details and the available choices.
- **Poll votes and selections:** Submitted votes and the options selected.
- **Surveys and questions:** Survey details and question definitions.
- **Question options:** Choices for questions that use predefined answers.
- **Survey responses and answers:** Submitted survey responses.
- **Sessions:** Server-side session data.

Foreign keys and database constraints help keep related records consistent. Transactions can be used when a submission needs several related records to be saved together.

## Prerequisites

Install the following before running the project:

- Node.js 18 or later
- npm
- Git, if you plan to use GitHub
- PostgreSQL for a local PostgreSQL setup

The project documentation also describes SQLite as a possible local or test option. Check the database configuration and installed dependencies in the current code before relying on that option.

## Installation and Local Setup

1. Open a terminal in the project directory.
2. Install the dependencies:

   ```bash
   npm install
   ```

3. Copy the example environment file to `.env`:

   **Windows Command Prompt**
   ```bat
   copy .env.example .env
   ```

   **PowerShell**
   ```powershell
   Copy-Item .env.example .env
   ```

4. Open `.env` and update the settings for your local environment. Do not commit this file to GitHub.
5. If using PostgreSQL, start the PostgreSQL service and create a database:

   ```sql
   CREATE DATABASE poll_survey_db;
   ```

6. Set the database connection details in `.env`. For example:

   ```env
   NODE_ENV=development
   PORT=3000
   APP_NAME=QuickPulse
   APP_URL=http://localhost:3000
   SESSION_SECRET=replace-with-a-long-random-secret
   DB_DIALECT=postgres
   DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/poll_survey_db
   DB_SSL=false
   ```

   Replace `YOUR_PASSWORD` with your local PostgreSQL password. Use a strong, randomly generated session secret. The values above are examples, not production credentials.

7. Run the database migrations:

   ```bash
   npm run migrate
   ```

8. If you want sample data for local testing, run:

   ```bash
   npm run seed
   ```

9. Start the development server:

   ```bash
   npm run dev
   ```

   If the development script is unavailable, check the scripts in `package.json`. The documented production start command is:

   ```bash
   npm start
   ```

10. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Purpose |
|---|---|
| `NODE_ENV` | Sets the environment, such as `development`, `test`, or `production` |
| `PORT` | Port used by the server |
| `APP_NAME` | Application name shown in the interface |
| `APP_URL` | Base URL used to create shareable links |
| `SESSION_SECRET` | Secret used to sign session cookies |
| `SESSION_MAX_AGE_MS` | Session cookie lifetime in milliseconds |
| `DATABASE_URL` | Database connection string |
| `DB_DIALECT` | Database type, such as `postgres` or `sqlite` |
| `DB_SSL` | Enables SSL for database connections when required |
| `RATE_LIMIT_MAX_REQUESTS` | General request limit configuration |
| `AUTH_RATE_LIMIT_MAX` | Login and registration request limit configuration |

Use the variable names expected by the current application code. Never commit `.env` or real credentials to the repository.

## Database Migrations and Sample Data

Run the migration script to create or update the database schema:

```bash
npm run migrate
```

To add sample data for local demonstrations:

```bash
npm run seed
```

Only use sample data in development or another environment where it is safe to create demonstration accounts and records. Before deployment, check what the seed script creates and do not automatically seed public administrator accounts in production.

## Running Tests

Run the automated test suite with:

```bash
npm test
```

The tests are intended to cover authentication, poll creation and voting, survey responses, validation, access control, and security-related behavior. Actual test results depend on the current code and environment; run the suite before claiming that all tests pass.

## Main Routes

| Route | Purpose |
|---|---|
| `/` | Home page |
| `/auth/register` | Registration |
| `/auth/login` | Login |
| `/dashboard` | User dashboard |
| `/polls` | Browse public polls |
| `/polls/new` | Create a poll |
| `/polls/:slugOrId` | View a poll and vote |
| `/polls/:slugOrId/results` | View poll results |
| `/surveys` | Browse public surveys |
| `/surveys/new` | Create a survey |
| `/surveys/:slugOrId` | Respond to a survey |
| `/surveys/:slugOrId/results` | View survey results |
| `/profile` | Profile settings |
| `/admin` | Administrator area |

Access to some routes depends on login status, ownership, and role. Check the route files for the exact behavior implemented in the current version.

## Security Notes

The application is designed to use password hashing, server-side sessions, access checks, request validation, rate limiting, CSRF protection, and secure HTTP headers. These protections should be tested against the actual implementation before the application is treated as production-ready.

Anonymous voting and survey responses have limitations: technical measures may reduce repeat submissions, but they cannot guarantee that a person can never submit more than once or that a response is completely unidentifiable.

For deployment:
- Use a strong, unique `SESSION_SECRET`.
- Keep database credentials in the hosting provider's environment settings.
- Ensure `.env` is excluded from Git.
- Do not publish demonstration administrator passwords.
- Do not run a seed script in production unless its behavior has been reviewed and is intentional.

## Publishing to GitHub

1. Check that `.env`, `node_modules`, logs, and local database files are excluded by `.gitignore`.
2. Review the files that will be committed:

   ```bash
   git status
   ```

3. Stage and commit the project:

   ```bash
   git add .
   git commit -m "Add polling and survey application"
   ```

4. Create a new public repository on GitHub. If the project already has a local README and commit history, create the remote repository without generating another README.
5. Connect the repository and push the code. Replace the placeholder with your own repository URL:

   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/polling-survey-application.git
   git branch -M main
   git push -u origin main
   ```

If a remote named `origin` already exists, inspect it with `git remote -v` before adding or changing it.

## Deployment

The project includes a `render.yaml` file intended to configure deployment on Render. Before deploying:

1. Push the project to GitHub.
2. Review `render.yaml` and confirm its build and start commands match `package.json`.
3. Create the Render Blueprint from the connected repository.
4. Configure the database connection and required environment variables in Render.
5. Use a strong production session secret and enable database SSL if the database provider requires it.
6. Review the migration and seed commands. Do not seed demo administrator accounts into a public production environment.
7. Deploy the application and open the live URL.
8. Test registration, login, poll creation, voting, survey creation, response submission, results, and CSV export.

Hosting plans and database availability can change. Confirm the current provider's limits and pricing before choosing a deployment option.

## Limitations and Possible Improvements

Possible future improvements include:
- Email verification and password recovery.
- Live result updates without reloading the page.
- File uploads in survey questions.
- More advanced reporting and filtering.

## Conclusion

QuickPulse brings poll creation, survey responses, and result analysis into one web application. It provides practical experience with server-side web development, relational database design, authentication, input validation, testing, and deployment.
