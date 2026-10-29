# Connectoo

> **Civic issues, connected to action.**
>
> Connectoo is a multi-page civic administration platform built by **Team Connectoo**. It helps bridge the gap between residents reporting local problems and the public teams responsible for addressing them. By giving citizens, officials, and field workers a shared view of an issue's progress, Connectoo makes civic problem-solving more visible and accountable.

[![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![AWS](https://img.shields.io/badge/Cloud-AWS_EC2-FF9900?logo=amazonaws&logoColor=white)](https://aws.amazon.com/ec2/)
[![Jenkins](https://img.shields.io/badge/CI%2FCD-Jenkins-D24939?logo=jenkins&logoColor=white)](https://www.jenkins.io/)
[![Selenium](https://img.shields.io/badge/UI_Tests-Selenium-43B02A?logo=selenium&logoColor=white)](https://www.selenium.dev/)

---

## ✨ Features

- 📝 **Report local issues** with a description, location, ward, category, and optional photo.
- 🗺️ **Browse and follow community reports** in a shared civic issue feed.
- 💬 **Discuss reports** with threaded comments and show community support with a “hype.”
- 🏛️ **Coordinate official responses** by acknowledging reports, assigning work, and managing field workers.
- 🧰 **Track field work** through a dedicated worker dashboard, including resolution notes and proof images.
- 🔐 **Role-based experiences** for citizens, authorities, and field workers.
- 💾 **Persist application data** with SQLite and Docker-managed storage.

## 🏗️ System Architecture

Connectoo is an Express application rendered with EJS templates. Docker Compose brings up the application and the supporting services on a shared Docker network:

```text
                         GitHub
                            │
                      push / webhook
                            ▼
                     ┌─────────────┐
                     │   Jenkins   │
                     │ CI pipeline │
                     └──────┬──────┘
                            │ build / test / deploy
                            ▼
┌──────────────────────────────────────────────────────────┐
│                Docker Compose network                    │
│                                                          │
│  ┌──────────────┐      ┌───────────────┐                 │
│  │  Node.js +   │◄─────│ Maven +       │                 │
│  │  Express app │      │ Selenium test │                 │
│  │  app:3000    │      └───────┬───────┘                 │
│  └──────────────┘              │ WebDriver               │
│                                ▼                          │
│                       ┌─────────────────┐                │
│                       │ Selenium Chrome │                │
│                       │ selenium:4444   │                │
│                       └─────────────────┘                │
└──────────────────────────────────────────────────────────┘
                            │
                            ▼
                   AWS EC2 deployment
```

### Application and test communication

- The **app** service runs the Node.js/Express site on port `3000`.
- The **selenium** service runs Chrome with Selenium WebDriver on port `4444`.
- The **maven** service runs the Java UI test suite. On the Compose network, it reaches the app at `http://app:3000` and Selenium at `http://selenium:4444/wd/hub`.
- Docker Compose service names provide internal DNS; the browser test does not need host-mapped addresses to reach either service.
- SQLite data, uploaded images, and Jenkins home are persisted in named Docker volumes.

### CI/CD workflow

In the deployed environment, a GitHub webhook notifies the configured Jenkins job when code is pushed. The Docker-capable Jenkins agent checks out the change, builds or updates the Compose environment, and runs the Maven/Selenium UI tests against the app. The test verifies that the application home page title contains “Connectoo.” After the pipeline's configured checks pass, Jenkins deploys the updated application to the AWS EC2 host.

**Jenkins configuration is environment-specific:** this repository does not include a `Jenkinsfile` or webhook configuration. To enable the push-to-deploy flow, configure the Jenkins job and GitHub webhook, provide the job with access to Docker Compose and the deployment target, and gate deployment on successful tests. The Compose file includes Jenkins and the Maven/Selenium test services; running Compose by itself does not configure a GitHub webhook or deploy to EC2.

> **Deployment security:** restrict access to Jenkins and Selenium, use a unique `SESSION_SECRET`, and serve public production traffic over HTTPS.

## 📋 Prerequisites

For the containerized setup:

- [Git](https://git-scm.com/downloads)
- [Docker](https://docs.docker.com/get-docker/) with the Docker Compose v2 plugin (`docker compose`)

For running the application or tests outside Docker, also install **Node.js 22+ and npm**, plus **Java 17 and Maven** for the Selenium tests.

## 🚀 Local Installation

### 1. Clone the repository

```bash
git clone https://github.com/MEGHAREDDY27/Connectoo.git
cd Connectoo
```

### 2. Configure the application secret

Create a `.env` file in the project root and set a long, unique session secret. Compose reads this file automatically.

```dotenv
SESSION_SECRET=replace-with-a-long-random-secret
```

Do not use the development fallback secret for a publicly accessible deployment.

### 3. Start the Compose environment

```bash
docker compose up -d
```

Compose builds the application image if needed and starts the app, Jenkins, Selenium, and the Maven UI test service. The app is available at [http://localhost:3000](http://localhost:3000), Jenkins at [http://localhost:8080](http://localhost:8080), and Selenium WebDriver at [http://localhost:4444](http://localhost:4444).

Use the following commands to inspect service status and logs:

```bash
docker compose ps
docker compose logs -f app
```

When source or Dockerfile changes need to be included in a rebuilt image, run:

```bash
docker compose up -d --build
```

Stop the services without removing persistent data:

```bash
docker compose down
```

## 🧪 UI Testing

The Compose environment waits for the application and Selenium health checks before starting Maven. The Maven container runs `mvn --batch-mode test`; its Selenium test opens the app through the internal `app` hostname and checks the page title.

View the test output after starting the environment:

```bash
docker compose logs maven
```

To run the UI test again while the app and Selenium services are available:

```bash
docker compose run --rm maven
```

To run the test from a local Java/Maven installation instead, start the app and a Selenium Chrome WebDriver, then run:

```bash
mvn test
```

The test uses `SELENIUM_REMOTE_URL` when set; otherwise, it connects to `http://localhost:4444/wd/hub`. The test targets `http://app:3000`, so when running Maven outside Compose, make sure the hostname `app` resolves to the machine running the app (for example, with a local hosts-file entry). Running the Maven service through Compose handles this networking automatically.

## ☁️ AWS EC2 Deployment

Run Docker Engine and the Compose plugin on the EC2 host, then deploy the Compose project there. Configure security group rules and any reverse proxy to expose only the required application traffic. Keep Jenkins and Selenium ports restricted to trusted access, set a strong `SESSION_SECRET`, use HTTPS for public traffic, and back up the persistent Docker volumes.

For automated releases, connect the GitHub webhook to the Jenkins job and configure a Docker-capable deployment agent with access to the EC2 target. Verify that UI tests pass before allowing the job to update the production app.

## 👥 Contributors

**Team Connectoo**

- [Contributor name] — [role or area of contribution]
- [Contributor name] — [role or area of contribution]
- [Contributor name] — [role or area of contribution]

---

<p align="center">
  <strong>Building more connected, accountable civic services.</strong>
</p>
