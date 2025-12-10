import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'

// カスタムレンダー関数（将来的にProviderなどをラップできる）
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, { ...options })
}

export * from '@testing-library/react'
export { customRender as render }
