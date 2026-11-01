// Pixel centres on the council's 668 x 939 map, checked 2026-11-01.
// These are NOT GPS coordinates and must never be used for routing or what3words.
// A replacement source image requires visually rechecking every marker and inset.
(() => {
  'use strict';
  const locations = [
  {
    "id": 1,
    "name": "Telephone box at the top of Grove Hill",
    "x": 387,
    "y": 278,
    "access": "24h"
  },
  {
    "id": 2,
    "name": "Highworth Cemetery",
    "x": 72,
    "y": 583,
    "access": "24h"
  },
  {
    "id": 3,
    "name": "Highworth Community Centre",
    "x": 537,
    "y": 207,
    "access": "24h"
  },
  {
    "id": 4,
    "name": "Highworth Town Council Office",
    "x": 416,
    "y": 514,
    "access": "24h"
  },
  {
    "id": 5,
    "name": "Highworth Recreation Centre",
    "x": 277,
    "y": 551,
    "access": "24h"
  },
  {
    "id": 6,
    "name": "St Michael’s Hall",
    "x": 383,
    "y": 343,
    "access": "24h"
  },
  {
    "id": 7,
    "name": "Westrop Surgery",
    "x": 275,
    "y": 341,
    "access": "24h"
  },
  {
    "id": 8,
    "name": "Barra Close Play Park",
    "x": 76,
    "y": 297,
    "access": "24h"
  },
  {
    "id": 9,
    "name": "Sevenhampton — council map inset",
    "x": 477,
    "y": 845,
    "access": "24h"
  },
  {
    "id": 10,
    "name": "1st Highworth Scouts Hut",
    "x": 648,
    "y": 512,
    "access": "24h"
  },
  {
    "id": 11,
    "name": "Highworth Town Junior Football Club",
    "x": 224,
    "y": 651,
    "access": "24h"
  },
  {
    "id": 12,
    "name": "Gardening Naturally, Blackworth Industrial Estate",
    "x": 400,
    "y": 38,
    "access": "24h"
  },
  {
    "id": 13,
    "name": "Outside the sports hall at Highworth Warneford School",
    "x": 429,
    "y": 699,
    "access": "24h"
  },
  {
    "id": 14,
    "name": "Tesco Express",
    "x": 263,
    "y": 358,
    "access": "restricted"
  },
  {
    "id": 15,
    "name": "Highworth Recreation Centre — inside the building",
    "x": 269,
    "y": 551,
    "access": "restricted"
  },
  {
    "id": 16,
    "name": "Highworth Bowls Club",
    "x": 330,
    "y": 636,
    "access": "restricted"
  },
  {
    "id": 17,
    "name": "Sandsground House, 26 Swindon Street",
    "x": 308,
    "y": 748,
    "access": "restricted"
  },
  {
    "id": 18,
    "name": "Highworth Town Football Club",
    "x": 303,
    "y": 583,
    "access": "restricted"
  },
  {
    "id": 19,
    "name": "Aldi",
    "x": 392,
    "y": 10,
    "access": "restricted"
  }
];
  const source = 'https://highworthtowncouncil.gov.uk/wp-content/uploads/2026/07/Defib-Map-23.07.2026.png';
  const container = document.getElementById('aed-map');
  const controls = document.getElementById('aed-map-controls');
  const select = document.getElementById('aed-location');
  const status = document.getElementById('aed-map-status');
  const original = document.getElementById('aed-original');
  if (!container) return;
  const fail = () => {
    container.hidden = true;
    controls.hidden = true;
    original.open = true;
    status.textContent = 'The interactive map could not load. Use the original council map, PDF and location lists below.';
  };
  if (!window.L) { fail(); return; }
  container.hidden = false;
  const map = L.map(container, {crs:L.CRS.Simple, minZoom:-2, maxZoom:2, zoomSnap:0.25, scrollWheelZoom:false});
  const bounds = L.latLngBounds([[0,0],[939,668]]);
  const position = location => [939-location.y, location.x];
  const markers = new Map();
  const showAll = () => {
    map.closePopup();
    select.value = '';
    map.fitBounds(bounds, {padding:[20,20]});
  };
  const showLocation = id => {
    const location = locations.find(item => String(item.id) === String(id));
    if (!location) { showAll(); return; }
    select.value = String(location.id);
    markers.forEach(marker => marker.setZIndexOffset(0));
    const marker = markers.get(location.id);
    marker.setZIndexOffset(1000);
    map.setView(position(location), 1);
    marker.openPopup();
  };
  const overlay = L.imageOverlay(source, bounds, {
    alt:'Highworth Town Council defibrillator map, including the separate Sevenhampton inset',
    attribution:'Map: <a href="https://highworthtowncouncil.gov.uk/defibrillators/">Highworth Town Council</a>'
  });
  overlay.on('error', fail);
  overlay.on('load', () => {
    controls.hidden = false;
    status.textContent = 'Choose a location to zoom to its marker. Access categories are from the July 2026 council map; call 999 in an emergency.';
    document.querySelectorAll('[data-aed-id]').forEach(item => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'aed-list-location';
      button.textContent = item.dataset.aedId+'. '+item.textContent;
      button.addEventListener('click', () => {
        showLocation(item.dataset.aedId);
        container.scrollIntoView({block:'start'});
        container.focus({preventScroll:true});
      });
      item.replaceChildren(button);
    });
  });
  overlay.addTo(map);
  locations.forEach(location => {
    const access = location.access === '24h' ? 'Listed as accessible 24 hours' : 'Listed with restricted access';
    const option = document.createElement('option');
    option.value = String(location.id);
    option.textContent = location.id+'. '+location.name;
    select.append(option);
    const marker = L.marker(position(location), {
      title:location.name+' — '+access,
      icon:L.divIcon({className:'aed-marker aed-marker--'+location.access, html:String(location.id), iconSize:[26,26], iconAnchor:[13,13]})
    }).addTo(map);
    const popup = document.createElement('div');
    const heading = document.createElement('strong');
    heading.textContent = location.name;
    const category = document.createElement('p');
    category.textContent = access+' on the council’s July 2026 map.';
    const note = document.createElement('p');
    note.textContent = 'Current access is not confirmed. In an emergency call 999; the call handler can direct you to an accessible AED.';
    const words = document.createElement('p');
    words.textContent = 'Exact cabinet what3words address: not yet verified.';
    popup.append(heading, category, note, words);
    marker.bindPopup(popup, {maxWidth:270, autoPanPaddingTopLeft:[10,80], autoPanPaddingBottomRight:[10,20]});
    marker.on('click', () => { select.value=String(location.id); });
    markers.set(location.id, marker);
  });
  select.addEventListener('change', () => showLocation(select.value));
  document.getElementById('aed-map-reset').addEventListener('click', showAll);
  showAll();
})();
