const colorMap = {
  indigo: 'text-indigo-600',
  green:  'text-green-600',
  orange: 'text-orange-500',
  purple: 'text-purple-600',
}

export default function StatCard({ label, value, sub, color = 'indigo' }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${colorMap[color]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}
