import Image
import colorsys
import random

def to_norm(x):
    return x / 255.0
def from_norm(x):
    return int(round(x * 255.0))

def rgba_to_hlsa((r, g, b, a)):
    h, l, s = colorsys.rgb_to_hls(to_norm(r), to_norm(g), to_norm(b))
    return from_norm(h), from_norm(l), from_norm(s), a
def hlsa_to_rgba((h, l, s, a)):
    r, g, b = colorsys.hls_to_rgb(to_norm(h), to_norm(l), to_norm(s))
    return from_norm(r), from_norm(g), from_norm(b), a

def main():
    image = Image.open('bubbleart01.tga')
    assert image.mode == 'RGBA'

    image.putdata(map(rgba_to_hlsa, image.getdata()))
    image.save('bubble_transformed.png')

    one_bubble = image.crop((128, 64, 256, 128))
    one_bubble.load()

    hues = range(0, 256, 8)

    total = Image.new('RGBA', (128, 64 * len(hues)))

    def sat(x):
        return max(0, min(255, x))

    for i, hue in enumerate(hues):
        shifted = one_bubble.copy()
        n_jitter = random.randint(-32, 0)
        p_jitter = random.randint(0, 64)
        shifted.putdata([(hue, sat(l + n_jitter), sat(s + p_jitter), a) for h, l, s, a in shifted.getdata()])
    
        total.paste(shifted, (0, 64 * i))

    total.putdata(map(hlsa_to_rgba, total.getdata()))
    total.save('bubble_examples.png')

if __name__ == '__main__':
    main()
