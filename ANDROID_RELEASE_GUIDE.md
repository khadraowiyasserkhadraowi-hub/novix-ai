# 🚀 Novix AI — Android Release & Google Play Store Guide

This document provides a comprehensive, step-by-step manual to build, sign, and compile a production-ready **Android APK** and **AAB (Android App Bundle)** for **Novix AI** using this workspace's configurations and assets.

Novix AI is fully equipped with Google Play Store-compliant assets, including a high-fidelity **App Icon**, a tailored **Splash Screen**, standard mobile viewport controls (disabling browser-zoom scaling issues), and a custom **Web App Manifest (`/public/manifest.json`)**.

---

## 🛠️ Option 1: Direct Signed APK & AAB Generation via PWABuilder (Fastest & Easiest)

Google Play natively supports **Trusted Web Activities (TWAs)**. This allows you to package a modern web application into a signed `.apk` and `.aab` for the Google Play Store in under 5 minutes without writing any native Java/Kotlin code.

1. **Deploy your Web App**: Ensure your Novix AI app is deployed and accessible via its live URL (e.g., your Cloud Run production URL).
2. **Go to PWABuilder**: Visit [PWABuilder.com](https://www.pwabuilder.com/).
3. **Analyze your App**: Enter your deployed Web App URL and click **Start**. PWABuilder will automatically scan your `manifest.json` and verify full Google Play Store compliance.
4. **Generate the Package**:
   - Click **Build My App** and select **Android**.
   - Click **Options** to customize your package name (e.g., `com.novix.ai`), version code, and status bar color.
   - Enter your key credentials or let PWABuilder generate a safe signing key for you.
5. **Download**: Download the output zip file containing:
   - `app-release.aab` (upload this to the Google Play Console).
   - `app-release.apk` (install this directly on your physical Android devices for testing).

---

## 🤖 Option 2: Wrap with Capacitor (Native Android Project)

If you need advanced offline plugins or deep integration with Android SDKs, use **Capacitor** (the successor to Cordova).

### Step 1: Install Capacitor Dependencies
Run the following commands on your local development machine in your project root:
```bash
npm install @capacitor/core @capacitor/cli
```

### Step 2: Initialize Capacitor
Initialize Capacitor with your App Name and Package ID:
```bash
npx cap init "Novix AI" "com.novix.ai" --web-dir=dist
```

### Step 3: Add the Android Platform
Install the Android integration package and add the project:
```bash
npm install @capacitor/android
npx cap add android
```

### Step 4: Build & Sync
Build your React production package and synchronize it with the Android project folder:
```bash
npm run build
npx cap sync
```

### Step 5: Open in Android Studio & Generate Signed APK / AAB
Open the native project inside Android Studio:
```bash
npx cap open android
```

Once Android Studio opens:
1. Go to **Build** > **Generate Signed Bundle / APK...**
2. Choose **Android App Bundle (AAB)** (for Google Play submission) or **APK** (for direct device installation).
3. Create a new Keystore file (if you do not have one), set a strong password, and select your alias.
4. Set the Build Variant to **release** and select **V1 / V2 Signature** options.
5. Click **Finish**. Android Studio will compile and output your production-signed `app-release.aab` and `app-release.apk` files in `android/app/release/`.

---

## 🔗 Digital Asset Links (Hiding the Browser URL Bar)

For a fully native feel (removing the browser URL wrapper bar when launched on Android), Google Play requires proving domain ownership using a **Digital Asset Link**.

1. Create a folder in your public directory named `.well-known`.
2. Inside it, create a file named `assetlinks.json`:
   ```json
   [
     {
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "com.novix.ai",
         "sha256_cert_fingerprints": ["YOUR_PLAY_STORE_SHA256_CERT_FINGERPRINT"]
       }
     }
   ]
   ```
3. When deployed, Google will verify that `https://yourdomain.com/.well-known/assetlinks.json` matches your app’s signature, unlocking seamless fullscreen display on all devices.
