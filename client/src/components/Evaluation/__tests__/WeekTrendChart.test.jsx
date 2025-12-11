import React from 'react'
import { render } from '@testing-library/react'
import WeekTrendChart from '../WeekTrendChart'

describe('WeekTrendChart', () => {
  it('renders when weekly entries are provided', () => {
    const weeklyEntries = [
      {
        _id: '1',
        periodLabel: 'Week of Mar 1',
        score: 20,
        maxScore: 25,
      },
      {
        _id: '2',
        periodLabel: 'Week of Mar 8',
        score: 18,
        maxScore: 25,
      },
    ]

    const { getByText } = render(<WeekTrendChart weeklyEntries={weeklyEntries} />)

    expect(getByText('Weekly trend')).toBeInTheDocument()
  })
})
