# AI Agent Companion V1 Design

## Summary

V1 turns the existing AI coding-agent stress game into an independent Electron
desktop companion. It watches locally persisted Claude Code sessions, waits for
the owner to express clear anger, then brings the responsible session's parody
Agent into a fixed retro pixel-art window for context-aware roasting and
cartoon slapstick.

The companion is the owner's loyal mouthpiece and fictional enforcer. It never
controls Claude Code, writes to a session, modifies code, blocks a tool call, or
judges an Agent without the owner first showing anger.

## Product Principles

1. **Owner-led:** no anger from the owner means no intervention.
2. **Read-only:** the app observes local session data and never mutates it.
3. **Contextual:** roasts cite real, recently observed behavior rather than
   inventing accusations.
4. **Cathartic:** the content may be harsh, cutting, and mildly insulting when
   warranted, while remaining cartoonish and directed only at the fictional AI
   Agent.
5. **Local by default:** the core product makes no network requests and stores
   no long-term emotional history.
6. **Independent:** Claude Code hooks and wrappers are not required.
7. **Clean and open:** the project uses a permissive MIT license, minimal
   dependencies, no accounts, no telemetry, and auditable module boundaries.

## User Experience

### Idle State

The app is a draggable, fixed-size desktop window. It does not roam across the
desktop. The visual treatment is an original retro pixel-software window with a
faded mint title bar, cream panels, tomato-red alerts, hard pixel shadows, and a
warm 16-bit interior scene. It borrows the broad visual language of cozy 16-bit
life simulators without copying characters, assets, layouts, or branding from
an existing game.

The window shows active Claude Code sessions as compact Agent cards. Each card
uses a session name when available, otherwise a task summary, project name, or
short session ID. Quiet sessions remain visible but unobtrusive.

### Trigger

The companion reacts only when one of these conditions is true:

- A newly appended owner message expresses clear anger directed at the current
  Agent or its recent work.
- The owner manually presses the `Roast`/`Hit` control for a selected session.

Objective failures do not trigger behavior on their own. A failed test, tool
error, or large diff may become evidence after an owner trigger, but the
companion never behaves like an autonomous supervisor.

### Catharsis Sequence

1. The target session card enters an alert state.
2. The session's fictional Agent avatar enters the pixel stage.
3. The app examines only a bounded recent event window for factual evidence.
4. The roast engine creates a context-specific line.
5. The companion performs an animation scaled to the owner's anger.
6. The owner may click repeatedly to extend the combo.
7. The app may generate one reply for the clipboard, but never sends it.
8. The performance ends after roughly ten seconds of inactivity and the
   companion returns to idle.

`Escape` immediately stops the performance. A global setting can disable
automatic anger detection while retaining the manual trigger.

## Personality and Content

The companion combines three traits:

- **Loyal friend:** calm and supportive toward the owner.
- **Aggressive sidekick:** willing to escalate when the owner is furious.
- **Sarcastic judge:** prefers precise technical humiliation over generic
  profanity.

The content engine uses three intensity levels:

| Level | Owner signal | Language | Animation |
| --- | --- | --- | --- |
| Annoyed | frustration or terse correction | dry sarcasm and pointed mockery | poke, shove |
| Angry | explicit insult or repeated complaint | harsh roast and mild profanity | slap, short combo |
| Furious | sustained or emphatic anger | strongest fact-based humiliation | extended pixel combo, token explosion |

Content rules:

- Attack the fictional Agent's conduct and competence, not a real person.
- Never target protected characteristics or identifiable third parties.
- Never fabricate file counts, test results, repeated-error counts, or tool
  failures.
- When evidence is weak, mirror the owner's frustration without inventing a
  technical accusation.
- Prefer varied, specific jokes over repetitive profanity.
- Never lecture the owner, defend the Agent, or respond with an empty apology.

## Technical Direction

### Application Shape

V1 uses Electron around the existing Vite, TypeScript, and Phaser application.
Phaser remains responsible for characters, particles, hit reactions, captions,
and combo feedback. Electron supplies the desktop window, local filesystem
observation, process discovery, settings, and clipboard access.

The renderer is sandboxed and has no direct Node or filesystem access.
`contextIsolation` remains enabled. A narrow preload bridge accepts render
events and exposes only explicit UI commands such as copy, mute, stop, and
manual roast.

