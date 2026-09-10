import { useRef, useEffect } from 'react';

export default function ConfettiCanvas({ trigger }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!trigger) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let particles = [];
    const colors = ['#38bdf8', '#818cf8', '#f43f5e', '#34d399', '#fb923c', '#facc15'];

    // Resize canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const { type } = trigger;
    const count = type === 'complete' ? 140 : 40;

    if (type === 'complete') {
      // Spawn from bottom-left corner
      for (let i = 0; i < count / 2; i++) {
        particles.push({
          x: 0,
          y: canvas.height,
          vx: Math.random() * 12 + 4,
          vy: -Math.random() * 18 - 10,
          r: Math.random() * 6 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          opacity: 1,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2
        });
      }
      // Spawn from bottom-right corner
      for (let i = 0; i < count / 2; i++) {
        particles.push({
          x: canvas.width,
          y: canvas.height,
          vx: -Math.random() * 12 - 4,
          vy: -Math.random() * 18 - 10,
          r: Math.random() * 6 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          opacity: 1,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2
        });
      }
    } else {
      // Small burst in the upper middle area
      for (let i = 0; i < count; i++) {
        particles.push({
          x: canvas.width / 2,
          y: canvas.height * 0.4,
          vx: (Math.random() - 0.5) * 14,
          vy: (Math.random() - 0.5) * 14 - 3,
          r: Math.random() * 5 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          opacity: 1,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.25
        });
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = false;
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.vx *= 0.98; // wind resistance
        p.rotation += p.rotationSpeed;

        if (p.vy > 0) {
          p.opacity -= 0.015;
        }

        if (p.opacity > 0 && p.y < canvas.height + 50) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity;

          // Draw confetti square
          ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
          ctx.restore();
        }
      });

      if (alive) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [trigger]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999
      }}
    />
  );
}
