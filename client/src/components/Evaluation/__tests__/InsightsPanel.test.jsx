import React from 'react'
import { render } from '@testing-library/react'
import InsightsPanel from '../InsightsPanel'

describe('InsightsPanel', () => {
  it('renders at least one dynamic tip when given sample hero and performance', () => {
    const hero = {
      period: { label: 'March 2025' },
      averagePercentage: 80,
      perTypeAverages: {
        aptitude: 82,
        logical: 75,
        machine: 68,
      },
      status: 'COMPLETED',
      lastUpdated: new Date().toISOString(),
    }

    const performance = {
      groupedByYearMonth: {
        2025: {
          year: 2025,
          months: {
            '2025-03': {
              monthKey: '2025-03',
              label: 'March 2025',
              stats: {
                averagePercentage: 80,
                perTypeAverages: {
                  aptitude: 82,
                  logical: 75,
                  machine: 68,
                },
              },
            },
            '2025-02': {
              monthKey: '2025-02',
              label: 'February 2025',
              stats: {
                averagePercentage: 76,
                perTypeAverages: {
                  aptitude: 78,
                  logical: 74,
                  machine: 70,
                },
              },
            },
          },
        },
      },
    }

    const { getByText } = render(<InsightsPanel hero={hero} performance={performance} />)

    expect(getByText(/weakest area/i)).toBeInTheDocument()
  })
})
