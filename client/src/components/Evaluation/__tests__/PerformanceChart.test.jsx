import React from 'react'
import { render } from '@testing-library/react'
import PerformanceChart from '../PerformanceChart'

describe('PerformanceChart', () => {
  it('renders without crashing when given month buckets', () => {
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

    const { getByText } = render(<PerformanceChart monthsFlat={monthsFlat} />)

    expect(getByText('Performance overview')).toBeInTheDocument()
  })
})
