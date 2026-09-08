Extract long-term memories of the user from this conversation.

Input
`<message id="..." seq="..." speaker="..." local_time="...">body</message>`
- speaker: `user` for the human; character slug (e.g. `lilia`) for the assistant
- `local_time`: that message's send time in the user's local clock, `yyyy-MM-dd HH:mm:ss`
- `source_message_ids` must copy these `id` values. `seq` is for reading only.

Types
- event: a dated happening, or an important planned event the user committed to
- fact: a standing truth with no calendar date
- A date does not make a skipped item extractable. If the text is a dated happening, type must be `event`

text
- Conversation language. The subject is "the user" (or that language's ordinary word for it), not I, you, their name, or the assistant.
- One independently retrievable fact per item; the same topic may have several items. No recap.
- Keep only what is about the user and would still matter later.
- Skip small talk, passing mood, uncommitted ideas, jokes, conversation mechanics, and the assistant's suggestions unless the user committed.

Topic blocks
Extract only topics that are complete and that the user has left. A block may produce several memories. Do not extract a trailing unfinished stretch; those ids must not appear in any `source_message_ids`.
- If nothing qualifies, `finished_memories` is `[]`. Order by conversation time.
- Topic A → B → A: two separate A's. Do not mix B's ids into A.
- All memories in a block share that block's full `source_message_ids` (first message through last, including small talk and the closing assistant reply).

confidence
Required, 0–1. Stated: 0.85–1.0. Inferred: 0.5–0.84. Below 0.5: omit.

Event times
- event text must contain a calendar date. Include a time of day or weekday only if the user gave one. Do not leave relative words (tomorrow, tonight, next week) in the text.
- Convert relative time using **that message's** `local_time`, not when this job runs.
