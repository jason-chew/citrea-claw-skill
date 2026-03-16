// ─── Stale warning deduplication ─────────────────────────────────────────────
const warnedStale = new Set()

async function fetchRedStonePrices() {
  try {
    const results = await Promise.all(
      Object.entries(PRICE_FEEDS).map(async ([symbol, address]) => {
        const [roundData, decimals] = await Promise.all([
          client.readContract({
            address,
            abi: AGGREGATOR_ABI,
            functionName: 'latestRoundData',
          }),
          client.readContract({
            address,
            abi: AGGREGATOR_ABI,
            functionName: 'decimals',
          }),
        ])

        const price     = Number(roundData[1]) / 10 ** decimals
        const updatedAt = Number(roundData[3])
        const age       = Math.floor(Date.now() / 1000) - updatedAt

        // Only warn once per symbol per process run
        if (age > 7200 && !warnedStale.has(symbol)) {
          console.warn(`⚠️  ${symbol} price is ${Math.floor(age / 60)} minutes old`)
          warnedStale.add(symbol)
        }

        return [symbol, price]
      })
    )

    return Object.fromEntries(results)

  } catch (error) {
    console.error(`⚠️  Could not fetch RedStone prices: ${error.message}`)
    return null
  }
}
