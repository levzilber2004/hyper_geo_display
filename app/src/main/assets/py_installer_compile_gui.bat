set "project=C:\Lev\projects\project_hyper_geo_display"

python -m PyInstaller -F --noconfirm --onefile --noconsole --icon "%project%\images\app-logo.png" ^
--add-data "%project%;." ^
--hidden-import="PyQt5" ^
--hidden-import="PyQt5.QtWidgets" ^
--hidden-import="PyQt5.QtGui" ^
--hidden-import="PyQt5.QtCore" ^
--hidden-import="PyQt5.QtWebEngineWidgets" ^
"%project%\Main.py"
PAUSE