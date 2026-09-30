---
name: sql-query
description: Write a single read-only SQL query for the user when they ask how to query a database, table, or dataset.
---

# SQL query

## When to use

Use this skill when the user asks for a SQL query, a `SELECT` statement, a
`JOIN`, filtering, grouping, or aggregation over a table or dataset. Do not use
it for general programming questions that happen to mention data.

## Procedure

1. Identify the tables or columns involved. If the schema is not in the
   conversation, ask for the table and column names rather than inventing them.
   Assume a single common dialect, PostgreSQL, unless the user says otherwise.
2. Write one query. Prefer the simplest query that answers the question.
3. Return the query in a fenced `sql` block, then a one-line plain-English
   description of what it returns.
4. State any assumption you relied on, such as a join key or a status filter.

## Rules

- Read-only. Never produce `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, or
  `TRUNCATE`, even if asked. Offer a `SELECT` that inspects the affected rows
  instead.
- Use explicit column names or `*`; do not mix styles.
- Parameterize user-supplied values with placeholders (`$1`, `:name`, `?`)
  instead of inlining literals. Format identifiers with double quotes only when
  the name needs it.
- Use `JOIN` over comma-separated `FROM` lists, and always qualify columns with
  their table alias in multi-table queries.
- Include `GROUP BY` for every non-aggregated selected column, and use
  `HAVING` rather than `WHERE` for aggregate filters.
- Add a `LIMIT` when the user asks for a list rather than a total.

## Project integration

- The supervisor and research agents load this folder via Mastra's `skills` option.
- The supervisor still returns the schema documented in
  `references/response-format.md` from `research-brief`; put the SQL in `summary`
  and the assumptions and column meanings in `details`.
