export default function KMSLogo({ size = "1rem" }) {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      fontFamily: '"Arial", "Helvetica Neue", sans-serif', 
      fontSize: size,
      lineHeight: 1,
      userSelect: 'none'
    }}>
      <span style={{ color: '#3f2165', fontWeight: 900, letterSpacing: '0.5px' }}>KMS</span>
      <span style={{ color: '#f59251', fontWeight: 300, marginLeft: '2px', letterSpacing: '0.5px' }}>EDU</span>
      <svg 
        width="1.2em" 
        height="1.2em" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="#3f2165" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        style={{ marginLeft: '2px', marginTop: '-0.8em' }}
      >
        <polyline points="13 5 19 5 19 11"></polyline>
        <polyline points="7 11 13 11 13 17"></polyline>
      </svg>
    </div>
  );
}
