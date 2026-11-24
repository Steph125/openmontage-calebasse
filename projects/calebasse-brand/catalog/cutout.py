"""Cut a packshot out of its plain light background (no ML install): GrabCut seeded by a
background flood-fill, then a feathered alpha edge. Usage: cutout.py <in.jpg> <out.png>"""
import sys

import cv2
import numpy as np


def cutout(src: str, dst: str, tol: int = 14) -> None:
    img = cv2.imread(src, cv2.IMREAD_COLOR)
    h, w = img.shape[:2]
    # 1) background seed: flood fill from the border with a colour tolerance
    ff = np.zeros((h + 2, w + 2), np.uint8)
    seeds = [(x, 0) for x in range(0, w, 16)] + [(x, h - 1) for x in range(0, w, 16)] + [(0, y) for y in range(0, h, 16)] + [(w - 1, y) for y in range(0, h, 16)]
    flags = 4 | cv2.FLOODFILL_MASK_ONLY | cv2.FLOODFILL_FIXED_RANGE | (255 << 8)
    for s in seeds:
        if ff[s[1] + 1, s[0] + 1] == 0:
            cv2.floodFill(img, ff, s, (0, 0, 0), (tol,) * 3, (tol,) * 3, flags)
    bg = ff[1:-1, 1:-1] > 0
    # 2) GrabCut refinement: flood-filled = sure background, far interior = probable foreground
    mask = np.full((h, w), cv2.GC_PR_FGD, np.uint8)
    mask[bg] = cv2.GC_BGD
    core = cv2.erode((~bg).astype(np.uint8), np.ones((25, 25), np.uint8))
    mask[core > 0] = cv2.GC_FGD
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(img, mask, None, bgd, fgd, 4, cv2.GC_INIT_WITH_MASK)
    fg = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    # 3) keep the largest connected blobs, close holes, feather the edge
    n, lab, stats, _ = cv2.connectedComponentsWithStats(fg, 8)
    if n > 1:
        keep = np.zeros_like(fg)
        areas = stats[1:, cv2.CC_STAT_AREA]
        big = areas.max()
        for i, a in enumerate(areas, 1):
            if a > big * 0.04:
                keep[lab == i] = 255
        fg = keep
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    alpha = cv2.GaussianBlur(fg, (0, 0), 1.2)
    ys, xs = np.where(alpha > 8)
    y0, y1, x0, x1 = max(0, ys.min() - 4), min(h, ys.max() + 5), max(0, xs.min() - 4), min(w, xs.max() + 5)
    rgba = np.dstack([img, alpha])[y0:y1, x0:x1]
    cv2.imwrite(dst, rgba)


if __name__ == "__main__":
    cutout(sys.argv[1], sys.argv[2])
