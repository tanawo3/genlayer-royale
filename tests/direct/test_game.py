import pytest
from tests.utils import setup_mock_genvm

@pytest.fixture
def mock_genvm():
    return setup_mock_genvm()

def test_register_player(mock_genvm):
    contract = mock_genvm.deploy("contracts/game_registry.py", "GameLeaderboard")
    mock_genvm.set_sender("0x1234567890abcdef")
    
    contract.register_player("NeonPhantom")
    
    prof = contract.profiles.get("0x1234567890abcdef")
    assert prof.username == "NeonPhantom"
    assert prof.rank == "Rookie"

def test_generate_cyberpunk_loadout(mock_genvm):
    contract = mock_genvm.deploy("contracts/game_registry.py", "GameLeaderboard")
    mock_genvm.set_sender("0xabc")
    contract.register_player("Runner")
    
    # Mock the LLM equivalence call for prompt_non_comparative
    mock_genvm.mock_eq_principle_non_comparative({
        "weapon_name": "Plasma Blade",
        "special_effect": "Cuts through firewalls"
    })
    
    contract.generate_cyberpunk_loadout()
    
    prof = contract.profiles.get("0xabc")
    assert prof.current_loadout == "Plasma Blade"

def test_record_match(mock_genvm):
    contract = mock_genvm.deploy("contracts/game_registry.py", "GameLeaderboard")
    mock_genvm.set_sender("0xdef")
    contract.register_player("Ghost")
    
    mock_genvm.mock_eq_principle_non_comparative({
        "narrative": "Ghost obliterated the mainframe.",
        "achievement_title": "Mainframe Breaker",
        "faction": "Netrunners"
    })
    
    match_id = contract.record_match("Hard", 12, "Surived the onslaught.", idempotency_key="match-1")
    
    # Test idempotency
    dup_id = contract.record_match("Hard", 12, "Surived the onslaught.", idempotency_key="match-1")
    assert dup_id == 0 # Idempotent drop
    
    assert contract.state.total_kills_global == 12
    assert contract.processed_results.get("match-1") is True
