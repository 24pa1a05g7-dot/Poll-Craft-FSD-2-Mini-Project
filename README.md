# PollCraft – Full-Stack Polling & Survey Management Platform

PollCraft is a production-grade, full-stack web application designed for creating interactive polls, administering multi-question questionnaires, collecting responses, and analyzing qualitative and quantitative data with real-time visualizations.

Developed as a college mini project, PollCraft showcases clean software engineering practices: a strictly decoupled Model-View-Controller (MVC) architecture, robust Role-Based Access Control (RBAC), database normalization, idempotent migrations, defensive cybersecurity against common OWASP vulnerabilities, and responsive user experience.

---

## 1. System Architecture & Tech Stack

```
   ┌──────────────────────────────────────────────────────────────┐
   │                     Client (Browser)                         │
   │           HTML5, EJS, Bootstrap 5, Chart.js, CSS             │
   └──────────────────────────────┬───────────────────────────────┘
                                  │ HTTPS (Session Cookie / CSRF)
                                  ▼
   ┌──────────────────────────────────────────────────────────────┐
   │                   Express.js Application                     │
   │  ┌────────────────────────────────────────────────────────┐  │
   │  │ Middleware: Helmet, CORS, CSRF, Rate-Limit, Session    │  │
   │  └───────────────────────────┬────────────────────────────┘  │
   │                              │                               │
   │  ┌───────────────────────────┴────────────────────────────┐  │
   │  │ Controllers: Auth, Dashboard, Poll, Survey, Admin      │  │
   │  └───────────────────────────┬────────────────────────────┘  │
   │                              │                               │
   │  ┌───────────────────────────┴────────────────────────────┐  │
   │  │ Services: PollService, SurveyService, Analytics, CSV   │  │
   │  └───────────────────────────┬────────────────────────────┘  │
   │                              │                               │
   │  ┌───────────────────────────┴────────────────────────────┐  │
   │  │ Sequelize ORM (Models, Associations, Hooks, Migrator)  │  │
   │  └───────────────────────────┬────────────────────────────┘  │
   └──────────────────────────────┼───────────────────────────────┘
                                  │ SSL / TLS (Pooled Connection)
                                  ▼
   ┌──────────────────────────────────────────────────────────────┐
   │             PostgreSQL Database (Supabase)                   │
   │  Users, Polls, PollOptions, Votes, Surveys, Questions,      │
   │  Options, Responses, Answers, Sessions, SequelizeMeta       │
   └──────────────────────────────────────────────────────────────┘
```

| Layer | Technology | Key Responsibility |
|---|---|---|
| **Runtime & Server** | Node.js (v18+) & Express.js | Event-driven async web server, REST routing, middleware pipeline |
| **View Engine** | EJS (Embedded JavaScript) | Dynamic server-side page rendering, reusable components, zero client build overhead |
| **Database** | PostgreSQL (Supabase) | ACID-compliant relational store, constraints, indexes, foreign keys |
| **ORM** | Sequelize v6 | Schema definition, model hooks, transactional operations, safe queries |
| **Authentication** | express-session & bcryptjs | Session-based authentication, salted password hashing, session regeneration |
| **Data Visualization**| Chart.js (v4) | Responsive bar charts, doughnut breakdown charts, rating distribution charts |
| **Testing** | Node.js Test Runner & Supertest | Automated test runner verifying auth, voting, permissions, and security |
| **Deployment** | Render Web Service | Cloud hosting with automated Git-driven deployments via `render.yaml` |

---

## 2. Key Features

### 🗳️ Poll Management & Voting
- **Creation Wizard**: Set title, description, optional category, closing expiration timestamp, and access mode (Public vs Unlisted).
- **Flexible Voting Modes**: Single-choice (radio) or multiple-selection (checkboxes).
- **Integrity & Duplicate Prevention**: Rejects duplicate submissions per authenticated user or anonymous browser session.
- **State Enforcement**: Automatically rejects votes against draft, manually closed, or time-expired polls.
- **Dynamic Charts**: Live distribution percentages, bar charts, and doughnut proportions powered by Chart.js.

### 📋 Survey Builder & Questionnaire Administration
- **6 Supported Question Types**:
  1. *Single Choice* (Radio buttons)
  2. *Multiple Choice* (Multi-select checkboxes)
  3. *Short Text* (Single-line prompt)
  4. *Long Text* (Multi-line paragraph feedback)
  5. *Rating Scale* (1 to 5 star rating)
  6. *Yes / No* (Binary boolean switch)
