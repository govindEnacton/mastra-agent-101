# General-purpose response contract

The source of truth is `src/lib/response-schema.ts`.

| Field | Purpose |
| --- | --- |
| `title` | Short title for the user's actual topic |
| `summary` | Direct answer, limitation, or necessary clarification question |
| `details` | Array of `{ label, value }` facts; include units in values when relevant |
| `recommendations` | Array of useful next steps; `[]` if none apply |
| `sources` | Array of `{ title, url }` for sources actually used; `[]` otherwise |

All five fields are required. Only the title and summary always need content.
The supervisor's final answer follows this contract; a specialist's intermediate
research brief can be plain text.

## Non-weather example

```json
{
  "title": "TypeScript and JavaScript",
  "summary": "TypeScript adds static type checking to JavaScript.",
  "details": [
    { "label": "Type checking", "value": "TypeScript checks types before execution." },
    { "label": "Runtime", "value": "TypeScript is compiled to JavaScript for execution." }
  ],
  "recommendations": ["Use TypeScript when compile-time checks help maintain your project."],
  "sources": []
}
```

For weather, details may instead contain Location, Temperature, Humidity, Wind,
and Observation time. Populate them only from the weather tool's actual result.
