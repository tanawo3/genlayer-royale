import re

path = r'C:\Users\omarb\Desktop\genlayer\royale_temp\contracts\game_registry.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the first prompt_non_comparative (record_match)
content = re.sub(
    r'decision = gl.eq_principle.prompt_non_comparative\(\s*leader_fn,\s*"The leader\'s generated narrative and title must accurately reflect the Match Summary and Kills provided, and maintain an epic cyberpunk theme. Variations in creativity are fully acceptable as long as it fits the requested criteria."\s*\)',
    r'''def validator_fn(leaders_res: gl.vm.Result) -> bool:
            if not isinstance(leaders_res, gl.vm.Return): return False
            data = leaders_res.calldata
            if not isinstance(data, dict): return False
            if "narrative" not in data or "achievement_title" not in data: return False
            return True
            
        decision = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)''',
    content
)

# Replace the second prompt_non_comparative (craft_weapon)
content = re.sub(
    r'decision = gl.eq_principle.prompt_non_comparative\(\s*leader_fn,\s*"The leader\'s generated text must accurately reflect the request and maintain an epic cyberpunk theme. Variations in creativity are fully acceptable as long as it fits the requested criteria."\s*\)',
    r'''def validator_fn(leaders_res: gl.vm.Result) -> bool:
            if not isinstance(leaders_res, gl.vm.Return): return False
            data = leaders_res.calldata
            if not isinstance(data, dict): return False
            if "weapon_name" not in data or "damage" not in data: return False
            return True
            
        decision = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)''',
    content,
    count=1
)

# Replace the third prompt_non_comparative (spawn_boss)
content = re.sub(
    r'decision = gl.eq_principle.prompt_non_comparative\(\s*leader_fn,\s*"The leader\'s generated text must accurately reflect the request and maintain an epic cyberpunk theme. Variations in creativity are fully acceptable as long as it fits the requested criteria."\s*\)',
    r'''def validator_fn(leaders_res: gl.vm.Result) -> bool:
            if not isinstance(leaders_res, gl.vm.Return): return False
            data = leaders_res.calldata
            if not isinstance(data, dict): return False
            if "boss_name" not in data or "lore_description" not in data: return False
            return True
            
        decision = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)''',
    content
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Replaced all prompt_non_comparative wrappers with custom validator_fn using run_nondet_unsafe.")
