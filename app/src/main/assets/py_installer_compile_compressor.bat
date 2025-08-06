set "project=C:\Lev\projects\project_hyper_geo_display"

python -m PyInstaller -F --noconfirm --onefile --icon "%project%\images\app-logo.png" ^
--add-data "%project%;." ^
--hidden-import="PyQt5" ^
"%project%\Compressor.py"
PAUSE