package me.lev.hypergeodisplay

import androidx.exifinterface.media.ExifInterface
import android.os.Build
import android.util.Log
import android.webkit.JavascriptInterface
import android.widget.Toast
import androidx.annotation.RequiresApi
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

class WebViewInterface(private val activity: MainActivity) {

    /**
     * This function opens the file path.
     */
    @android.webkit.JavascriptInterface
    fun open_file_path(path: String) {
        activity.openRecordingImageWithExplorer(path);
    }

    /**
     * This function opens the file selector.
     */
    @android.webkit.JavascriptInterface
    fun file_selector(options: String) {
        activity.openFileSelector(options)
    }


    /**
     * This function opens the dir selector.
     */
    @android.webkit.JavascriptInterface
    fun dir_selector(options: String) {
        activity.openDirSelector()
    }

    /**
     * This function reads json as text from a path.
     */
    @android.webkit.JavascriptInterface
    fun read_json_as_text(path: String): String {
        return activity.readJsonAsText(path);
    }


    /**
     * This function starts the server.
     */
    @android.webkit.JavascriptInterface
    fun start_server(path: String) {
        activity.startServer(path);
    }

    /**
     * This function returns true if the server has started.
     */
    @android.webkit.JavascriptInterface
    fun has_server_started(): Boolean {
        return activity.hasServerStarted();
    }

    /**
     * This function reads the dji images and returns their data including lat lon and timestamp.
     */
    @android.webkit.JavascriptInterface
    fun read_dji_images(path: String): String {
        val geoInfoList = mutableListOf<JSONObject>()
        val dir = File(path)
        if (!dir.exists() || !dir.isDirectory) {
            println("Directory does not exist: $path")
            return "[]"
        }

        val files = dir.listFiles { file -> file.extension.equals("jpg", ignoreCase = true) } ?: return "[]"

        for (file in files) {
            try {
                val exif = ExifInterface(file.absolutePath)

                // Extract GPS info
                val latLong = exif.latLong
                val lat = latLong?.get(0) ?: continue
                val lon = latLong?.get(1) ?: continue

                // Extract timestamp (DateTimeOriginal or DateTime)
                val dateTimeOriginal = exif.getAttribute(ExifInterface.TAG_DATETIME_ORIGINAL)
                val dateTime = exif.getAttribute(ExifInterface.TAG_DATETIME)
                val timestampStr = dateTimeOriginal ?: dateTime

                // Parse timestamp string and convert to a sortable format
                val timestamp = if (timestampStr != null) {
                    timestampStr.replace(":", "_").replace(" ", "_")
                } else {
                    "-500"
                }

                // Build JSON object for this image
                val jsonObj = JSONObject()
                jsonObj.put("file", file.name)
                jsonObj.put("latitude", lat)
                jsonObj.put("longitude", lon)
                jsonObj.put("timestamp", timestamp)
                jsonObj.put("yaw", -500)
                jsonObj.put("pitch", -500)
                jsonObj.put("roll", -500)

                geoInfoList.add(jsonObj)
            } catch (e: Exception) {
                println("Error processing file ${file.name}: ${e.message}")
                continue
            }
        }

        // Sort by timestamp (lex order works because of formatting)
        geoInfoList.sortWith(compareBy { it.optString("timestamp") })

        // Return JSON array string
        val jsonArray = JSONArray(geoInfoList)
        return jsonArray.toString()
    }



}