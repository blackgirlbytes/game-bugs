import { render, screen} from '@testing-library/react'
import { LogDashboard } from '../LogDashboard'

describe('LogDashboard', () => {
  it('renders without crashing', () => {
    render(<LogDashboard />)
    // Add basic assertions based on what should be visible in your LogDashboard component
    // This is just an example - adjust based on your actual component
    expect(screen.getByRole('main')).toBeInTheDocument()
  })
}) 