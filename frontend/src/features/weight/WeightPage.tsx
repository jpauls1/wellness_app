import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import type { WeightEntry } from '../../api/types'
import { WeightChart } from './WeightChart'

export function WeightPage() {
  const [entries, setEntries] = useState<WeightEntry[]>([])
  const [weight, setWeight] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadEntries() {
    setLoading(true)
    setError(null)
    try {
      setEntries(await api.listWeightEntries())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load weight entries')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEntries()
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const parsed = Number(weight)
    if (!weight || Number.isNaN(parsed)) return
    try {
      await api.createWeightEntry({ weight_lbs: parsed })
      setWeight('')
      await loadEntries()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save weight entry')
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.deleteWeightEntry(id)
      await loadEntries()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete weight entry')
    }
  }

  const recent = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )

  return (
    <section>
      <h2>Weight</h2>

      <form className="entry-form" onSubmit={handleSubmit}>
        <label htmlFor="weight-input">Weight (lbs)</label>
        <input
          id="weight-input"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          placeholder="182.4"
          value={weight}
          onChange={(event) => setWeight(event.target.value)}
          required
        />
        <button type="submit">Log weight</button>
      </form>

      {error && <p className="error">{error}</p>}

      <div className="card">
        <h3>Progress</h3>
        {loading ? <p>Loading…</p> : <WeightChart entries={entries} />}
      </div>

      <div className="card">
        <h3>History</h3>
        {recent.length === 0 && !loading ? (
          <p className="empty-state">No entries yet.</p>
        ) : (
          <ul className="history-list">
            {recent.map((entry) => (
              <li key={entry.id}>
                <span>{new Date(entry.timestamp).toLocaleString()}</span>
                <span className="value">{entry.weight_lbs} lbs</span>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => handleDelete(entry.id)}
                  aria-label="Delete entry"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
