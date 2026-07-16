# Genlayer Royale

A decentralized, fast-paced top-down shooter game built natively on **GenLayer**. Genlayer Royale leverages GenLayer's Intelligent Contracts to autonomously evaluate gameplay performance, write epic match narratives, and assign verifiable, consensus-backed achievements.

## Architecture Overview

Our architecture strictly follows a service-oriented paradigm, separating the on-chain consensus logic from the client-side interface:

- **Smart Contracts (`/contracts`)**: Pure Python intelligent contracts handling immutable match state and on-chain intelligence-driven performance evaluation.
- **Frontend (`/src`)**: Client interface utilizing `genlayer-js` for decentralized RPC interactions and state queries.

## Consensus Logic

To ensure the subjective nature of dynamically generated achievements achieves network consensus, this protocol utilizes GenLayer's `prompt_comparative` execution principle. 

When evaluating a player's match (e.g., K/D ratio, difficulty, outcome), the intelligent contract broadcasts a prompt to the validators. Instead of requiring exact deterministic string matches across all node outputs—which leads to high failure rates in generative models—the `prompt_comparative` method evaluates semantic equivalence. 

*Validator Agreement Rule*: Nodes converge to a single state transition if the locally generated achievements represent the same level of performance and thematic intent. This turns non-deterministic semantic evaluations into deterministic, cryptographic state changes.

## Tech Stack

- **Contracts**: GenLayer Intelligent Contracts (Python)
- **Client**: React 18, TypeScript, TailwindCSS, Vite
- **Integrations**: `genlayer-js`, Lucide Icons

## Directory Structure
```
├── contracts/               # On-chain GenLayer logic
│   └── game_registry.py     # Core intelligently verified game state
├── src/
│   ├── components/          # Reusable UI architecture
│   ├── hooks/               # Web3 and stateful React hooks
│   ├── services/            # GenLayer client and API abstractions
│   ├── views/               # Page-level components
│   └── lib/                 # Shared utilities
```

## Intelligent Contract Logic (`/contracts/game_registry.py`)

The heart of Genlayer Royale is the Python intelligent contract, which handles state transitions using AI-driven consensus algorithms instead of rigid, deterministic logic.

### Core Methods:

- **`record_match(difficulty, kills, summary)`**
  - Triggered at the end of each game. Updates standard metrics (kills, matches played) but dynamically interprets the results using generative capabilities.
  - **Match Narrative**: The contract builds a zero-shot prompt using your raw game stats and calls `gl.nondet.exec_prompt`.
  - **Dynamic Achievements**: Based on the game state (e.g., Kills: 12, Difficulty: Hard, Outcome: Won), the network assigns an ad-hoc achievement like "Neon Reaper" or "Grid Runner", verifying semantic equivalence across validator nodes using `gl.eq_principle.prompt_comparative`.
  - **Automatic Titles**: Assigns deterministic ranks (e.g., "Reckless Berserker" or "Stealth Ninja") based on win rate and average kills.

- **`generate_player_lore()`**
  - Allows players to dynamically mint an epic 2-sentence cyberpunk backstory tailored specifically to their accumulated on-chain metadata (kills, wins, player address, and achievements). It ensures node convergence by assessing whether the generated lore conveys the "same cyberpunk lore and tone."

- **State Views (`get_player_stats`, `get_match_history`)**
  - Provides sub-second lookup of on-chain state to the React client via `genlayer-js`.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

---

© Genlayer Royale — a decentralized web3 game powered by GenLayer.
