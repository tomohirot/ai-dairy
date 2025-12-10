import { render, screen } from '../utils/test-utils'
import Home from '@/app/page'

describe('Home Page', () => {
  it('renders the page title', () => {
    render(<Home />)

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('営業日報システム')
  })

  it('renders the welcome message', () => {
    render(<Home />)

    expect(screen.getByText('営業日報システムへようこそ')).toBeInTheDocument()
  })
})
