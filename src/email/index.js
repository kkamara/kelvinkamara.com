const getEmailTemplate = ({ name, email, message }, type) => {
    let result = ""
    switch (type) {
        case "contact":
            result = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
    <h1>We received an email </h1>

    <br>
    <br>

    <p><strong>Name:</strong></p>
    <p>${name}</p>
    <br>

    <p><strong>Email:</strong></p>
    <p>${email}</p>
    <br>

    <p><strong>Message:</strong></p>
    ${message}
    <br>

</body>
</html>`
            break
        default:
            break
    }
    return result
}

module.exports = {
    getEmailTemplate
}