- **Questionnaire Lifecycle**: Draft Mode -> Published Mode -> Closed Mode.
- **Dataset Consistency Lock**: Once a survey receives its first response, question addition and deletion are permanently disabled to prevent dataset corruption or schema mismatch.
- **Public & Anonymous Participation**: Organizers can mandate verified student login or allow anonymous responses for sensitive campus feedback.

### 📊 Analytics & Reporting
- **Personal Dashboard**: Isolates the logged-in user's active polls, questionnaires, submission counts, and recent activity.
- **Aggregate Analytics**: Calculates average rating scores, response counts, and percentage breakdowns per question.
- **Sanitized CSV Export**: Download all response submissions in standardized spreadsheet format for Excel, Google Sheets, or SPSS.

### 🛡️ Security & Access Control
- **Strict Role-Based Access Control (RBAC)**:
  - *Regular Users*: Can only view, edit, delete, and download analytics for content they personally created.
  - *Administrators*: Dedicated console (`/admin`) for platform-wide user management, content moderation, and system telemetry. Global statistics never leak into standard user dashboards.
  - *Server-Side Admin Provisioning*: Public signups are locked to `role: 'user'`. Administrative accounts can only be provisioned via the secure server CLI script (`scripts/create-admin.js`).
- **Insecure Direct Object Reference (IDOR) Defense**: Server-side ownership verification enforced across all mutation, deletion, viewing, and export routes. Attempted unauthorized access returns HTTP 403 Forbidden.
- **CSV Formula Injection Mitigation**: Sanitizes cell values starting with dangerous formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`) by prepending a single quote (`'`), neutralizing spreadsheet remote code execution (RCE).
- **CSRF Defense**: Double-submit cookie verification and CSRF token forms prevent cross-site request forgery.
- **Security Headers & Rate Limiting**: Helmet security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`) and express-rate-limit to stop brute-force attacks.

---

## 3. Database Architecture & Schema

The relational database schema is normalized and guarded with foreign key cascades:

```
 users (id, name, email, password, role, is_active, created_at)
   ├── polls (id, user_id, title, slug, status, is_multiple_choice, is_anonymous, expires_at)
   │     ├── poll_options (id, poll_id, option_text, display_order)
   │     └── poll_votes (id, poll_id, user_id, session_id, ip_address, created_at)
   │           └── poll_vote_selections (id, vote_id, poll_option_id)
   │
   └── surveys (id, user_id, title, slug, status, is_public, allow_anonymous, expires_at)
         ├── survey_questions (id, survey_id, question_text, question_type, is_required, order)
         │     └── survey_question_options (id, question_id, option_text, display_order)
         └── survey_responses (id, survey_id, user_id, session_id, submitted_at)
               └── survey_answers (id, response_id, question_id, text_value, numeric_value, boolean_value)
                     └── survey_answer_selections (id, answer_id, question_option_id)
```

### Safe, Non-Destructive Migrations
PollCraft uses a versioned migration runner (`src/utils/migrator.js`) backed by a `SequelizeMeta` audit table.
- **Zero Data Loss**: Never runs `sequelize.sync({ force: true })` or table drops.
- **Idempotency**: Running `npm run migrate` repeatedly only applies unexecuted migration files.
- **Safe Seeding**: `npm run seed` uses `findOrCreate` to populate sample categories and demonstration records without overwriting or deleting production rows.

---

## 4. Local Installation & Setup

### Prerequisites
- Node.js 18.x or 20.x LTS installed (`node -v`)
- npm 9+ installed (`npm -v`)
- Git (`git -v`)

### Step 1: Clone & Install Dependencies
```bash
git clone https://github.com/YOUR_USERNAME/pollcraft.git
cd pollcraft
npm install
```

### Step 2: Configure Environment Variables
Copy the configuration template:
```bash
# Windows PowerShell
Copy-Item .env.example .env

# Linux / macOS / Bash
cp .env.example .env
```

Open `.env` and configure your settings:
```ini
NODE_ENV=development
PORT=3000
APP_NAME=PollCraft
APP_URL=http://localhost:3000

# Strong random secret for signed session cookies
SESSION_SECRET=super-secret-crypto-key-change-in-production
SESSION_MAX_AGE_MS=86400000

