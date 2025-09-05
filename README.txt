Hyper Geo Display

Hyper Geo Display is an application that visualizes recorded data from the Hyper Geo Host app.

This project includes two versions:
- Android app – runs on Android devices
- Python app – runs on Windows

Both apps share the same core functionality, adapted for each platform.

Features:
- Scroll, zoom, and pan the map
- Video playback with speed control
- Full path visualization with the current location
- Open individual images from the recordings folder
- Display GEO data for each image

Python (Windows) Version:

Running the app:
1. Navigate to:
   App/src/main/assets/Main.py
2. Run Main.py. A file selection window will appear.
3. Select the recordings folder from the Hyper Geo Host.

Required folder structure:
folder/
    recordings/recording_folder/
    logs/recording_.json

Usage:
- After selecting a folder, the recording window will open with a map.
- The video stream displays recorded images alongside your recorded path.
- Use the map and controls to explore recordings.

Android Version:

Running the app:
1. Build the project into an APK.
2. Install the APK on your Android device.
3. Launch the app. A file selection window will appear.
4. Select the recordings folder from the Hyper Geo Host.

Required folder structure:
Hyper GEO Scope/
    recordings/recording_folder/
    logs/recording_.json

Usage:
- After selecting a folder, the recording window will open with a map.
- Features are identical to the Python version: scroll, zoom, video speed control, path visualization, file open button, and GEO data display.