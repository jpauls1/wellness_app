import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { WeightEntry } from '../../api/types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

interface WeightChartProps {
  entries: WeightEntry[]
}

export function WeightChart({ entries }: WeightChartProps) {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  )

  const data = {
    labels: sorted.map((entry) =>
      new Date(entry.timestamp).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
    ),
    datasets: [
      {
        label: 'Weight (lbs)',
        data: sorted.map((entry) => entry.weight_lbs),
        borderColor: '#17827a',
        backgroundColor: '#17827a',
        tension: 0.25,
        pointRadius: 3,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        title: { display: true, text: 'lbs' },
      },
    },
  }

  if (sorted.length === 0) {
    return <p className="empty-state">Log a weight entry to see your progress chart.</p>
  }

  return <Line data={data} options={options} />
}