# Database Configuration (Supabase or Local PostgreSQL)
DB_DIALECT=postgres
DATABASE_URL=postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
DB_SSL=true
```
*(Note: If you leave `DATABASE_URL` blank, the app will automatically fall back to local file storage at `./data/dev.sqlite` for rapid offline evaluation.)*

### Step 3: Run Safe Database Migrations
```bash
npm run migrate
```

### Step 4: (Optional) Seed Demo Data
```bash
npm run seed
```

### Step 5: (Optional) Provision an Administrator
```bash
node scripts/create-admin.js admin@pollcraft.io SecureAdminPassword123! "Lead Admin"
```

### Step 6: Start the Application
```bash
# Development mode with hot-reload (Node --watch)
npm run dev

# Or standard production mode
npm start
```
Visit **[http://localhost:3000](http://localhost:3000)** in your web browser.

---

## 5. Supabase PostgreSQL Connection Guide

To connect PollCraft to a hosted Supabase PostgreSQL instance:

1. **Log in to Supabase**: Navigate to [https://supabase.com](https://supabase.com) and open your project.
2. **Access Connection Settings**:
   - Go to **Project Settings** (gear icon) -> **Database**.
   - Scroll down to **Connection parameters** or **Connection Pooling**.
3. **Select Connection String**:
   - Select **URI**.
   - Set Mode to **Transaction** (Port `6543`) or **Session** (Port `5432`).
   - Copy the URI string:
     ```
     postgres://postgres.[PROJECT_REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
     ```
4. **Update `.env`**:
   - Replace `[YOUR-PASSWORD]` with your actual database password.
   - Set `DB_SSL=true` (Supabase poolers mandate SSL).
5. **Run Migrations on Supabase**:
   ```bash
   npm run migrate
   ```
   PollCraft connects via SSL, verifies the `SequelizeMeta` table, and provisions all relational tables safely without affecting any other database schemas.

---

## 6. Running Automated Tests

PollCraft comes with an automated test suite executed with Node's native `--test` runner and Supertest.

```bash
npm test
```

### Test Coverage Highlights:
- **Authentication (`tests/auth.test.js`)**: Registration validation, duplicate email rejection, bcrypt hashing, session cookie issuance, and public registration role lock (`role: 'user'`).
- **Polls (`tests/polls.test.js`)**: Minimum options validation, single/multiple-choice vote processing, duplicate vote prevention, expiration deadlines, and ownership checks.
- **Surveys (`tests/surveys.test.js`)**: 6 question types, questionnaire lifecycle, dataset integrity lock (structural edit rejection when responses exist), and zero-response CSV resilience.
- **Security & Authorization (`tests/security.test.js`)**: CSRF token enforcement, Helmet security headers, IDOR access controls (403 on foreign content modifications), and CSV formula injection neutralization.

---

## 7. Deployment Guide (Render.com + Supabase)

PollCraft is configured for zero-friction cloud deployment on Render via `render.yaml`.

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "Deploy PollCraft production release"
git push origin main
```

