# Connectoo V2

Connectoo is a civic issue resolution platform built with Node.js, Express, EJS, and SQLite. Citizens can report and follow local issues, while officials and field staff can manage acknowledgements, assignments, and resolutions.

## Requirements

- Node.js 22 or later and npm
- Docker Engine and the Docker Compose plugin (for containerized use)
- Java 17 and Maven (for running the Selenium UI test outside Docker)

## Install and run locally

1. Clone the repository and enter the project directory.
2. Install dependencies:

   ```sh
   npm ci
   ```

3. Copy `.env.example` to `.env` and set a long, unique `SESSION_SECRET`.
4. Start the application:

   ```sh
   npm start
   ```

   Open [http://localhost:3000](http://localhost:3000). SQLite data is stored in `database/connectoo.db` by default.

## Run with Docker Compose

Set `SESSION_SECRET` in your shell or `.env` file to a long, unique value, then start the services:

```sh
docker compose up --build
```

The app is available on port 3000, Jenkins on port 8080, and Selenium WebDriver on port 4444. The Maven service runs the Java UI test after the app and Selenium are healthy, then exits. To run the test again while the other services are already running:

```sh
docker compose run --rm maven
```

App data, uploaded files, and Jenkins home are stored in named Docker volumes. To stop the services without deleting this data, run `docker compose down`. Deleting volumes with `docker compose down --volumes` permanently removes it.

## Run the UI test locally

Start the app and a Selenium standalone Chrome instance, then run:

```sh
mvn test
```

The test uses `SELENIUM_REMOTE_URL` when set; otherwise, it connects to `http://localhost:4444/wd/hub`.

## EC2 deployment notes

Build and run the app with Docker Compose on an EC2 instance with Docker installed. Configure the instance security group to allow only the traffic you need. Do not expose Jenkins or Selenium's WebDriver port to the public internet; restrict access to trusted networks or place them behind suitable access controls. Supply a strong `SESSION_SECRET`, configure persistent backups for Docker volumes, and use TLS through a reverse proxy or load balancer for public application traffic.
