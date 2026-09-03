from PIL import Image, ImageDraw, ImageFont
import os

# Criar diretorio se nao existir
os.makedirs('hotmart-assets', exist_ok=True)

# Dimensao do banner da Hotmart (800x450)
width, height = 800, 450
img = Image.new('RGB', (width, height), color='#0a0a0a')
draw = ImageDraw.Draw(img)

# Gradiente de fundo
for y in range(height):
    ratio = y / height
    r = int(10 + ratio * 30)
    g = int(5 + ratio * 15)
    b = int(0 + ratio * 5)
    draw.line([(0, y), (width, y)], fill=(r, g, b))

# Barra laranja no topo
draw.rectangle([0, 0, width, 4], fill='#f97316')

# Tentar carregar fontes do sistema
try:
    font_title = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 52)
    font_subtitle = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 22)
    font_badge = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 16)
    font_small = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 14)
except:
    font_title = ImageFont.load_default()
    font_subtitle = ImageFont.load_default()
    font_badge = ImageFont.load_default()
    font_small = ImageFont.load_default()

# Elementos decorativos - circulos laranja
draw.ellipse([620, 30, 720, 130], fill='#f97316', outline='#f97316')
draw.ellipse([650, 60, 690, 100], fill='#0a0a0a')

# Titulo principal
title = "HybridTracker"
draw.text((60, 100), title, fill='#ffffff', font=font_title)

# Subtitulo
subtitle = "O único app que evolui com você"
draw.text((60, 170), subtitle, fill='#f97316', font=font_subtitle)

# Descricao
desc_lines = [
    "Benchmarks científicos • Timer de prova • Plano semanal",
    "Recuperação inteligente • Integração com wearables"
]
for i, line in enumerate(desc_lines):
    draw.text((60, 220 + i * 28), line, fill='#aaaaaa', font=font_small)

# Badge de trial
badge_text = "7 DIAS GRÁTIS"
draw.rounded_rectangle([60, 290, 250, 325], radius=8, fill='#f97316')
draw.text((75, 298), badge_text, fill='#000000', font=font_badge)

# Badge de preco
badge2_text = "R$ 49,90 /mês"
draw.rounded_rectangle([270, 290, 420, 325], radius=8, outline='#f97316', width=2)
draw.text((285, 298), badge2_text, fill='#f97316', font=font_badge)

# Barra inferior com features
features = ["8 BENCHMARKS", "TIMER PROVA", "PLANO SEMANAL", "RECUPERAÇÃO"]
bar_y = 380
for i, feat in enumerate(features):
    x = 60 + i * 180
    draw.text((x, bar_y), feat, fill='#f97316', font=font_badge)

# Logo simbolo (infinito estilizado)
draw.ellipse([680, 340, 740, 400], fill='#f97316', outline='#f97316')
draw.ellipse([690, 350, 730, 390], fill='#0a0a0a')
draw.text((700, 355), "∞", fill='#f97316', font=font_title)

# Salvar
img.save('hotmart-assets/banner-hotmart.png', quality=95)
print("Banner gerado: hotmart-assets/banner-hotmart.png")
