(function () {
  'use strict';
  var mapElement = document.getElementById('report-map');
  if (!mapElement || !window.L) return;

  var latitude = document.getElementById('report-latitude');
  var longitude = document.getElementById('report-longitude');
  var coordinates = document.getElementById('map-coordinates');
  var map = L.map(mapElement).setView([17.385, 78.4867], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  var marker;
  function setPin(lat, lng) {
    latitude.value = lat.toFixed(6);
    longitude.value = lng.toFixed(6);
    coordinates.textContent = latitude.value + ', ' + longitude.value;
    if (marker) marker.setLatLng([lat, lng]);
    else marker = L.marker([lat, lng]).addTo(map);
  }

  if (latitude.value && longitude.value) {
    var lat = Number(latitude.value);
    var lng = Number(longitude.value);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setPin(lat, lng);
      map.setView([lat, lng], 15);
    }
  }
  map.on('click', function (event) { setPin(event.latlng.lat, event.latlng.lng); });
  window.setTimeout(function () { map.invalidateSize(); }, 0);
})();
