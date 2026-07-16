path = r'C:\Users\omarb\Desktop\genlayer\royale_temp\contracts\game_registry.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the keyword 'principle=' to pass it as a positional argument
content = content.replace('principle="', '"')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed 'principle=' keyword argument.")
