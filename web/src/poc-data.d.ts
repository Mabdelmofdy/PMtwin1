declare module '@poc-data/*.json' {
  const value: {
    domain?: string
    version?: string
    data: unknown[]
  }
  export default value
}
