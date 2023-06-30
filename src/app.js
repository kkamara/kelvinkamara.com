const path = require('path')
const { log, } = require('console')
const minifyHTML = require("express-minify-html")
const cookieParser = require("cookie-parser")
const sanitize = require('sanitize')
const express = require("express")
const formData = require('form-data')
const Mailgun = require('mailgun.js')

const { getEmailTemplate } = require("./email")
const config = require("./config")

const app = express()

app.set("view engine", "pug")
app.set('views', path.join(__dirname, 'views/'))

app.use(
    minifyHTML({
        override: true,
        exception_url: false,
        htmlMinifier: {
            removeComments: true,
            collapseWhitespace: true,
            collapseBooleanAttributes: true,
            removeAttributeQuotes: true,
            removeEmptyAttributes: true,
            minifyJS: true
        }
    })
)
app.use(express.urlencoded({ extended: false }))
app.use(express.static("public"))
app.use(cookieParser())
app.use(sanitize.middleware)

app.post(
    "/api/contact",
    async (req, res) => {
        const data = {
            name: req.body.name || "",
            email: req.body.email || "",
            message: req.body.message || ""
        }
        let errorMsg = ""

        if (!data.name) {
            errorMsg = "Name string must be provided"
        } else if (data.name.length < 3) {
            errorMsg = "Name length must be greater than 2 characters"
        } else if (data.name.length > 50) {
            errorMsg = "Name length must be less than 51 characters"
        }

        if (!data.email) {
            errorMsg = "Email string must be provided"
        } else if (data.email.length < 3) {
            errorMsg = "Email length must be greater than 2 characters"
        } else if (data.email.length > 50) {
            errorMsg = "Email length must be less than 51 characters"
        } else if (
            true !== /^(([^<>()[\]\\.,:\s@"]+(\.[^<>()[\]\\.,:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(data.email)
        ) {
            errorMsg = "Email must be a valid format like johnsmith@example.com"
        }

        if (data.message) {
            if (typeof data.message !== "string") {
                errorMsg = "Message string must be provided"
            } else if (data.message.length > 1000) {
                errorMsg = "Message length must be less than 1001 characters"
            }
        }

        if (errorMsg.length) {
            res.status(400)
            return res.send({ error: errorMsg })
        }

        data.name = data.name
        data.email = data.email
        data.message = data.message || null

        if (data.message && data.message.length) {
            let formattedMsg = ''
            data.message
                .split('\n')
                .forEach(v => {
                    if (v.length) { 
                        formattedMsg += `<p>${v}</p>`
                    }
                })
            data.message = formattedMsg
        }

        const emailTemplate = getEmailTemplate(data, "contact")

        try {
            const mailgun = new Mailgun(formData)
            const mg = mailgun.client({
                username: 'api', 
                key: config.mailgunSecret,
            })
            await mg.messages.create(config.mailgunDomain, {
                from: config.mailFromName,
                to: [config.mailToAddress],
                subject: config.mailSubject,
                html: emailTemplate,
            })

            res.status(200)
            return res.send({ message: 'Success' })
        } catch (err) {
            log(err.message)
            res.status(500)
            return res.send({ error: "Unsuccessful" })
        }
    }
)
app.get(
    '/', 
    (req, res) => res.render(
        'pages/index', 
        Object.assign(
            { queryParams: req.query, }, 
            config,
        ),
    ),
)

if (config.nodeEnv === "production") {
    app.listen(config.appPort)
} else {
    app.listen(config.appPort, () => {
        const open = require('open')
        const url = `http://127.0.0.1:${config.appPort}`
        open(url)
        log(`Listening on ${url}`)
    })
}
