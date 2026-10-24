# PollCraft -- Polling and Survey Application

PollCraft is a full-stack web application for creating polls and
surveys, collecting responses, and viewing results. It was developed as
a college mini project using Node.js, Express, EJS, Sequelize, and
PostgreSQL.

## Live Demo

-   **Application:** https://poll-craft-fsd-2-mini-project.onrender.com
-   **GitHub repository:**
    https://github.com/24pa1a05g7-dot/Poll-Craft-FSD-2-Mini-Project

> The hosted service may take a little time to wake up when using
> Render's free tier.

## Features

-   User registration, login, and session-based authentication
-   Create polls with answer options and collect votes
-   Create surveys with multiple questions and supported question types
-   View response summaries and charts
-   Export survey responses to CSV where available
-   PostgreSQL database hosted on Supabase
-   Responsive pages built with EJS, Bootstrap, CSS, and JavaScript

## Technology Stack

-   **Backend:** Node.js, Express.js
-   **Views/UI:** EJS, HTML, CSS, Bootstrap, JavaScript
-   **Database/ORM:** PostgreSQL, Supabase, Sequelize
-   **Authentication:** express-session, bcryptjs
-   **Charts:** Chart.js
-   **Hosting:** Render
-   **Testing:** Node.js test runner and Supertest (if running the
    included test suite)

## Run the Project Locally

### Prerequisites

Install Node.js (18 or later recommended), npm, and Git.

### 1. Clone the repository

``` bash
git clone https://github.com/24pa1a05g7-dot/Poll-Craft-FSD-2-Mini-Project.git
cd Poll-Craft-FSD-2-Mini-Project
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root. If `.env.example` is present,
copy it first:

**Windows PowerShell**

``` powershell
Copy-Item .env.example .env
```

**macOS/Linux**

``` bash
cp .env.example .env
```

If `.env.example` is not present, create `.env` manually using the
variable names expected by the project configuration. Set the values for
your local environment. Do not commit real credentials or secrets.

Common settings may include:

``` env
NODE_ENV=development
PORT=3000
SESSION_SECRET=replace-with-a-long-random-secret
DATABASE_URL=
DB_SSL=false
```

Use the exact variable names required by the current
`src/config/database.js` and session configuration. If you connect to
Supabase/PostgreSQL, set `DATABASE_URL` to your own database connection
string and configure SSL as required. **Never paste your real database
password or session secret into the README or commit them to GitHub.**

### 3. Start the application

Use the script defined in `package.json`. Commonly:

``` bash
npm run dev
```

Or, if the project does not define a development script:

``` bash
npm start
```

Open http://localhost:3000 unless your configured `PORT` is different.

### 4. Database setup

The deployed application runs database migrations during server startup.
For local development, check `package.json` for the migration script
before running it:

``` bash
npm run migrate
```

Only run the migration command if that script exists in the current
project. Use a development database when testing. Do not run destructive
database commands against production data.

## Deployment

The live version is hosted on Render and uses Supabase PostgreSQL.
Render environment variables are configured in the Render dashboard, so
the deployed service does not require a committed `.env` file.

The current deployed service starts with:

``` bash
node src/server.js
```

The Render build command is configured as:

``` bash
npm install
```

Database migrations are run by the server during startup, as configured
in the application. If deployment settings change, confirm the actual
Build Command and Start Command in the Render dashboard.

## Security and Repository Hygiene

-   Keep `.env` out of GitHub; it can contain database credentials and
    session secrets.
-   Keep `node_modules/` out of GitHub; dependencies are restored with
    `npm install`.
-   Use `.gitignore` to exclude secrets, dependencies, local databases,
    and log files.
-   `.env.example` is optional documentation for variable names and
    should contain placeholders only---never real secrets.
-   Use a strong, unique `SESSION_SECRET` in production.

## Project Structure

``` text
.
├── package.json
├── .gitignore
├── README.md
├── render.yaml
├── scripts/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── migrations/
│   ├── models/
│   ├── services/
│   ├── utils/
│   ├── public/
│   └── views/
└── tests/
```

The exact files and folders may differ slightly depending on the current
repository version.
## Application Workflow

1. Users register for an account or sign in to an existing account.
2. Users create polls with answer options or build surveys with different question types.
3. Participants submit votes or survey responses according to the configured settings.
4. Poll and survey creators view collected responses through the available results and analytics pages.
5. Survey responses can be exported to CSV where the feature is available.

## Limitations and Future Enhancements

- Add email verification and password recovery.
- Improve analytics with additional charts and response filters.
- Introduce more options for managing and sharing surveys.
- Strengthen privacy controls and provide clearer information about anonymous participation.
- Expand automated testing and accessibility support.

## Project Information

PollCraft was developed as a college mini-project to apply full-stack web development concepts, including server-side programming, relational database management, authentication, and data visualization.
