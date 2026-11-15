# Quick Start Guide - KelvinKamara.com

## ⚡ 5-Minute Setup

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Configure Environment
```bash
# Copy example configuration
cp .env.example .env

# Edit .env with your settings:
# - MAIL_TO_ADDRESS - where contact emails go
# - APP_KEY - for session security (already set)
# - MAILGUN_* - for production emails (optional)
# - TURNSTILE_* - for CAPTCHA (optional)
```

### 3️⃣ Run Development Server
```bash
npm run dev
```

**Output:**
```
Listening on http://127.0.0.1:8000
```

### 4️⃣ Test It
Visit **http://localhost:8000** in your browser

## 📋 Checklist

- [ ] Node.js 16+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Dependencies installed (`npm install` completed)
- [ ] .env configured (copy from .env.example)
- [ ] Server running (`npm run dev`)
- [ ] Home page loads at http://localhost:8000
- [ ] Contact form appears
- [ ] Mailhog running (for email testing)

## 🧪 Test Contact Form

1. Start development server: `npm run dev`
2. Visit http://localhost:8000
3. Fill contact form with:
   - Name: "Test User"
   - Email: "test@example.com"
   - Message: "Hello!"
4. Click "Send Message"
5. You should see success message

**Email Testing:**
- Development: Emails go to Mailhog (http://localhost:1025)
- Production: Emails go via Mailgun (configure MAILGUN_*)

## 📧 Email Setup

### Development (Mailhog)
```bash
# Start Mailhog in Docker
docker run --rm -p 1025:1025 -p 8025:8025 mailhog/mailhog

# View emails at http://localhost:8025
```

### Production (Mailgun)
1. Sign up at https://mailgun.com
2. Get your domain and API key
3. Update .env:
   ```
   MAILGUN_DOMAIN=mg.yourdomain.com
   MAILGUN_SECRET=your-api-key-here
   ```

## 🔐 Configuration

### Essential Settings (.env)

```bash
# Application
APP_NAME=KelvinKamara
APP_URL=http://localhost:8000  # Change for production
NODE_ENV=development           # Set to 'production' for deploy

# Email (Required)
MAIL_TO_ADDRESS=your-email@example.com  # Where to send contact emails

# Optional: CAPTCHA
TURNSTILE_SITEKEY=your-public-key
TURNSTILE_SECRET=your-secret-key

# Optional: Production Email
MAILGUN_DOMAIN=your-domain.com
MAILGUN_SECRET=your-api-key
```

See `.env.example` for all options.

## 🚀 Deployment

### Local Testing
```bash
npm run dev
```

### Production Build
```bash
NODE_ENV=production npm run start
```

### Docker
```bash
docker build -t kelvinkamara .
docker run -p 8000:8000 --env-file .env kelvinkamara
```

### Heroku
```bash
heroku create kelvinkamara
git push heroku main
heroku config:set APP_KEY=xxxx
```

## 🐛 Troubleshooting

### Port 8000 in use
```bash
# Use different port
PORT=3000 npm run dev
```

### Email not sending
1. Check Mailhog: `docker ps`
2. Verify MAIL_* settings in .env
3. Check logs: `tail -f logs/access.log`

### CAPTCHA not working
1. Verify TURNSTILE_SITEKEY is set
2. Check browser console for errors
3. Restart server after changing .env

### Dependencies error
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📖 Documentation

- **NODEJS_README.md** - Complete reference
- **MIGRATION_SUMMARY.md** - What was migrated
- **setup.js** - Validation script
- **.env.example** - Configuration template

## ✅ Validation

Run setup validator:
```bash
npm run setup
```

This checks:
- ✓ Node.js version
- ✓ Required files exist
- ✓ Directories created
- ✓ Dependencies configured

## 🎯 Next Steps

1. ✅ Local testing (you are here)
2. 🔄 Configure for your needs
3. 📦 Deploy to production
4. 📊 Monitor logs in logs/
5. 🚀 Add features as needed

## 🆘 Need Help?

- Check **NODEJS_README.md** for complete documentation
- Review **MIGRATION_SUMMARY.md** for migration details
- Look at **setup.js** for what's being validated
- Check logs in **logs/** directory

## 📞 Support

For issues:
- GitHub: https://github.com/kkamara/kelvinkamara.com/issues
- Email: kamaracomputers@gmail.com

---

**Happy coding! 🚀**
