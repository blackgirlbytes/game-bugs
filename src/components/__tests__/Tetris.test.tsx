
import { render, screen } from '@testing-library/react'
import { Tetris } from '../Tetris'

describe('Tetris', () => {
  it('renders without crashing', () => {
    render(<Tetris />)
    // Add basic assertions based on what should be visible in your Tetris component
    // This is just an example - adjust based on your actual component
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
}) 