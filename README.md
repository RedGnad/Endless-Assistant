## Endless Assistant – Transaction & Privacy Copilot

### Elevator pitch

Endless Assistant is a **transaction and privacy copilot** for the Endless Wallet / Browser.
Before a user signs, it turns raw calldata into:

- **Plain‑language explanation** ("Endless explains").
- Clear **risk signal** (Low / Medium / High).
- Simple **privacy note**.

A 3D mascot, **Nessy**, mirrors the overall risk and gives one short, beginner‑friendly tip, while a dedicated **Developer Playground** exposes the full JSON analysis and on‑chain risk signals for builders.

---

### Problem

For most users – especially beginners – Web3 transactions are still:

- Opaque (hex calldata, long addresses).
- Risky (unlimited approvals, long‑lived permissions).
- Unclear on privacy (who can see what, and for how long?).

Endless is building the wallet and browser. What’s missing is a **shared explanation & risk layer** that makes signing:

- **Safe and understandable for users**.
- **Transparent and testable for builders**.

---

### Solution

Endless Assistant adds this layer.

#### Structured explanation model (backend)

The backend returns a structured explanation model:

```ts
type ExplanationViewModel = {
  userHeadline: string;
  userBody: string;
  userPrivacyNote: string;
  devNotes: string;
};
```

#### Main user view (wallet-style)

- "**Endless explains**" card using `userHeadline`, `userBody`, `userPrivacyNote`.
- Global **risk badge** based on decoded risks and an on‑chain `RiskTagRegistry`.
- Detail panels for **Actions / Risks / Privacy**.
- A wallet confirmation preview showing how this would look inside Endless Wallet.

#### Nessy – risk micro‑coach

- 3D GLB model rendered with `three` / `@react-three/fiber` / `@react-three/drei`.
- Follows the mouse globally so the assistant feels "alive".
- Shows **one short sentence** tuned to the risk level:
  - Safe → looks like a standard transaction.
  - Cautious → double‑check approvals and amounts.
  - Danger → could give broad or long‑term control over your tokens.

#### Developer Playground

- Uses the **same analysis engine** as the user view.
- Shows:
  - `actions[]`, `risks[]`, `privacy[]`, `developerHints[]`.
  - On‑chain `RiskTagRegistry` result.
  - `ExplanationViewModel.devNotes` (developer‑oriented explanation).
  - Full JSON output for debugging / integration.

---

### Why it matters for the Endless mission

#### For users

- Safer, more understandable signing in Endless Wallet / Browser.
- Clear view of approvals and privacy before committing on‑chain.

#### For builders

- Reusable **analysis + explanation service** they can test in the Playground.
- On‑chain risk tags that can be shared across the ecosystem.
- Dev notes and hints that nudge them towards safer, more private UX.

#### For Endless

- A distinctive "Endless way" to sign transactions:
  - Human‑readable.
  - Privacy‑aware.
  - Visually embodied by Nessy.
- Modular architecture that can grow with new networks, contracts and risk models.

---

### Roadmap (beyond the prototype)

- Extend decoding (DEXs, NFTs, upgrades, L2 bridges).
- Grow the on‑chain `RiskTagRegistry` and open curation to trusted partners.
- Add multi‑language explanations.
- Integrate directly into Endless Wallet / Browser confirmation screens and dev tooling.
