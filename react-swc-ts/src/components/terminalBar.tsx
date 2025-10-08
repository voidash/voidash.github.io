
function TerminalBar() {
  return (
    <>
    <div className="terminal-bar">
     {/* <input type="text" placeholder="Type terminal 😉" className="input-search"/> */}
      <div className="quote">"Without music, life would be a mistake." </div>
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
