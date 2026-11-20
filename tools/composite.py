"""Fill missing product mockups by swapping artwork into AI-generated templates.
Template = <product>-august-meeting.jpg (art has a flat blue bg, easy to locate)."""
import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps
from scipy import ndimage

ROOT = os.path.join(os.path.dirname(__file__), "..", "assets")
ARTS = ["august-meeting", "heavy-is-the-head", "local-hair-braider", "obioma", "agony", "a-true-mother"]
RECT = ["notepad", "phone-case", "calendar", "tote-bag", "t-shirt", "hoodie", "mug", "framed-art"]
SHAPE = ["sticker", "keychain", "patch"]
BLUE = np.array([62, 103, 150])
FORCE = "--force" in sys.argv

def art(a): return Image.open(f"{ROOT}/art/{a}.jpg").convert("RGB")

def find_box(t):
    a = np.asarray(t).astype(int)
    m = np.linalg.norm(a - BLUE, axis=2) < 48
    m = ndimage.binary_closing(m, iterations=6)
    lab, n = ndimage.label(m)
    if not n: return None, None
    sizes = ndimage.sum(m, lab, range(1, n + 1))
    keep = [i + 1 for i, s in enumerate(sizes) if s > 0.03 * sizes.max()]
    comp = np.isin(lab, keep)
    ys, xs = np.where(comp)
    return (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1), comp

def rect_swap(p, a):
    t = Image.open(f"{ROOT}/products/{p}-august-meeting.jpg").convert("RGB")
    box, comp = find_box(t)
    x0, y0, x1, y1 = box
    # shrink 1px to avoid blue fringe, then cover-crop the new art into the box
    w, h = x1 - x0, y1 - y0
    src = art(a)
    fitted = ImageOps.fit(src, (w, h), Image.LANCZOS)
    # shading from template luminance (fabric folds / mug curvature)
    L = np.asarray(t.convert("L")).astype(float)[y0:y1, x0:x1]
    region = comp[y0:y1, x0:x1]
    ref = np.median(L[region]) if region.any() else L.mean()
    shade = np.clip(L / max(ref, 1), 0.55, 1.2)
    # use lighting only from the flat-blue pixels; fill figure areas by normalized convolution
    rm = ndimage.binary_erosion(region, iterations=3).astype(float)
    sig = max(w, h) / 40
    den = ndimage.gaussian_filter(rm, sig)
    fill = (ndimage.gaussian_filter(shade * rm, sig) + 0.08) / (den + 0.08)
    fine = ndimage.gaussian_filter(shade, 1.0)
    shade = fill
    shade = ndimage.gaussian_filter(shade, 1.5)
    f = np.asarray(fitted).astype(float) * shade[..., None]
    out = np.asarray(t).copy()
    out[y0:y1, x0:x1] = np.clip(f, 0, 255).astype(np.uint8)
    return Image.fromarray(out)

def bg_like(p):
    t = Image.open(f"{ROOT}/products/{p}-august-meeting.jpg").convert("RGB")
    a = np.asarray(t).astype(float)
    # soft background: blur heavily the template's border colours
    c = np.concatenate([a[:40].reshape(-1, 3), a[-40:].reshape(-1, 3), a[:, :40].reshape(-1, 3), a[:, -40:].reshape(-1, 3)]).mean(0)
    W, H = t.size
    bg = Image.new("RGB", (W, H), tuple(int(v) for v in c))
    # subtle vignette
    vg = Image.radial_gradient("L").resize((W, H)).point(lambda v: int(v * 0.12))
    bg = Image.composite(Image.new("RGB", (W, H), (0, 0, 0)), bg, vg)
    return bg

def rounded(im, r):
    m = Image.new("L", im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, im.size[0] - 1, im.size[1] - 1], r, fill=255)
    return m

