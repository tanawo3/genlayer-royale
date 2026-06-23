# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
from dataclasses import dataclass
from datetime import datetime, timezone
import typing

@allow_storage
@dataclass
class MatchRecord:
    player: Address
    difficulty: str
    kills: u32
    won: bool
    timestamp: str
    narrative: str

@allow_storage
@dataclass
class PlayerStats:
    total_kills: u32
    total_wins: u32
    matches_played: u32
    title: str
    lore: str
    achievements: str

class GameLeaderboard(gl.Contract):
    match_history: DynArray[MatchRecord]
    highest_scores: TreeMap[str, u32]
    highest_scorers: TreeMap[str, Address]
    player_profiles: TreeMap[Address, PlayerStats]

    def __init__(self):
        pass

    @gl.public.write
    def record_match(self, difficulty: str, kills: int, summary: str) -> None:
        if difficulty not in ["Easy", "Medium", "Hard"]:
            raise gl.vm.UserError("Invalid difficulty")
            
        player = gl.message.sender_address
        ts = datetime.now(timezone.utc).isoformat()
        
        won = "won the match" in summary
        
        prompt = f"""Write a short, epic 2-sentence combat narrative for a single player in a cyberpunk hacker battle. 
Match Outcome: {"VICTORY" if won else "DEFEAT"}
Kills: {kills}
Difficulty: {difficulty}
Player's Match Log: "{summary}"
Output raw text only. No quotes or JSON."""

        def eval_gen():
            res = gl.nondet.exec_prompt(prompt)
            return str(res)

        try:
            # Consensus verification: Ensures narrative symmetry between nodes
            res = gl.eq_principle.prompt_comparative(
                eval_gen,
                "Equivalent if they convey the same narrative battle outcome and tone."
            )
            narrative = res.get() if hasattr(res, "get") else res
            narrative_str = str(narrative).strip()
        except Exception:
            narrative_str = "The archives lack clarity on this encounter due to temporal interference."

        if not narrative_str:
            narrative_str = "An epic battle fought in silence."
        
        record = MatchRecord(
            player=player, 
            difficulty=difficulty, 
            kills=u32(kills),
            won=won,
            timestamp=ts,
            narrative=narrative_str
        )
        self.match_history.append(record)
        
        current_highest = self.highest_scores.get(difficulty, u32(0))
        if kills > int(current_highest):
            self.highest_scores[difficulty] = u32(kills)
            self.highest_scorers[difficulty] = player

        # Progressive state synchronization
        profile = self.player_profiles.get(player, PlayerStats(u32(0), u32(0), u32(0), "Rookie Runner", "No lore yet.", ""))
        new_kills = int(profile.total_kills) + kills
        new_wins = int(profile.total_wins) + (1 if won else 0)
        new_matches = int(profile.matches_played) + 1
        
        if new_matches < 3:
            new_title = "Rookie Runner"
        else:
            win_rate = new_wins / new_matches
            avg_kills = new_kills / new_matches
            
            if win_rate >= 0.7 and avg_kills >= 7.0:
                new_title = "Fearless Warrior"
            elif win_rate <= 0.3 and avg_kills >= 4.0:
                new_title = "Reckless Berserker"
            elif win_rate >= 0.6 and avg_kills <= 2.5:
                new_title = "Stealth Ninja"
            elif win_rate <= 0.3 and avg_kills <= 1.5:
                new_title = "Cautious Survivor"
            elif avg_kills >= 5.0:
                new_title = "Skillful Slayer"
            elif win_rate >= 0.5:
                new_title = "Tactical Master"
            else:
                new_title = "Cyber Adept"
                
        # Subjective State Processing: Validator agreement extraction
        achievements_list = profile.achievements.split(",") if profile.achievements else []
        new_achievements = achievements_list.copy()

        prompt = f"""The player just finished a cyberpunk shooter match.
Difficulty: {difficulty}
Status: {'Won' if won else 'Lost'}
Kills: {kills}
Generate a unique, epic 1-3 word cyberpunk achievement name for this specific performance. If the performance is completely boring/average, output EXACTLY the word "None". Do not output anything else but the achievement name."""

        def eval_ach():
            return str(gl.nondet.exec_prompt(prompt)).strip()

        try:
            # Consensus verification: Ensures log symmetry between nodes and abstract alignment
            res = gl.eq_principle.prompt_comparative(
                eval_ach,
                "These are cyberpunk achievement titles. Consider them equivalent as long as they are both short, thematic achievement titles suitable for the player's performance, even if the exact words are different. If both are 'None', they are equivalent."
            )
            dynamic_achievement = str(res.get() if hasattr(res, "get") else res).replace('"', '').strip()
        except:
            dynamic_achievement = "None"

        if dynamic_achievement != "None" and dynamic_achievement.lower() != "none" and dynamic_achievement not in new_achievements:
            new_achievements.append(dynamic_achievement)
            
        profile.total_kills = u32(new_kills)
        profile.total_wins = u32(new_wins)
        profile.matches_played = u32(new_matches)
        profile.title = new_title
        profile.achievements = ",".join([a for a in new_achievements if a])
        
        self.player_profiles[player] = profile

    @gl.public.view
    def get_highest_score(self, difficulty: str) -> int:
        return int(self.highest_scores.get(difficulty, u32(0)))
        
    @gl.public.view
    def get_highest_scorer(self, difficulty: str) -> str:
        scorer = self.highest_scorers.get(difficulty, Address("0x0000000000000000000000000000000000000000"))
        return str(scorer)

    @gl.public.view
    def get_match_history(self) -> list[dict[str, typing.Any]]:
        result = []
        for record in self.match_history:
            result.append({
                "player": str(record.player),
                "difficulty": record.difficulty,
                "kills": int(record.kills),
                "won": record.won,
                "timestamp": record.timestamp,
                "narrative": getattr(record, "narrative", "")
            })
        return result

    @gl.public.write
    def generate_player_lore(self) -> None:
        player = gl.message.sender_address
        profile = self.player_profiles.get(player, PlayerStats(u32(0), u32(0), u32(0), "Rookie Runner", "No lore yet.", ""))
        
        prompt = f"""Generate a short, epic 2-sentence cyberpunk backstory for a hacker known as {player}.
Stats: {int(profile.matches_played)} matches, {int(profile.total_wins)} wins, {int(profile.total_kills)} total enemies defeated.
Title: {profile.title}
Achievements: {profile.achievements if profile.achievements else 'None yet.'}
Make it sound legendary and gritty. Output raw text only. No quotes."""

        def eval_gen():
            res = gl.nondet.exec_prompt(prompt)
            return str(res)

        try:
            res = gl.eq_principle.prompt_comparative(
                eval_gen,
                "Equivalent if they convey the same cyberpunk lore and tone."
            )
            lore = str(res.get() if hasattr(res, "get") else res).strip()
        except Exception:
            lore = "A mysterious entity whose past is redacted by the mega-corps."
            
        profile.lore = lore
        self.player_profiles[player] = profile

    @gl.public.view
    def get_player_stats(self, player_address: str) -> dict[str, typing.Any]:
        addr = Address(player_address)
        profile = self.player_profiles.get(addr, PlayerStats(u32(0), u32(0), u32(0), "Rookie Runner", "No lore yet.", ""))
        return {
            "total_kills": int(profile.total_kills),
            "total_wins": int(profile.total_wins),
            "matches_played": int(profile.matches_played),
            "title": str(profile.title),
            "lore": str(profile.lore),
            "achievements": str(profile.achievements)
        }
