# flip_avatar.py
import sys
import os
from PIL import Image


def flip_image(image_path):
    if not os.path.exists(image_path):
        print(f"[!] Error: File '{image_path}' not found.")
        return False

    print(f"[+] Loading image: {image_path}")
    try:
        img = Image.open(image_path)
        # Flip horizontally (Left to Right)
        flipped_img = img.transpose(Image.FLIP_LEFT_RIGHT)
        flipped_img.save(image_path, "PNG")
        print(f"[✔] Success! Horizontally flipped and saved: {image_path}")
        return True
    except Exception as e:
        print(f"[!] Failed to flip image: {e}")
        return False


def main():
    # If a file path is given as an argument, use that
    if len(sys.argv) >= 2:
        target = sys.argv[1]
        flip_image(target)
        sys.exit(0)

    # Otherwise, auto-detect transparent or face files in local directories
    search_paths = ["assets/default-face.png", "default-face.png"]

    # Look for any png files ending in _transparent.png in the current directory
    for f in os.listdir("."):
        if f.endswith("_transparent.png"):
            search_paths.insert(0, f)

    # Also look in assets folder if it exists
    if os.path.exists("assets"):
        for f in os.listdir("assets"):
            if f.endswith("_transparent.png") or f.startswith("face"):
                search_paths.insert(0, os.path.join("assets", f))

    found = False
    for path in search_paths:
        if os.path.exists(path):
            flip_image(path)
            found = True
            break

    if not found:
        print("\n[!] No default avatar files found to flip.")
        print("Usage: python flip_avatar.py <image_path>")
        print("Example: python flip_avatar.py my_face_transparent.png\n")


if __name__ == "__main__":
    main()