### Step 2: Deploy to Render
1. Open [Render.com Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Blueprint**.
3. Select your GitHub repository.
4. Render detects `render.yaml` and provisions:
   - **Service**: Node.js Web Service (`web`)
   - **Build Command**: `npm install && npm run migrate`
   - **Start Command**: `npm start`
5. Under Environment Variables in Render, supply:
   - `DATABASE_URL`: Your Supabase PostgreSQL connection URI.
   - `DB_SSL`: `true`
   - `SESSION_SECRET`: A generated 64-character random string.
   - `APP_URL`: Your assigned Render live URL (`https://your-service.onrender.com`).
6. Click **Apply**. The service builds, executes migrations, and goes live automatically.

---

## 8. College Mini Project Viva Questions & Answers

### Q1: What is the MVC architectural pattern and how does PollCraft implement it?
> **Answer**: Model-View-Controller separates concerns:
> - **Model** (`src/models/`): Encapsulates data schema, validation rules, and business logic using Sequelize ORM.
> - **View** (`src/views/`): User interface templates written in EJS that render dynamic HTML on the server.
> - **Controller** (`src/controllers/`): Receives HTTP requests, validates inputs, orchestrates service calls, and renders the corresponding view or redirects.

### Q2: Why did you choose PostgreSQL with Sequelize instead of MongoDB with Mongoose?
> **Answer**: Polls and surveys require strict relational integrity (e.g. a vote selection must reference an existing option, which references an existing poll; deleting a survey must cascade cleanly to answers). PostgreSQL offers ACID compliance, foreign key constraints, and relational indexing. Sequelize provides schema versioning, transactional rollback support, and guards against SQL injection via parameterized queries.

### Q3: How do you protect passwords and sensitive user credentials?
> **Answer**: Passwords are never stored in plaintext. When a user registers, a Sequelize `beforeCreate` hook passes the plaintext password through `bcryptjs.hash()` using a cryptographic salt cost factor of 10. During login, `bcryptjs.compare()` verifies the candidate password against the stored hash in constant time to prevent timing attacks.

### Q4: How does session authentication work, and why regenerate sessions on login?
> **Answer**: When a user logs in, Express creates a session record on the server and issues a cryptographically signed cookie (`pollcraft.sid`) with `httpOnly`, `sameSite`, and `secure` (in production) flags. We call `req.session.regenerate()` upon successful authentication to eliminate **Session Fixation attacks**, ensuring an attacker cannot pre-set a session identifier and hijack the user's account.

### Q5: What is an Insecure Direct Object Reference (IDOR) vulnerability, and how is it prevented?
> **Answer**: IDOR occurs when an application exposes a reference to an internal object (e.g., `/polls/42/edit`) and trusts the user without verifying ownership. PollCraft enforces server-side ownership checks in middleware and services: if `poll.userId !== req.session.user.id` and the user is not an administrator, the server halts execution and returns an HTTP 403 Forbidden response.

### Q6: What is CSV Formula Injection (Formula / DDE Injection), and how does PollCraft prevent it?
> **Answer**: When survey responses containing text starting with `=`, `+`, `-`, `@`, `\t`, or `\r` are exported to CSV, spreadsheet software (Excel, Calc) may interpret the cell as a dynamic formula or execute external commands. PollCraft's `CsvService` inspects every cell: if a string starts with any formula trigger, it prepends a single apostrophe (`'`), forcing spreadsheet software to treat the value purely as literal text.

### Q7: Why is anonymous voting technically challenging to enforce strictly?
> **Answer**: Complete anonymity and repeat-prevention are opposing goals. If we store no user identifier, voters could vote multiple times by clearing cookies, using incognito windows, or switching IP addresses. PollCraft records a hashed session identifier and voter IP for unauthenticated polls to balance privacy with basic ballot integrity, while clearly documenting these technical limitations.

### Q8: Why prevent structural changes to a survey once responses are recorded?
> **Answer**: If an organizer deletes Question 3 or reorders choices after 50 participants have already submitted responses, the historical answers will point to non-existent options or misaligned questions, corrupting analytical validity. PollCraft locks question mutation as soon as `responseCount > 0`.

---

## 9. Project Directory Structure

```
501/
├── package.json               # Project manifest, dependencies & scripts
├── render.yaml                # Production deployment blueprint
├── .env.example               # Safe configuration template (no secrets)
├── .gitignore                 # Excludes .env, node_modules, backups & sqlite files
├── README.md                  # Comprehensive technical documentation
├── scripts/
│   ├── migrate.js             # CLI migration runner
│   ├── seed.js                # Non-destructive idempotent demo seeder
│   └── create-admin.js        # Dedicated CLI script for administrator provisioning
├── src/
│   ├── app.js                 # Express app setup, security middleware & routing
│   ├── server.js              # HTTP server bootstrap & graceful shutdown
│   ├── config/
│   │   ├── database.js        # Sequelize connection (Supabase SSL + SQLite fallback)
│   │   └── session.js         # express-session configuration
│   ├── controllers/           # HTTP request handlers (auth, polls, surveys, admin, dashboard)
│   ├── middleware/            # auth, csrf, rateLimiter, errorHandler, notFoundHandler
│   ├── migrations/            # 12 versioned database schema migration files
│   ├── models/                # Sequelize relational models & associations
│   ├── services/              # pollService, surveyService, analyticsService, csvService
│   ├── utils/                 # migrator.js (SequelizeMeta runner), validators
│   ├── public/                # Static assets (css/style.css, js/builder.js, js/charts.js)
│   └── views/                 # EJS view templates (pages, layouts, partials)
└── tests/
    ├── auth.test.js           # Authentication & session tests
    ├── polls.test.js          # Poll creation, expiration & voting tests
    ├── surveys.test.js        # Survey builder, response & CSV export tests
    └── security.test.js       # CSRF, RBAC, IDOR & CSV injection tests
```

---

## 10. License & Attribution

This project is licensed under the MIT License for educational purposes. Developed as an individual college mini project.
