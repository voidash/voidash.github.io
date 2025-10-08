import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext'

// Import the functions you need from the SDKs you need

ReactDOM.createRoot(document.getElementById('root')!).render(
    <ThemeProvider>
        <App />
    </ThemeProvider>
)
