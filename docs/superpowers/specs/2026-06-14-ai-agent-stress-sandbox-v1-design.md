# AI Agent Stress Sandbox V1 Design

## Summary

V1 is a lightweight viral web game for AI coding users who are angry, tired, and overstimulated by coding agents that move fast, make mistakes, apologize politely, and repeat similar mistakes.

The product is not an IDE tool, not a serious productivity app, and not a complex game. It is a 30-second stress-relief toy: open the page, immediately hit a parody AI coding agent doll, watch it apologize in an overly polite way, and see its mistakes spill out as visual jokes.

## User

The primary user is a developer who uses AI coding tools heavily. They may use tools similar to Claude, Codex, Gemini, Cursor agents, or other coding agents, but the product must avoid direct brand names, logos, UI copies, and official character references.

The user’s real frustration:

- They pay for subscriptions or token usage.
- The agent writes code quickly but also breaks things quickly.
- The agent often misses context, skips tests, invents APIs, changes too much, or deletes user code.
- When corrected, the agent apologizes politely and says the right thing.
- The same kind of mistake still happens again.
- The user expected leverage, but becomes the agent’s supervisor.

## Product Shape

V1 is an instant-play web game.

The user opens a URL and immediately sees a single AI coding agent doll in the center of the screen. There is no login, no onboarding, no explanation page, and no required input before play.

The first interaction should be obvious: hit the doll.

The doll is not a realistic person. It is a cartoon AI toy with a humanoid body, a screen-like face, a loading ring, and coding-agent visual hints such as context meters, token strips, or tiny code labels.

## Visual Direction

The confirmed visual direction is arcade cartoon slapstick.

The style should use:

- Thick black outlines
- High-contrast shapes
- Sticker-like floating labels
- Big comic impact words such as `BONK`, `SMASH`, or `NO TESTS`
- Bright, readable colors
- Exaggerated squash, stretch, shake, and rebound

The visual language should feel playful, absurd, and safe. It should satisfy the desire to “hit someone” without becoming realistic violence. No blood, gore, injury detail, or realistic suffering.

## Scene

V1 uses a clean sandbox stage, not a complex IDE background.

The background can include small coding hints, but the character and hit feedback must dominate the screen. The game should be readable in a short screen recording without needing explanatory text.

The stage should support:

- A central doll
- Floating apology captions
- Impact words
- Falling mistake labels
- Token or bug particles
- Screen shake
- Combo or rage indicators if useful

## Core Loop

The V1 loop is:

1. User opens the page.
2. User immediately hits, clicks, taps, or drags the agent doll.
3. The doll reacts physically.
4. The game randomly emits an apology caption.
5. The game randomly emits a mistake or contradiction label.
6. The visual feedback makes the apology look hollow.
7. The user keeps hitting because the next result may be different.

The core should feel responsive within the first second.

## Interaction Requirements

V1 should support:

- Click or tap to hit the doll.
- Repeated hits to trigger stronger reactions.
- Optional drag or fling behavior if it can be implemented without making V1 heavy.
- Randomized hit direction, recoil, expression, and labels.
- Immediate visual feedback for every hit.

V1 should not require:

- Typing a complaint before playing.
- Picking a category before playing.
- Reading tutorial text.
- Choosing a character.
- Creating an account.

## Random Event System

The game must not rely on one fixed hit animation.

Each hit should combine random pieces from several pools:

- Hit reaction: bounce, squash, spin, slide, wobble, or recoil
- Expression: dazed, spinner eyes, blank confidence, fake smile, panic
- Apology caption
- Mistake label
- Contradiction feedback
- Particle type
- Impact word
- Screen shake intensity
- Rare event

Example event:

1. Player hits the doll.
2. Doll flies left and spins.
3. Caption appears: “你说得对，我刚才确实没有充分理解你的意图。”
4. A large `0 tests run` label drops from above.
5. Token particles scatter.
6. Screen shakes.

Another event:

1. Player hits the doll.
2. Doll squashes flat and rebounds.
3. Caption appears: “我会严格控制修改范围。”
4. A `+2400 lines` label bursts out.
5. A small `package-lock changed` sticker slides across the floor.

## Content Pools

Apology captions should sound polite, over-careful, and slightly infuriating:

- “你说得对，我刚才确实没有充分理解你的意图。”
- “抱歉，这里是我没有完整读取上下文导致的。”
- “我重新检查了一遍，这次会更严谨。”
- “确实，我刚才的修改范围有点超出预期。”
- “你提醒得很及时，我会避免再次出现类似问题。”
- “我已经修复了这个问题。”
- “这是我的疏忽，我应该先确认边界再动手。”
- “我理解你的愤怒，这次我会更仔细地处理。”

Mistake labels should be short, legible, and developer-specific:

- `0 tests run`
- `fake API`
- `ignored context`
- `same mistake again`
- `+2400 lines`
- `deleted user code`
- `broke imports`
- `scope creep`
- `package-lock changed`
- `sorry.md`

The strongest joke pattern is “sincere apology plus immediate contradiction.”

## Shareability

The game should be designed for screen recording.

The target behavior is:

> Open in 10 seconds, hit for 30 seconds, record a clip, share because the moment is self-explanatory.

V1 should produce a visually funny moment every few seconds. The video should remain understandable even without sound.

Good shareable moments:

- The doll apologizes while flying through the air.
- A huge `0 tests run` label crushes the scene.
- The doll says it fixed the issue, then `same mistake again` explodes.
- The screen fills with token particles.
- The doll becomes more polite as the hits get stronger.

## V1 Scope

V1 must include:

- One main AI coding agent doll.
- Instant hit interaction.
- Arcade cartoon visual style.
- Random apology captions.
- Random mistake labels.
- Hit reactions, screen shake, and particles.
- At least several distinct shareable event combinations.

V1 may include if lightweight:

- Basic combo count.
- Basic rage meter.
- Drag or fling.
- A short “rage report” after a session.

V1 must not include:

- Login or accounts.
- Real brand parody characters.
- Complex levels.
- Realistic violence.
- Required complaint input.
- Complex IDE simulation.
- Long-term progression.
- Multiplayer.

## Success Criteria

V1 succeeds if:

- A frustrated AI coding user understands the joke immediately.
- The first hit feels responsive and emotionally satisfying.
- The doll reads as an AI coding agent without using real brands.
- The apology captions feel familiar and annoying in the right way.
- The contradiction labels make users laugh or feel seen.
- A 30-second recording contains at least one shareable moment.

## Risks

The main product risks are:

- Too abstract: if the character does not feel like a coding agent, the joke becomes generic.
- Too realistic: if the character feels like a real person, the violence becomes uncomfortable.
- Too much UI: if the stage becomes an IDE dashboard, the direct stress-relief feeling weakens.
- Too repetitive: if hit results are fixed, users will not keep playing or recording.
- Too brand-specific: direct references to real AI products could create legal and platform risk.

## Open Product Questions

These should be answered later, not before V1 design approval:

- Should V1 include sound effects?
- Should drag and fling be included in the first build or added after click hits feel good?
- Should the first version include a rage report or only live play?
- Should the game include a share button, or rely on native screen recording first?

