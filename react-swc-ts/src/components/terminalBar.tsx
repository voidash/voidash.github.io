import { useTheme } from '../context/ThemeContext';

function TerminalBar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
    <div className="terminal-bar">
     {/* <input type="text" placeholder="Type terminal 😉" className="input-search"/> */}
      <div className="quote">"Without music, life would be a mistake." </div>
      <button
        onClick={toggleTheme}
        style={{
          position: 'absolute',
          left: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          padding: '5px'
        }}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <a
        href="/"
        style={{
          position: 'absolute',
          right: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#0066cc',
          textDecoration: 'underline',
          fontSize: '14px',
          cursor: 'pointer'
        }}
      >
        Switch to Normal Mode
      </a>
    </div>
    </>
  );
}

export default TerminalBar;
