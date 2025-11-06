#!/usr/bin/env python3
import requests
import re

torzsszam = "4576"
url = f"https://www.vizugy.hu/talajvizkut_grafikon/index.php?torzsszam={torzsszam}"

response = requests.get(url, timeout=15)
html_content = response.text

# Keressük meg a chartView hívást
chart_start = html_content.find('chartView(')
print(f"chartView start position: {chart_start}")

# Keressük meg a záró zárójelet
bracket_count = 0
chart_end = -1
for i in range(chart_start + 10, min(chart_start + 500000, len(html_content))):
    if html_content[i] == '(':
        bracket_count += 1
    elif html_content[i] == ')':
        if bracket_count == 0:
            chart_end = i
            break
        bracket_count -= 1

print(f"chartView end position: {chart_end}")
print(f"Distance: {chart_end - chart_start}")

# Kinyerjük a chartView argumentumait
chart_call = html_content[chart_start + 10:chart_end]

print(f"\nFirst 200 chars of chart_call:")
print(repr(chart_call[:200]))

print(f"\nLast 200 chars of chart_call:")
print(repr(chart_call[-200:]))

# Kettévágás
split_pattern = r'\],\['
parts = re.split(split_pattern, chart_call, maxsplit=1)

print(f"\nNumber of parts: {len(parts)}")
print(f"Part 0 length: {len(parts[0])}")
print(f"Part 1 length: {len(parts[1])}")

print(f"\nPart 0 first 100 chars:")
print(repr(parts[0][:100]))

print(f"\nPart 1 first 100 chars:")
print(repr(parts[1][:100]))

print(f"\nPart 1 last 100 chars:")
print(repr(parts[1][-100:]))
