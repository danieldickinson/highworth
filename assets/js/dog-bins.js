// Source: Highworth Parish Map, Refuse layer; exported 2026-10-31.
// https://www.google.com/maps/d/viewer?mid=1s4-3oSEXaFsDKk-9qUpR31_Jp3nApofT
// Only entries named "Dogbin". Preserve source coordinates, including nearby pairs.
(() => {
  'use strict';
  const locations = [
  [
    51.6414396,
    -1.7146315
  ],
  [
    51.6414097,
    -1.7146207
  ],
  [
    51.6389167,
    -1.7144912
  ],
  [
    51.6387314,
    -1.7085135
  ],
  [
    51.6390938,
    -1.7047572
  ],
  [
    51.6387359,
    -1.7048806
  ],
  [
    51.6368914,
    -1.7034467
  ],
  [
    51.636119,
    -1.7052679
  ],
  [
    51.636074,
    -1.7052813
  ],
  [
    51.6349649,
    -1.7045763
  ],
  [
    51.6345379,
    -1.7089785
  ],
  [
    51.6357466,
    -1.7065699
  ],
  [
    51.6325597,
    -1.7054101
  ],
  [
    51.6309372,
    -1.7060738
  ],
  [
    51.6308306,
    -1.7071521
  ],
  [
    51.6316864,
    -1.7088633
  ],
  [
    51.6325865,
    -1.7084663
  ],
  [
    51.6338251,
    -1.7080425
  ],
  [
    51.6311596,
    -1.7102723
  ],
  [
    51.6303438,
    -1.7077537
  ],
  [
    51.6292033,
    -1.7070214
  ],
  [
    51.6280645,
    -1.7097412
  ],
  [
    51.6294634,
    -1.7144322
  ],
  [
    51.6279807,
    -1.7182947
  ],
  [
    51.627984,
    -1.7170555
  ],
  [
    51.6289097,
    -1.7142982
  ],
  [
    51.62861,
    -1.7142177
  ],
  [
    51.6287332,
    -1.7154462
  ],
  [
    51.6326213,
    -1.7205292
  ],
  [
    51.6319399,
    -1.7211367
  ],
  [
    51.6374388,
    -1.7147683
  ],
  [
    51.6374488,
    -1.7146235
  ],
  [
    51.6377344,
    -1.7188745
  ],
  [
    51.634767,
    -1.7214494
  ],
  [
    51.6325641,
    -1.720321
  ],
  [
    51.6326018,
    -1.7187415
  ],
  [
    51.6342777,
    -1.7166691
  ],
  [
    51.6338658,
    -1.7144812
  ]
];
  const container = document.getElementById('dog-bins-map');
  const status = document.getElementById('dog-bins-status');
  const reset = document.getElementById('dog-bins-reset');
  if (!container) return;
  if (!window.L) {
    container.hidden = true;
    status.textContent = 'The interactive map could not load. Please use the council map link below.';
    return;
  }
  const map = L.map(container, {scrollWheelZoom:false, zoomSnap:0.25});
  const bounds = L.latLngBounds(locations);
  const showAll = () => map.fitBounds(bounds, {padding:[28,28], maxZoom:16});
  const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:19,
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  tiles.on('tileerror', () => {
    status.textContent = 'Some background map tiles could not load. Try the council’s original map below.';
  });
  locations.forEach((coordinates, index) => {
    const number = index + 1;
    const icon = L.divIcon({className:'dog-bin-marker', html:String(number), iconSize:[28,28], iconAnchor:[14,14]});
    const marker = L.marker(coordinates, {icon, title:'Recorded dog-bin location '+number, alt:'Recorded dog-bin location '+number}).addTo(map);
    const popup = document.createElement('div');
    const heading = document.createElement('strong');
    heading.textContent = 'Recorded dog-bin location '+number;
    const note = document.createElement('p');
    note.textContent = 'Council map location; current condition and availability are unverified.';
    const link = document.createElement('a');
    link.href = 'https://www.google.com/maps/search/?api=1&query='+coordinates.join(',');
    link.textContent = 'View this location in Google Maps';
    const words = document.createElement('a');
    words.href = 'https://what3words.com/'+coordinates.join(',');
    words.textContent = 'View this recorded pin in what3words';
    const wordsRow = document.createElement('p');
    wordsRow.append(words);
    const precision = document.createElement('p');
    precision.textContent = 'The three-word address refers to the council’s map pin, not a surveyed bin position. Check the square on arrival.';
    popup.append(heading, note, link, wordsRow, precision);
    marker.bindPopup(popup, {autoPanPaddingTopLeft:[10,80], autoPanPaddingBottomRight:[10,20]});
  });
  showAll();
  reset.hidden = false;
  reset.addEventListener('click', showAll);
  status.textContent = 'Select a marker for its map link. Locations are from the council’s published map, not a live survey.';
})();