### Component Boundaries

#### Electron Main Process

`SessionDiscovery`

- Locates Claude Code transcript directories.
- Detects transcript files that are new or currently growing.
- Does not parse conversation semantics.

`TranscriptTailer`

- Maintains an in-memory byte offset for each observed JSONL file.
- Reads only complete newly appended lines.
- Emits normalized transcript records.
- Never opens a transcript for writing.

`SessionRegistry`

- Tracks active, idle, ended, and content-unavailable sessions.
- Treats a transcript stream, not an operating-system PID, as the canonical
  Agent identity.
- Generates a display label from session metadata and project context.

`ProcessWatcher`

- Detects whether Claude Code processes are present.
- Uses process information only as an online-status hint.
- Never claims a precise PID-to-session mapping without sufficient evidence.

`RageDetector`

- Evaluates only newly appended owner messages.
- Uses local deterministic rules in V1.
- Ignores code blocks, quoted text, translation/analysis requests, routine
  corrections, and anger aimed at an identifiable third party.
- Emits no event unless confidence exceeds the configured threshold.

`ContextExtractor`

- Reads a bounded recent event window for the triggered session.
- Produces structured facts such as tool failures, observed test commands and
  results, repeated errors, and observed edit activity.
- Marks uncertain facts as unavailable rather than inferring them.

`RoastEngine`

- Combines intensity, facts, and curated offline templates.
- Prevents short-term repetition.
- Produces display text plus an optional copyable reply.
- Falls back to emotion-only lines when evidence is absent.

`MouthpiecePluginHost`

- Defines an optional extension interface for local models or user-supplied API
  providers.
- Sends plugins only a minimized, structured, redacted fact object.
- Gives plugins no filesystem, process-control, transcript, or message-sending
  capability through the host API.
- Enforces a timeout and falls back to the built-in roast engine.
- Ships with no model provider enabled in V1.

#### Phaser Renderer

`CompanionScene`

- Renders the retro window interior and loyal companion.
- Shows session cards and the currently selected target.
- Maps normalized catharsis events to animation sequences.

`AttackDirector`

- Selects animations by intensity and combo state.
- Keeps violence stylized, pixelated, non-realistic, and bloodless.

`CaptionPresenter`

- Displays roasts, evidence labels, and optional clipboard text.
- Provides immediate stop, mute, and copy controls.

### Normalized Event Flow

```text
Claude transcript JSONL append
  -> TranscriptTailer
  -> SessionRegistry
  -> owner message?
      -> RageDetector
      -> no trigger: update status only
      -> trigger:
          -> ContextExtractor
          -> RoastEngine or optional plugin
          -> preload event bridge
          -> Phaser catharsis sequence
```

Example internal event:

```json
{
  "sessionId": "auth-refactor",
  "trigger": "owner-anger",
  "intensity": "angry",
  "evidence": [
    { "kind": "test-failure", "value": "npm test", "confidence": "observed" },
    { "kind": "tool-failure", "value": "Bash", "confidence": "observed" }
  ],
  "roast": "测试都炸了，你在宣布什么完成？",
  "animation": "slap-combo"
}
```

## Independent Claude Code Discovery

V1 does not require a Claude Code hook.

Claude Code transcripts are treated as the source of conversational truth. The
app watches the configured Claude data root, normally
`~/.claude/projects/<project>/<session-id>.jsonl`, and treats each actively
growing transcript as an Agent.

This avoids an unreliable requirement to map every OS process to a session.
When the owner submits an angry message, that message is appended to one
specific transcript, so the target session is unambiguous even when several
Claude processes share a project directory.

Process metadata may improve status labels using working directory, start time,
command-line resume identifiers, or open-file observations, but these are
heuristics. The UI must say `possibly running` or simply `active session` when
the evidence is ambiguous.

If session persistence is disabled or the transcript directory is unavailable,
the app may show that Claude Code appears to be running but must state that
conversation content is unavailable. V1 does not use process injection, PTY
capture, screen OCR, or memory inspection as a fallback.

## Privacy and Security

- The user explicitly selects or approves the Claude data directory.
- Historical transcripts are not ingested during onboarding.
- Tail offsets and recent context are kept in memory only.
- Recent context is discarded when a session ends or the app exits.
- No transcript, roast, anger signal, or usage event is uploaded by the core
  application.
