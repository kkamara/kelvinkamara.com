![kelvinkamara.com-light.png](https://raw.githubusercontent.com/kkamara/useful/main/kelvinkamara.com-light.png)

![kelvinkamara.com-dark.png](https://raw.githubusercontent.com/kkamara/useful/main/kelvinkamara.com-dark.png)

# kelvinkamara.com

(2020) Award-Winning Web Developer.

Mr. Kelvin Kamara has over 10 years competency in both frontend & backend solutions. He is a firm believer in using the right tool for the job.

Specialising in backend server development, Kel was fortunate to achieve the UK Government Cabinet Office Recognition Award, on April 2019, for his work with secure web systems.

![government award](https://www.kelvinkamara.com/award.jpg)

* [Installation](#installation)

* [Usage](#usage)

* [Api Documentation](#api-documentation)

* [Unit Tests](#unit-tests)

* [Misc](#misc)

* [Contributing](#contributing)

* [License](#license)

## Installation

* [XAMPP: Apache, MariaDB (MySQL alternative), & PHP](https://www.apachefriends.org/)
* If you find that the MariaDB XAMPP service fails to start (I get this on Windows) then install MySQL manually [here](https://dev.mysql.com/downloads/mysql/)
* [https://laravel.com/docs/12.x/installation](https://laravel.com/docs/12.x/installation)
* [https://laravel.com/docs/12.x/vite](https://laravel.com/docs/12.x/vite)

```bash
# Create our environment file.
cp .env.example .env
# Install our app dependencies.
composer i
php artisan key:generate
# Before running the next command:
# Update your database details in .env
php artisan migrate --seed
yarn install
yarn build
```

## Usage

```bash
php artisan serve --port=3000
# Website accessible at http://localhost:3000
```

## Api Documentation

```bash
php artisan route:list
```

## Unit Tests

```bash
php artisan test --filter=Unit
```

## Misc

[See NodeJS ReactJS Boilerplate](https://github.com/kkamara/nodejs-reactjs-boilerplate).

[See PHP ReactJS Boilerplate](https://github.com/kkamara/php-reactjs-boilerplate).

[See ReactJS Native Mobile App Boilerplate](https://github.com/kkamara/ReactJSNativeMobileAppBoilerplate).

[See MRVL Desktop](https://github.com/kkamara/mrvl-desktop).

[See MRVL Web](https://github.com/kkamara/mrvl-web).

[See NodeJS Docker Skeleton](https://github.com/kkamara/nodejs-docker-skeleton).

[See NodeJS Scraper](https://github.com/kkamara/nodejs-scraper).

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[BSD](https://opensource.org/licenses/BSD-3-Clause)
