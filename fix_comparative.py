import re

path = r'C:\Users\omarb\Desktop\genlayer\royale_temp\contracts\game_registry.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all remaining prompt_comparative with prompt_non_comparative
content = content.replace('gl.eq_principle.prompt_comparative', 'gl.eq_principle.prompt_non_comparative')

# We need to change the principle text for all of them. Since the existing one is the generic one:
old_principle = 'principle="The substantive decisions (like boolean flags, numerical scores, or categories) must be strictly equivalent. Minor variations in verbose reasoning strings are allowed."'
new_principle = 'principle="The leader\'s generated text must accurately reflect the request and maintain an epic cyberpunk theme. Variations in creativity are fully acceptable as long as it fits the requested criteria."'

content = content.replace(old_principle, new_principle)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated all remaining prompt_comparative calls.")
