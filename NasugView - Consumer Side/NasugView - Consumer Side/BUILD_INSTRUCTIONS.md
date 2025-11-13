# Build Instructions for NasugView (Android & iOS)

## Prerequisites

### For Android:
- Android Studio installed
- Android SDK (API 33 or higher)
- Java JDK 11 or higher

### For iOS (Mac only):
- macOS computer
- Xcode 14 or higher
- CocoaPods installed (`sudo gem install cocoapods`)

---

## Building for Android

### Option 1: Using Expo CLI (Recommended)
```bash
# Build and run on connected Android device/emulator
npx expo run:android
```

### Option 2: Using Android Studio
1. Open Android Studio
2. Open project folder: `android/`
3. Wait for Gradle sync to complete
4. Click "Run" button or press Shift+F10

### Option 3: Generate APK
```bash
cd android
./gradlew assembleRelease

# APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

---

## Building for iOS (Mac Required)

### Step 1: Install iOS Dependencies
```bash
cd ios
pod install
cd ..
```

### Step 2: Build and Run

#### Option 1: Using Expo CLI (Recommended)
```bash
npx expo run:ios
```

#### Option 2: Using Xcode
1. Open Xcode
2. Open file: `ios/NasugView2.xcworkspace` (NOT .xcodeproj!)
3. Select your device/simulator
4. Click "Run" button or press Cmd+R

---

## Development Workflow

### Start Metro Bundler
```bash
npm start
```

### Run on Android
```bash
# In a new terminal
npx expo run:android
```

### Run on iOS (Mac only)
```bash
# In a new terminal
npx expo run:ios
```

---

## Testing OCR on Real Devices

### Android:
1. Enable USB Debugging on your Android phone
2. Connect via USB
3. Run: `npx expo run:android`
4. App will install and launch automatically

### iPhone:
1. Connect iPhone via USB
2. Trust the computer on iPhone
3. Run: `npx expo run:ios --device`
4. App will install and launch automatically

---

## Important Notes

### ML Kit Text Recognition:
- ✅ Works on **both Android and iOS**
- ✅ 100% offline (no internet required)
- ✅ No API keys needed
- ⚠️ **Does NOT work with Expo Go** - requires custom build

### First Build Time:
- Android: ~5-10 minutes
- iOS: ~10-15 minutes
- Subsequent builds are much faster

### App Size:
- Android APK: ~50-70 MB
- iOS IPA: ~60-80 MB
- ML Kit adds ~10-15 MB to app size

---

## Troubleshooting

### Android Build Failed:
```bash
# Clean build
cd android
./gradlew clean
cd ..
npx expo run:android
```

### iOS Build Failed:
```bash
# Clean and reinstall pods
cd ios
pod deintegrate
pod install
cd ..
npx expo run:ios
```

### Metro Bundler Issues:
```bash
# Clear cache and restart
npx expo start --clear
```

---

## Production Builds

### Android (APK/AAB):
```bash
cd android
./gradlew bundleRelease  # For Google Play Store (AAB)
./gradlew assembleRelease  # For direct installation (APK)
```

### iOS (IPA) - Mac Required:
1. Open Xcode
2. Select "Generic iOS Device"
3. Product → Archive
4. Distribute App → App Store Connect / Ad Hoc

---

## ML Kit Features Working:

✅ **Text Recognition** (OCR)
- Extracts text from images
- Recognizes printed text
- Works with business permits, IDs, receipts
- Supports multiple languages

✅ **Offline Processing**
- No internet connection required
- All processing happens on device
- Fast and private

✅ **Cross-Platform**
- Same code works on Android and iOS
- Native performance on both platforms

---

## Questions?

If you encounter issues:
1. Make sure you're NOT using Expo Go
2. Rebuild the app after installing new packages
3. Clear Metro bundler cache: `npx expo start --clear`
4. Check that native directories exist: `android/` and `ios/`
