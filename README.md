# Multi Image Crop & Resizer — React Native (Expo)

Developed by **Ghulam Shabbir**,

---

## Project Structure

```
ImageCropResizer/
├── App.js                        ← Entry: back handler, fonts, SafeArea
├── app.json                      ← Expo config (Hermes, permissions, icons)
├── eas.json                      ← EAS Build: production = AAB, preview = APK
├── babel.config.js
├── package.json
├── assets/
│   ├── icon.png                  ← 1024×1024 app icon
│   ├── splash.png                ← 1242×2436 splash
│   ├── adaptive-icon.png         ← 1024×1024 adaptive icon foreground
│   └── fonts/
│       └── JameelNooriNastaleeq-subset.ttf   ← (optional, see Font Subsetting below)
└── src/
    ├── screens/
    │   └── HomeScreen.js         ← Main app UI and all logic
    └── components/
        ├── DaroodModal.js        ← Welcome & download Darood modals
        ├── GridPreview.js        ← Live grid overlay preview using SVG
        ├── ImageResultGrid.js    ← Processed images grid with rename inputs
        └── SliderRow.js          ← Margin/spacing slider component
```

---

## Prerequisites

- **Node.js** 18+
- **Expo CLI**: `npm install -g expo-cli`
- **EAS CLI**: `npm install -g eas-cli`
- **Expo account**: `eas login`
- **Android Studio** (for local builds) or EAS cloud build

---

## Installation

```bash
cd ImageCropResizer
npm install

# Install the community slider (required for SliderRow)
npx expo install @react-native-community/slider
```

---

## Running in Development

```bash
npx expo start

# Then press 'a' for Android emulator / scan QR for Expo Go
```

> **Note:** `@shopify/react-native-skia` and `expo-media-library` require a **development build** (not Expo Go).
> Create one with:
>
> ```bash
> eas build --profile development --platform android
> ```

---

## Building the APK / AAB

### Preview APK (for testing/sideloading)

```bash
eas build --profile preview --platform android
```

### Production AAB (for Google Play Store)

```bash
eas build --profile production --platform android
```

The production profile:

- Uses **Android App Bundle (.aab)** format (`bundleRelease`)
- Enables **Hermes** JS engine (`jsEngine: "hermes"` in app.json)
- Targets all ABI splits automatically (Play Store handles delivery)

---

## Key Features Implemented

### 1. Double-tap Back to Exit

`App.js` uses `BackHandler` with a 2-second window:

- First press → shows `"Press back again to exit"` toast
- Second press within 2s → `BackHandler.exitApp()`

### 2. Native Image Processing (`expo-image-manipulator`)

Replaces HTML5 Canvas. Uses native C++ image pipeline:

- **Grid mode**: `crop` action per cell → `resize` to target dimensions
- **Multiple mode**: `resize` each image
- **KB targeting**: binary search over `compress` quality (8 iterations max, ±2KB accuracy)
- All operations are async, non-blocking, hardware-accelerated

### 3. Gallery Save (`expo-media-library`)

Download button → Darood modal (2 clicks) → `MediaLibrary.saveToLibraryAsync()` for each processed image → Alert with success count.
No browser download, no WebView filesystem hacks.

### 4. Grid Preview with SVG Overlay

`GridPreview.js` renders the source image scaled to screen width, with `react-native-svg` `<Rect>` overlays showing each cell boundary in real time as sliders are adjusted.

### 5. Darood Modals

- **Welcome modal**: requires 10 counts before app unlocks
- **Download modal**: requires 2 counts before gallery save executes
- Animations: blink (Darood text), pulse (title), bounce (button), pop-in (Jazakallah)
- Urdu text rendered with `serif` / `GeezaPro` system fonts (or custom subset if provided)

### 6. RTL Grid Cropping (Column order preserved)

Grid iteration: `for c from cols-1 downto 0` — matches original HTML logic for right-to-left column ordering.

---

## Font Subsetting (Urdu — Under 300KB)

