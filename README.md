# QuickPulse - Full-Stack Polling & Survey Application

A production-grade, secure, full-stack web application for creating, managing, and analyzing instant community polls and multi-question structured surveys.

Built as an individual college mini project following the Model-View-Controller (MVC) architectural pattern, utilizing Node.js, Express.js, PostgreSQL with Sequelize ORM, EJS server-side templates, Chart.js, and session-based authentication.

---

## Table of Contents

1. [Project Overview & Objectives](#1-project-overview--objectives)
2. [Problem Statement](#2-problem-statement)
3. [Key Features & Role-Based Access Control](#3-key-features--role-based-access-control)
4. [Technology Stack & Rationale](#4-technology-stack--rationale)
5. [System Architecture & Request Lifecycle](#5-system-architecture--request-lifecycle)
6. [Database Schema & Entity Relationships](#6-database-schema--entity-relationships)
7. [Mermaid Entity-Relationship Diagram](#7-mermaid-entity-relationship-diagram)
8. [Project Folder Structure](#8-project-folder-structure)
9. [Prerequisites](#9-prerequisites)
10. [Local Installation & Setup](#10-local-installation--setup)
11. [PostgreSQL Configuration](#11-postgresql-configuration)
12. [Environment Variables Guide](#12-environment-variables-guide)
13. [Database Migrations & Demonstration Seed Data](#13-database-migrations--demonstration-seed-data)
14. [Startup Commands](#14-startup-commands)
15. [Automated Testing Suite](#15-automated-testing-suite)
16. [Route & Endpoint Directory](#16-route--endpoint-directory)
17. [Security & Privacy Engineering](#17-security--privacy-engineering)
18. [GitHub Publication Instructions](#18-github-publication-instructions)
19. [Render Cloud Deployment Guide](#19-render-cloud-deployment-guide)
20. [Live Deployment Verification Checklist](#20-live-deployment-verification-checklist)
21. [Known Limitations & Roadmap](#21-known-limitations--roadmap)
22. [Viva Voce & Technical Defense Q&A](#22-viva-voce--technical-defense-qa)

---

## 1. Project Overview & Objectives

**QuickPulse** provides an institutional platform enabling students, faculty, and organizations to collect quantitative and qualitative sentiment. The application handles both rapid, single-question instant polls and comprehensive, multi-format academic surveys.

### Primary Objectives
- **Zero-Prototype Reality**: Deliver a complete, fully persistent web service backed by a normalized relational database.
- **Data Integrity**: Enforce strict validation rules, atomic database transactions for ballot submissions, and structural locks on surveys with recorded responses.
- **Responsive Visual Analytics**: Automatically compute percentages and interactive Chart.js charts directly from PostgreSQL datasets.
- **Enterprise-Grade Security**: Defend against session fixation, CSRF, brute-force attacks, and SQL injection without trusting user-supplied parameters.
- **Portability**: Standardized deployment on Render with hosted PostgreSQL or SQLite in-memory isolated test runners.

---

## 2. Problem Statement

Institutions, clubs, and academic departments frequently rely on disjointed third-party forms or ad-hoc polling tools that exhibit critical deficiencies:
1. **Data Siloing**: Survey results are trapped in external proprietary silos without export ownership.
2. **Double-Voting Vulnerabilities**: Unauthenticated forms can easily be manipulated through automated bots or repeated submissions.
3. **Fragile Form Modification**: Editing a live questionnaire often causes database schema misalignment or corrupts previous responses.
4. **Poor Analytics Accessibility**: Organizers must manually export raw spreadsheets and generate visual charts in external software.

**QuickPulse** resolves these shortcomings by coupling relational persistence, automated statistical aggregation, strict double-submission protection, and structured data-integrity safeguards.

---

## 3. Key Features & Role-Based Access Control

### User Roles
- **Guest / Respondent**: Can browse public polls and surveys, cast votes, submit responses, view public visual results, and share permalinks.
- **Registered User / Organizer**: Can create instant polls, design multi-question surveys with the visual builder, configure closing deadlines, inspect detailed responses, export RFC 4180 CSV files, and manage their own content.
- **Administrator**: Full platform governance: access the Administrator Console (`/admin`), view platform-wide metrics, deactivate or reactivate user accounts, and moderate spam polls or surveys.

### Instant Polls
- Single-choice and multiple-choice voting.
- Configurable anonymous vs. login-required voting.
- Automatic closing deadlines and manual open/close controls.
- Real-time vote percentage bars and interactive Chart.js Bar & Doughnut charts.
- Public directory browsing with category and keyword search filters.

### Multi-Question Surveys
- Supports **6 question types**:
  1. Single Choice (Radio options)
  2. Multiple Choice (Checkboxes)
  3. Short Text (Single line input)
  4. Long Text (Multi-line qualitative feedback)
  5. Star / Numeric Rating (1 to 5 scale)
  6. Yes / No (Boolean selection)
- **Questionnaire Builder**: Add, order, and delete questions with optional guidance subtext.
- **Data Integrity Lock**: Once a survey receives its first submission, structural questions are locked to prevent orphaned or misaligned answers.
- **RFC 4180 CSV Export**: One-click download of all respondent answers formatted for Excel, Google Sheets, or Python Pandas.
- **Zero-Response Safety**: Gracefully handles surveys with zero submissions without divide-by-zero or template calculation exceptions.

---

## 4. Technology Stack & Rationale

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Runtime** | Node.js (v18+) | Asynchronous event loop, high throughput, and modern standard library. |
| **Web Framework** | Express.js (v4) | Lightweight, unopinionated routing and middleware architecture. |
| **Template Engine** | EJS | Server-side HTML rendering with contextual variable escaping to prevent XSS. |
| **CSS System** | Bootstrap 5 + Vanilla CSS | Responsive grid, mobile breakpoints, and custom CSS design variables. |
| **Database** | PostgreSQL | Robust ACID compliance, foreign keys, index indexing, and strict types. |
| **ORM** | Sequelize (v6) | Normalized models, migrations, transactional safety, and query parametrization. |
| **Sessions** | `express-session` + `connect-session-sequelize` | Server-side session storage persisted directly in PostgreSQL tables. |
| **Cryptography** | `bcryptjs` + `crypto` | 10-round salted password hashing and SHA-256 respondent fingerprinting. |
| **Security** | Helmet + Rate Limit + Custom CSRF | Hardened HTTP headers, brute-force mitigation, and token-based CSRF guards. |
| **Visual Charts** | Chart.js (v4) | Dynamic client-rendered Canvas visualizations (Bar, Pie, Doughnut, Histogram). |
| **Testing** | Node.js Test Runner (`node:test`) + Supertest | Zero-dependency, ultra-fast test suite with isolated in-memory SQLite storage. |

---

## 5. System Architecture & Request Lifecycle

```
[ Client Browser ]
        │  (HTTPS / Secure Cookies / CSRF Tokens)
        ▼
[ Security Middlewares: Helmet, Morgan, Express Rate-Limiter ]
        │
[ Session & Auth Layer: express-session + Sequelize Store + attachUser ]
        │
[ CSRF Protection Middleware: Token Validation for POST/PUT/DELETE ]
        │
[ Application Router: /auth, /polls, /surveys, /dashboard, /admin ]
        │
[ Controllers: Request sanitization, payload inspection ]
        │
[ Services: Transactions, double-submission checks, data aggregation ]
        │
[ Sequelize Models: User, Poll, PollOption, Survey, SurveyQuestion, etc. ]
        │
[ PostgreSQL Database Engine (Hosted on Render / Cloud / Local) ]
```

---

## 6. Database Schema & Entity Relationships

- **users**: Accounts with role (`user` or `admin`), encrypted passwords, and active state.
- **polls**: Poll metadata, slug permalink, public/unlisted flag, multiple choice toggle, expiry timestamp.
- **poll_options**: Candidate answer options for a given poll.
- **poll_votes**: An individual voting event, linking to an optional user ID, session ID, and SHA-256 IP hash.
- **poll_vote_selections**: Junction table supporting multiple-choice poll selections referencing `poll_options`.
- **surveys**: Questionnaire containers with status (`draft`, `published`, `closed`), categories, and ownership.
- **survey_questions**: Question definitions with `questionType` ENUM, help text, required flag, and sort index.
- **survey_question_options**: Choice options for single and multiple-choice survey questions.
- **survey_responses**: Submission event for a survey.
- **survey_answers**: Individual answers linked to a response and question (holds text, numeric rating, or boolean).
- **survey_answer_selections**: Junction table linking choice answers to selected question options.
- **sessions**: Session storage table used by `connect-session-sequelize`.

---

## 7. Mermaid Entity-Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Poll : "creates"
    User ||--o{ Survey : "creates"
    User ||--o{ PollVote : "casts"
    User ||--o{ SurveyResponse : "submits"

    Poll ||--|{ PollOption : "contains"
    Poll ||--o{ PollVote : "receives"
    PollVote ||--|{ PollVoteSelection : "contains"
    PollOption ||--o{ PollVoteSelection : "selected_in"

    Survey ||--|{ SurveyQuestion : "defines"
    Survey ||--o{ SurveyResponse : "receives"
    SurveyQuestion ||--o{ SurveyQuestionOption : "has_options"
    SurveyResponse ||--|{ SurveyAnswer : "includes"
    SurveyQuestion ||--o{ SurveyAnswer : "answered_in"
    SurveyAnswer ||--o{ SurveyAnswerSelection : "links_to"
    SurveyQuestionOption ||--o{ SurveyAnswerSelection : "chosen_in"

    User {
        int id PK
        string name
        string email UK
        string password
        string role
        boolean isActive
    }

    Poll {
        int id PK
        int userId FK
        string title
        string slug UK
        string status
        boolean isMultipleChoice
        datetime expiresAt
    }

    Survey {
        int id PK
        int userId FK
        string title
        string slug UK
        string status
        boolean allowAnonymous
    }

    SurveyQuestion {
        int id PK
        int surveyId FK
        string questionText
        string questionType
        boolean isRequired
    }
```

---

## 8. Project Folder Structure

```
├── .env.example              # Placeholder environment configuration
├── .gitignore                 # Exclusion rules (node_modules, .env, data, logs)
├── package.json              # Dependencies and execution scripts
├── render.yaml               # Render Cloud Blueprint infrastructure as code
├── README.md                 # Complete system documentation
├── data/                     # Standalone SQLite storage fallback
├── scripts/
│   ├── migrate.js            # Standalone migration CLI runner
│   └── seed.js               # Demonstration data seeder
├── src/
│   ├── app.js                # Express app setup, middlewares, template engine
│   ├── server.js             # HTTP server listener and graceful shutdown
│   ├── config/
│   │   ├── database.js       # Sequelize PostgreSQL/SQLite connection manager
│   │   └── session.js        # Express-session & SequelizeStore configuration
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── pollController.js
│   │   ├── profileController.js
│   │   └── surveyController.js
│   ├── middleware/
│   │   ├── auth.js           # Authentication & role-based guards
│   │   ├── csrf.js           # Session-bound CSRF token validation
│   │   ├── errorHandler.js   # 404 and 500 error handlers
│   │   └── rateLimiter.js    # Express rate-limiting policies
│   ├── migrations/           # 12 Version-controlled Sequelize migrations
│   ├── models/               # Sequelize entity definitions and associations
│   ├── public/
│   │   ├── css/style.css     # Design system, cards, progress bars, responsive UI
│   │   └── js/               # main.js, charts.js, builder.js
│   ├── routes/               # Express modular route definitions
│   ├── services/             # Business logic (pollService, surveyService, csvService)
│   ├── utils/                # migrator.js schema synchronization
│   └── views/                # EJS server-side templates
│       ├── layouts/          # header, navbar, footer, alerts
│       └── pages/            # home, auth, dashboard, polls, surveys, profile, admin, errors
└── tests/
    ├── auth.test.js          # Registration, login, duplicate email, protected routes
    ├── polls.test.js         # Creation, voting, duplicate check, results aggregation
    ├── security.test.js      # CSRF rejection, helmet headers, admin 403 access
    └── surveys.test.js       # Builder, validation, answers, CSV export, structure lock
```

---

## 9. Prerequisites

- **Node.js**: `v18.0.0` or higher (verified on Node.js v22).
- **npm**: `v9.0.0` or higher.
- **Git**: Installed for version control.
- **PostgreSQL**: (Recommended for production) A running PostgreSQL instance locally or a free cloud database (Render, Neon, Supabase).
  * *Zero-Config Fallback*: The application automatically runs using local SQLite storage if PostgreSQL credentials are omitted during initial development or automated testing.

---

## 10. Local Installation & Setup

1. **Clone or Navigate to the Repository**:
   ```bash
   cd c:\Users\saiba\Downloads\501
   ```

2. **Install Node Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the `.env.example` file to create your local `.env`:
   ```bash
   copy .env.example .env
   ```

---

## 11. PostgreSQL Configuration

### Using a Local PostgreSQL Server:
1. Ensure the PostgreSQL service is active.
2. Create an empty database:
   ```sql
   CREATE DATABASE poll_survey_db;
   ```
3. Update `.env`:
   ```env
   DB_DIALECT=postgres
   DATABASE_URL=postgres://postgres:your_password@localhost:5432/poll_survey_db
   ```

### Using Render / Neon / Supabase Hosted PostgreSQL:
Set your connection string directly in `.env`:
```env
DATABASE_URL=postgres://user:password@ep-host.region.aws.neon.tech/quickpulse?sslmode=require
DB_SSL=true
```

---

## 12. Environment Variables Guide

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `development` | Runtime environment (`development`, `production`, `test`). |
| `PORT` | `3000` | Port on which the HTTP server listens. |
| `APP_NAME` | `QuickPulse` | Branding name displayed in navbar and footer. |
| `APP_URL` | `http://localhost:3000` | Base URL used when generating shareable links. |
| `SESSION_SECRET` | *(string)* | Random key used for encrypting session cookies. |
| `SESSION_MAX_AGE_MS`| `86400000` | Session cookie validity (24 hours). |
| `DATABASE_URL` | *(optional URL)* | PostgreSQL URI (e.g. `postgres://user:pass@host:5432/db`). |
| `DB_DIALECT` | `sqlite` | Primary dialect (`postgres` or `sqlite`). |
| `DB_SSL` | `false` | Set to `true` when connecting to hosted PostgreSQL with SSL. |
| `RATE_LIMIT_MAX_REQUESTS`| `300` | Max general requests per 15-minute window. |
| `AUTH_RATE_LIMIT_MAX` | `20` | Max login/registration attempts per 15 minutes. |

---

## 13. Database Migrations & Demonstration Seed Data

Initialize all tables, foreign keys, indexes, and sample demonstration data:

```bash
# Execute schema migration
npm run migrate

# Populate realistic academic and campus demonstration data
npm run seed
```

### Pre-Configured Demonstration Accounts:
| Role | Email Address | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@quickpulse.io` | `AdminPassword123!` | System metrics, user suspension, full deletion rights |
| **Faculty User** | `sarah@university.edu` | `Password123!` | Poll & survey authoring, analytics, CSV exports |
| **Student User** | `alex@student.org` | `Password123!` | Poll & survey participation, dashboard tracking |

---

## 14. Startup Commands

```bash
# Development server (with automatic reload via nodemon)
npm run dev

# Production startup
npm start
```

Once running, navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 15. Automated Testing Suite

The application includes an automated test suite executed with the built-in Node.js test runner (`node:test`) and `supertest`:

```bash
npm test
```

### Test Coverage Summary:
- **Authentication (`tests/auth.test.js`)**: Registration, password hashing, duplicate email rejection, invalid password rejection, session cookie setting, protected route redirection.
- **Polls & Voting (`tests/polls.test.js`)**: Creation with options, min-2-options validation, voting, duplicate vote prevention, closed poll rejection, expired poll rejection, result percentage calculations, ownership validation.
- **Surveys & Validation (`tests/surveys.test.js`)**: Question builder with multiple types, zero-response CSV export, survey submission across all 6 question formats, duplicate submission rejection, required question validation, invalid option rejection, structural modification lock when responses exist, CSV data extraction.
- **Security & Authorization (`tests/security.test.js`)**: Missing CSRF rejection (403 Forbidden), non-admin rejection from `/admin` (403), administrator console access (200), Helmet security headers verification.

---

## 16. Route & Endpoint Directory

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Landing page with featured polls, surveys, and live stats. |
| `GET` | `/auth/register` | Guest | User registration form. |
| `POST` | `/auth/register` | Guest | Creates account and regenerates session. |
| `GET` | `/auth/login` | Guest | Login form with demo credentials hint. |
| `POST` | `/auth/login` | Guest | Authenticates credentials and starts session. |
| `POST` | `/auth/logout` | Auth | Destroys session and clears session cookie. |
| `GET` | `/dashboard` | Auth | User dashboard with stats, recent polls, and surveys. |
| `GET` | `/polls` | Public | Explore public polls with search and category filters. |
| `GET` | `/polls/new` | Auth | Instant poll creation form. |
| `POST` | `/polls/new` | Auth | Creates new poll with answer options. |
| `GET` | `/polls/:slugOrId` | Public | Public voting interface. |
| `POST` | `/polls/:slugOrId/vote` | Public/Auth | Records user vote in database transaction. |
| `GET` | `/polls/:slugOrId/results` | Public | Real-time results with Chart.js charts. |
| `GET` | `/polls/:slugOrId/edit` | Owner/Admin | Edit poll metadata and expiration date. |
| `POST` | `/polls/:id/delete` | Owner/Admin | Deletes poll and cascades votes. |
| `GET` | `/surveys` | Public | Explore public surveys directory. |
| `GET` | `/surveys/new` | Auth | Multi-question survey setup wizard. |
| `POST` | `/surveys/new` | Auth | Initializes survey record. |
| `GET` | `/surveys/:id/builder` | Owner/Admin | Visual questionnaire builder interface. |
| `POST` | `/surveys/:id/builder/questions`| Owner/Admin | Adds question to survey (locked if responses exist). |
| `POST` | `/surveys/:id/status` | Owner/Admin | Toggles status between draft, published, and closed. |
| `GET` | `/surveys/:slugOrId` | Public | Public survey response questionnaire. |
| `POST` | `/surveys/:slugOrId/respond`| Public/Auth | Validates and persists questionnaire submission. |
| `GET` | `/surveys/:slugOrId/results` | Public | Visual survey analytics and charts. |
| `GET` | `/surveys/:id/responses` | Owner/Admin | Table of individual responses. |
| `GET` | `/surveys/:id/export/csv` | Owner/Admin | Downloads RFC 4180 CSV export of responses. |
| `GET` | `/profile` | Auth | Account settings and password changes. |
| `GET` | `/admin` | Admin | Root Administrator Console. |
| `POST` | `/admin/users/:id/toggle` | Admin | Deactivates or reactivates user accounts. |

---

## 17. Security & Privacy Engineering

- **Cross-Site Request Forgery (CSRF)**: Every state-changing request (`POST`, `PUT`, `DELETE`) requires a cryptographic session-bound token matching `res.locals.csrfToken`.
- **Session Fixation Defense**: Sessions are explicitly regenerated upon successful registration and login.
- **Password Protection**: Passwords are encrypted using `bcryptjs` with an adaptive work factor of 10 rounds; plaintext passwords are never stored or logged.
- **Cross-Site Scripting (XSS)**: EJS contextual escaping (`<%= %>`) neutralizes malicious user input.
- **SQL Injection Prevention**: Sequelize uses parameterized queries across all database calls.
- **Anonymous Respondent Privacy**: For anonymous polls and surveys, raw IP addresses are hashed using SHA-256 with a secret salt to prevent ballot stuffing while ensuring respondents cannot be identified.

---

## 18. GitHub Publication Instructions

To publish this project to your GitHub account:

1. **Verify Git Initialization & Status**:
   ```bash
   git status
   ```
2. **Add Files to Staging**:
   ```bash
   git add .
   ```
3. **Commit the Project**:
   ```bash
   git commit -m "feat: complete full-stack polling and survey web application"
   ```
4. **Create a New Public Repository on GitHub**:
   - Go to [GitHub.com/new](https://github.com/new).
   - Enter Repository Name: `polling-survey-application` (or `quickpulse`).
   - Keep it **Public**. Do not initialize with a README (this repository already contains one).
5. **Link and Push**:
   ```bash
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/polling-survey-application.git
   git branch -M main
   git push -u origin main
   ```

---

## 19. Render Cloud Deployment Guide

The application is pre-configured for automated deployment on [Render](https://render.com) using the included `render.yaml` blueprint.

### Step-by-Step Render Deployment:
1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** and select **Blueprint**.
3. Connect your GitHub repository (`polling-survey-application`).
4. Render will detect `render.yaml` and automatically configure:
   - A **Web Service** (`quickpulse-poll-survey`) running Node.js.
   - A **PostgreSQL Database** (`quickpulse-db`) linked via `DATABASE_URL`.
   - Build Command: `npm install && npm run migrate && npm run seed`
   - Start Command: `npm start`
5. Click **Apply**.
6. Once deployed, Render will provide a public live URL (e.g., `https://quickpulse-poll-survey.onrender.com`).

---

## 20. Live Deployment Verification Checklist

After deploying to Render or another cloud provider, verify the deployment:

- [ ] **Home Page**: Verify the landing page loads with HTTP 200 and platform metrics appear.
- [ ] **Authentication**: Log in with demo admin credentials (`admin@quickpulse.io` / `AdminPassword123!`).
- [ ] **Instant Poll**: Create a new poll with 3 options, submit a vote, and confirm that the Bar and Doughnut charts update.
- [ ] **Duplicate Vote Prevention**: Attempt to vote again on the same poll and verify that the application detects the existing vote.
- [ ] **Survey Builder**: Create a survey in draft mode, add choice, rating, and text questions, and publish it.
- [ ] **Survey Submission**: Submit an anonymous response and confirm that results appear under `/surveys/:slug/results`.
- [ ] **CSV Export**: Click "Export CSV" and open the downloaded file in Excel to confirm RFC 4180 formatting.
- [ ] **Admin Console**: Navigate to `/admin` to verify user management and platform moderation actions.

---

## 21. Known Limitations & Roadmap

- **Email Verification**: Currently accounts are activated immediately upon registration; future iterations can integrate Nodemailer / SendGrid for email confirmation tokens.
- **WebSocket Live Polling**: Current results refresh on page load; future updates can integrate Socket.io for instantaneous chart transitions during live conference sessions.
- **File Upload Questions**: Support for image or PDF attachments within survey responses.

---

## 22. Viva Voce & Technical Defense Q&A

### Q1: Why did you choose Sequelize with PostgreSQL over a NoSQL database like MongoDB?
**Answer**: Polling and surveys are inherently relational. A poll has options, votes, and vote selections. A survey has ordered questions, question choices, responses, and answer selections. Relational databases enforce strict primary key/foreign key referential integrity, preventing orphaned answers if a question is deleted. Furthermore, PostgreSQL provides ACID transactions, ensuring that multi-option votes are committed atomically or rolled back entirely if a failure occurs.

### Q2: How do you prevent double-voting in anonymous polls without violating user privacy?
**Answer**: For unauthenticated votes, storing raw IP addresses violates privacy principles. QuickPulse computes a one-way cryptographic SHA-256 hash of the client's IP concatenated with the server's secret salt, alongside a unique device session cookie (`sessionId`). When a vote is submitted, the system queries for existing records matching either the `userId`, `sessionId`, or `ipHash`. If a match exists, the transaction is rejected.

### Q3: What prevents users from modifying surveys after people have already responded?
**Answer**: QuickPulse implements a **structural integrity lock**. Before allowing an organizer to add or delete questions from a survey, `SurveyService` executes a `count({ where: { surveyId } })` on the `survey_responses` table. If any responses exist, structural modifications are rejected. This prevents data corruption where existing answers would point to modified or deleted question IDs.

### Q4: How is CSRF protected throughout the application?
**Answer**: QuickPulse generates a cryptographic 24-byte hex token bound to the server-side session. This token is exposed to EJS templates via `res.locals.csrfToken`. Every HTML form submission embeds this token as a hidden `_csrf` input. The CSRF middleware inspects all state-changing HTTP verbs (`POST`, `PUT`, `DELETE`). If the token is missing or mismatched, a 403 Forbidden response is issued.

### Q5: How are survey responses converted into CSV format?
**Answer**: `CsvService` generates an RFC 4180-compliant comma-separated output. It queries the survey questions to construct the header row, retrieves all responses with eager-loaded answers, and escapes every cell value by replacing internal double quotes with escaped quotes (`""`) and wrapping the value in quotation marks (`"..."`). This prevents CSV injection and preserves formatting when opened in Microsoft Excel or Python.
