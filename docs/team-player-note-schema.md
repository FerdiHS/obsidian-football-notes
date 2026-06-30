# Team and Player Note Schema

This document defines the canonical MVP schema for team notes and player notes in Football Notes.

The goal is to keep generated notes predictable, Dataview-friendly, and easy to extend later without rewriting the basic note shape.

## Team note schema

### Frontmatter

Required fields:

```yaml
type: team
sport: football
team_name: Example FC
```

Optional fields:

- `country`
- `league`
- `aliases`
- `tags`

### Body structure

```markdown
# Team Name

## Overview

## Matches

## Players

## Notes
```

## Player note schema

### Frontmatter

Required fields:

```yaml
type: player
sport: football
player_name: Example Player
```

Optional fields:

- `team`
- `position`
- `country`
- `aliases`
- `tags`

### Body structure

```markdown
# Player Name

## Overview

## Teams

## Matches

## Notes
```

## Notes

- `aliases` is included for future matching work but advanced alias resolution is out of scope for this milestone.
- The plugin owns the initial skeleton it generates.
- User-authored content begins after note creation.
