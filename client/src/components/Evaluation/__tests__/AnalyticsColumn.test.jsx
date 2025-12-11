import React from 'react'
import { render } from '@testing-library/react'
import PerformanceChart from '../PerformanceChart'
import WeekTrendChart from '../WeekTrendChart'

// Simple wrapper to mirror the right-hand analytics column structure
const AnalyticsColumn = ({ monthsFlat, weeklyEntries }) => (
  <div>
    <PerformanceChart monthsFlat={monthsFlat} />
    <div className="hidden md:block">
      <WeekTrendChart weeklyEntries={weeklyEntries} />
    </div>
  </div>
)

describe('AnalyticsColumn desktop week chart', () => {
  it('renders both monthly and week-level charts when data is present', () => {
    const monthsFlat = [
      {
        monthKey: '2025-03',
        label: 'March 2025',
        stats: {
          averagePercentage: 75,
          perTypeAverages: {
            aptitude: 80,
            logical: 70,
            machine: 75,
            spring_meet: 78,
          },
        },
      },
    ]

    const weeklyEntries = [
      { _id: '1', periodLabel: 'Week of Mar 1', score: 20, maxScore: 25 },
    ]

    const { getByText } = render(
      <AnalyticsColumn monthsFlat={monthsFlat} weeklyEntries={weeklyEntries} />,
    )

    expect(getByText('Performance overview')).toBeInTheDocument()
    expect(getByText('Weekly trend')).toBeInTheDocument()
  })
})
