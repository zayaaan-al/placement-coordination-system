import React from 'react'
import { render } from '@testing-library/react'
import PerformanceHero from '../PerformanceHero'

describe('PerformanceHero', () => {
  it('renders trend text comparing months', () => {
    const hero = {
      period: { label: 'March 2025' },
      averagePercentage: 80,
      perTypeAverages: {},
      status: 'COMPLETED',
      lastUpdated: new Date().toISOString(),
    }

    const trend = {
      direction: 'up',
      delta: 4.2,
      label: 'Performance up 4.2% vs February 2025',
    }

    const { getByText } = render(<PerformanceHero hero={hero} trend={trend} />)

    expect(getByText(/Performance up 4.2% vs February 2025/)).toBeInTheDocument()
  })
})
