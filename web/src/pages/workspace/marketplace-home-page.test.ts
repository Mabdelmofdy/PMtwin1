import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const sourcePath = join(dirname(fileURLToPath(import.meta.url)), 'marketplace-home-page.tsx')
const source = readFileSync(sourcePath, 'utf8')
const routesPath = join(dirname(fileURLToPath(import.meta.url)), '../../routes.tsx')
const routesSource = readFileSync(routesPath, 'utf8')

describe('MarketplaceHomePage', () => {
  it('renders enterprise discovery sections for collaboration, topology, and exchange', () => {
    assert.match(source, /Explore by collaboration/)
    assert.match(source, /Explore by match type/)
    assert.match(source, /Explore by value exchange/)
  })

  it('links tiles to browse pages with query filters', () => {
    assert.match(source, /\/opportunities\?mainModel=/)
    assert.match(source, /\/matches\?matchTypes=/)
    assert.match(source, /\/opportunities\?exchangeModes=/)
  })

  it('is wired to the workspace route tree', () => {
    assert.match(routesSource, /path="\/marketplace"/)
    assert.match(routesSource, /MarketplaceHomePage/)
  })
})
