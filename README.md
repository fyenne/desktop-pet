# 🐾 Multi-Pet Customizable Desktop Companion

A lightweight, modern, and highly interactive multi-pet desktop widget framework built with **Electron, Node.js, and HTML5/CSS**. 

Users can upload any photo (like friends, celebrities, pets, or avatars), and the application dynamically crops it, placing it on custom animated, cute cartoon dog/cat bodies. The pets waddle, trot, and roam autonomously across your **entire screen**, dodge each other dynamically, speak in customizable Chinese chat boxes, and actively chase your mouse cursor!

---

## ✨ Features
- **Transparent Fullscreen Canvas:** Completely borderless, always-on-top, transparent overlays that never block clicks to your desktop background icons.
- **Customizable Photo Cutouts:** Centers and crops any JPG, PNG, WebP, or GIF to act as your pet's head.
- **Multi-Pet Spawning (Multiplayer):** Right-click context menus allow you to spawn multiple pets at once. Each pet possesses its own independent avatar, speed, scale, and character style.
- **Autonomous Dodge (Reynolds' Flocking Separation):** Coordinated via an IPC position-update loop. Pets calculate proximity repulsion angles with **randomized angle jitter** to realistically dodge and waddle around each other (and walk around sleeping friends!).
- **Mouse Chasing & Companion:** The pets actively run toward your cursor when close. A funny custom **poop emoji (`💩`) companion** floats next to your standard Windows mouse cursor globally across your monitors!
- **Playful Whip Interaction:** Left-clicking your pet crack-waves a curved leather whip and snap-rotates its head by **45 degrees** around its neck pivot point.
- **Dynamic Chinese Speech Bubbles:** Pops open bouncy chat boxes every random 3–6 seconds with customizable humorous phrases (e.g., "爸爸！", "主人，好饿呀", "爸爸，抱抱我").
- **Automatic Settings Persistence:** Saves and loads all pet parameters dynamically to a local JSON database, with built-in backwards-compatible data migrations.

---

## 📂 Codebase & Major Scripts Explained

All scripts are structured to maintain strict separation of concerns, are highly modular, and contain **zero hardcoded absolute paths** (allowing seamless cross-machine replication):

### 1. Main Process (`main.js`)
- **Responsibility:** Spawns and tracks all active window overlays keyed by `petId`. 
- **OS Integration:** Mounts native Windows right-click context menus, handles Electron's standard file-picker dialogs, and coordinates window click-through toggles.
- **Cursor Server:** Polls global, native coordinate points at **30Hz** (`screen.getCursorScreenPoint()`) and broadcasts them to all renderers, ensuring smooth tracking even when windows ignore mouse events.

### 2. Renderer Process (`renderer.js`)
- **Responsibility:** Executes the 60FPS physics and rendering loop using `requestAnimationFrame`.
- **Game AI:** Coordinates state machines (`idle`, `walking`, `running`, `sleeping`), randomly targets coordinate objectives, manages file Drag & Drop image loading, and triggers bouncy speech bubble timers.

### 3. Physics Mathematics (`physics.js`)
- **Responsibility:** Pure, self-contained vector-based mathematics.
- **Formulas:**
  - `calculateVelocity()`: Calculates distance/direction vectors, interpolates current velocity towards the target at defined acceleration scales (adding smooth waddle inertia and momentum), and clamps maximum speeds.
  - `clampPosition()`: Clamps coordinate offsets to prevent pets from walking off-screen.

### 4. Style Sheets (`style.css`)
- **Responsibility:** Manages page layout, transparent overlays, and animations.
- **Keyframe Sets:**
  - `@keyframes legWalk`: Rotates front and back legs in opposite phase offsets.
  - `@keyframes tailWag`: Swings tails at different speeds depending on idle or running states.
- **Custom Breeds:** Scopes custom sizes, gradients, and assets to individual class tags:
  - `.body-style-golden`: Default golden pup.
  - `.body-style-corgi`: Short legs, long orange coat, white belly, puff tail.
  - `.body-style-greyhound`: Tall athletic charcoal build, tan shoulder spots, whip tail.
  - `.body-style-dalmatian`: Polka-dot spots generated procedurally via CSS radial-gradients.

### 5. Config Database (`config-manager.js`)
- **Responsibility:** Reads/writes JSON profiles to `%APPDATA%/desktop-pet/config.json`.
- **Migration Engine:** If a legacy single-pet config is loaded, it dynamically migrates it to the new array structure without data loss.

---

## 🐍 Python Image Tools Included
Inside the project directory, we have included two pre-built python scripts to help you customize your avatars:

### `remove_bg.py` (Background Eraser)
Removes the background of any portrait or face JPEG/PNG automatically using deep learning (`rembg` AI models) and outputs a transparent PNG:
```bash
pip install rembg pillow
python remove_bg.py my_face.jpg
```
*Outputs: `my_face_transparent.png`*

### `flip_avatar.py` (Horizontal Mirroring)
Horizontally mirrors any transparent avatar PNG in-place so that its eyes/face orient correctly with the dog's right-sided neck direction:
```bash
python flip_avatar.py assets/default-face.png
```

---

## ⚙️ How to Tune Coordinates & Position

Because the photo is centered on a transparent canvas and aligned on top of the moving dog body, you can easily shift the face's default horizontal and vertical attachment offsets to fit any picture shape.

Open **`desktop-pet/style.css`** and find the `.pet-face` selector:

```css
.pet-face {
  width: 75px;
  height: 75px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center bottom;
  
  /* TUNING CHUNK: Modify the X and Y translate values here! */
  transform: translate(6px, -12px); 
  
  transform-origin: bottom left; /* Pivot point for whip-cracking rotations */
  transition: transform 0.1s ease-in-out;
  z-index: 2;
}
```

- **Horizontal tuning (X-axis):** Modify `6px`. Increasing it moves the head further **forward (right)** on the neck. Decreasing it moves it **backward (left)**.
- **Vertical tuning (Y-axis):** Modify `-12px`. Making it more negative (e.g., `-18px`) moves the head **higher up**. Making it closer to zero (e.g., `-6px`) moves the head **lower down**.

---

## 💾 How to Load Custom Images
You can swap a pet's face using either of these two methods:
1. **Drag-and-Drop:** Drag any PNG/JPG file from your Windows File Explorer and **drop it directly on top of your pet's body**. The app will instantly save and load the new face!
2. **Context Menu:** Right-click your pet, select **"Change Face..."**, and browse for any picture file.

---

## 🚀 Installation & Launch

To start your desktop pet pack:

```bash
# 1. Navigate to the project directory
cd desktop-pet

# 2. Install Electron dependencies
npm install

# 3. Boot up the app!
npm start
```
