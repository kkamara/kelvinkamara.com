const path = require('path')

let parseEnvFile
if (process.env.NODE_ENV !== "staging") {
    parseEnvFile = require("dotenv").config({
        path: path.join(
            __dirname, 
            '../',
            '../',
            '.env',
        ),
    })
}

if (parseEnvFile && parseEnvFile.error) {
    throw parseEnvFile.error
}

const config = {
    asset: path => {
        if (path[0] === "/") return `${path}`
        return `/${path}`
    },
    appName: process.env.APP_NAME,
    nodeEnv: process.env.NODE_ENV,
    appDebug: process.env.APP_DEBUG,
    appURL: process.env.APP_URL,
    appLocale: process.env.APP_LOCALE,
    appPort: process.env.PORT || process.env.APP_PORT,
    // email
    mailgunDomain: process.env.MAILGUN_DOMAIN,
    mailgunSecret: process.env.MAILGUN_SECRET,
    mailgunEndpoint: process.env.MAILGUN_ENDPOINT,
    mailToAddress: process.env.MAIL_TO_ADDRESS,
    mailFromName: process.env.MAIL_FROM_NAME,
    mailSubject: process.env.MAIL_SUBJECT,
}

module.exports = config
