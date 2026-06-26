from PIL import Image, ImageDraw, ImageFont
import math
import os
import textwrap


OUT = r"C:\cardiac-alert\outputs\business_model_canvas_cas.png"
W, H = 1600, 900
GREEN = "#0b4a2c"
RED = "#c5121b"
YELLOW = "#ffc400"
BLUE = "#243e72"
GRAY = "#9a9a9a"
DARK = "#202020"
LIGHT = "#f9faf9"


def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


FONT_DIR = r"C:\Windows\Fonts"
TITLE = font(os.path.join(FONT_DIR, "timesbd.ttf"), 52)
SECTION = font(os.path.join(FONT_DIR, "arialbd.ttf"), 12)
BODY = font(os.path.join(FONT_DIR, "arial.ttf"), 14)
BODY_SMALL = font(os.path.join(FONT_DIR, "arial.ttf"), 13)
FOOTER = font(os.path.join(FONT_DIR, "arialbd.ttf"), 15)
NUM = font(os.path.join(FONT_DIR, "arialbd.ttf"), 18)
LOGO = font(os.path.join(FONT_DIR, "arialbd.ttf"), 52)


def text_size(draw, text, fnt):
    box = draw.textbbox((0, 0), text, font=fnt)
    return box[2] - box[0], box[3] - box[1]


def draw_wrapped_bullets(draw, x, y, max_w, items, fnt=BODY, fill=DARK, line_gap=7):
    cy = y
    bullet_indent = 20
    for item in items:
        approx_chars = max(18, int(max_w / max(6.7, fnt.size * 0.52)))
        lines = textwrap.wrap(item, width=approx_chars)
        if not lines:
            continue
        draw.text((x, cy), "•", font=fnt, fill=fill)
        for idx, line in enumerate(lines):
            draw.text((x + bullet_indent, cy), line, font=fnt, fill=fill)
            cy += fnt.size + 2
        cy += line_gap
    return cy


def draw_header(draw):
    # VKU-like text mark
    x, y = 48, 15
    draw.text((x, y), "V", font=LOGO, fill="#d22b2b")
    draw.text((x + 34, y), "K", font=LOGO, fill="#f29f05")
    draw.text((x + 70, y), "U", font=LOGO, fill="#274c91")
    draw.line((x, y + 60, x + 112, y + 54), fill="#f29f05", width=4)
    draw.line((x, y + 65, x + 112, y + 60), fill="#274c91", width=3)

    title = "5. Business Model Canvas"
    tw, _ = text_size(draw, title, TITLE)
    draw.text(((W - tw) / 2, 17), title, font=TITLE, fill=RED)
    draw.line((475, 74, W - 35, 74), fill="#7a1f2a", width=2)
    draw.line((475, 76, 705, 76), fill=YELLOW, width=3)


def draw_footer(draw):
    y = H - 36
    draw.rectangle((0, y, W, H), fill="white")
    draw.rectangle((0, y + 5, 1165, y + 28), fill=RED)
    draw.polygon([(1165, y + 5), (1215, y + 16), (1165, y + 28)], fill=RED)
    draw.polygon([(1212, y + 5), (1425, y + 5), (1475, y + 16), (1425, y + 28), (1212, y + 28), (1245, y + 16)], fill=YELLOW)
    draw.polygon([(1465, y + 5), (W - 50, y + 5), (W - 15, y + 16), (W - 50, y + 28), (1465, y + 28), (1500, y + 16)], fill=BLUE)
    draw.text((18, y + 9), "Faculty of Computer Science", font=FOOTER, fill="white")
    draw.text((W - 54, y + 9), "12", font=FOOTER, fill="white")


def icon_target(draw, cx, cy):
    for r in [30, 20, 10]:
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=GREEN, width=4)
    draw.line((cx, cy, cx + 28, cy - 28), fill=GREEN, width=4)
    draw.polygon([(cx + 28, cy - 28), (cx + 18, cy - 26), (cx + 28, cy - 18)], fill=GREEN)


def icon_diamond(draw, cx, cy):
    pts = [(cx, cy - 35), (cx + 42, cy - 8), (cx, cy + 36), (cx - 42, cy - 8)]
    draw.polygon(pts, outline=GREEN, fill=None)
    draw.line((cx - 42, cy - 8, cx + 42, cy - 8), fill=GREEN, width=3)
    draw.line((cx - 20, cy - 28, cx, cy + 36), fill=GREEN, width=3)
    draw.line((cx + 20, cy - 28, cx, cy + 36), fill=GREEN, width=3)


