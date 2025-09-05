package me.lev.hypergeodisplay

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.content.pm.ActivityInfo
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.DocumentsContract
import android.provider.Settings
import android.util.Log
import android.view.View
import android.webkit.MimeTypeMap
import android.webkit.WebView
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.RequiresApi
import androidx.core.content.FileProvider
import java.io.File


class MainActivity : ComponentActivity() {

    private lateinit var _webView: WebView
    private lateinit var _fileServer: FileServer
    private lateinit var _lastSelectedFileType: String
    private lateinit var dirSelectorLauncher: ActivityResultLauncher<Intent>
    private var _hasServerStarted = false
    private val FILE_SELECT_CODE = 1001
    private val WEB_VIEW_PATH = "file:///android_asset/javascript/Main.html"



    /**
     * This function in initiates the app.
     */
    @SuppressLint("NewApi")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // This makes sure the code doesn't run twice at the same time.
        val currentOrientation = resources.configuration.orientation
        if (currentOrientation != Configuration.ORIENTATION_LANDSCAPE) {
            requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        } else {
            // Sets the main overlay to be enabled.
            setContentView(R.layout.main_overlay)

            // Hides the action bar.
            hideActionBar()

            // Creates the dir picker launcher.
            createDirSelectorLauncher()
        }
        // Checks the permissions.
        checkForPermissions()

    }

    /////////////////////////////////////////////////////////////////////////////////////////
    // PUBLIC FUNCTIONS.
    /////////////////////////////////////////////////////////////////////////////////////////

    /**
     *  This function opens the file selector.
     */
    fun openFileSelector(type: String) {
        val intent = Intent(Intent.ACTION_GET_CONTENT)
        intent.setType(type)
        intent.addCategory(Intent.CATEGORY_OPENABLE)
        try {
            Toast.makeText(this, "Please select a log path.", Toast.LENGTH_LONG).show()
            startActivityForResult(Intent.createChooser(intent, "Select a file"), FILE_SELECT_CODE)
            _lastSelectedFileType = type
        } catch (_: ActivityNotFoundException) {}
    }

    /**
     * This function opens the dir selector.
     */
    fun openDirSelector() {
        Toast.makeText(this, "Please select a recording dir.", Toast.LENGTH_LONG).show()
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT_TREE).apply {
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
            addFlags(Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION)
            addFlags(Intent.FLAG_GRANT_PREFIX_URI_PERMISSION)
        }
        dirSelectorLauncher.launch(intent)
    }








    /**
     * This function starts a server at a specified path.
     */
    fun startServer(path: String) {
        val recordingsDir = File(path)

        if (recordingsDir.exists() && recordingsDir.isDirectory) {
            _fileServer = FileServer(recordingsDir)
            _fileServer.start()
            _hasServerStarted = true
        } else {

            openFileSelector(_lastSelectedFileType)
        }
    }

    /**
     * This function reads a json file as text.
     */
    fun readJsonAsText(path: String): String {
        val fullPath = File(path)
        return try {
            fullPath.readText(Charsets.UTF_8)
        } catch (e: Exception) {
            ""
        }
    }

    /**
     * This function returns true if the file server has started.
     */
    fun hasServerStarted(): Boolean {
        return _hasServerStarted;
    }

    /**
     * This function opens a recording image with the file explorer.
     */
    fun openRecordingImageWithExplorer(path: String) {
        val file = File(path)
        openFileWithExplorer(this, file)
    }




    /////////////////////////////////////////////////////////////////////////////////////////
    // PRIVATE FUNCTIONS.
    /////////////////////////////////////////////////////////////////////////////////////////

    /**
     * This function extracts the recording name.
     */
    private fun extractRecordingName(uriString: String): String? {
        val startIndex = uriString.indexOf("recording_")
        if (startIndex == -1) return null
        return uriString.substring(startIndex)
    }


    /**
     * This function hides the action bar for the app.
     */
    private fun hideActionBar() {
        window.apply {
            statusBarColor = android.graphics.Color.TRANSPARENT
            navigationBarColor = android.graphics.Color.TRANSPARENT
            addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            decorView.systemUiVisibility = (
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
                            View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
                            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
                            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or
                            View.SYSTEM_UI_FLAG_FULLSCREEN or
                            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    )
        }
    }

    /**
     * This function returns a real path from tree uri.
     */
    private fun getRealPathFromTreeUri(uri: Uri): String? {
        val docId = DocumentsContract.getTreeDocumentId(uri)
        val parts = docId.split(":")

        if (parts.size == 2 && parts[0] == "primary") {
            return "/storage/emulated/0/${parts[1]}"
        }
        return null
    }


    /**
     * This function checks for permissions.
     */

    @RequiresApi(Build.VERSION_CODES.O)
    private fun checkForPermissions() {
        // External storage permission check and start.
        if (
            checkSelfPermission(android.Manifest.permission.MANAGE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(android.Manifest.permission.MANAGE_EXTERNAL_STORAGE), 0)
        }
    }

    /**
     * This function loads the camera webivew overlay.
     */
    @SuppressLint("RestrictedApi", "SetJavaScriptEnabled")
    private fun loadWebViewOverlay() {
        // Create root container to hold camera preview and overlay.
        _webView = findViewById(R.id.web_view)
        _webView.setBackgroundColor(0x00000000)
        _webView.setLayerType(View.LAYER_TYPE_SOFTWARE, null)
        _webView.settings.javaScriptEnabled = true
        _webView.settings.builtInZoomControls = false
        _webView.settings.displayZoomControls = false
        _webView.settings.setSupportZoom(false)

        // Add JS interface and load URL in code.
        _webView.addJavascriptInterface(WebViewInterface(this), "interfaceModule")
        _webView.loadUrl(WEB_VIEW_PATH)
    }


    /**
     * This function creates the dir picker launcher handler.
     */
    private fun createDirSelectorLauncher() {
        dirSelectorLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            if (result.resultCode == Activity.RESULT_OK) {
                val treeUri: Uri? = result.data?.data
                treeUri?.let {
                    // Persist permission so you can access it later
                    contentResolver.takePersistableUriPermission(
                        it,
                        Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION
                    )

                    val realPath = getRealPathFromTreeUri(treeUri)
                    Log.d("BRO!!!!", "Inferred real path: $realPath")
                    _webView.evaluateJavascript("continueDirSelection('${realPath}');", null)
                }

            }
        }
    }

    /**
     * This function opens a file with the file explorer.
     */
    private fun openFileWithExplorer(context: Context, file: File) {
        try {
            val uri = FileProvider.getUriForFile(context, "${context.packageName}.provider", file)

            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, getMimeType(file))
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            context.startActivity(intent)
        } catch (e: ActivityNotFoundException) {
            Toast.makeText(context, "No app found to open this file type", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            Toast.makeText(context, "Error opening file: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    /**
     * This function gets the mime type of a file.
     */
    private fun getMimeType(file: File): String {
        val extension = MimeTypeMap.getFileExtensionFromUrl(file.toURI().toString())
        return MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension.lowercase()) ?: "*/*"
    }

    /////////////////////////////////////////////////////////////////////////////////////////
    // OVERRIDDEN FUNCTIONS.
    /////////////////////////////////////////////////////////////////////////////////////////

    /**
     * This function asks for the permission from the user to open the camera and his location.
     */
    @RequiresApi(Build.VERSION_CODES.R)
    @Deprecated("This function is deprecated.")
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == 0) {
            val hasExternalStorage =  Environment.isExternalStorageManager()
            if (!hasExternalStorage) {
                Toast.makeText(this, "Storage permission is required.", Toast.LENGTH_SHORT).show()
                val intent = Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION)
                val uri = Uri.fromParts("package", packageName, null)
                intent.data = uri
                startActivity(intent)
            } else {
                // Loads the web-view layout.
                loadWebViewOverlay()
            }

        }
    }


    /**
     * This function overrides a default function in android and makes sure that a file is selected always.
     */
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == FILE_SELECT_CODE) {
            if (resultCode == Activity.RESULT_OK) {
                data?.data?.let { uri ->
                    // You got the URI of the selected file
                    val path = uri.toString()
                    val recordingName = extractRecordingName(path);
                    if (recordingName != null) {
                        // Continues the file selection.
                        _webView.evaluateJavascript("continueFileSelection('${recordingName}');", null)
                    } else {
                        openFileSelector(_lastSelectedFileType)
                    }
                }
            } else {
                openFileSelector(_lastSelectedFileType)
            }
        }
    }
}





