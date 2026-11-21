<img src="https://raw.githubusercontent.com/kkamara/useful/main/kelvinkamara.com-light.png" alt="kelvinkamara.com-light.png" width="300px"/> <img src="https://raw.githubusercontent.com/kkamara/useful/main/kelvinkamara.com-dark.png" alt="kelvinkamara.com-dark.png" width="300px"/> <img src="./public/award.jpg" alt="award.jpg" width="120px"/>

# kelvinkamara.com

(01-Feb-2020) Award-Winning Web Developer.

## Evidence Supporting I Achieved the Govt. Award

* [award-evidence.png](https://github.com/kkamara/kelvinkamara.com/blob/main/kelvinkamara/assets/img/award-evidence.png)
* [award-evidence.mp4](https://github.com/kkamara/kelvinkamara.com/tree/main/kelvinkamara/assets/videos)

## Table of Contents

* [Installation](#installation)

* [Usage](#usage)

* [Using Docker?](#using-docker)

* [Mail Server With Docker](#mail-server-with-docker)

* [API Tests](#api-tests)

## Installation

* [NodeJS](https://nodejs.org/en/)

```bash
# Configure your database credentials in config.json
# (and also .env for Docker)
cp config.example.json config.json
cp .env.example .env
npm install --global yarn
yarn
yarn migrate
yarn seed:all
```

#### Running frontend

```bash
cd frontend
cp .env.example .env
yarn
yarn dev
```

#### Sequelize reference

See the [Sequelize migration documentation](https://sequelize.org/docs/v6/other-topics/migrations/) for interacting with the application's database.

See [package.json](./package.json) for helpful commands related to using the database. For example:

```bash
yarn seed:generate --name create-admin-user
```

## Usage

```bash
yarn start
# Serves app to http://localhost:8000
```

### Private admin workspace

The client workspace is available at `/admin`. Build it before serving it through
Express:

```bash
cd frontend
yarn
yarn build
cd ..
yarn migrate
```

Set `ADMIN_PASSWORD` privately in the server's environment or ignored `.env`
file before running the administrator seeder on a new database. The login is the
administrator email configured in the seeder. Public registration is disabled.
Changing `ADMIN_PASSWORD` alone does not change an existing account: after
setting it, run `yarn admin:password` on the server to update the existing
administrator and revoke its sessions. Use a new, strong password; the current
login validation permits 6–20 characters.
Ensure the application and Sequelize CLI use the same database configuration.
The `yarn migrate` script selects the development configuration; for production,
run migrations with `NODE_ENV=production` using Sequelize CLI instead.
SQL query logging is disabled because queries may contain client details,
payment instructions and authentication tokens.

Development admin email is delivered only to MailHog. Inside Docker the default
host is `mailhog`; for a backend running on the host set `MAILHOG_HOST=127.0.0.1`
and use the published `MAILHOG_PORT`. Production admin email uses the Mailgun EU
API only: configure `MAILGUN_DOMAIN`, `MAIL_PASS` (Mailgun API key), and
`MAIL_FROM`. There is no fallback to another mail provider.
All outgoing emails use `kamaracomputers@gmail.com` as their reply-to address.
For contact form emails, the visitor's address remains in the message body;
replying directly addresses Kel, not the visitor.

Invoices use GBP and do not depend on Stripe. Payment instructions can include
bank-transfer details, and an HTTPS payment link can optionally be supplied or
generated for an existing invoice. Set `STRIPE_SECRET` to a test secret or
restricted key in development and a live key in production. Each generated link
can be used to complete Stripe's checkout once. After a client completes
checkout, Stripe automatically deactivates the link, so it cannot be used for
another checkout. Opening the link without completing checkout does not use it
up. A completed checkout does not necessarily mean the payment has settled:
check its status in Stripe, especially for delayed payment methods. Stripe
receives the invoice number and amount, not the client's contact details or
invoice description.

If Stripe link creation fails or times out, check Stripe before retrying: a link
may already have been created. Automatic retries use the same idempotency key and
are blocked after 23 hours or if the Stripe key changes, because Stripe may
forget old idempotency keys and create a second link. If retries are blocked,
find and deactivate any existing link in Stripe before creating a replacement
invoice and link; the original invoice remains in the workspace.

Payments are recorded manually; the app does not verify bank transfers or
automatically reconcile online payments. Check Stripe before recording a
payment. If a client pays another way or only partially pays, deactivate any
existing Stripe link in the Stripe dashboard to avoid duplicate or incorrect
charges. Creating a Stripe link is blocked if a payment is already recorded
against the invoice. Agreements contain the terms you
provide and are signed outside the app; the signed marker is a manual record,
not proof of signature. On the Agreements page, save reusable templates for
initial project work or ongoing plans and select one when creating an agreement.
The title and text are copied and can be tailored before creation; changing or
deleting a template does not alter existing agreements. Deleting an agreement
permanently removes its record and signed marker, but does not recall emails
already sent. Agreement PDFs currently support Western European characters;
other characters are preserved in storage but rejected when generating a PDF
or sending an agreement, to avoid producing an incorrect document.
The agreement character-set migration cannot be rolled back safely
once Unicode text has been saved; back up the database before applying it.
Payment exports are CSV files for the selected client.
Client data, financial details, and documents are sensitive: restrict database
and server access, use HTTPS, and maintain secure backups.

The admin app is excluded from the sitemap and disallowed in `robots.txt`.
These controls do not provide access security; the API additionally requires
an authenticated administrator.

The Docker image builds the frontend into `/opt/admin-dist`, outside the
development bind mount. `ADMIN_DIST_PATH` selects the built frontend directory
and defaults to `frontend/dist` outside the image. The image does not embed
`.env`, `config.json`, logs, sessions, or uploads. Supply the private configuration files at runtime
and persist the runtime directories outside the image. The development Compose
bind mount already supplies the project files. MySQL may implicitly commit DDL,
so back up the database before applying migrations even though migrations use
the project's transaction pattern.

#### Reload server on project files change

```bash
yarn dev
```

#### Reload server and frontend app on project files change

```bash
yarn dev:frontend
```

<a name="using-docker"></a>
## Using docker?

* [Docker](https://docs.docker.com/engine/install/)
* [Docker Compose](https://docs.docker.com/compose/install/)

```bash
cp config.example.json config.json
cp .env.example .env
docker-compose --build -d
```

## Mail Server With Docker

![docker-mailhog.png](https://raw.githubusercontent.com/kkamara/useful/main/docker-mailhog.png)

The [Mailhog](https://github.com/mailhog/MailHog) Docker image runs at `http://localhost:8025`in this app.

## API Tests

```bash
NODE_ENV=test yarn test
```
