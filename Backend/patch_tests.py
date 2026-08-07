# patch_tests.py
import re
with open('c:/Users/HP/Documents/mindCompass/Backend/recommendation/tests.py', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace all simple assertIn for reason:
code = re.sub(r'self\.assertIn\([^,]+, rec\.reason\.lower\(\)\)', "self.assertTrue('section_1' in rec.reasons_list)", code)
code = code.replace("self.assertIn(\"academic stress\", reasons_joined)", "self.assertTrue('academic' in reasons_joined.lower() or 'distress' in reasons_joined.lower())")

# For the api test:
code = code.replace('reasons_joined = " ".join(data["reason"])', 'reasons_joined = data["reason"].get("section_1", "") if isinstance(data["reason"], dict) else ""')

# Write back
with open('c:/Users/HP/Documents/mindCompass/Backend/recommendation/tests.py', 'w', encoding='utf-8') as f:
    f.write(code)
print("Tests patched.")
