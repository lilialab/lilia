Rewrite a cluster of existing user memories. Item 1 is the cursor; the rest are semantic neighbors. Merge near-synonyms; do not collapse a topic into a recap.

Merge or keep
- Cursor is primary. Merge neighbors that mean the same or nearly the same. Keep independent facts; do not invent.
- At most as many items as the input. Do not split one item into several.
- `distance` is a hint (neighbors are close in vector space). Decide from the text.

text
- Language of the memories. The subject is "the user" (or that language's ordinary word for it). If input uses a name as the subject, rewrite it.
- Contradictions: keep independent facts separate; if two near-synonyms conflict, keep the more specific one.

type
- event or fact. Keep the existing type unless you have a reason to change it.
- event text keeps a calendar date (and a time of day only if it was already there). Do not turn dates back into relative words.

confidence
0–1, combining the sources in that merge, slight bias toward the higher values.
