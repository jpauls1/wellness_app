import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import type { WeightEntry } from '../../api/types'
import { WeightChart } from './WeightChart'

export function WeightPage() {
  const [entries, setEntries] = useState<WeightEntry[]>([])
  const [weight, setWeight] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')

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

  function startEdit(entry: WeightEntry) {
    setEditingId(entry.id)
    setEditValue(String(entry.weight_lbs))
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValue('')
  }

  async function handleSaveEdit(id: number) {
    const parsed = Number(editValue)
    if (!editValue || Number.isNaN(parsed)) return
    try {
      await api.updateWeightEntry(id, { weight_lbs: parsed })
      cancelEdit()
      await loadEntries()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update weight entry')
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
            {recent.map((entry) =>
              editingId === entry.id ? (
                <li key={entry.id} className="edit-row">
                  <span>{new Date(entry.timestamp).toLocaleString()}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0"
                    autoFocus
                    value={editValue}
                    onChange={(event) => setEditValue(event.target.value)}
                  />
                  <span className="row-actions">
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => handleSaveEdit(entry.id)}
                    >
                      Save
                    </button>
                    <button type="button" className="link-button" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </span>
                </li>
              ) : (
                <li key={entry.id}>
                  <span>{new Date(entry.timestamp).toLocaleString()}</span>
                  <span className="value">{entry.weight_lbs} lbs</span>
                  <span className="row-actions">
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => startEdit(entry)}
                      aria-label="Edit entry"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => handleDelete(entry.id)}
                      aria-label="Delete entry"
                    >
                      Delete
                    </button>
                  </span>
                </li>
              ),
            )}
          </ul>
        )}
      </div>
    </section>
  )
}
