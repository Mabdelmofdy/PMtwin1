declare module '@seed-data/*.json' {
  const value: {
    domain?: string
    version?: string
    data: unknown[]
  }
  export default value
}