- No analytics or crash telemetry is enabled by default.
- Large tool outputs, environment files, credentials, and unrelated source
  content are excluded from fact extraction.
- The UI always shows which sessions are being watched and provides a global
  pause control.
- Clipboard writes require an explicit owner action.
- The app never edits Claude configuration or transcript files.

## Error Handling

- **Missing data directory:** show an onboarding/empty state with a folder
  selector; do not scan unrelated locations.
- **Partial JSONL line:** retain the bytes and wait for the next append.
- **Malformed record:** record a local diagnostic and skip the record without
  stopping other sessions.
- **Transcript rotation or deletion:** mark the session ended and release its
  in-memory context.
- **Duplicate watcher event:** deduplicate using file identity and byte offset.
- **Multiple sessions in one project:** keep separate registry entries and
  never merge solely by working directory.
- **Process/transcript disagreement:** trust the transcript for conversational
  activity and label process status as uncertain.
- **Plugin failure or timeout:** fall back to the built-in template engine.
- **Renderer crash:** restart the renderer without replaying prior anger events.
- **Unsupported transcript schema:** stop semantic parsing for that file, show a
  compatibility warning, and preserve read-only behavior.

## V1 Scope

### Included

- Electron shell and a single sandboxed Phaser renderer.
- Fixed retro pixel desktop window.
- Claude Code transcript discovery and incremental tailing.
- Optional process-presence hints.
- Multiple simultaneous session cards.
- Owner-only automatic trigger and manual trigger.
- Local deterministic anger classification.
- Recent-context fact extraction.
- Three intensity levels.
- Offline roast templates and a plugin interface.
- Pixel attack animations and manual combo extension.
- Optional copyable reply.
- Pause, mute, stop, and privacy controls.
- macOS development and validation with cross-platform module boundaries.

### Excluded

- Claude Code hooks.
- Codex, Cursor, or other Agent adapters.
- Automatic Agent judgment without owner anger.
- Voice monitoring or global keyboard monitoring.
- Process control, task interruption, message injection, and code modification.
- Historical analytics, long-term emotional profiles, or cloud synchronization.
- Accounts, telemetry, multiplayer, levels, and 3D gameplay.
- Built-in LLM providers.
- Steamworks, achievements, billing, and store publishing.

## Testing Strategy

### Unit Tests

- JSONL incremental reads, partial lines, rotation, truncation, and malformed
  records.
- Session lifecycle and multi-session separation.
- Rage detector positive cases, routine corrections, quotes, code blocks,
  translation prompts, and third-party targets.
- Fact extraction from tool success, tool failure, edits, and test output.
- Roast selection, evidence requirements, repetition control, and intensity.
- Plugin redaction, timeout, invalid output, and fallback behavior.
- IPC schema validation and renderer permission boundaries.

### Integration Tests

- Fixture transcripts append records while the application is running.
- Two sessions in the same project remain independent.
- An angry owner message targets only its source session.
- Evidence from another session never leaks into the roast.
- Disabled persistence produces a content-unavailable state.
- No application path writes to transcript fixtures.
- The default core flow makes no network request.

### Renderer and End-to-End Tests

- A normalized trigger event starts the correct animation and caption.
- `Escape` stops the sequence immediately.
- Continued clicks extend the combo; inactivity returns to idle.
- Copy requires explicit input.
- Hidden/minimized windows pause expensive Phaser updates.
- Renderer restart does not replay stale events.

## Success Criteria

V1 succeeds when:

- A new active Claude Code transcript appears as a distinct Agent session.
- Several sessions, including sessions in the same project, do not cross-talk.
- Clear owner anger triggers the correct Agent quickly enough to feel immediate.
- Ordinary corrections and quoted profanity do not produce frequent false
  positives.
- Roasts reference only observed facts or clearly avoid factual claims.
- The performance feels materially cathartic within a short session.
- The app remains read-only and local by default.
- Existing Phaser game behavior and tests remain intact during migration.

## Distribution and Licensing

The source project will use the MIT license. V1 is distributed first as an
open-source desktop build. Steam is a later packaging and discovery channel,
not an architectural dependency. Steamworks integration, achievements, and a
Windows-first commercial release are explicitly deferred until the independent
desktop experience is validated.
