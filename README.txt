This app displays the recorded data from the hyper geo host app.


There are two apps inside this app.
An android app, and a python app.
Both function on the same generic code, just each one is for a different platform,
python is for windows. and android is for android.


To run the python go to:
App / src / main / assets / Main.py
the app will open a json file select window, where you need to select a log from the hyper geo host.
correct folder structure is
folder /
	recordings / recording_ folder.
	logs / recording_.json

when you select a recording_.json, it will select from the recordings folders the folder with the same name as the recording_.json.
once you've done that, it will open a recording window with a map, from there it is quite straight forward.
features:
Scroll zoom and pan.
Speed control of the video.
The entire path is shown on the map including the point you are at.
File open button, to open the current image in the recordings folder.
GEO data for each image.


To run the android you'll have to turn it into an apk:
once thats done, 
 the app will open a json file select window, where you need to select a log from the hyper geo host.
correct folder structure is
Hyper GEO Scope /
	recordings / recording_ folder.
	logs / recording_.json
do not change the names of the folder structure, and do not move them out of their correct position or else it wouldn't work.

when you select a recording_.json, it will select from the recordings folders the folder with the same name as the recording_.json.
once you've done that, it will open a recording window with a map, from there it is quite straight forward.
features:
Scroll zoom and pan.
Speed control of the video.
The entire path is shown on the map including the point you are at.
File open button, to open the current image in the recordings folder.
GEO data for each image.