To embed **Jameel Noori Nastaleeq** with only the Urdu characters used in this app:

### Step 1 — Install pyftsubset

```bash
pip install fonttools brotli
```

### Step 2 — Define your Unicode range

The app uses these Urdu characters:

```
صلی اللہ علیہ والہ وسلم، جزاک اللہ خیر
ملٹی امیج کراپ اینڈ ریسائزر
```

### Step 3 — Subset the font

```bash
pyftsubset JameelNooriNastaleeq.ttf \
  --unicodes="U+0020,U+0021,U+0028,U+0029,U+062C,U+0632,U+0627,U+06A9,U+0644,U+06C1,U+062E,U+06CC,U+0631,U+0635,U+0644,U+06CC,U+0639,U+06C1,U+0648,U+0633,U+0645,U+060C,U+0698,U+06CC,U+0648,U+06CC,U+0644,U+067E,U+0631,U+0646,U+0633,U+067E,U+0644,U+06AF,U+0648,U+0631,U+0646,U+0645,U+0646,U+0679,U+06C1,U+0627,U+06CC,U+0631,U+0633,U+06CC,U+06A9,U+0646,U+0688,U+0631,U+06CC,U+0633,U+06A9,U+0648,U+0644,U+0648,U+0631,U+06CC,U+0627,U+0645,U+0648,U+0627,U+0644,U+0627,U+0645,U+0644,U+0679,U+06CC,U+0627,U+0645,U+06CC,U+062C,U+06A9,U+0631,U+0627,U+067E,U+0627,U+06CC,U+0646,U+0688,U+0631,U+06CC,U+0633,U+0627,U+0626,U+0632,U+0631" \
  --output-file=assets/fonts/JameelNooriNastaleeq-subset.ttf \
  --flavor=woff2
```

### Step 4 — Uncomment font loading in App.js

```js
const [fontsLoaded] = useFonts({
  JameelNooriNastaleeq: require("./assets/fonts/JameelNooriNastaleeq-subset.ttf"),
});
```

### Step 5 — Apply font in components

In `DaroodModal.js` and `HomeScreen.js`, replace:

```js
fontFamily: Platform.select({ android: "serif", ios: "GeezaPro" });
```

with:

```js
fontFamily: "JameelNooriNastaleeq";
```

Target size after subsetting: **~180–260KB** (well under 300KB).

---

## Permissions Required

| Permission                                    | Purpose                        |
| --------------------------------------------- | ------------------------------ |
| `READ_EXTERNAL_STORAGE` / `READ_MEDIA_IMAGES` | Pick images from gallery       |
| `WRITE_EXTERNAL_STORAGE`                      | Save to gallery (Android < 10) |
| `NSPhotoLibraryUsageDescription`              | iOS photo access               |

These are pre-configured in `app.json` and the `expo-media-library` plugin.

---

## Disabling Share / Long-press Gestures

In all `<Image>` components, long-press sharing is disabled by default in React Native (unlike WebView). No additional configuration needed. The `GestureHandlerRootView` wrapper in `App.js` only enables gesture detection for explicit `TouchableOpacity` interactions.

If you add `<Image>` inside a `<Pressable>`, ensure `onLongPress` is not bound.

---

## EAS Project ID

After running `eas build` for the first time, EAS will assign a project ID. Update `app.json`:

```json
"extra": {
  "eas": {
    "projectId": "your-actual-project-id"
  }
}
```

---

## Troubleshooting

| Issue                           | Fix                                                              |
| ------------------------------- | ---------------------------------------------------------------- |
| Slider not found                | Run `npx expo install @react-native-community/slider`            |
| Skia build error                | Ensure NDK 23+ is installed in Android Studio                    |
| Media library permission denied | Check `app.json` plugins section and rebuild                     |
| Hermes not active               | Confirm `"jsEngine": "hermes"` in `app.json` android block       |
| Font not rendering              | Check `.ttf` path and ensure `useFonts` is awaited before render |
