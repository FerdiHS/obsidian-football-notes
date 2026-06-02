# Match note schema

This document defines the canonical MVP schema for generated football match notes.

The goal is to keep match notes predictable, Dataview-friendly, and safe to extend in later issues without rewriting the basic note shape.

## Frontmatter

### Required fields

```yaml
type: match-note
sport: football
source_url: 'https://example.com/match/123'
```

### Reserved fields for later issues

These fields are part of the planned schema, but they are not required or emitted by the current MVP template yet:

- `source_host`
- `competition`
- `match_date`
- `home_team`
- `away_team`
- `tags`

## Body structure

Generated match notes should use this exact section order:

```markdown
# Match

## Snapshot

## Lineups

## Match stats

## Timeline

## My observations

## Tactical notes
```

The current MVP template should create section headings only. It should not add starter prose or machine-generated filler text inside the sections.

## Ownership

- The plugin owns the initial skeleton it generates.
- User-authored content begins after note creation.
- Later refresh or update logic must preserve user-written content in these sections.

## Naming

- Placeholder note title for the current MVP template: `New match note`
- File naming rules are intentionally deferred to the later file-creation issue.
