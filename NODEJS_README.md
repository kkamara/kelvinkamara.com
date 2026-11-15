# kelvinkamara.com - Node.js/Express Version

Award-Winning Software Developer Portfolio - Migrated from Django to Node.js/Express

## Migration Complete ✅

This project has been successfully migrated from Django to Node.js/Express with full feature parity:

- ✅ Contact form API with Turnstile CAPTCHA
- ✅ Email sending via Nodemailer/Mailgun
- ✅ Rate limiting & security middleware
- ✅ Pug templating engine
- ✅ Static file serving (robots.txt, sitemap.xml, assets)
- ✅ Session management with secure cookies
- ✅ Production-ready error handling & logging
- ✅ NRB convention compliance

## Requirements

- **Node.js** 16+ (tested with 18+)
- **npm** or **yarn**
- **Mail server** (Mailhog for development, Mailgun for production)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Key settings to update:
- `APP_KEY` - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `APP_URL` - Your application URL
- `MAIL_TO_ADDRESS` - Where contact emails are sent
- `MAILGUN_*` - For production email sending
- `TURNSTILE_*` - For CAPTCHA (optional)

### 3. Run Development Server

```bash
npm run dev
```

Server starts at `http://localhost:8000`

### 4. Production Deployment

```bash
npm run start
```

## Project Structure

```
src/
├── app.js                      # Express application
├── config/
│   └── index.js               # Configuration from .env
├── controllers/
│   └── contactControllers.js  # Contact form handler
├── routes/
│   ├── index.js               # Main router
│   ├── homeRoutes.js          # Home page routes
│   └── API/
│       ├── index.js
│       └── contactRoutes.js   # API routes
├── middlewares/
│   └── V1/
│       ├── errorMiddleware.js      # Error handling
│       ├── throttleMiddleware.js   # Rate limiting
│       ├── sessionMiddleware.js    # Session management
│       ├── corsMiddleware.js       # CORS handling
│       ├── loggingMiddleware.js    # Request logging
│       └── minifyHTMLMiddleware.js # HTML minification
├── services/
│   └── mailService.js         # Email sending
├── utils/
│   ├── validators.js          # Input validation
│   └── contactValidator.js    # Contact form validation
└── views/
    ├── home.pug               # Home page
    ├── layouts/
    │   ├── main.pug          # Main layout
    │   ├── navbar.pug        # Navigation
    │   ├── footer.pug        # Footer
    │   └── flash.pug         # Alert messages
    └── emails/
        └── contact.pug       # Contact email template

public/
├── css/
│   └── style.css             # Stylesheet
├── js/
│   └── main.js               # Client-side JavaScript
├── assets/                   # Static assets
├── robots.txt                # SEO robots config
└── sitemap.xml              # XML sitemap
```

## API Endpoints

### POST /api/contact

Submit contact form with CAPTCHA verification.

**Request:**
```bash
curl -X POST http://localhost:8000/api/contact \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "name=John+Doe&email=john@example.com&message=Hello&cf-turnstile-response=token"
```

**Form Fields:**
- `name` (string, 3-50 chars) - Sender's name
- `email` (string, valid email) - Sender's email
- `message` (string, max 1000 chars) - Message content
- `cf-turnstile-response` (string) - CAPTCHA token (if enabled)

**Success Response (200):**
```json
{
  "message": "Success"
}
```

**Error Responses:**
```json
// Rate limited (429)
{ "error": "Too many requests. Please try again later." }

// Invalid input (400)
{ "error": "Name length must be greater than 2 characters" }

// CAPTCHA failed (400)
{ "error": "Captcha verification failed. Please try again." }

// Server error (500)
{ "error": "Internal Server Error." }
```

### GET /

Home page with contact form

### GET /sitemap.xml

XML sitemap for SEO

### GET /robots.txt

Robots configuration for crawlers

## Configuration

### Environment Variables

```bash
# Application
APP_NAME              # App name (default: KelvinKamara)
APP_KEY              # Session secret key (REQUIRED for production)
NODE_ENV             # development|production
APP_DEBUG            # true|false - Show stack traces
APP_TIMEZONE         # UTC, Europe/London, etc.
APP_URL              # Your application URL
PORT                 # Server port (default: 8000)

# Email
MAIL_HOST            # SMTP host (default: mailhog)
MAIL_PORT            # SMTP port (default: 1025)
MAIL_SECURE          # true|false - Use TLS
MAIL_USER            # SMTP username
MAIL_PASS            # SMTP password
MAIL_FROM            # From email address
MAIL_TO_ADDRESS      # Where to send contact emails
MAIL_SUBJECT         # Email subject line

# Mailgun (Production)
MAILGUN_DOMAIN       # Mailgun domain
MAILGUN_SECRET       # Mailgun API key

# Turnstile CAPTCHA
TURNSTILE_SITEKEY    # Public key for widget
TURNSTILE_SECRET     # Secret key for verification

# Security
SECURE_SSL_REDIRECT  # Redirect HTTP to HTTPS
SESSION_COOKIE_SECURE # Secure flag on cookies
CSRF_COOKIE_SECURE   # Secure flag on CSRF cookie
CSRF_TRUSTED_ORIGINS # Trusted origins for CSRF
USE_X_FORWARDED_PROTO # Trust X-Forwarded-Proto header
```

