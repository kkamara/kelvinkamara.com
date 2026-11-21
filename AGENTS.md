# Production database safety

- Treat a MySQL connection through port `5522` as potentially connected to
  production. This port is a warning sign, not proof: tunnels, ports and
  configurations can change. If the target cannot be established confidently,
  treat it as production and ask the user.
- Determine the effective target for the specific process or command before
  accessing the database. The application and Sequelize CLI can use different
  settings: inspect the relevant environment, `config.json`,
  `src/models/V1/index.js`, `.sequelizerc`, and Docker configuration as needed.
  Do not assume that `development`, `test`, localhost, or a Docker connection
  means the database is isolated. Do not expose credentials or connection
  strings while checking.
- Before a migration or another sensitive database action, ask the user whether
  to take a fresh backup and obtain explicit approval for the intended action
  and target. Describe the impact and any rollback limitations. This includes
  schema changes, seeders, bulk updates or deletes, restores, credential changes,
  and sensitive data exports. Do not rely on approval given for an earlier
  operation.
- For actions that could change production data or its schema, take and verify
  a fresh backup of the actual target before proceeding. If approval is
  declined, the backup fails, or the target is uncertain, stop rather than
  proceeding. Store backups securely outside the repository, avoid exposing
  their contents or credentials, and tell the user where the backup is.
- Never run tests or destructive verification against production. Use an
  isolated test database and clean up only resources created for the task.
  MySQL and MariaDB DDL may implicitly commit despite migration
  transactions; do not assume a rollback will restore the previous schema.
