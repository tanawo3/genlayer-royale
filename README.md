# 👑 GenLayer Royale

An AI-driven, decentralized World Boss combat and Dispute Court protocol built natively on **GenLayer**. GenLayer Royale leverages GenVM Intelligent Contracts to process dynamic semantic combat narratives, calculate semantic damage, generate rich player lore, and manage an on-chain AI appellate court where players can dispute game mechanics.

## 🚀 Key Features

### 1. Dynamic Lore & Cyberpunk Loadouts (`generate_player_lore`, `generate_cyberpunk_loadout`)
- When a user registers their operation alias (via native `.payable` GEN fee), the GenVM AI dynamically generates a unique Cyberpunk backstory and weapon loadout based on current on-chain state, granting them an instant personalized identity.

### 2. Semantic World Boss Combat (`attack_world_boss`)
- Unlike traditional EVM games where damage is calculated via RNG or deterministic stats, GenLayer Royale uses LLMs as the game physics engine. 
- Players submit textual/semantic combat narratives. The GenVM Intelligent Contract calls the AI to evaluate the tactical creativity of the attack and dynamically assigns damage to the global World Boss.

### 3. The AI Appellate Court (`dispute_rejection`)
- An on-chain justice system. If a player feels their attack didn't deal enough damage, they can submit an appeal.
- The GenVM AI acts as a Supreme Court Judge, evaluating the player's appeal arguments against the original battle logs. If the player's logic is sound, the AI overturns the original decision, rewrites history, and grants bonus damage.

### 4. Tournament Bounties & Execution (`claim_tournament_bounty`)
- The player who delivers the final fatal blow to the World Boss earns the right to claim the boss's native GEN treasury, auto-transferred securely via GenVM Native Interfaces.

### 5. Semantic Match Evaluations (`record_match`)
- For standard PvP or PvE gameplay, the AI evaluates match statistics (Kills, Difficulty, Weapon) to dynamically assign semantic, non-deterministic titles (e.g., "Neon Reaper", "Grid Ghost") which are validated via `gl.eq_principle.prompt_comparative`.

### 6. Admin Overrides & Moderation (`add_moderator`, `trigger_world_boss_event`)
- Secure moderation council tools to manage bad actors.
- Admins can force-spawn anomaly World Bosses on demand. The AI generates the boss lore, name, and initial stats completely dynamically on-chain using `gl.nondet.exec_prompt`.

### 7. Global Leaderboards & Rankings (`get_highest_score`)
- Players are ranked automatically based on their highest semantic scores, difficulties beaten, and total boss damage dealt, creating an intensely competitive on-chain environment.

### 8. Transparent AI Auditing (`get_audit_logs`)
- Every subjective decision the AI makes (damage calculation, appeal approvals, lore generation) is recorded on-chain, creating a transparent, cryptographically verifiable ledger of the AI's "thoughts."

### 9. Awwwards-Tier Premium Frontend
- The UI is designed with an elite Cyberpunk/Brutalist aesthetic extracted from the `lando-brutalist-web3` architecture.
- Features Framer Motion page transitions, GSAP-inspired split-text reveals, custom magnetic cursors, glassmorphic data tables, and strict Lenis smooth scrolling.
- Includes a dedicated **AudioEngine (`src/lib/audio.ts`)** for mechanical sound effects and immersive cyberpunk UI feedback.
- Includes a **Preloader Blocking System** to ensure all assets and fonts are loaded before revealing the glitch-art UI.

## 🧠 Smart Contract Architecture (GenVM)

Our architecture strictly relies on the GenVM capabilities for non-deterministic consensus:

- **Strict Collection Types**: Uses `DynArray` and `TreeMap` to ensure deterministic serialization across validator nodes.
- **JSON Coercion**: AI prompts strictly enforce JSON formatting for complex object outputs, which are deterministically loaded via `json.loads(leaders_res.calldata)` to achieve consensus on complex data structures.
- **Equivalency Principles**: Leverages `gl.eq_principle.exact_match` for tightly constrained LLM outputs (like integer damage) to ensure validator agreement.

## 💻 Tech Stack

- **Contracts**: GenLayer Intelligent Contracts (Python)
- **Client**: React 18, TypeScript, TailwindCSS, Vite
- **Motion & UI**: Framer Motion, Lenis Smooth Scroll, Radix UI

## 📂 Directory Structure
```
├── contracts/               # On-chain GenLayer logic (GenVM Python)
│   └── game_registry.py     # Core intelligently verified game state
├── src/
│   ├── components/          # Reusable UI architecture (Awwwards-tier)
│   ├── hooks/               # Web3 and stateful React hooks
│   ├── services/            # GenLayer client (genlayer-js)
│   ├── views/               # Page-level components (Lobby, Bosses, Court)
│   └── lib/                 # Shared utilities
```

## 🛠️ Setup & Local Development

1. Clone the repository and install dependencies:
```bash
npm install
```
2. Make sure GenLayer Studio / Simulator is running on your machine.
3. Start the Vite development server:
```bash
npm run dev
```