## Development

### Run with nodemon (auto-reload)
```bash
npm run dev
```

### Run in production mode
```bash
NODE_ENV=production npm run start
```

### View logs
```bash
tail -f logs/access.log
```

## Email Testing

### Mailhog (Development)

1. Start Mailhog container:
```bash
docker run --rm -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

2. Access UI at `http://localhost:8025`

3. Submit contact form - emails appear in Mailhog UI

### Mailgun (Production)

1. Get API credentials from Mailgun dashboard
2. Set `MAILGUN_DOMAIN` and `MAILGUN_SECRET` in `.env`
3. Emails send via Mailgun's SMTP

## CAPTCHA Integration

### Test Credentials
- **Sitekey**: `1x00000000000000000000AA` (always passes)
- **Secret**: `1x0000000000000000000000000000000AA` (always passes)

### Production Setup
1. Create account at https://dash.cloudflare.com/
2. Get Turnstile keys
3. Set `TURNSTILE_SITEKEY` and `TURNSTILE_SECRET` in `.env`

## Security Best Practices

### For Production:

1. **Generate Strong APP_KEY:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. **Enable HTTPS:**
```env
SECURE_SSL_REDIRECT=true
SESSION_COOKIE_SECURE=true
CSRF_COOKIE_SECURE=true
```

3. **Set Proper CORS Origins:**
```env
ALLOWED_ORIGINS=https://kelvinkamara.com,https://www.kelvinkamara.com
```

4. **Use Environment Variables:**
- Never commit `.env` file
- Store secrets in production environment
- Use separate `.env` for each environment

5. **Enable Rate Limiting:**
- Contact form limited to 5 requests/minute per IP
- Global rate limit: 10,000 requests/15 minutes

6. **Use Mailgun for Email:**
- More reliable than local SMTP
- Better deliverability
- Professional email handling

## Rate Limiting

### Global Rate Limit
- **Window**: 15 minutes
- **Limit**: 10,000 requests/window (development), 100,000 (production)

### Contact Form Rate Limit
- **Window**: 1 minute
- **Limit**: 5 requests/window per IP

Adjust in `src/middlewares/V1/throttleMiddleware.js`

## Troubleshooting

### Port Already in Use
```bash
# Use different port
PORT=3000 npm run dev

# Kill process on port 8000 (Windows)
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Email Not Sending
1. Check Mailhog is running: `docker ps`
2. Verify `MAIL_HOST` and `MAIL_PORT` in `.env`
3. Check logs: `tail -f logs/access.log`
4. Restart server: `npm run dev`

### CAPTCHA Not Working
1. Verify `TURNSTILE_SITEKEY` is set
2. Check browser console for errors
3. Test with provided test credentials first
4. Ensure you're on allowed domain

### Sessions Not Persisting
1. Check `sessions/` directory exists
2. Ensure directory is writable
3. For production, upgrade to Redis:
```bash
npm install connect-redis redis
```

## Deployment

### Heroku
```bash
heroku create kelvinkamara
git push heroku main
heroku config:set APP_KEY=xxx
heroku config:set MAILGUN_DOMAIN=xxx
heroku open
```

### Docker
```bash
docker build -t kelvinkamara .
docker run -p 8000:8000 --env-file .env kelvinkamara
```

### Traditional Server
```bash
# SSH into server
ssh user@server.com

# Clone repo
git clone https://github.com/kkamara/kelvinkamara.com.git
cd kelvinkamara.com

# Install & configure
npm install
cp .env.example .env
# Edit .env with production values

# Run with PM2 (process manager)
npm install -g pm2
pm2 start src/app.js --name kelvinkamara
pm2 startup
pm2 save
```

## Performance Monitoring

### View Request Logs
```bash
tail -f logs/access.log
```

### Monitor Memory Usage
```bash
npm install -g clinic
clinic doctor -- npm run dev
```

## Feature Roadmap

- [ ] Dashboard at `/dashboard` for client management
- [ ] Database integration (Sequelize already in dependencies)
- [ ] User authentication system
- [ ] Client portfolio management
- [ ] Project showcase features
- [ ] Mobile app backend API

## Contributing

Pull requests welcome. For major changes, open an issue first.

## License

All rights reserved. This is a proprietary portfolio project.

See [license](./license) file for details.

## Support

For issues and questions:
- GitHub Issues: https://github.com/kkamara/kelvinkamara.com/issues
- Email: kamaracomputers@gmail.com
