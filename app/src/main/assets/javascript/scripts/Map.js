// This function creates the main map.
function loadMainMap(mainContainer, id) {
  // Create the map with Leaflet.
  const map = L.map(id, { attributionControl: false }).setView(
    [constants.INITIAL_LAT, constants.INITIAL_LON],
    20
  );

  // Creates the map labels.
  const labels = createMapLabels(mainContainer);

  // Create satellite layer with Esri World Imagery.
  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/' +
      'World_Imagery/MapServer/tile/{z}/{y}/{x}'
  ).addTo(map);

  let marker = L.marker([constants.INITIAL_LAT, constants.INITIAL_LON], {
    draggable: false,
    zIndexOffset: 9999,
  }).addTo(map);

  const dronePathIcon = L.icon({
    iconSize: [9, 9], // smaller than default.
    iconUrl: './libs/leaflet/images/marker-drone-icon.png',
  });

  const markers = [];
  // This function loads the drone path.
  window.loadDronePath = (jsonList) => {
    jsonList.forEach((element) => {
      markers.push(
        L.marker(
          [parseFloat(element.latitude), parseFloat(element.longitude)],
          {
            draggable: false,
            icon: dronePathIcon,
          }
        ).addTo(map)
      );
    });
  };

  // This function toggles the drone path markers.
  window.toggleMarkers = (toggle) => {
    markers.forEach((marker) => {
      toggle ? marker.addTo(map) : map.removeLayer(marker);
    });
  };

  // Update marker and map when user inputs lat/lon
  window.updateLocation = (file, timestamp, lat, lon, yaw, pitch, roll) => {
    if (!isNaN(lat) && !isNaN(lon)) {
      const newPos = [lat, lon];
      marker.setLatLng(newPos);
      map.setView(newPos, map.getZoom());
      updateLabel(file, labels.gpsFileLabel, 'NO FILE');
      updateLabel(timestamp, labels.gpsTimestampLabel, 'NO TIME');
      updateLabel(lat, labels.gpsLatitudeLabel, 'NO GPS');
      updateLabel(lon, labels.gpsLongitudeLabel, 'NO GPS');
      updateLabel(yaw, labels.gyroYawLabel, 'NO GYRO');
      updateLabel(pitch, labels.gyroPitchLabel, 'NO GYRO');
      updateLabel(roll, labels.gyroRollLabel, 'NO GYRO');
    }
  };
}

// This function creates the map labels.
function createMapLabels(mainContainer) {
  const mapLabelContainer = $(
    '<aside class="box-shadow-element map-label map-label-container"></aside>'
  );

  const innerLabelContainer = $(
    '<span class="box-shadow-element map-label margin-right margin-bottom"></span>'
  );

  const showDronePathObject = appendAndReturnInnerSpan(
    mapLabelContainer,
    'hide drone path', // name.
    null, // text.
    'box-shadow-element pop-button extra-margin-bottom margin-right', // classes.
    true, // shouldReturnParentAndSpan.
    true // createBooleanButton.
  );

  let toggle = false;
  showDronePathObject.element.on('click', () => {
    showDronePathObject.element.toggleClass('background-green', toggle);
    showDronePathObject.element.toggleClass('background-red', !toggle);
    showDronePathObject.element.text(
      toggle ? 'hide drone path' : 'show drone path'
    );
    toggleMarkers(toggle);
    toggle = !toggle;
  });

  const gpsFileObject = appendAndReturnInnerSpan(
    mapLabelContainer,
    'file', // name.
    'NO FILE', // text.
    'box-shadow-element pop-button extra-margin-bottom margin-right', // classes.
    true // shouldReturnParentAndSpan.
  );
  gpsFileObject.element.on('click', () => {
    if (!gpsFileObject.innerElement.hasClass('red-color')) {
      interfaceModule.open_file_path(
        parameters.currentRecordingsPath + gpsFileObject.innerElement.text()
      );
    }
  });

  const gpsTimestampLabel = appendAndReturnInnerSpan(
    innerLabelContainer,
    'timestamp',
    'NO TIME'
  );
  const gpsLatitudeLabel = appendAndReturnInnerSpan(
    innerLabelContainer,
    'latitude',
    'NO GPS'
  );
  const gpsLongitudeLabel = appendAndReturnInnerSpan(
    innerLabelContainer,
    'longitude',
    'NO GPS'
  );
  const gyroYawLabel = appendAndReturnInnerSpan(
    innerLabelContainer,
    'yaw',
    'NO GYRO'
  );
  const gyroPitchLabel = appendAndReturnInnerSpan(
    innerLabelContainer,
    'pitch',
    'NO GYRO'
  );
  const gyroRollLabel = appendAndReturnInnerSpan(
    innerLabelContainer,
    'roll',
    'NO GYRO'
  );

  mapLabelContainer.append(innerLabelContainer);
  mainContainer.append(mapLabelContainer);
  return {
    gpsFileLabel: gpsFileObject.innerElement,
    gpsTimestampLabel: gpsTimestampLabel,
    gpsLatitudeLabel: gpsLatitudeLabel,
    gpsLongitudeLabel: gpsLongitudeLabel,
    gyroYawLabel: gyroYawLabel,
    gyroPitchLabel: gyroPitchLabel,
    gyroRollLabel: gyroRollLabel,
  };
}

// This function creates a span and returns the inner span.
function appendAndReturnInnerSpan(
  label,
  name,
  text,
  classes = '',
  shouldReturnParentAndSpan = false,
  createBooleanButton = false
) {
  const element = $(
    `<span class="${classes} ${
      createBooleanButton ? 'background-green centered-text' : ''
    }">${name} ${
      createBooleanButton ? '' : `&gt; <span class="red-color">${text}</span>`
    }</span>`
  );
  label.append(element);
  const innerElement = element.find('span');
  return shouldReturnParentAndSpan
    ? { element: element, innerElement: innerElement }
    : innerElement;
}

function updateLabel(value, label, text) {
  if (value == constants.INVALID_VALUE) {
    label.removeClass('green-color').addClass('red-color').text(text);
  } else {
    label.removeClass('red-color').addClass('green-color').text(value);
  }
}
