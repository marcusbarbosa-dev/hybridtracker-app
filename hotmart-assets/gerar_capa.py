from PIL import Image, ImageDraw, ImageFont
import os

# Create directory if not exists
os.makedirs('hotmart-assets', exist_ok=True)

# Image dimensions (Hotmart cover image size: 800x450)
width, height = 800, 450
img = Image.new('RGB', (width, height), color='#0a0a0a')
draw = ImageDraw.Draw(img)

# Background gradient effect
for y in range(height):
    ratio = y / height
    r = int(10 + ratio * 40)
    g = int(10 + ratio * 20)
    b = int(10 + ratio * 5)
    draw.line([(0, y), (width, y)], fill=(r, g, b))

# Draw decorative elements
# Orange accent bar at top
draw.rectangle([0, 0, width, 6], fill='#f97316')

# Orange circles (decorative)
draw.ellipse([650, 50, 750, 150], fill='#f97316', outline='#f97316')
draw.ellipse([680, 80, 730, 130], fill='#0a0a0a')

# Draw main title
try:
    font_title = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 48)
    font_subtitle = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 24)
    font_badge = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 18)
except:
    font_title = ImageFont.load_default()
    font_subtitle = ImageFont.load_default()
    font_badge = ImageFont.load_default()

# Title text
title = "HybridTracker"
draw.text((60, 120), title, fill='#ffffff', font=font_title)

# Subtitle
subtitle = "O unico app que evolui com voce"
draw.text((60, 190), subtitle, fill='#f97316', font=font_subtitle)

# Description lines
desc_lines = [
    "Benchmarks cientificos  |  Timer de prova",
    "Plano semanal adaptativo  |  Recuperacao inteligente"
]
for i, line in enumerate(desc_lines):
    draw.text((60, 240 + i * 30), line, fill='#aaaaaa', font=font_subtitle)

# Price badge
badge_text = "7 DIAS GRATIS"
draw.rounded_rectangle([60, 320, 280, 360], radius=8, fill='#f97316')
draw.text((80, 328), badge_text, fill='#000000', font=font_badge)

# Additional badge
badge2_text = "R$ 49,90 /mes"
draw.rounded_rectangle([300, 320, 460, 360], radius=8, outline='#f97316', width=2)
draw.text((320, 328), badge2_text, fill='#f97316', font=font_badge)

# Bottom bar with features
features = ["8 BENCHMARKS", "TIMER PROVA", "PLANO SEMANAL", "RECUPERACAO"]
bar_y = 400
for i, feat in enumerate(features):
    x = 60 + i * 180
    draw.text((x, bar_y), feat, fill='#f97316', font=font_badge)

# Save
img.save('hotmart-assets/capa-hotmart.png', quality=95)
print("Capa gerada: hotmart-assets/capa-hotmart.png")