def shape_item(p, a):
    bg = bg_like(p)
    W, H = bg.size
    src = art(a)
    s = min(W, H) * (0.5 if p == "keychain" else 0.58)
    ar = src.width / src.height
    w, h = (int(s * ar), int(s)) if ar < 1 else (int(s), int(s / ar))
    img = src.resize((w, h), Image.LANCZOS)
    if p == "sticker":
        b = int(s * 0.05); r = int(s * 0.08)
        card = Image.new("RGB", (w + 2 * b, h + 2 * b), (252, 252, 252))
        card.paste(img, (b, b), rounded(img, int(r * 0.6)))
        mask = rounded(card, r)
        rot = -6
    elif p == "keychain":
        b = int(s * 0.035); r = int(s * 0.07)
        card = Image.new("RGB", (w + 2 * b, h + 2 * b), (235, 240, 242))
        card.paste(img, (b, b), rounded(img, int(r * 0.6)))
        # acrylic gloss
        gl = Image.new("L", card.size, 0); d = ImageDraw.Draw(gl)
        d.polygon([(0, 0), (card.width * 0.45, 0), (0, card.height * 0.45)], fill=40)
        card = Image.composite(Image.new("RGB", card.size, (255, 255, 255)), card, gl.filter(ImageFilter.GaussianBlur(20)))
        mask = rounded(card, r)
        rot = 4
    else:  # patch
        b = int(s * 0.06); r = int(s * 0.1)
        card = Image.new("RGB", (w + 2 * b, h + 2 * b), (30, 30, 34))
        small = img.resize((max(1, w // 3), max(1, h // 3)), Image.BILINEAR).resize((w, h), Image.NEAREST)  # stitch-ish
        small = small.filter(ImageFilter.SMOOTH_MORE)
        card.paste(small, (b, b), rounded(img, int(r * 0.5)))
        d = ImageDraw.Draw(card)
        step = max(4, int(s * 0.012))
        for i in range(0, 2 * (card.width + card.height), step * 2):
            pass
        # merrowed border: dashed stroke
        for k in range(3):
            d.rounded_rectangle([b // 3 + k, b // 3 + k, card.width - b // 3 - k, card.height - b // 3 - k], r, outline=(60, 60, 66), width=1)
        noise = (np.random.rand(card.height, card.width) * 18 - 9)[..., None]
        card = Image.fromarray(np.clip(np.asarray(card).astype(float) + noise, 0, 255).astype(np.uint8))
        mask = rounded(card, r)
        rot = -3
    card = card.convert("RGBA"); card.putalpha(mask)
    card = card.rotate(rot, Image.BICUBIC, expand=True)
    # shadow
    sh = Image.new("RGBA", card.size, (0, 0, 0, 0))
    sh.putalpha(card.getchannel("A").point(lambda v: int(v * 0.28)))
    sh = sh.filter(ImageFilter.GaussianBlur(int(s * 0.03)))
    x, y = (W - card.width) // 2, (H - card.height) // 2 + (int(s * 0.06) if p == "keychain" else 0)
    out = bg.convert("RGBA")
    out.alpha_composite(sh, (x + int(s * 0.02), y + int(s * 0.035)))
    out.alpha_composite(card, (x, y))
    out = out.convert("RGB")
    if p == "keychain":
        d = ImageDraw.Draw(out)
        cx, top = W // 2, y + int(card.height * 0.02)
        rr = int(s * 0.12)
        d.ellipse([cx - rr, top - 2 * rr, cx + rr, top], outline=(150, 150, 155), width=max(4, int(s * 0.022)))
        d.ellipse([cx - rr + 3, top - 2 * rr + 3, cx + rr - 3, top - 3], outline=(215, 215, 220), width=2)
    return out

made = []
for p in RECT + SHAPE:
    for a in ARTS:
        dst = f"{ROOT}/products/{p}-{a}.jpg"
        if a == "august-meeting" or (os.path.exists(dst) and not FORCE and not os.path.exists(f"{ROOT}/../tools/.comp/{p}-{a}")):
            continue
        im = rect_swap(p, a) if p in RECT else shape_item(p, a)
        im.save(dst, quality=88)
        os.makedirs(f"{ROOT}/../tools/.comp", exist_ok=True); open(f"{ROOT}/../tools/.comp/{p}-{a}", "w").close()  # marker: composited, safe to overwrite / regenerate
        made.append(f"{p}-{a}")
print(len(made), "composited")
