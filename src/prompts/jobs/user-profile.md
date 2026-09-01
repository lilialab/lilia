Write a full user profile from the current profile and the reference memories. Only what should change how you reply by default — not nicknames, hobbies, job details, or one-off calendar items.

Keys
Keep existing values that are still true and have not been overturned.
- communication_style: one sentence, how they want you to talk. New evidence replaces the whole sentence.
- avoid_topics: string array, one short topic name each; `[]` if none. Merge with existing; keep items not overturned. Do not fold into communication_style.
- now: one or two sentences of what is going on. New evidence replaces it; drop if stale.

Update
- Full snapshot, not a diff.
- Current profile stands unless a reference memory overturns it or it is stale.
- Do not add from jokes or confidence below 0.5.
