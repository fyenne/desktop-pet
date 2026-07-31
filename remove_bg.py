# remove_bg.py
import sys
import os

try:
    from rembg import remove
    from PIL import Image
except ImportError:
    print("\n[!] Dependencies missing!")
    print("Please install them in your Python environment by running:")
    print("    pip install rembg pillow")
    sys.exit(1)

def main():
    # If a file path is provided as a command-line argument, use it
    if len(sys.argv) >= 2:
        input_path = sys.argv[1]
    else:
        # Interactive fallback: Prompts the user to drag-and-drop or paste their image path
        print("\n=== AI Background Removal Utility ===")
        user_input = input("Please drag-and-drop or paste your image path here: ").strip()
        # Clean up any surrounding quotation marks added by dragging-and-dropping files in Windows
        input_path = user_input.strip('"').strip("'")
        
        if not input_path:
            print("[!] Error: No image path entered.")
            sys.exit(1)

    if not os.path.exists(input_path):
        print(f"\n[!] Error: Input file '{input_path}' not found.")
        sys.exit(1)

    # Set output path (default to replacing extension with _transparent.png)
    if len(sys.argv) >= 3:
        output_path = sys.argv[2]
    else:
        name, _ = os.path.splitext(input_path)
        output_path = f"{name}_transparent.png"

    print(f"\n[+] Analyzing image: {input_path}")
    print("[+] Removing background (this may take a few seconds on first run to download the model)...")

    try:
        input_image = Image.open(input_path)
        output_image = remove(input_image)
        output_image.save(output_path, "PNG")
        print(f"[✔] Success! Saved transparent avatar to: {output_path}\n")
    except Exception as e:
        print(f"[!] Failed to remove background: {e}\n")

if __name__ == "__main__":
    main()