def icon_gear(draw, cx, cy):
    for a in range(0, 360, 45):
        rad = math.radians(a)
        x1, y1 = cx + math.cos(rad) * 22, cy + math.sin(rad) * 22
        x2, y2 = cx + math.cos(rad) * 34, cy + math.sin(rad) * 34
        draw.line((x1, y1, x2, y2), fill=GREEN, width=7)
    draw.ellipse((cx - 24, cy - 24, cx + 24, cy + 24), fill=GREEN)
    draw.ellipse((cx - 9, cy - 9, cx + 9, cy + 9), fill="white")


def icon_people(draw, cx, cy):
    draw.ellipse((cx - 12, cy - 32, cx + 12, cy - 8), fill=GREEN)
    draw.ellipse((cx - 45, cy - 22, cx - 25, cy - 2), fill=GREEN)
    draw.ellipse((cx + 25, cy - 22, cx + 45, cy - 2), fill=GREEN)
    draw.rounded_rectangle((cx - 26, cy - 5, cx + 26, cy + 33), radius=12, fill=GREEN)
    draw.rounded_rectangle((cx - 58, cy + 8, cx - 20, cy + 35), radius=10, fill=GREEN)
    draw.rounded_rectangle((cx + 20, cy + 8, cx + 58, cy + 35), radius=10, fill=GREEN)


def icon_chat(draw, cx, cy):
    icon_people(draw, cx - 12, cy + 8)
    draw.rounded_rectangle((cx + 22, cy - 36, cx + 66, cy - 7), radius=7, outline=GREEN, width=4)
    draw.polygon([(cx + 34, cy - 7), (cx + 24, cy + 6), (cx + 48, cy - 7)], fill=GREEN)
    draw.ellipse((cx + 33, cy - 25, cx + 39, cy - 19), fill=GREEN)
    draw.ellipse((cx + 46, cy - 25, cx + 52, cy - 19), fill=GREEN)
    draw.ellipse((cx + 59, cy - 25, cx + 65, cy - 19), fill=GREEN)


def icon_handshake(draw, cx, cy):
    draw.line((cx - 55, cy - 10, cx - 20, cy + 12), fill=GREEN, width=12)
    draw.line((cx + 55, cy - 10, cx + 20, cy + 12), fill=GREEN, width=12)
    draw.polygon([(cx - 26, cy - 5), (cx + 5, cy - 18), (cx + 32, cy + 8), (cx + 4, cy + 25)], fill=GREEN)
    draw.line((cx - 5, cy + 5, cx + 17, cy + 25), fill="white", width=3)
    draw.line((cx + 6, cy - 3, cx + 27, cy + 15), fill="white", width=3)


def icon_network(draw, cx, cy):
    pts = [(cx, cy - 32), (cx - 45, cy + 12), (cx + 43, cy + 18), (cx - 5, cy + 38)]
    for a, b in [(0, 1), (0, 2), (1, 3), (2, 3)]:
        draw.line((pts[a][0], pts[a][1], pts[b][0], pts[b][1]), fill=GREEN, width=4)
    for px, py in pts:
        draw.ellipse((px - 9, py - 9, px + 9, py + 9), fill=GREEN)


def icon_calc(draw, cx, cy):
    draw.rounded_rectangle((cx - 36, cy - 42, cx + 36, cy + 42), radius=8, outline=GREEN, width=5)
    draw.rectangle((cx - 24, cy - 30, cx + 24, cy - 12), fill=GREEN)
    for iy in range(3):
        for ix in range(3):
            x = cx - 24 + ix * 24
            y = cy + iy * 18
            draw.rounded_rectangle((x, y, x + 12, y + 10), radius=2, fill=GREEN)


def icon_revenue(draw, cx, cy):
    draw.line((cx - 48, cy + 35, cx + 52, cy + 35), fill=GREEN, width=5)
    bars = [24, 44, 64]
    for i, h in enumerate(bars):
        x = cx - 35 + i * 29
        draw.rectangle((x, cy + 35 - h, x + 18, cy + 35), fill=GREEN)
    draw.line((cx - 45, cy + 20, cx - 10, cy - 6, cx + 18, cy - 22, cx + 44, cy - 52), fill=GREEN, width=5)
    draw.polygon([(cx + 44, cy - 52), (cx + 30, cy - 47), (cx + 44, cy - 37)], fill=GREEN)


