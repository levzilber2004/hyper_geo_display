import os
import shutil
import sys
# Appends the system to the base dir.
BASE_DIR = os.path.dirname(__file__) 
sys.path.append(BASE_DIR)

from http.server import SimpleHTTPRequestHandler, HTTPServer
from PyQt5.QtWidgets import QApplication, QMainWindow
from PyQt5.QtWebEngineWidgets import QWebEngineView
from PyQt5.QtGui import QIcon
from PyQt5.QtCore import QVariant, QUrl, QObject, pyqtSlot, pyqtSignal
from PyQt5.QtWebChannel import QWebChannel
import exifread
import ctypes
import logging
import json
from datetime import datetime
import tkinter as tk
import subprocess
import threading
from tkinter import filedialog
from http.server import HTTPServer, SimpleHTTPRequestHandler

class QuietHandler(SimpleHTTPRequestHandler):
    def copyfile(self, source, outputfile):
        try:
            shutil.copyfileobj(source, outputfile)
        except (ConnectionAbortedError, ConnectionResetError):
            # Ignore client disconnect errors
            pass

    def end_headers(self):
        # Add CORS headers 
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200, "OK")
        self.end_headers()

    def log_message(self, format, *args):
        pass  # Override to disable logging.

class PythonThread(threading.Thread):
        def __init__(self, function, options):
            super().__init__()
            self.function = function
            self.options = options

        def run(self):
            logging.info("Thread started running...")
            self.function() if self.options is None else self.function(self.options)
            del globals()['thread']
                
        def stop(self):
            logging.info("Thread stopped running... don't worry about the error, it's intentional ;)")
            if not self.thread.is_alive(): 
                return
    
            exc = ctypes.py_object(SystemExit)
            res = ctypes.pythonapi.PyThreadState_SetAsyncExc(ctypes.c_long(self.thread.ident), exc)
            if res == 0:
                raise ValueError("Invalid thread ID")
            elif res > 1:
                # If it returns more than one, undo the change
                ctypes.pythonapi.PyThreadState_SetAsyncExc(self.thread.ident, None)
                raise SystemError("PyThreadState_SetAsyncExc failed")
    

class PythonBridge(QObject):
    sendJsCommand = pyqtSignal(str)

    @pyqtSlot(str)
    def send_message(self, message):
        print("Message from JavaScript:", message)
  

    def rgba_to_hex(self, rgba):
        return '#{:02x}{:02x}{:02x}{:02x}'.format(*rgba)

    @pyqtSlot(QVariant, result=str) 
    def dir_selector(self, options):
        dir_path = filedialog.askdirectory(title=options['title'])
        return dir_path
    
    @pyqtSlot(QVariant, result=str)
    def file_selector(self, options):
        file_path = filedialog.askopenfilename(title=options['title'],
        filetypes=[(options['text'], options['type'])])
        return file_path
    
    @pyqtSlot(str, result=str)
    def read_json_as_text(self, file_path):
        with open(file_path, 'r') as file:
            return str(file.read())

    @pyqtSlot(QVariant, result=str) 
    def dir_selector(self, options):
        dir_path = filedialog.askdirectory(title=options['title'])
        return dir_path
    
    def _convert_to_degrees(self, value):
        """Helper to convert GPS coordinates to decimal degrees"""
        d = float(value.values[0].num) / float(value.values[0].den)
        m = float(value.values[1].num) / float(value.values[1].den)
        s = float(value.values[2].num) / float(value.values[2].den)
        return d + (m / 60.0) + (s / 3600.0)

    @pyqtSlot(str, result=str)
    def read_dji_images(self, path):
        geo_info_list = []
        print(f"Reading folder: {path}.")
        for filename in os.listdir(path):
            if filename.lower().endswith(".jpg"):
                file_path = os.path.join(path, filename)
                with open(file_path, 'rb') as f:
                    tags = exifread.process_file(f, details=False)
                    try:
                        lat = self._convert_to_degrees(tags["GPS GPSLatitude"])
                        lon = self._convert_to_degrees(tags["GPS GPSLongitude"])
                        lat_ref = tags["GPS GPSLatitudeRef"].values
                        lon_ref = tags["GPS GPSLongitudeRef"].values

                        if lat_ref != "N":
                            lat = -lat
                        if lon_ref != "E":
                            lon = -lon

                        # Parse timestamp
                        timestamp_str = tags.get("EXIF DateTimeOriginal") or tags.get("Image DateTime")
                        if timestamp_str:
                            timestamp = str(timestamp_str).replace(":", "_").replace(" ", "_")
                        else:
                            timestamp = -500

                        geo_info_list.append({
                            "file": filename,
                            "latitude": lat,
                            "longitude": lon,
                            "timestamp": timestamp,
                            "yaw": -500,
                            "pitch": -500,
                            "roll": -500,
                        })
                    except KeyError:
                        print(f"No GPS or timestamp data in {filename}")
                        continue

        # Sort by timestamp.
        geo_info_list = sorted(geo_info_list, key=lambda x: x["timestamp"] or datetime.min)
        return json.dumps(geo_info_list)
    
    
    @pyqtSlot(result=bool)
    def has_server_started(self):
            return HTMLViewer.static_has_server_started


    @pyqtSlot(str, QVariant) 
    def run_thread(self, method, options):
        global thread
        thread = PythonThread(getattr(self, method), options)   
        thread.thread = thread
        thread.start()
        

    @pyqtSlot(str)
    def open_file_path(self, path):
        # Converts to proper Windows format.
        normalized_path = os.path.normpath(path)
        if os.path.exists(normalized_path):
            subprocess.run(['explorer', f'/select,{normalized_path}'])


    @pyqtSlot(str)
    def start_server(self, path):
        os.chdir(path)  # Change working dir so server serves from here.
        PORT = 8000
        with HTTPServer(('', PORT), QuietHandler) as httpd:
            print(f"Serving {path} at http://localhost:{PORT}")
            HTMLViewer.static_has_server_started = True
            httpd.serve_forever()
   

    

    @pyqtSlot(result=str)
    def get_default_disk(self):
        return os.path.abspath(os.sep)
    
    @pyqtSlot(str)
    def execute_js(self, command):
        self.sendJsCommand.emit(command)
            

class HTMLViewer(QMainWindow):
    static_has_server_started = False

    def __init__(self):
        super().__init__()
        # removes cache

        self.setWindowTitle("HYPER GEO DISPLAY")
        self.setGeometry(100, 100, 1280, 720)

        # Initialize QWebEngineView to display HTML content
        self.browser = QWebEngineView()

        # Load HTML content from a separate file
        html_path = os.path.join(BASE_DIR, 'javascript', 'Main.html')
        self.browser.setUrl(QUrl.fromLocalFile(html_path))
        icon_path = os.path.join(BASE_DIR, 'images', 'app-logo.png')
        self.setWindowIcon(QIcon(icon_path)) 

  
        # Set up QWebChannel to connect JavaScript with Python
        self.channel = QWebChannel()
        self.python_bridge = PythonBridge()

        self.channel.registerObject("bridge", self.python_bridge)
        self.browser.page().setWebChannel(self.channel)

        # Set the browser widget as the central widget of the window
        self.setCentralWidget(self.browser)


# Initialize the application and main window
root = tk.Tk()
root.withdraw()
app = QApplication(sys.argv)
window = HTMLViewer()
# window = HTMLViewer(False)
window.show()
sys.exit(app.exec_())    
