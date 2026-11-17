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

* [NodeJS](https://nodejs.org/en/).

```bash
# Configure your database credentials in config.json
# (and also .env for Docker)
cp .config.example.json config.json
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
* [Docker Compose](https://docs.docker.com/compose/install/).

```bash
cp .config.example.json config.json
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
