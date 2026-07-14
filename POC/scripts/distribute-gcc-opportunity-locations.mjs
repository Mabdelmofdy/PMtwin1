import fs from 'node:fs'

const GCC_LOCATIONS = [
  { location: 'Riyadh, Saudi Arabia', locationCountry: 'sa', locationRegion: 'riyadh', locationCity: 'riyadh-city' },
  { location: 'Jeddah, Saudi Arabia', locationCountry: 'sa', locationRegion: 'makkah', locationCity: 'jeddah' },
  { location: 'Dammam, Saudi Arabia', locationCountry: 'sa', locationRegion: 'eastern-province', locationCity: 'dammam' },
  { location: 'NEOM, Saudi Arabia', locationCountry: 'sa', locationRegion: 'tabuk', locationCity: 'neom' },
  { location: 'Al Khobar, Saudi Arabia', locationCountry: 'sa', locationRegion: 'eastern-province', locationCity: 'khobar' },
  { location: 'Abha, Saudi Arabia', locationCountry: 'sa', locationRegion: 'asir', locationCity: 'abha' },
  { location: 'Tabuk, Saudi Arabia', locationCountry: 'sa', locationRegion: 'tabuk', locationCity: 'tabuk-city' },
  { location: 'Makkah, Saudi Arabia', locationCountry: 'sa', locationRegion: 'makkah', locationCity: 'makkah-city' },
  { location: 'Jubail, Saudi Arabia', locationCountry: 'sa', locationRegion: 'eastern-province', locationCity: 'jubail' },
  { location: 'Diriyah, Saudi Arabia', locationCountry: 'sa', locationRegion: 'riyadh', locationCity: 'diriyah' },
  { location: 'Dubai, United Arab Emirates', locationCountry: 'uae', locationRegion: 'dubai-emirate', locationCity: 'dubai' },
  { location: 'Abu Dhabi, United Arab Emirates', locationCountry: 'uae', locationRegion: 'abu-dhabi-emirate', locationCity: 'abu-dhabi' },
  { location: 'Sharjah, United Arab Emirates', locationCountry: 'uae', locationRegion: 'sharjah-emirate', locationCity: 'sharjah' },
  { location: 'Doha, Qatar', locationCountry: 'qa', locationRegion: 'doha-region', locationCity: 'doha' },
  { location: 'Kuwait City, Kuwait', locationCountry: 'kw', locationRegion: 'kuwait-region', locationCity: 'kuwait-city' },
  { location: 'Manama, Bahrain', locationCountry: 'bh', locationRegion: 'bahrain-region', locationCity: 'manama' },
  { location: 'Muscat, Oman', locationCountry: 'om', locationRegion: 'muscat-region', locationCity: 'muscat' },
]

function applyLocations(filePath) {
  const doc = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const arr = Array.isArray(doc) ? doc : doc.data
  if (!Array.isArray(arr) || arr.length === 0) {
    console.log('skip (empty):', filePath)
    return
  }

  const counts = {}
  arr.forEach((opp, index) => {
    const loc = GCC_LOCATIONS[index % GCC_LOCATIONS.length]
    opp.location = loc.location
    opp.locationCountry = loc.locationCountry
    opp.locationRegion = loc.locationRegion
    opp.locationCity = loc.locationCity
    if (opp.normalized && typeof opp.normalized === 'object') {
      // Keep geographic display text in sync; leave work-mode values like "On-Site" alone.
      if (
        typeof opp.normalized.location === 'string' &&
        /saudi arabia|united arab emirates|qatar|kuwait|bahrain|oman|riyadh|jeddah|dubai|doha|manama|muscat/i.test(
          opp.normalized.location,
        )
      ) {
        opp.normalized.location = loc.location
      }
      if ('locationCountry' in opp.normalized) opp.normalized.locationCountry = loc.locationCountry
      if ('locationRegion' in opp.normalized) opp.normalized.locationRegion = loc.locationRegion
      if ('locationCity' in opp.normalized) opp.normalized.locationCity = loc.locationCity
    }
    counts[loc.location] = (counts[loc.location] || 0) + 1
  })

  fs.writeFileSync(filePath, `${JSON.stringify(doc, null, 2)}\n`, 'utf8')
  console.log('updated', filePath, 'count=', arr.length)
  console.log(counts)
}

for (const file of [
  './POC/data/opportunities.json',
  './POC/data/demo-cast-coverage-opportunities.json',
]) {
  applyLocations(file)
}
