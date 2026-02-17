
import re
import glob
import os

def check_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for className={... ${...} ...} without backticks
    # This regex looks for className={ followed by anything NOT a backtick or closing brace, then ${
    pattern = r'className=\{[^`}]*\$\{'
    matches = list(re.finditer(pattern, content))
    
    if matches:
        print(f"POTENTIAL ERROR in {filepath}:")
        for m in matches:
            # Get context
            start = m.start()
            end = m.end()
            line_no = content[:start].count('\n') + 1
            print(f"  Line {line_no}: ...{content[start:end]}...")
            
    # Check for className="... ${...} ..." which is also wrong (should be backticks inside brackets)
    pattern2 = r'className="[^"]*\$\{'
    matches2 = list(re.finditer(pattern2, content))
    if matches2:
        print(f"POTENTIAL ERROR (quotes instead of braces/backticks) in {filepath}:")
        for m in matches2:
             start = m.start()
             end = m.end()
             line_no = content[:start].count('\n') + 1
             print(f"  Line {line_no}: ...{content[start:end]}...")

files = glob.glob('src/**/*.jsx', recursive=True)
for file in files:
    check_file(file)
