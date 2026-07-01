function App() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--pg-bg)',
    }}>
      <CreditCard />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
