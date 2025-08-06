import os
from PIL import Image
import piexif

class JpegLosslessCompressor:
    def __init__(self, folder_path, output_folder=None):
        self.folder_path = folder_path
        self.output_folder = output_folder or folder_path

    def compress_images(self):
        for filename in os.listdir(self.folder_path):
            if filename.lower().endswith('.jpg') or filename.lower().endswith('.jpeg'):
                input_path = os.path.join(self.folder_path, filename)
                output_path = os.path.join(self.output_folder, filename)
                self._compress_image(input_path, output_path)

    def _compress_image(self, input_path, output_path):
        img = Image.open(input_path)
        exif_data = img.info.get('exif', None)
        # Save with optimize=True for lossless compression, keep exif
        img.save(output_path, 'JPEG', optimize=True, quality=85, progressive=True, exif=exif_data)

# Example usage:
compressor = JpegLosslessCompressor('C:\Lev\project_datas\hyper_geo_display_data\RGB-102', 'C:\Lev\project_datas\hyper_geo_display_data\RGB-102\compressed')
compressor.compress_images()