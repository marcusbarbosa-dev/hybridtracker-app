import re

# Read the file in binary mode first
with open('src/pages/LandingPage.tsx', 'rb') as f:
    raw = f.read()

# Decode with surrogatepass to handle any invalid sequences
text = raw.decode('utf-8', errors='surrogatepass')

# Fix literal \uXXXX sequences - they appear as actual backslash-u sequences
def decode_unicode_escape(match):
    hex_val = match.group(1)
    return chr(int(hex_val, 16))

# Replace \uXXXX with actual characters
text = re.sub(r'\\u([0-9a-fA-F]{4})', decode_unicode_escape, text)

# Write back with surrogatepass
data = text.encode('utf-8', errors='surrogatepass')
with open('src/pages/LandingPage.tsx', 'wb') as f:
    f.write(data)

print("Fixed Unicode escapes successfully")
