import React, { useState } from 'react'
import styled from 'styled-components'
const NamedWithInterpolation = styled.div`
  @apply m-0 p-0 w-100vw h-100vh overflow-hidden bg-blue-500;
`

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="text-center">
      <NamedWithInterpolation />
      <header className="m-4">
        <p>Hello Vite + React!</p>
        <p>
          <button
            className="border border-gray-400 rounded px-4 py-2 mt-4 hover:(bg-teal-400 border-teal-400)"
            onClick={() => setCount(count => count + 1)}>
            count is: {count}
          </button>
        </p>
      </header>
    </div>
  )
}

export default App
