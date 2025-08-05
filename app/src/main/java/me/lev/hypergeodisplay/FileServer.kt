package me.lev.hypergeodisplay

import com.koushikdutta.async.http.server.AsyncHttpServer
import java.io.File

class FileServer(private val rootDir: File) {

    private val server = AsyncHttpServer()

    /**
     * This function starts the server.
     */
    fun start() {
        server.get("/.*") { request, response ->
            val path = request.path.removePrefix("/")
            val file = File(rootDir, path)

            if (file.exists() && file.isFile) {
                response.setContentType(getMimeType(file))
                response.sendStream(file.inputStream(), file.length())
            } else {
                response.code(404)
                response.send("File not found.")
            }
        }
        server.listen(8000)
    }

    /**
     * This function stops the server.
     */
    fun stop() {
        server.stop()
    }

    /**
     * This function returns the mime type.
     */
    private fun getMimeType(file: File): String {
        return when (file.extension.lowercase()) {
            "json" -> "application/json"
            "txt" -> "text/plain"
            "html" -> "text/html"
            "jpg", "jpeg" -> "image/jpeg"
            "png" -> "image/png"
            "gif" -> "image/gif"
            "webp" -> "image/webp"
            else -> "application/octet-stream"
        }
    }
}