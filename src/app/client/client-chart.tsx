'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

export default function ClientChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-gray-500">
        No performance data available yet.
      </div>
    )
  }

  const formattedData = data.map(item => ({
    ...item,
    current_value: Number(Number(item.current_value || 0).toFixed(2)),
    date: format(new Date(item.created_at), 'MMM dd, yyyy')
  }))

  const formatCurrencyCompact = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`
    return `$${value}`
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 10, right: 10, bottom: 0, left: -15 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#ffffff50" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false}
            tickMargin={8}
          />
          <YAxis 
            stroke="#ffffff50" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(value) => formatCurrencyCompact(Number(value))}
            width={45}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', borderColor: 'rgba(255,255,255,0.12)', borderRadius: '12px', fontSize: '12px' }}
            itemStyle={{ color: '#fff' }}
            formatter={(value: any) => [
              `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              'Valuation'
            ]}
          />
          <Line 
            type="monotone" 
            dataKey="current_value" 
            stroke="#3b82f6" 
            strokeWidth={2.5}
            dot={{ fill: '#3b82f6', strokeWidth: 1.5, r: 3 }}
            activeDot={{ r: 5, stroke: '#fff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