def draw_box(draw, rect, num, title, icon_func, items, body_font=BODY):
    x1, y1, x2, y2 = rect
    draw.rectangle(rect, fill="white", outline=GRAY, width=2)
    draw.ellipse((x1 + 18, y1 + 18, x1 + 50, y1 + 50), fill=GREEN)
    draw.text((x1 + 28, y1 + 23), str(num), font=NUM, fill="white", anchor="mm")
    draw.text((x1 + 60, y1 + 22), title.upper(), font=SECTION, fill=DARK)
    icon_func(draw, (x1 + x2) // 2, y1 + 83)
    draw_wrapped_bullets(draw, x1 + 24, y1 + 135, x2 - x1 - 42, items, body_font)


def draw_bottom_box(draw, rect, num, title, icon_func, items):
    x1, y1, x2, y2 = rect
    draw.rectangle(rect, fill="white", outline=GRAY, width=2)
    draw.ellipse((x1 + 18, y1 + 18, x1 + 50, y1 + 50), fill=GREEN)
    draw.text((x1 + 34, y1 + 34), str(num), font=NUM, fill="white", anchor="mm")
    draw.text((x1 + 62, y1 + 24), title.upper(), font=SECTION, fill=DARK)
    icon_func(draw, x1 + 94, y1 + 94)
    draw_wrapped_bullets(draw, x1 + 185, y1 + 67, x2 - x1 - 210, items, BODY_SMALL, line_gap=3)


def main():
    img = Image.new("RGB", (W, H), "white")
    draw = ImageDraw.Draw(img)
    draw_header(draw)

    gx, gy = 220, 135
    cw, top_h, bottom_h = 232, 500, 185
    split_h = top_h // 2

    sections = {
        "partners": [
            "Hospitals, clinics and nursing homes",
            "Smart camera / IoT suppliers",
            "Cloud hosting providers",
            "Telegram, Twilio, ElevenLabs",
        ],
        "activities": [
            "Train and tune AI models",
            "Process camera streams",
            "Operate alert pipeline",
            "Index medical knowledge",
        ],
        "resources": [
            "CNN-LSTM and MediaPipe models",
            "Go/Gin backend, HLS server",
            "MongoDB, Redis, ChromaDB",
            "Emergency contact network",
        ],
        "value": [
            "AI fall and cardiac-risk alerts",
            "Contactless vitals monitoring",
            "Real-time evidence recording",
            "Telegram, WebSocket and phone escalation",
            "First-aid RAG assistant",
        ],
        "relationships": [
            "24/7 monitoring workflow",
            "Self-service dashboard",
            "Emergency guidance",
            "Technical onboarding",
        ],
        "channels": [
            "Web dashboard and mobile app",
            "Hospitals / nursing homes",
            "Smart-home camera partners",
            "Online subscriptions",
        ],
        "segments": [
            "Elderly people living alone",
            "Cardiovascular and mobility-risk patients",
            "Families and caregivers",
            "Nursing homes and clinics",
            "Home-care service providers",
        ],
        "cost": [
            "Cloud, GPU and bandwidth costs",
            "AI, call and SMS API fees",
            "Model training and testing",
            "Security and compliance",
            "Marketing and customer support",
        ],
        "revenue": [
            "SaaS subscription tiers",
            "Premium emergency call packages",
            "B2B nursing-home licenses",
            "Hardware-software bundles",
            "Analytics and reporting services",
        ],
    }

    draw_box(draw, (gx, gy, gx + cw, gy + top_h), 8, "Key Partners", icon_handshake, sections["partners"], BODY_SMALL)
    draw_box(draw, (gx + cw, gy, gx + 2 * cw, gy + split_h), 3, "Key Activities", icon_gear, sections["activities"], BODY_SMALL)
    draw_box(draw, (gx + cw, gy + split_h, gx + 2 * cw, gy + top_h), 5, "Key Resources", icon_people, sections["resources"], BODY_SMALL)
    draw_box(draw, (gx + 2 * cw, gy, gx + 3 * cw, gy + top_h), 2, "Value Propositions", icon_diamond, sections["value"], BODY_SMALL)
    draw_box(draw, (gx + 3 * cw, gy, gx + 4 * cw, gy + split_h), 9, "Customer Relationships", icon_chat, sections["relationships"], BODY_SMALL)
    draw_box(draw, (gx + 3 * cw, gy + split_h, gx + 4 * cw, gy + top_h), 8, "Channels", icon_network, sections["channels"], BODY_SMALL)
    draw_box(draw, (gx + 4 * cw, gy, gx + 5 * cw, gy + top_h), 1, "Customer Segments", icon_target, sections["segments"], BODY_SMALL)

    by = gy + top_h + 12
    draw_bottom_box(draw, (gx, by, gx + int(2.5 * cw), by + bottom_h), 6, "Cost Structure", icon_calc, sections["cost"])
    draw_bottom_box(draw, (gx + int(2.5 * cw), by, gx + 5 * cw, by + bottom_h), 7, "Revenue Streams", icon_revenue, sections["revenue"])

    draw_footer(draw)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    img.save(OUT, quality=95)
    print(OUT)


if __name__ == "__main__":
    main()
