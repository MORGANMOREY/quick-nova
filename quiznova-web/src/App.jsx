import { useState, useEffect, useRef } from 'react';

// Web Audio Synth for game sounds
const playSound = (type) => {
  const isMuted = localStorage.getItem('quiznova_muted') === 'true';
  if (isMuted) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'correct') {
      // Happy chime (C5 -> E5 -> G5)
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } else if (type === 'wrong') {
      // Disappointing downward buzz
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(70, now + 0.35);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'streak') {
      // Exciting rising scale
      const now = ctx.currentTime;
      const notes = [440, 554, 659, 880]; // A4, C#5, E5, A5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.1, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.26);
      });
    } else if (type === 'complete') {
      // A full celebratory fanfare!
      const now = ctx.currentTime;
      const fanfare = [
        { freq: 523.25, time: 0 },   // C5
        { freq: 523.25, time: 0.12 },// C5
        { freq: 523.25, time: 0.24 },// C5
        { freq: 659.25, time: 0.36 },// E5
        { freq: 587.33, time: 0.48 },// D5
        { freq: 783.99, time: 0.6 }  // G5 (sustained)
      ];
      fanfare.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.freq, now + n.time);

        const duration = n.time === 0.6 ? 0.7 : 0.12;
        gain.gain.setValueAtTime(0.12, now + n.time);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + n.time + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + n.time);
        osc.stop(now + n.time + duration + 0.05);
      });
    } else if (type === 'snake_eat') {
      // 8-bit blip sound
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(250, now);
      osc.frequency.setValueAtTime(500, now + 0.07);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'snake_die') {
      // 8-bit crash
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(30, now + 0.38);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.42);
    } else if (type === 'click') {
      // Subtle click sound
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, now);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch (e) {
    console.error("Audio Context failed", e);
  }
};

function ConfettiCanvas({ trigger }) {
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
      // Small burst in the upper middle area (centered)
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

          // Draw standard confetti square
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


// Square featured games mock images
// Square featured games mock images
const GAMES_DATA = [
  {
    name: "Space Trivia Expedition",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80",
    questions: [
      {
        q: "Which planet is known as the Red Planet?",
        options: ["Mars", "Venus", "Jupiter", "Saturn"],
        ans: 0,
        image: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=400&q=80",
        exp: "Mars appears reddish due to the high concentration of iron oxide (rust) on its surface."
      },
      {
        q: "What is the hottest planet in our solar system?",
        options: ["Venus", "Mercury", "Jupiter", "Mars"],
        ans: 0,
        image: "https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6?auto=format&fit=crop&w=400&q=80",
        exp: "Venus is the hottest planet because of its dense greenhouse atmosphere that traps heat."
      },
      {
        q: "Which planet is famous for its beautiful ring system?",
        options: ["Saturn", "Uranus", "Jupiter", "Neptune"],
        ans: 0,
        image: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?auto=format&fit=crop&w=400&q=80",
        exp: "Saturn has the most extensive and visible ring system, composed of ice and rocky debris."
      },
      {
        q: "What is the largest moon of Saturn?",
        options: ["Titan", "Europa", "Ganymede", "Callisto"],
        ans: 0,
        image: "https://images.unsplash.com/photo-1543722530-d2c3201371e7?auto=format&fit=crop&w=400&q=80",
        exp: "Titan is Saturn's largest moon and is the only known moon with a dense atmosphere and liquid lakes."
      },
      {
        q: "Which galaxy is closest to our own Milky Way?",
        options: ["Andromeda", "Triangulum", "Magellanic Cloud", "Sagittarius"],
        ans: 0,
        image: "https://images.unsplash.com/photo-1538370965046-79c0d6907d47?auto=format&fit=crop&w=400&q=80",
        exp: "The Andromeda Galaxy is the closest large spiral galaxy to the Milky Way."
      }
    ]
  },
  { name: "Quordle", image: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=400&q=80" },
  { name: "The Loop", image: "https://images.unsplash.com/photo-1528642474498-1af0c17fd8c3?auto=format&fit=crop&w=400&q=80" },
  { name: "Reunion", image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=400&q=80" },
  { name: "Tightrope", image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80" },
  { name: "Blossom", image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=400&q=80" },
  { name: "Octordle", image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80" },
  { name: "Sudoku", image: "https://images.unsplash.com/photo-1553856622-d1b352e9a211?auto=format&fit=crop&w=400&q=80" },
  { name: "Crossword", image: "https://images.unsplash.com/photo-1605235548773-455b706c88f1?auto=format&fit=crop&w=400&q=80" },
  { name: "Wordle", image: "https://images.unsplash.com/photo-1616423641402-f815ac5616ea?auto=format&fit=crop&w=400&q=80" },
  { name: "Connections", image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=400&q=80" },
  { name: "Spelling Bee", image: "https://images.unsplash.com/photo-1563240619-44ce092ba19e?auto=format&fit=crop&w=400&q=80" },
  {
    name: "Snake Knowledge Quiz",
    image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=400&q=80",
    questions: [
      { q: "Which snake is known as the longest venomous snake in the world?", options: ["King Cobra", "Black Mamba", "Inland Taipan", "Rattlesnake"], ans: 0, exp: "The King Cobra can reach lengths of up to 18 feet (5.5 meters), making it the longest venomous snake." },
      { q: "What do snakes use to smell their surroundings?", options: ["Their nose", "Their tongue", "Their skin", "Their eyes"], ans: 1, exp: "Snakes use their forked tongues to collect airborne particles, which are then analyzed by the Jacobson's organ in the roof of their mouth." },
      { q: "Which of these snakes is a constrictor?", options: ["Python", "Cobra", "Viper", "Coral Snake"], ans: 0, exp: "Pythons are constrictors, meaning they kill their prey by squeezing it until it suffocates." }
    ]
  }
];

// Split into Featured (Left) and New (Right)
const FEATURED_QUIZZES = [
  {
    id: 1,
    title: "Guess the Movie: Emoji Quiz",
    desc: "It's the pictures that got small.",
    image: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=600&q=80",
    questions: [
      { q: "🎬🚢🧊", image: "https://images.unsplash.com/photo-1518066000714-58c45f1a2c0a?auto=format&fit=crop&w=600&q=80", options: ["Titanic", "Jaws", "Pirates of the Caribbean", "Cast Away"], ans: 0, exp: "Titanic (1997)" },
      { q: "🦇👨🃏", image: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&w=600&q=80", options: ["The Dark Knight", "Spider-Man", "Iron Man", "Superman"], ans: 0, exp: "The Dark Knight features Batman and his archenemy, the Joker." },
      { q: "👽🚲🌕", image: "https://images.unsplash.com/photo-1618331835717-801e976710b2?auto=format&fit=crop&w=600&q=80", options: ["E.T. the Extra-Terrestrial", "Apollo 13", "Star Wars", "Alien"], ans: 0, exp: "E.T. (1982) features the iconic flying bicycle scene across the moon." },
      { q: "🦁👑🌅", image: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=600&q=80", options: ["The Lion King", "Madagascar", "Tarzan", "Jungle Book"], ans: 0, exp: "The Lion King is famous for Simba, Mufasa, and the Pride Lands." },
      { q: "🦖🏞️🚙", image: "https://images.unsplash.com/photo-1518331560945-8120b411d332?auto=format&fit=crop&w=600&q=80", options: ["Jurassic Park", "Godzilla", "King Kong", "Indiana Jones"], ans: 0, exp: "Jurassic Park features resurrected dinosaurs in a theme park." },
      { q: "🧙‍♂️💍🌋", image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=600&q=80", options: ["The Lord of the Rings", "Harry Potter", "The Hobbit", "Game of Thrones"], ans: 0, exp: "The Lord of the Rings follows the quest to destroy the One Ring." },
      { q: "🕷️👨🕸️", image: "https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=600&q=80", options: ["Spider-Man", "Ant-Man", "Venom", "Deadpool"], ans: 0, exp: "Spider-Man is the famous web-slinging superhero from Marvel." },
      { q: "🏴‍☠️🚢🦜", image: "https://images.unsplash.com/photo-1554189097-ffe88e998a2b?auto=format&fit=crop&w=600&q=80", options: ["Pirates of the Caribbean", "Peter Pan", "Treasure Island", "Waterworld"], ans: 0, exp: "Pirates of the Caribbean features Captain Jack Sparrow." },
      { q: "🍫🏭🎩", image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80", options: ["Charlie and the Chocolate Factory", "Willy Wonka", "Matilda", "Alice in Wonderland"], ans: 0, exp: "This features the eccentric chocolatier Willy Wonka." },
      { q: "🎈🏠👴👦", image: "https://images.unsplash.com/photo-1499696803273-0d3752e008aa?auto=format&fit=crop&w=600&q=80", options: ["Up", "The Wizard of Oz", "Mary Poppins", "Inside Out"], ans: 0, exp: "Up is the heartwarming Pixar movie about Carl Fredricksen's flying house." }
    ]
  },
  {
    id: 2,
    title: "Flags of the World Quiz: Undercover Edition",
    desc: "Can you identify the country based on just a fraction of a flag?",
    image: "https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?auto=format&fit=crop&w=600&q=80",
    questions: [
      { q: "Which flag has a red circle on a white background?", image: "/flags/jp.png", options: ["Japan", "South Korea", "Bangladesh", "Greenland"], ans: 0, exp: "Japan's flag is the Nisshōki, known as the Hinomaru." },
      { q: "Which country has a red maple leaf on its flag?", image: "/flags/ca.png", options: ["Canada", "Lebanon", "Peru", "Mexico"], ans: 0, exp: "Canada's national flag prominently features a red maple leaf." },
      { q: "Which flag is a simple red square with a white cross?", image: "/flags/ch.png", options: ["Switzerland", "Denmark", "Sweden", "Finland"], ans: 0, exp: "Switzerland is one of the only two countries to have a square flag." },
      { q: "Which flag has horizontal stripes of blue and yellow?", image: "/flags/ua.png", options: ["Ukraine", "Sweden", "Colombia", "Kazakhstan"], ans: 0, exp: "Ukraine's flag features two horizontal bands of blue and yellow." },
      { q: "Which flag has a green pentagram star on a red background?", image: "/flags/ma.png", options: ["Morocco", "Vietnam", "Turkey", "Senegal"], ans: 0, exp: "Morocco's flag is red with a green pentagram." },
      { q: "Which flag has fifty white stars on a blue canton with red and white stripes?", image: "/flags/us.png", options: ["United States", "Liberia", "Malaysia", "Puerto Rico"], ans: 0, exp: "The United States flag has 50 stars representing its 50 states." },
      { q: "Which flag has a single large yellow star on a red background?", image: "/flags/vn.png", options: ["Vietnam", "China", "Somalia", "Suriname"], ans: 0, exp: "Vietnam's flag is red with a large five-pointed yellow star in the center." },
      { q: "Which flag has green, white, and red vertical stripes with an eagle emblem?", image: "/flags/mx.png", options: ["Mexico", "Italy", "Ireland", "Iran"], ans: 0, exp: "Mexico's flag features an eagle perched on a cactus eating a snake." },
      { q: "Which flag is a green field with a yellow diamond and blue globe?", image: "/flags/br.png", options: ["Brazil", "Argentina", "Jamaica", "South Africa"], ans: 0, exp: "Brazil's flag features a starry blue globe with the motto 'Ordem e Progresso'." },
      { q: "Which flag has three horizontal stripes of black, red, and gold?", image: "/flags/de.png", options: ["Germany", "Belgium", "Austria", "Russia"], ans: 0, exp: "Germany's flag consists of three horizontal stripes of its national colors." },
      { q: "Which flag features a red cross on a white background?", image: "/flags/gb-eng.png", options: ["England", "Georgia", "Denmark", "Iceland"], ans: 0, exp: "The flag of England is derived from Saint George's Cross." },
      { q: "Which flag has a white crescent and star on a red background?", image: "/flags/tr.png", options: ["Turkey", "Pakistan", "Algeria", "Tunisia"], ans: 0, exp: "The flag of Turkey features a white star and crescent on a red background." },
      { q: "Which flag has blue and white horizontal stripes with a 'Sun of May'?", image: "/flags/ar.png", options: ["Argentina", "Uruguay", "Greece", "El Salvador"], ans: 0, exp: "Argentina's flag features the Sun of May in the center." },
      { q: "Which flag has black, yellow, and red vertical stripes?", image: "/flags/be.png", options: ["Belgium", "Germany", "Romania", "Chad"], ans: 0, exp: "Belgium's flag has vertical stripes, unlike Germany's horizontal stripes." },
      { q: "Which flag features an orange, white, and green vertical tricolor?", image: "/flags/ie.png", options: ["Ireland", "Italy", "Ivory Coast", "India"], ans: 0, exp: "Ireland's flag is a vertical tricolor of green, white, and orange." }
    ]
  },
  {
    id: 3,
    title: "Famous Landmarks of the World",
    desc: "Can you identify these iconic sites from a single photo?",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80",
    questions: [
      { q: "Where is the Eiffel Tower located?", options: ["Paris", "London", "Berlin", "Rome"], ans: 0, exp: "The Eiffel Tower is located on the Champ de Mars in Paris, France." },
      { q: "Which city is home to the Colosseum?", options: ["Rome", "Athens", "Naples", "Milan"], ans: 0, exp: "The Colosseum is an elliptical amphitheatre in the centre of the city of Rome, Italy." }
    ]
  },
  {
    id: 4,
    title: "Space Trivia Expedition",
    desc: "Test your knowledge of the cosmos and our solar system.",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
    questions: [
      { q: "Which planet is known as the Red Planet?", options: ["Mars", "Venus", "Jupiter", "Saturn"], ans: 0, exp: "Mars appears reddish due to the high concentration of iron oxide (rust) on its surface." },
      { q: "What is the hottest planet in our solar system?", options: ["Venus", "Mercury", "Jupiter", "Mars"], ans: 0, exp: "Venus is the hottest planet because of its dense greenhouse atmosphere that traps heat." }
    ]
  }
];

const NEW_QUIZZES = [
  {
    id: 6, title: "Snake Knowledge Quiz", desc: "Test your knowledge on serpents!", image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=400&q=80",
    questions: [
      { q: "Which snake is known as the longest venomous snake in the world?", options: ["King Cobra", "Black Mamba", "Inland Taipan", "Rattlesnake"], ans: 0, exp: "The King Cobra can reach lengths of up to 18 feet (5.5 meters), making it the longest venomous snake." },
      { q: "What do snakes use to smell their surroundings?", options: ["Their nose", "Their tongue", "Their skin", "Their eyes"], ans: 1, exp: "Snakes use their forked tongues to collect airborne particles, which are then analyzed by the Jacobson's organ in the roof of their mouth." },
      { q: "Which of these snakes is a constrictor?", options: ["Python", "Cobra", "Viper", "Coral Snake"], ans: 0, exp: "Pythons are constrictors, meaning they kill their prey by squeezing it until it suffocates." }
    ]
  },
  {
    id: 3, title: "Name That Greek God Quiz", desc: "Prepare for your next trip to Mount Olympus by identifying...", image: "https://images.unsplash.com/photo-1533518463841-d62e1fc91373?auto=format&fit=crop&w=200&q=80",
    questions: [
      { q: "Who is the god of thunder?", options: ["Zeus", "Ares", "Apollo", "Hermes"], ans: 0, exp: "Zeus is the king of the gods." },
      { q: "Who is the god of the underworld?", options: ["Hades", "Poseidon", "Ares", "Hephaestus"], ans: 0, exp: "Hades ruled the underworld in Greek mythology." },
      { q: "Who is the goddess of wisdom and war?", options: ["Athena", "Aphrodite", "Hera", "Artemis"], ans: 0, exp: "Athena is the patron goddess of Athens and represents wisdom and strategic warfare." }
    ]
  },
  {
    id: 4, title: "Former Names of Current Places Quiz", desc: "What is New Amsterdam called today?", image: "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&w=200&q=80",
    questions: [
      { q: "What is New Amsterdam called today?", options: ["New York", "Boston", "Chicago", "Philadelphia"], ans: 0, exp: "New York was formerly New Amsterdam." },
      { q: "Edo is the former name of which major city?", options: ["Tokyo", "Kyoto", "Osaka", "Seoul"], ans: 0, exp: "Tokyo was known as Edo until the 19th century." },
      { q: "Constantinople is the former name of which city?", options: ["Istanbul", "Rome", "Athens", "Alexandria"], ans: 0, exp: "Constantinople was renamed to Istanbul." }
    ]
  },
  {
    id: 5, title: "What Very Big Thing Happened on This Day?", desc: "Are you up to date on your famous historical dates?", image: "https://images.unsplash.com/photo-1510662145379-13537db782dc?auto=format&fit=crop&w=200&q=80",
    questions: [
      { q: "In what year did the Titanic sink?", options: ["1912", "1905", "1923", "1898"], ans: 0, exp: "The Titanic sank on April 15, 1912." },
      { q: "In what year did the Apollo 11 moon landing occur?", options: ["1969", "1965", "1972", "1959"], ans: 0, exp: "Apollo 11 landed on the moon on July 20, 1969." },
      { q: "In what year did the Berlin Wall fall?", options: ["1989", "1991", "1985", "1993"], ans: 0, exp: "The Berlin Wall fell on November 9, 1989." }
    ]
  }
];

const EDITORS_PICKS_DATA = [
  { id: 10, title: "Match the Baby Animal to Its Mama Quiz", desc: "Prove you're the best of the nest", image: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=400&q=80", isImageQuiz: false },
  { id: 11, title: "Guess the Country by Its Neighbors Quiz", desc: "Figure out if your geography skills border on greatness", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80", isImageQuiz: false },
  { id: 12, title: "Fruit or Vegetable? A Quiz", desc: "How to be a smarty-pants in the produce aisle.", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80", isImageQuiz: false },
  { id: 13, title: "Name That Dinosaur! Quiz", desc: "You don't need to be a paleontologist to dig this quiz.", image: "https://images.unsplash.com/photo-1525877442103-5ddb2089b2bb?auto=format&fit=crop&w=400&q=80", isImageQuiz: true },
  { id: 14, title: "Where on Earth Is That? Vol. 2 Quiz", desc: "Try to get high marks identifying these landmarks.", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=400&q=80", isImageQuiz: true },
  { id: 15, title: "What's That Symbol Mean? Quiz Vol. 2", desc: "Having trouble deciding which quiz to take? Consider this a sign.", image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=400&q=80", isImageQuiz: true },
  { id: 16, title: "U.S. State Capitals Quiz", desc: "From Albany to Trenton, can you name them all?", image: "https://images.unsplash.com/photo-1501466044931-62695aada8e9?auto=format&fit=crop&w=400&q=80", isImageQuiz: false },
  { id: 17, title: "Famous Figures in American Military History Quiz", desc: "A 16-question salute to American armed forces.", image: "https://images.unsplash.com/photo-1506760610100-1af6025cf0c7?auto=format&fit=crop&w=400&q=80", isImageQuiz: false }
];

const POPULAR_DATA = [
  { id: 20, title: "Can You Name These 19th-Century Figures?", desc: "Test your knowledge of the people who shaped the 1800s.", image: "https://images.unsplash.com/photo-1510662145379-13537db782dc?auto=format&fit=crop&w=400&q=80" },
  { id: 21, title: "The Ultimate Periodic Table Quiz", desc: "Do you know your helium from your hafnium?", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80" },
  { id: 22, title: "World Geography: Expert Level", desc: "For those who think they know every corner of the map.", image: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=400&q=80" },
  { id: 23, title: "Famous Landmarks of the World", desc: "Can you identify these iconic sites from a single photo?", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=400&q=80" }
];

const KMSLogo = ({ size = "1rem" }) => (
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

function BrowseScreen({ onNavigate, games, searchQuery, newQuizzes, editorsPicksTitle, popularTitle, showFeaturedGames }) {
  const [history, setHistory] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [maxStreak, setMaxStreak] = useState(0);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('quiznova_history');
      if (savedHistory) setHistory(JSON.parse(savedHistory));
      const savedMaxStreak = localStorage.getItem('quiznova_max_streak');
      if (savedMaxStreak) setMaxStreak(Number(savedMaxStreak));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const totalXP = history.reduce((acc, curr) => acc + curr.xpEarned, 0);
  const currentLevel = Math.floor(totalXP / 300) + 1;
  const levelXPProgress = totalXP % 300;
  const xpPercent = Math.min(100, Math.round((levelXPProgress / 300) * 100)) || 0;

  return (
    <div className="main-container">
      <a href="#" className="back-link">← KMSACADEMY.com</a>


      <div className="header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>{searchQuery ? `Search Results for "${searchQuery}"` : 'Quizzes'}</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="category-dropdown">
            <option>All Categories</option>
            <option>Animals</option>
            <option>History</option>
            <option>Science</option>
          </select>
          <div style={{ display: 'flex', background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden' }}>
            <button onClick={() => setViewMode('grid')} style={{ padding: '0.4rem 0.8rem', background: viewMode === 'grid' ? 'var(--accent-1)' : 'transparent', color: viewMode === 'grid' ? '#fff' : 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>🔲 Grid</button>
            <button onClick={() => setViewMode('list')} style={{ padding: '0.4rem 0.8rem', background: viewMode === 'list' ? 'var(--accent-1)' : 'transparent', color: viewMode === 'list' ? '#fff' : 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>📄 List</button>
          </div>
        </div>
      </div>

      {searchQuery ? (
        <div className={viewMode === 'grid' ? "games-grid" : ""} style={{ display: viewMode === 'list' ? 'flex' : '', flexDirection: viewMode === 'list' ? 'column' : '', gap: '1rem' }}>
          {[...FEATURED_QUIZZES, ...EDITORS_PICKS_DATA, ...POPULAR_DATA, ...newQuizzes, ...games.filter(g => !g.isHidden).map(g => ({ ...g, title: g.name, id: g.name }))]
            .filter(q => (q.title || '').toLowerCase().includes((searchQuery || '').toLowerCase()))
            .map((quiz, i) => (
              <div
                key={i}
                className={viewMode === 'grid' ? "game-square" : "list-card"}
                onClick={() => onNavigate('quiz', quiz)}
                style={viewMode === 'list' ? { background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: '12px', cursor: 'pointer', display: 'flex', gap: '1rem', alignItems: 'center', transition: 'background 0.2s' } : { position: 'relative' }}
              >
                <img src={quiz.image} alt={quiz.title} style={viewMode === 'list' ? { width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' } : {}} />
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-main)', fontSize: viewMode === 'list' ? '1.2rem' : 'inherit' }}>{quiz.title}</h3>
                  {quiz.desc && <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{quiz.desc}</p>}
                </div>
              </div>
            ))
          }
        </div>
      ) : (
        <>
          <div className="top-grid">
            {/* Left Side: Featured Quizzes */}
            <div className="featured-quizzes">
              {FEATURED_QUIZZES.map(quiz => (
                <div key={quiz.id} className="featured-card" onClick={() => onNavigate('quiz', quiz)}>
                  <img src={quiz.image} className="f-card-img" alt={quiz.title} />
                  <div className="f-card-body">
                    <h3>{quiz.title}</h3>
                    <p>{quiz.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Side: New Quizzes List */}
            <div className="new-quizzes">
              <h2>New Quizzes</h2>
              {newQuizzes.map(quiz => (
                <div key={quiz._id || quiz.id || quiz.title} className="list-card" onClick={() => onNavigate('quiz', quiz)}>
                  <img src={quiz.image} className="list-card-img" alt={quiz.title} />
                  <div className="list-card-info">
                    <h4>{quiz.title}</h4>
                    <p>{quiz.desc}</p>
                  </div>
                </div>
              ))}
              <a href="#" className="see-all-btn">See All →</a>
            </div>
          </div>

          {/* Editors' Picks Section */}
          {!searchQuery && (
            <section className="editors-picks-section">
              <h2>{editorsPicksTitle || "Editors' Picks"}</h2>
              <div className="ep-grid">
                {EDITORS_PICKS_DATA.map(quiz => (
                  <div key={quiz.id} className="ep-card" onClick={() => onNavigate('quiz', { ...quiz, questions: [{ q: "Demo Question?", options: ["A", "B"], ans: 0, exp: "Demo exp" }] })}>
                    <div className="ep-img-container">
                      <img src={quiz.image} alt={quiz.title} className="ep-img" />
                      {quiz.isImageQuiz && <div className="ep-badge">🖼️</div>}
                    </div>
                    <div className="ep-info">
                      <div className="ep-title">{quiz.title}</div>
                      <div className="ep-desc">{quiz.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Popular Section */}
          <section className="editors-picks-section">
            <h2>{popularTitle || "Popular"}</h2>
            <div className="ep-grid">
              {POPULAR_DATA.map(quiz => (
                <div key={quiz.id} className="ep-card" onClick={() => onNavigate('quiz', { ...quiz, questions: [{ q: "Demo Question?", options: ["A", "B"], ans: 0, exp: "Demo exp" }] })}>
                  <div className="ep-img-container">
                    <img src={quiz.image} alt={quiz.title} className="ep-img" />
                  </div>
                  <div className="ep-info">
                    <div className="ep-title">{quiz.title}</div>
                    <div className="ep-desc">{quiz.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Featured Games Grid (Bottom) */}
          <section className="featured-games" style={{ display: showFeaturedGames ? 'block' : 'none' }}>
            <div className="main-container" style={{ padding: '0', minHeight: 'auto', background: 'transparent' }}>
              <h2>Featured Games</h2>
              <div className="games-grid">
                {games.filter(g => !g.isHidden).map(game => (
                  <div
                    key={game._id || game.id || game.name}
                    className="game-square"
                    style={{ position: 'relative' }}
                    onClick={() => {
                      onNavigate('quiz', {
                        title: game.name,
                        image: game.image,
                        questions: game.questions || [{ q: "Did you know this game doesn't have custom questions yet?", options: ["Yes", "No"], ans: 0, exp: "We're adding them soon!" }]
                      });
                    }}
                  >
                    <img src={game.image} alt={game.name} />
                    {game.questions && game.questions.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        background: 'var(--accent-gradient)',
                        color: '#fff',
                        padding: '4px 10px',
                        borderRadius: '99px',
                        fontSize: '0.7rem',
                        fontWeight: '800',
                        boxShadow: '0 4px 10px rgba(56, 189, 248, 0.3)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 2
                      }}>
                        ✨ {game.questions.length} Qs
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function QuizLandingScreen({ quiz, onStart, onNavigate }) {
  const [timerBonus, setTimerBonus] = useState(true);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <span
          className="back-link"
          onClick={() => onNavigate('home')}
        >
          ← BACK TO GAMES & QUIZZES
        </span>
      </div>

      <div className="breadcrumb">
        <span style={{ margin: 0, cursor: 'pointer' }} onClick={() => onNavigate('home')}>Home</span>
        <span>›</span>
        <span style={{ margin: 0, cursor: 'pointer' }} onClick={() => onNavigate('home')}>Games & Quizzes</span>
        <span>›</span>
        <span style={{ margin: 0, color: 'var(--text-gray)' }}>{quiz.title}</span>
      </div>

      <div className="landing-hero" style={{ backgroundImage: `url(${quiz.image})` }}>
        <div className="image-quiz-badge">
          🖼️ Image Quiz
        </div>

        <div className="floating-start-card">
          <div className="landing-category-pill">
            Entertainment & Pop Culture
          </div>
          <h1>{quiz.title}</h1>
          <button className="start-btn" onClick={onStart}>
            Start
          </button>

          <div className="landing-meta">
            <span>{quiz.questions.length} Questions</span>
            <div className="flex items-center gap-2">
              <span>Timer Bonus</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={timerBonus}
                  onChange={(e) => setTimerBonus(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
      <div className="login-prompt">
        <span>★</span> Save your scores! Login before you play.
      </div>
    </div>
  );
}

function SnakeGame({ quiz, onNavigate, onComplete }) {
  const GRID_SIZE = 15;
  const [snake, setSnake] = useState([{ x: 7, y: 7 }]);
  const [dir, setDir] = useState('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [foods, setFoods] = useState([]);
  const [won, setWon] = useState(false);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('quiznova_snake_highscore') || '0'));

  // Calculate dynamic tick speed (accelerates as questions progress!)
  const tickSpeed = Math.max(160, 420 - currentQIdx * 70);

  useEffect(() => {
    if (gameOver || won) return;
    const q = quiz.questions[currentQIdx];
    if (!q) { setWon(true); return; }

    // Spawn foods
    const newFoods = [];
    q.options.forEach((opt, i) => {
      let fx, fy, overlap;
      do {
        fx = Math.floor(Math.random() * GRID_SIZE);
        fy = Math.floor(Math.random() * GRID_SIZE);
        overlap = snake.some(s => s.x === fx && s.y === fy) || newFoods.some(f => f.x === fx && f.y === fy);
      } while (overlap);
      newFoods.push({ x: fx, y: fy, text: opt, isCorrect: i === q.ans });
    });
    setFoods(newFoods);
  }, [currentQIdx, gameOver, won]);

  useEffect(() => {
    if (gameOver || won || foods.length === 0) return;
    const interval = setInterval(() => {
      setSnake(prev => {
        const head = { ...prev[0] };
        if (dir === 'UP') head.y -= 1;
        if (dir === 'DOWN') head.y += 1;
        if (dir === 'LEFT') head.x -= 1;
        if (dir === 'RIGHT') head.x += 1;

        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          playSound('snake_die');
          setGameOver(true);
          return prev;
        }
        if (prev.some(s => s.x === head.x && s.y === head.y)) {
          playSound('snake_die');
          setGameOver(true);
          return prev;
        }

        const newSnake = [head, ...prev];
        const eatenIdx = foods.findIndex(f => f.x === head.x && f.y === head.y);

        if (eatenIdx !== -1) {
          if (foods[eatenIdx].isCorrect) {
            const addedScore = 5 + (currentQIdx * 2); // incremental scoring
            const newScore = score + addedScore;
            setScore(newScore);
            playSound('snake_eat');

            if (newScore > highScore) {
              setHighScore(newScore);
              localStorage.setItem('quiznova_snake_highscore', newScore.toString());
            }

            if (currentQIdx < quiz.questions.length - 1) {
              setFoods([]); // trigger respawn
              setCurrentQIdx(q => q + 1);
            } else {
              setWon(true);
              playSound('complete');
              if (onComplete) {
                // Register snake quiz completion in global stats!
                onComplete(newScore * 30, quiz.questions.length, 0, quiz.title);
              }
            }
          } else {
            playSound('snake_die');
            setGameOver(true);
          }
        } else {
          newSnake.pop();
        }
        return newSnake;
      });
    }, tickSpeed);
    return () => clearInterval(interval);
  }, [dir, gameOver, won, foods, currentQIdx, score, tickSpeed]);

  useEffect(() => {
    const handleKey = (e) => {
      if (['ArrowUp', 'w', 'W'].includes(e.key) && dir !== 'DOWN') { e.preventDefault(); setDir('UP'); }
      if (['ArrowDown', 's', 'S'].includes(e.key) && dir !== 'UP') { e.preventDefault(); setDir('DOWN'); }
      if (['ArrowLeft', 'a', 'A'].includes(e.key) && dir !== 'RIGHT') { e.preventDefault(); setDir('LEFT'); }
      if (['ArrowRight', 'd', 'D'].includes(e.key) && dir !== 'LEFT') { e.preventDefault(); setDir('RIGHT'); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dir]);

  return (
    <div className="quiz-page-wrapper flex-col" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

      {/* Title Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontFamily: 'Outfit, sans-serif', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
          🐍 Retro Neon Snake Quiz
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '0.25rem 0 0 0' }}>
          Steer the snake with <strong>Arrow keys / WASD</strong> or the <strong>Arcade D-Pad</strong> to eat the <strong>CORRECT</strong> answer!
        </p>
      </div>

      {/* Info Stats Bar */}
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', padding: '0.75rem 2rem', borderRadius: '50px', backdropFilter: 'blur(10px)' }}>
        <div style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: 'bold' }}>
          Score: <span style={{ color: 'var(--accent-1)' }}>{score}</span>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          🏆 Highscore: <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{highScore}</span>
        </div>
        <div style={{ color: 'var(--text-main)', fontSize: '1rem' }}>
          ⚡ Speed Level: <span style={{ color: '#ff4b4b', fontWeight: 'bold' }}>{currentQIdx + 1}</span>
        </div>
      </div>

      {gameOver && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem 2rem', borderRadius: '16px', marginBottom: '1rem', animation: 'popIn 0.3s ease' }}>
          <h3 style={{ color: '#f87171', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            💥 GAME OVER! You crashed or ate the wrong option.
          </h3>
        </div>
      )}

      {won && (
        <div style={{ background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)', padding: '1.5rem 3rem', borderRadius: '16px', marginBottom: '1rem', textAlign: 'center', animation: 'popIn 0.4s ease' }}>
          <h3 style={{ color: '#4ade80', margin: 0, fontSize: '1.5rem' }}>🎉 PERFECT RUN! YOU WIN!</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '0.5rem 0 0 0' }}>Earned +{(score * 30).toLocaleString()} XP!</p>
        </div>
      )}

      {/* Question Card Box */}
      {!gameOver && !won && (
        <div style={{ width: '100%', maxWidth: '650px', background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', padding: '1.5rem', borderRadius: '20px', marginBottom: '1.5rem', textAlign: 'center', boxShadow: 'var(--card-shadow)', backdropFilter: 'blur(10px)' }}>
          <span style={{ background: 'var(--accent-gradient)', color: 'white', padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Question {currentQIdx + 1} of {quiz.questions.length}
          </span>
          <h3 style={{ fontSize: '1.45rem', marginTop: '0.75rem', color: '#fff', lineHeight: '1.4' }}>
            {quiz.questions[currentQIdx]?.q}
          </h3>
        </div>
      )}

      {/* Grid Container */}
      <div style={{
        position: 'relative',
        width: '550px',
        height: '550px',
        background: 'radial-gradient(circle, #090d16 0%, #030712 100%)',
        border: '4px solid var(--accent-1)',
        borderRadius: '16px',
        boxShadow: '0 0 25px rgba(56, 189, 248, 0.3), inset 0 0 40px rgba(0,0,0,0.8)',
        overflow: 'hidden'
      }}>
        {/* Retro Grid Cell BG Lines */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, width: '100%', height: '100%',
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: `${100 / GRID_SIZE}% ${100 / GRID_SIZE}%`,
          pointerEvents: 'none'
        }} />

        {/* Render Snake */}
        {snake.map((s, i) => {
          const isHead = i === 0;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${(s.x / GRID_SIZE) * 100}%`,
                top: `${(s.y / GRID_SIZE) * 100}%`,
                width: `${100 / GRID_SIZE}%`,
                height: `${100 / GRID_SIZE}%`,
                background: isHead ? 'linear-gradient(135deg, #4ade80, #22c55e)' : '#16a34a',
                border: '1.5px solid #030712',
                borderRadius: isHead ? '6px' : '4px',
                boxShadow: isHead ? '0 0 10px rgba(74, 222, 128, 0.6)' : 'none',
                zIndex: isHead ? 4 : 3,
                transition: 'all 0.1s linear'
              }}
            />
          );
        })}

        {/* Render Foods */}
        {foods.map((f, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${(f.x / GRID_SIZE) * 100}%`,
              top: `${(f.y / GRID_SIZE) * 100}%`,
              width: `${100 / GRID_SIZE}%`,
              height: `${100 / GRID_SIZE}%`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 5
            }}
          >
            <div style={{
              background: f.isCorrect ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${f.isCorrect ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`,
              color: f.isCorrect ? '#000' : 'rgba(255,255,255,0.8)',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '0.65rem',
              fontWeight: '900',
              whiteSpace: 'nowrap',
              boxShadow: f.isCorrect ? '0 0 15px rgba(245, 158, 11, 0.5)' : 'none',
              transform: 'scale(1)',
              animation: f.isCorrect ? 'pulse 1.5s infinite alternate' : 'none'
            }}>
              {f.text}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile/Tablet Virtual Arcade D-Pad Controller */}
      <div className="arcade-controller" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button
          className="arcade-btn"
          onClick={() => { if (dir !== 'DOWN') setDir('UP'); playSound('click'); }}
          style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', color: 'white', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', transition: 'all 0.1s' }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          ▲
        </button>
        <div style={{ display: 'flex', gap: '2rem', margin: '0.3rem 0' }}>
          <button
            className="arcade-btn"
            onClick={() => { if (dir !== 'RIGHT') setDir('LEFT'); playSound('click'); }}
            style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', color: 'white', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', transition: 'all 0.1s' }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            ◀
          </button>
          <button
            className="arcade-btn"
            onClick={() => { if (dir !== 'LEFT') setDir('RIGHT'); playSound('click'); }}
            style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', color: 'white', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', transition: 'all 0.1s' }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            ▶
          </button>
        </div>
        <button
          className="arcade-btn"
          onClick={() => { if (dir !== 'UP') setDir('DOWN'); playSound('click'); }}
          style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', color: 'white', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', transition: 'all 0.1s' }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          ▼
        </button>
      </div>

      {/* Bottom Actions Row */}
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem' }}>
        <button className="primary-btn" style={{ background: 'transparent', border: '1px solid var(--border-subtle)' }} onClick={() => { playSound('click'); onNavigate('home'); }}>
          Back to Browse
        </button>
        {(gameOver || won) && (
          <button className="primary-btn" onClick={() => { playSound('click'); setSnake([{ x: 7, y: 7 }]); setDir('RIGHT'); setScore(0); setCurrentQIdx(0); setGameOver(false); setWon(false); }}>
            Play Again 🔄
          </button>
        )}
      </div>
    </div>
  );
}

function QuizScreen({ quiz, onNavigate, onComplete }) {
  if (quiz.id === 6) {
    return <SnakeGame quiz={quiz} onNavigate={onNavigate} onComplete={onComplete} />;
  }

  const [hasStarted, setHasStarted] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [selected, setSelected] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Gamified elements
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState(null);

  useEffect(() => {
    if (isFinished) {
      // Calculate final bonus
      const streakBonus = maxStreak >= 3 ? maxStreak * 15 : 0;
      const finalXP = score * 50 + streakBonus;

      // Play success chime
      playSound('complete');

      // Trigger confetti cannon explosion!
      setConfettiTrigger({ type: 'complete', id: Date.now() });

      if (onComplete) {
        onComplete(finalXP, maxStreak, streakBonus, quiz.title);
      }
    }
  }, [isFinished]);

  useEffect(() => {
    if (!hasStarted || isFinished) return;
    if (timeLeft > 0 && !showExplanation) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showExplanation) {
      playSound('wrong');
      setStreak(0);
      setShowExplanation(true);
      setFeedback({
        isCorrect: false,
        emoji: "⏰",
        message: "Time is up! Speed matters!"
      });
    }
  }, [timeLeft, showExplanation, isFinished, hasStarted]);

  const handleSelect = (idx) => {
    if (showExplanation) return;
    setSelected(idx);
    const isCorrect = idx === shuffledQuestions[currentQIdx].ans;

    if (isCorrect) {
      setScore(s => s + 1);
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      if (nextStreak > maxStreak) setMaxStreak(nextStreak);

      // Play audio effects & confetti burst
      if (nextStreak >= 3) {
        playSound('streak');
      } else {
        playSound('correct');
      }
      setConfettiTrigger({ type: 'correct', id: Date.now() });

      const emojis = ["🎉", "😎", "🔥", "🚀", "🥳", "✨", "🧠", "🎯", "🏆", "🌟"];
      const messages = ["Nailed it!", "Too easy for you!", "Spot on!", "Brain size: MEGA", "You're on fire!"];

      let baseMsg = messages[Math.floor(Math.random() * messages.length)];
      if (nextStreak >= 3) {
        baseMsg += ` Combo Streak x${nextStreak}! 🔥`;
      }

      setFeedback({
        isCorrect: true,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        message: baseMsg
      });
    } else {
      setStreak(0);
      playSound('wrong');
      const emojis = ["😅", "🫣", "💪", "💡", "🌱", "🙃", "👀"];
      const messages = ["Oops, almost!", "Keep going!", "Learning moment!", "Not quite, but good guess!", "Next time for sure!"];
      setFeedback({
        isCorrect: false,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        message: messages[Math.floor(Math.random() * messages.length)]
      });
    }

    setShowExplanation(true);
  };

  const handleNext = () => {
    playSound('click');
    if (currentQIdx < shuffledQuestions.length - 1) {
      setCurrentQIdx(q => q + 1);
      setSelected(null);
      setShowExplanation(false);
      setFeedback(null);
      setTimeLeft(15);
    } else {
      setIsFinished(true);
    }
  };

  const startQuiz = () => {
    playSound('click');
    const allQuestions = [...quiz.questions];
    // Shuffle and pick up to 5 questions
    const shuffled = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 5);

    // Dynamically shuffle the options for each question
    const questionsWithOptionsShuffled = shuffled.map(q => {
      const correctOptionText = q.options[q.ans];
      const newOptions = [...q.options].sort(() => 0.5 - Math.random());
      const newAnsIdx = newOptions.indexOf(correctOptionText);
      return {
        ...q,
        options: newOptions,
        ans: newAnsIdx
      };
    });

    setShuffledQuestions(questionsWithOptionsShuffled);
    setHasStarted(true);
    setCurrentQIdx(0);
    setScore(0);
    setTimeLeft(15);
    setIsFinished(false);
    setShowExplanation(false);
    setSelected(null);
    setFeedback(null);
    setStreak(0);
    setMaxStreak(0);
  };

  if (!hasStarted) {
    return <QuizLandingScreen quiz={quiz} onStart={startQuiz} onNavigate={onNavigate} />;
  }

  if (isFinished) {
    const streakBonus = maxStreak >= 3 ? maxStreak * 15 : 0;
    const totalXP = score * 50 + streakBonus;
    return (
      <div className="quiz-page-wrapper flex-col" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <ConfettiCanvas trigger={confettiTrigger} />

        <div style={{ position: 'absolute', top: 0, left: 0, padding: '2rem' }}>
          <span className="back-link" style={{ cursor: 'pointer' }} onClick={() => { playSound('click'); onNavigate('home'); }}>← BACK TO GAMES & QUIZZES</span>
        </div>

        <h2 style={{ fontSize: '3rem', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Quiz Complete! 🎉</h2>

        <div style={{ textAlign: 'center', width: '100%', maxWidth: '600px', background: 'var(--glass-bg)', padding: '3rem', border: '1px solid var(--border-subtle)', borderRadius: '24px', backdropFilter: 'blur(20px)', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
          <h3 style={{ fontSize: '2.2rem', marginBottom: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>You scored {score} / {shuffledQuestions.length}</h3>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', marginBottom: '2.5rem' }}>
            <p style={{ fontSize: '1.4rem', color: 'var(--accent-1)', fontWeight: 'bold', margin: 0 }}>⚡ Earned +{totalXP} XP!</p>
            {maxStreak >= 3 && (
              <p style={{ fontSize: '0.95rem', color: '#fbbf24', marginTop: '0.5rem', marginBottom: 0, fontWeight: 'bold' }}>
                🔥 Streak Combo Bonus: +{streakBonus} XP (Max Streak: {maxStreak}x)
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="primary-btn" onClick={() => { playSound('click'); onNavigate('home'); }}>Back to Browse</button>
            <button className="primary-btn" style={{ background: 'transparent', border: '1px solid var(--accent-1)' }} onClick={startQuiz}>Retake Quiz 🔄</button>
            <button className="primary-btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)' }} onClick={() => { playSound('click'); navigator.clipboard.writeText(`I scored ${score}/${shuffledQuestions.length} and earned ${totalXP} XP on QuizNova! 🚀`); alert('Score details copied to clipboard!'); }}>Share 🔗</button>
            <button className="primary-btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)' }} onClick={() => { playSound('click'); onNavigate('leaderboard'); }}>Leaderboard 🏆</button>
          </div>
        </div>
      </div>
    );
  }

  const question = shuffledQuestions[currentQIdx];
  const isTimerLow = timeLeft <= 4 && !showExplanation;

  return (
    <div className="quiz-page-wrapper">
      <ConfettiCanvas trigger={confettiTrigger} />

      <div className="quiz-card" style={{ transition: 'all 0.3s ease' }}>
        {/* Header Bar */}
        <div className="quiz-header">
          <div className="quiz-header-title">
            <span
              style={{ cursor: 'pointer', marginRight: '1rem' }}
              onClick={() => { playSound('click'); onNavigate('home'); }}
            >
              ←
            </span>
            {quiz.title}
          </div>
          <div className="quiz-stats" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div
              className={`timer-circle ${isTimerLow ? 'timer-pulsing' : ''}`}
              style={{
                background: isTimerLow ? '#ef4444' : 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontWeight: '900',
                border: `2px solid ${isTimerLow ? '#f87171' : 'var(--accent-1)'}`,
                boxShadow: isTimerLow ? '0 0 15px rgba(239, 68, 68, 0.6)' : 'none',
                transform: isTimerLow ? 'scale(1.15)' : 'scale(1)',
                transition: 'all 0.3s'
              }}
            >
              {timeLeft}
            </div>
            <div>{currentQIdx + 1} of {shuffledQuestions.length}</div>
            <div className="score-badge" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              Score: {score}
              {streak >= 2 && (
                <span style={{ background: '#f59e0b', color: '#000', padding: '2px 6px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '900' }}>
                  🔥 {streak}x
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="quiz-body">
          <div className="quiz-question-row">
            {question.image && (
              <div className="quiz-image-container" style={{ background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={question.image} alt="Question Context" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }} />
              </div>
            )}
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <div className="question-box" style={{ margin: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {question.q}
              </div>
            </div>
          </div>

          <div className="options-grid">
            {question.options.map((opt, i) => {
              let btnClass = "option-pill";
              if (!showExplanation && selected === i) btnClass += " selected";
              if (showExplanation) {
                if (i === question.ans) btnClass += " correct";
                else if (selected === i) btnClass += " wrong";
              }
              return (
                <button key={i} className={btnClass} onClick={() => handleSelect(i)} disabled={showExplanation}>
                  {opt}
                </button>
              );
            })}
          </div>

          {showExplanation && (
            <div style={{ marginTop: '0.5rem', width: '100%', maxWidth: '700px', animation: 'popIn 0.4s ease-out' }}>



              <div className="explanation-box">
                <p className="explanation-text">{question.exp}</p>
              </div>

              <button className="primary-btn next-btn" onClick={handleNext}>
                {currentQIdx < shuffledQuestions.length - 1 ? 'Next Question' : 'View Results'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Sidebar({ isOpen, onClose, onNavigate, games, userRole, onLogout, onLogin, currentUser }) {
  const renderAvatar = () => {
    if (userRole === 'guest') {
      return (
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', marginBottom: '1rem', border: '1px solid var(--border-subtle)' }}>
          👤
        </div>
      );
    }
    
    if (currentUser && currentUser.avatar) {
      if (currentUser.avatar.startsWith('http')) {
        return (
          <img src={currentUser.avatar} alt="Avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '1rem', objectFit: 'cover', border: '2px solid var(--accent-1)' }} />
        );
      }
      return (
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', color: 'white', fontWeight: 'bold', marginBottom: '1rem', boxShadow: '0 8px 25px rgba(16,185,129,0.25)' }}>
          {currentUser.avatar}
        </div>
      );
    }

    return (
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', color: 'white', fontWeight: 'bold', marginBottom: '1rem', boxShadow: '0 8px 25px rgba(16,185,129,0.25)' }}>
        {userRole === 'admin' ? 'AD' : 'US'}
      </div>
    );
  };

  const nameText = userRole === 'guest' 
    ? 'Welcome, Guest!' 
    : userRole === 'admin' 
      ? 'Administrator' 
      : (currentUser ? currentUser.username : 'Quiz Explorer');

  const emailText = userRole === 'admin' 
    ? 'admin@kmsacademy.org' 
    : (currentUser ? currentUser.email : 'explorer@kmsacademy.org');

  return (
    <div className={`menu-overlay ${isOpen ? 'show' : ''}`} style={{ display: isOpen ? 'flex' : 'none' }} onClick={onClose}>
      <div className={`sidebar ${isOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="sidebar-header">
          <span className="close-btn" onClick={onClose}>✕</span>
          <div className="brand-text" style={{ display: 'flex', alignItems: 'center' }}>
            <KMSLogo size="1.2rem" />
          </div>
        </div>

        <div
          style={{
            padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
            borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.01)',
            cursor: 'pointer', transition: 'background 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'}
          onClick={() => {
            if (userRole === 'guest') {
              onLogin();
            } else if (userRole === 'admin') {
              onNavigate('admin');
            } else {
              onNavigate('profile');
            }
            onClose();
          }}
        >
          {renderAvatar()}

          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '0.5px', textAlign: 'center' }}>
            {nameText}
          </div>
          {userRole !== 'guest' && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontWeight: '500', textAlign: 'center', wordBreak: 'break-word', maxWidth: '100%' }}>
              {emailText}
            </div>
          )}
        </div>

        <div className="sidebar-content">
          <div className="sidebar-section-title">Account</div>
          {userRole !== 'guest' ? (
            <>
              {userRole === 'admin' ? (
                <div className="sidebar-item" onClick={() => { onNavigate('admin'); onClose(); }}>
                  <div className="sidebar-icon">🛡️</div>
                  <div className="sidebar-text">Admin Panel</div>
                </div>
              ) : (
                <div className="sidebar-item" onClick={() => { onNavigate('profile'); onClose(); }}>
                  <div className="sidebar-icon">👤</div>
                  <div className="sidebar-text">Profile</div>
                </div>
              )}
              <div className="sidebar-item" onClick={() => { onNavigate('account'); onClose(); }}>
                <div className="sidebar-icon">⚙️</div>
                <div className="sidebar-text">Account</div>
              </div>
              <div className="sidebar-item" onClick={() => { onNavigate('leaderboard'); onClose(); }}>
                <div className="sidebar-icon">🏆</div>
                <div className="sidebar-text">Leaderboard</div>
              </div>
              <div className="sidebar-item" onClick={() => { onLogout(); onClose(); }}>
                <div className="sidebar-icon">🚪</div>
                <div className="sidebar-text" style={{ color: '#ef4444' }}>Log Out</div>
              </div>
            </>
          ) : (
            <>
              <div className="sidebar-item" onClick={() => { onLogin(); onClose(); }}>
                <div className="sidebar-icon">🔑</div>
                <div className="sidebar-text">Log In / Register</div>
              </div>
              <div className="sidebar-item" onClick={() => { onNavigate('leaderboard'); onClose(); }}>
                <div className="sidebar-icon">🏆</div>
                <div className="sidebar-text">Leaderboard</div>
              </div>
            </>
          )}

          <div className="sidebar-section-title" style={{ marginTop: '1.5rem' }}>Games</div>
          {games.filter(g => !g.isHidden).map((game, idx) => (
            <div key={game._id || game.id || game.name} className="sidebar-item" onClick={() => {
              onNavigate('quiz', {
                title: game.name,
                image: game.image,
                questions: game.questions || [{ q: "Did you know this game doesn't have custom questions yet?", options: ["Yes", "No"], ans: 0, exp: "We're adding them soon!" }]
              });
              onClose();
            }}>
              <div className="sidebar-icon">
                <img src={game.image} alt="" />
              </div>
              <div className="sidebar-text">{game.name} {idx === 0 && <span className="new-badge">NEW</span>}</div>
            </div>
          ))}
          <div className="sidebar-item" onClick={onClose}>
            <div className="sidebar-icon">🧩</div>
            <div className="sidebar-text">Sudoku</div>
          </div>

          <div className="sidebar-section-title">KMS Academy Quizzes</div>
          {FEATURED_QUIZZES.map(quiz => (
            <div key={quiz._id || quiz.id || quiz.title} className="sidebar-item" onClick={() => { onNavigate('quiz', quiz); onClose(); }}>
              <div className="sidebar-icon">❓</div>
              <div className="sidebar-text">{quiz.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Toast({ message, type, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(onRemove, 3000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  return (
    <div className={`toast ${type}`}>
      {type === 'success' ? '✅' : '❌'} {message}
    </div>
  );
}

function LeaderboardScreen({ onNavigate, data }) {
  const [filter, setFilter] = useState('All-time');
  const [type, setType] = useState('Global');

  return (
    <div className="main-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <span className="back-link" style={{ cursor: 'pointer' }} onClick={() => onNavigate('home')}>← BACK TO GAMES & QUIZZES</span>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '3rem', fontFamily: 'Outfit, sans-serif', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Leaderboard 🏆</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '0.5rem' }}>See how you stack up against the best QuizNova players.</p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto 1.5rem auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--glass-bg)', padding: '0.5rem', borderRadius: '12px' }}>
          {['Global', 'Quiz-specific'].map(t => (
            <button key={t} onClick={() => setType(t)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: type === t ? 'var(--accent-1)' : 'transparent', color: type === t ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold' }}>{t}</button>
          ))}
          {type === 'Quiz-specific' && (
            <select style={{ background: 'transparent', color: '#fff', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.5rem', marginLeft: '0.5rem' }}>
              <option>All Quizzes</option>
              <option>Famous Landmarks</option>
              <option>Space Trivia</option>
            </select>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['Daily', 'Weekly', 'Monthly', 'All-time'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: filter === f ? 'rgba(255,255,255,0.1)' : 'transparent', color: filter === f ? '#fff' : 'var(--text-muted)', cursor: 'pointer' }}>{f}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'var(--glass-bg)', borderRadius: '24px', padding: '2rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)' }}>
        {data.map((user, index) => (
          <div key={user.rank} style={{ display: 'flex', alignItems: 'center', padding: '1.25rem', borderBottom: index < data.length - 1 ? '1px solid var(--border-subtle)' : 'none', transition: 'background 0.2s', borderRadius: '12px', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: user.rank <= 3 ? 'var(--accent-1)' : 'var(--text-muted)', width: '40px', textAlign: 'center' }}>
              #{user.rank}
            </div>
            <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', marginLeft: '1rem', marginRight: '1.5rem', overflow: 'hidden', flexShrink: 0 }}>
              {user.avatar && user.avatar.startsWith('http') ? (
                <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display='none'; e.target.parentNode.innerText = user.name ? user.name.substring(0,2).toUpperCase() : 'US'; }} />
              ) : (
                user.avatar || (user.name ? user.name.substring(0,2).toUpperCase() : 'US')
              )}
            </div>
            <div style={{ flexGrow: 1 }}>
              <div style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--text-main)' }}>{user.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>⏱️ {user.time}</div>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-1)' }}>
              {user.score.toLocaleString()} XP
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileScreen({ onNavigate, onLogout, currentUser }) {
  const [history, setHistory] = useState([]);
  const [maxStreak, setMaxStreak] = useState(0);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('quiznova_token');
      if (token && currentUser) {
        try {
          const res = await fetch(import.meta.env.VITE_API_URL + '/api/users/history', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            // Handle paginated response from backend
            const logs = Array.isArray(data) ? data : (data.data || []);
            const formatted = logs.map(log => ({
              quizTitle: log.quizTitle,
              date: new Date(log.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }),
              accuracy: log.accuracy,
              xpEarned: log.xpEarned
            }));
            setHistory(formatted);
            return;
          }
        } catch (err) {
          console.error('Error fetching backend logs, using cache fallback:', err);
        }
      }

      // Fallback local storage
      try {
        const savedHistory = localStorage.getItem('quiznova_history');
        if (savedHistory) {
          const parsed = JSON.parse(savedHistory);
          setHistory(Array.isArray(parsed) ? parsed : []);
        }
      } catch (e) {
        console.error(e);
        setHistory([]);
      }
    };

    fetchHistory();

    try {
      const savedMaxStreak = localStorage.getItem('quiznova_max_streak');
      if (savedMaxStreak) setMaxStreak(Number(savedMaxStreak));
    } catch (e) { console.error(e); }
  }, [currentUser]);

  const totalXP = currentUser?.totalXP ?? history.reduce((acc, curr) => acc + (curr.xpEarned || 0), 0);
  const avgAccuracy = history.length > 0
    ? Math.round(history.reduce((acc, curr) => acc + (curr.accuracy || 0), 0) / history.length)
    : 0;

  // Achievement logic
  const achievements = [
    {
      id: 'first_step',
      icon: '🎓',
      title: 'Trivia Scholar',
      desc: 'Completed your first quiz',
      unlocked: history.length >= 1
    },
    {
      id: 'streak_master',
      icon: '🔥',
      title: 'Streak Master',
      desc: 'Achieved a 3+ correct answer combo streak',
      unlocked: maxStreak >= 3
    },
    {
      id: 'accuracy_king',
      icon: '⚡',
      title: 'Perfect Marks',
      desc: 'Scored 100% accuracy on any quiz',
      unlocked: history.some(h => h.accuracy === 100)
    },
    {
      id: 'snake_charmer',
      icon: '🐍',
      title: 'Snake Charmer',
      desc: 'Conquered the Snake Retro Quiz',
      unlocked: history.some(h => h.quizTitle === 'Snake Knowledge Quiz')
    },
    {
      id: 'xp_champion',
      icon: '👑',
      title: 'XP Lord',
      desc: 'Earned more than 500 XP in total',
      unlocked: totalXP >= 500
    }
  ];

  return (
    <div className="main-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <span className="back-link" style={{ cursor: 'pointer' }} onClick={() => { playSound('click'); onNavigate('home'); }}>← BACK TO GAMES & QUIZZES</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', maxWidth: '1100px', margin: '0 auto' }}>

        {/* User Card */}
        <div style={{ background: 'var(--glass-bg)', borderRadius: '24px', padding: '2.5rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              {currentUser && currentUser.avatar && currentUser.avatar.startsWith('http') ? (
                <img src={currentUser.avatar} alt="Avatar" style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-1)', boxShadow: '0 8px 25px rgba(56,189,248,0.3)' }} />
              ) : (
                <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', color: 'white', boxShadow: '0 8px 25px rgba(56,189,248,0.3)' }}>
                  {currentUser ? currentUser.avatar : 'US'}
                </div>
              )}
              <div>
                <h1 style={{ fontSize: '2.2rem', margin: 0, color: 'var(--text-main)' }}>{currentUser ? currentUser.username : 'Quiz Explorer'}</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.25rem' }}>{currentUser ? currentUser.email : 'explorer@quiznova.org'}</p>
              </div>
            </div>
            <button className="primary-btn" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', boxShadow: 'none' }} onClick={() => { playSound('click'); onLogout(); }}>Log Out</button>
          </div>

          {/* Stats Summary Panel */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginTop: '2.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '2rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-1)', marginBottom: '0.25rem' }}>{totalXP.toLocaleString()}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>⚡ Total XP</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-1)', marginBottom: '0.25rem' }}>{history.length}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>🎮 Quizzes Played</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#4ade80', marginBottom: '0.25rem' }}>{avgAccuracy}%</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>🎯 Avg Accuracy</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f59e0b', marginBottom: '0.25rem' }}>{maxStreak}x</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>🔥 Max Streak</div>
            </div>
          </div>
        </div>

        {/* Achievements / Badges Section */}
        <div style={{ background: 'var(--glass-bg)', borderRadius: '24px', padding: '2.5rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)' }}>
          <h3 style={{ fontSize: '1.6rem', color: 'var(--accent-1)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🏆 Achievements ({achievements.filter(a => a.unlocked).length} / {achievements.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {achievements.map(ach => (
              <div
                key={ach.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.25rem',
                  borderRadius: '16px',
                  background: ach.unlocked ? 'rgba(56, 189, 248, 0.05)' : 'rgba(255,255,255,0.01)',
                  border: `1px solid ${ach.unlocked ? 'var(--accent-1)' : 'var(--border-subtle)'}`,
                  opacity: ach.unlocked ? 1 : 0.45,
                  transition: 'all 0.3s ease',
                  boxShadow: ach.unlocked ? '0 0 15px rgba(56,189,248,0.1)' : 'none'
                }}
              >
                <div style={{ fontSize: '2.5rem', filter: ach.unlocked ? 'grayscale(0)' : 'grayscale(100%) drop-shadow(0 0 5px rgba(255,255,255,0.05))' }}>
                  {ach.icon}
                </div>
                <div>
                  <h4 style={{ margin: 0, color: ach.unlocked ? '#fff' : 'var(--text-muted)', fontSize: '1.05rem' }}>{ach.title}</h4>
                  <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.3' }}>{ach.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* History Table */}
        <div style={{ background: 'var(--glass-bg)', borderRadius: '24px', padding: '2.5rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)' }}>
          <h3 style={{ fontSize: '1.6rem', color: 'var(--accent-1)', marginBottom: '1.5rem' }}>🎮 Quiz History Logs</h3>

          {history.length === 0 ? (
            <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '16px', padding: '3rem', textAlign: 'center', border: '1px dashed var(--border-subtle)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No quizzes completed yet. Your logs will appear here once you play!</p>
              <button className="primary-btn" style={{ marginTop: '1.5rem' }} onClick={() => { playSound('click'); onNavigate('home'); }}>Start Playing Now 🚀</button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Quiz/Game</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Date Played</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Accuracy</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>XP Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record, index) => (
                    <tr key={index} style={{ borderBottom: index < history.length - 1 ? '1px solid var(--border-subtle)' : 'none', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '1.25rem 1rem' }}>
                        <strong style={{ color: '#fff', fontSize: '1rem' }}>{record.quizTitle}</strong>
                      </td>
                      <td style={{ padding: '1.25rem 1rem', color: 'var(--text-muted)' }}>{record.date}</td>
                      <td style={{ padding: '1.25rem 1rem' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '99px',
                          fontSize: '0.8rem',
                          fontWeight: '800',
                          background: record.accuracy === 100 ? 'rgba(74, 222, 128, 0.15)' : record.accuracy >= 60 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: record.accuracy === 100 ? '#4ade80' : record.accuracy >= 60 ? '#38bdf8' : '#f87171'
                        }}>
                          {record.accuracy}% Accuracy
                        </span>
                      </td>
                      <td style={{ padding: '1.25rem 1rem', fontWeight: '800', color: 'var(--accent-1)', fontSize: '1.1rem' }}>
                        +{record.xpEarned} XP
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [games, setGames] = useState(() => {
    const saved = localStorage.getItem('quiznova_games');
    return saved ? JSON.parse(saved) : GAMES_DATA;
  });
  const [newQuizzes, setNewQuizzes] = useState(() => {
    const saved = localStorage.getItem('quiznova_quizzes');
    return saved ? JSON.parse(saved) : NEW_QUIZZES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('quiznova_games', JSON.stringify(games));
    } catch (e) {
      console.error("Storage quota exceeded or error saving games", e);
      addToast("Failed to save games locally. Storage limit exceeded! Try using smaller image links instead of large uploads.", "error");
    }
  }, [games]);

  useEffect(() => {
    try {
      localStorage.setItem('quiznova_quizzes', JSON.stringify(newQuizzes));
    } catch (e) {
      console.error("Storage quota exceeded or error saving quizzes", e);
      addToast("Failed to save quizzes locally. Storage limit exceeded!", "error");
    }
  }, [newQuizzes]);

  const [currentScreen, setCurrentScreen] = useState('home');

  useEffect(() => {
    const savedTheme = localStorage.getItem('quiznova_theme');
    if (savedTheme) {
      try {
        const theme = JSON.parse(savedTheme);
        document.documentElement.style.setProperty('--accent-1', theme.color1);
        document.documentElement.style.setProperty('--accent-2', theme.color2);
      } catch (e) { console.error(e); }
    }
  }, []);

  // Validate stored token on app startup — fetch real user profile
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('quiznova_token');
      if (!token) return;
      try {
        const res = await fetch(import.meta.env.VITE_API_URL + '/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const user = await res.json();
          setCurrentUser(user);
          setUserRole(user.role);
          localStorage.setItem('quiznova_user', JSON.stringify(user));
          localStorage.setItem('quiznova_role', user.role);
        } else {
          // Token invalid/expired — clear auth state
          localStorage.removeItem('quiznova_token');
          localStorage.removeItem('quiznova_refresh_token');
          localStorage.removeItem('quiznova_user');
          localStorage.removeItem('quiznova_role');
          setCurrentUser(null);
          setUserRole('guest');
        }
      } catch (err) {
        console.error('Token validation failed:', err);
      }
    };
    validateToken();
  }, []);

  // Fetch quizzes from backend
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_API_URL + '/api/quizzes');
        if (!res.ok) throw new Error('Failed to fetch quizzes');
        const data = await res.json();
        if (data && data.length > 0) {
          const featured = data.filter(q => q.isFeatured);
          const latest = data.filter(q => q.isNewQuiz || (!q.isFeatured && !q.isEditorsPick && !q.isPopular));
          if (featured.length > 0) setGames(featured);
          if (latest.length > 0) setNewQuizzes(latest);
        }
      } catch (err) {
        console.error('Error fetching backend quizzes, using local cached seeds:', err);
      }
    };
    fetchQuizzes();
  }, []);

  // Fetch live leaderboard on mount
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_API_URL + '/api/leaderboard');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) setLeaderboardData(data);
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      }
    };
    fetchLeaderboard();
  }, []);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [editorsPicksTitle, setEditorsPicksTitle] = useState(() => localStorage.getItem('quiznova_editors_picks_title') || "Editors' Picks");
  const [popularTitle, setPopularTitle] = useState(() => localStorage.getItem('quiznova_popular_title') || "Popular");
  const [showFeaturedGames, setShowFeaturedGames] = useState(() => localStorage.getItem('quiznova_show_featured') !== 'false');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [userRole, setUserRole] = useState(() => localStorage.getItem('quiznova_role') || 'guest');
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('quiznova_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('quiznova_muted') === 'true');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [guestPlayCount, setGuestPlayCount] = useState(() => Number(localStorage.getItem('quiznova_guest_count') || 0));

  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([
    { rank: 1, name: "QuizMaster99", score: 14500, time: "2m 15s", avatar: "QM" },
    { rank: 2, name: "TriviaKing", score: 13200, time: "2m 45s", avatar: "TK" },
    { rank: 3, name: "SmartyPants", score: 12850, time: "3m 10s", avatar: "SP" },
    { rank: 4, name: "Brainiac22", score: 11400, time: "2m 55s", avatar: "BR" },
    { rank: 5, name: "NovaPlayer", score: 10900, time: "4m 20s", avatar: "NP" },
  ]);

  const handleQuizComplete = async (scoreXP, maxStreakVal = 0, streakBonusVal = 0, quizTitle = '', correctAnswers = null, totalQuestions = null) => {
    const token = localStorage.getItem('quiznova_token');
    // Accurate accuracy: use passed correct/total if available, else derive from XP
    const accuracy = (correctAnswers !== null && totalQuestions !== null && totalQuestions > 0)
      ? Math.round((correctAnswers / totalQuestions) * 100)
      : Math.min(100, Math.max(0, Math.round((scoreXP / Math.max(scoreXP, 250)) * 100)));

    if (token && (userRole === 'user' || userRole === 'admin' || userRole === 'sub_admin')) {
      try {
        const res = await fetch(import.meta.env.VITE_API_URL + '/api/users/history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            quizTitle: quizTitle || activeQuiz?.title || 'General Quiz',
            accuracy,
            xpEarned: scoreXP,
            maxStreak: maxStreakVal
          })
        });

        if (res.ok) {
          const saved = await res.json();
          addToast(`+${scoreXP} XP saved! Level ${saved.calculatedLevel ?? ''} 🎉`, 'success');
          // Update local user state with server-calculated values
          if (currentUser) {
            const updatedUser = {
              ...currentUser,
              totalXP: saved.calculatedTotalXP ?? (currentUser.totalXP + scoreXP),
              level: saved.calculatedLevel ?? currentUser.level,
              streak: saved.calculatedStreak ?? currentUser.streak,
              streakShieldCount: saved.calculatedStreakShieldCount ?? currentUser.streakShieldCount
            };
            setCurrentUser(updatedUser);
            localStorage.setItem('quiznova_user', JSON.stringify(updatedUser));
          }
        }
      } catch (err) {
        console.error('Failed to save score on server database:', err);
      }
    } else {
      addToast(`Completed! Earned ${scoreXP} XP. Log in to save to Leaderboard.`, 'success');
    }

    // Save to LocalStorage quiz history (as fallback/backup)
    try {
      const historyStr = localStorage.getItem('quiznova_history') || '[]';
      const historyList = JSON.parse(historyStr);

      const newRecord = {
        quizTitle: quizTitle || activeQuiz?.title || 'General Quiz',
        score: correctAnswers ?? Math.round(scoreXP / 50),
        totalQuestions: totalQuestions ?? 5,
        xpEarned: scoreXP,
        date: new Date().toLocaleDateString(),
        accuracy
      };

      const savedMaxStreak = Number(localStorage.getItem('quiznova_max_streak') || '0');
      if (maxStreakVal > savedMaxStreak) {
        localStorage.setItem('quiznova_max_streak', maxStreakVal.toString());
      }

      localStorage.setItem('quiznova_history', JSON.stringify([newRecord, ...historyList]));
    } catch (e) {
      console.error('Error saving history:', e);
    }
  };

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts([...toasts, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(toasts.filter(t => t.id !== id));
  };

  const handleNavigate = (screen, quiz = null) => {
    if (screen === 'quiz' && userRole === 'guest') {
      if (guestPlayCount >= 3) {
        addToast('You have reached the guest limit! Please register to keep playing.', 'error');
        setIsLoginOpen(true);
        return;
      }
      const newCount = guestPlayCount + 1;
      setGuestPlayCount(newCount);
      localStorage.setItem('quiznova_guest_count', newCount.toString());
    }

    setCurrentScreen(screen);
    if (quiz) setActiveQuiz(quiz);
    window.scrollTo(0, 0);
  };

  const handleLogin = (role, token = null, userObj = null, refreshToken = null) => {
    setUserRole(role);
    localStorage.setItem('quiznova_role', role);
    if (token) {
      localStorage.setItem('quiznova_token', token);
    }
    if (refreshToken) {
      localStorage.setItem('quiznova_refresh_token', refreshToken);
    }
    if (userObj) {
      setCurrentUser(userObj);
      localStorage.setItem('quiznova_user', JSON.stringify(userObj));
      localStorage.setItem('quiznova_username', userObj.username);
    }
    if (role === 'admin') {
      handleNavigate('admin');
      addToast('Logged in as Administrator', 'success');
    } else if (role === 'sub_admin') {
      handleNavigate('admin');
      addToast('Logged in as Sub Admin', 'success');
    } else {
      addToast('Logged in successfully', 'success');
    }
  };

  const handleLogout = () => {
    setUserRole('guest');
    setCurrentUser(null);
    localStorage.removeItem('quiznova_role');
    localStorage.removeItem('quiznova_token');
    localStorage.removeItem('quiznova_refresh_token');
    localStorage.removeItem('quiznova_user');
    localStorage.removeItem('quiznova_username');
    handleNavigate('home');
    addToast('Logged out successfully');
  };

  const filteredGames = games.filter(g =>
    !g.isHidden && (g.name || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  const latestGame = games.length > 0 ? games[games.length - 1] : (newQuizzes.length > 0 ? newQuizzes[0] : null);
  const latestGameTitle = latestGame ? (latestGame.title || latestGame.name) : '';
  const latestGameObj = latestGame ? { ...latestGame, title: latestGame.title || latestGame.name, id: latestGame.id || latestGame.name } : null;

  const handleQuizAdded = async (q) => {
    const token = localStorage.getItem('quiznova_token');
    if (token) {
      try {
        const res = await fetch(import.meta.env.VITE_API_URL + '/api/quizzes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(q)
        });
        if (res.ok) {
          const savedQuiz = await res.json();
          setNewQuizzes([savedQuiz, ...newQuizzes]);
          setShowBanner(true);
          addToast(`Created Quiz "${savedQuiz.title}" on backend database!`, 'success');
          return;
        }
      } catch (err) {
        console.error('Failed to sync new quiz to server database:', err);
      }
    }

    // Fallback to local
    setNewQuizzes([q, ...newQuizzes]);
    setShowBanner(true);
    addToast(`Created Quiz "${q.title}" locally`, 'success');
  };

  if (currentScreen === 'admin' && (userRole === 'admin' || userRole === 'sub_admin')) {
    return <AdminPanel games={games} setGames={setGames} onNavigate={handleNavigate} addToast={addToast} onQuizAdded={handleQuizAdded} newQuizzes={newQuizzes} userRole={userRole} editorsPicksTitle={editorsPicksTitle} setEditorsPicksTitle={setEditorsPicksTitle} popularTitle={popularTitle} setPopularTitle={setPopularTitle} showFeaturedGames={showFeaturedGames} setShowFeaturedGames={setShowFeaturedGames} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Sidebar
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigate={handleNavigate}
        games={games}
        userRole={userRole}
        onLogout={handleLogout}
        onLogin={() => setIsLoginOpen(true)}
        currentUser={currentUser}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLogin}
      />

      <div className="toast-container">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onRemove={() => removeToast(t.id)} />
        ))}
      </div>

      {showBanner && latestGame && (
        <div style={{ background: 'var(--accent-gradient)', color: 'white', padding: '0.6rem 2.5rem', textAlign: 'center', position: 'relative', fontSize: '0.95rem', fontWeight: 'bold', zIndex: 50, boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
          <span style={{ marginRight: '1rem' }}>🎉 LATEST QUIZ ADDED: "{latestGameTitle}" - Test your knowledge and earn XP!</span>
          <button
            style={{ background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.4)', color: 'white', padding: '0.25rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onClick={() => handleNavigate('quiz', latestGameObj)}
          >
            Play Now ▶
          </button>
          <span onClick={() => setShowBanner(false)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.8, padding: '0.5rem' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.8}>✕</span>
        </div>
      )}

      <nav className="top-nav-dark">
        <div className="nav-left">
          <span className="hamburger" onClick={() => setIsMenuOpen(true)}>☰</span>
          <div className="brand-text" onClick={() => handleNavigate('home')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <KMSLogo size="1.5rem" />
          </div>
        </div>

        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search games & quizzes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            className="lang-toggle"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            onClick={() => {
              const nextMute = !isMuted;
              setIsMuted(nextMute);
              localStorage.setItem('quiznova_muted', nextMute ? 'true' : 'false');
              if (!nextMute) {
                playSound('click');
              }
            }}
            style={{ fontSize: '1.2rem', padding: '0.4rem 0.8rem', borderRadius: '12px' }}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          {userRole === 'admin' || userRole === 'sub_admin' ? (
            <div style={{ position: 'relative' }}>
              <div className="profile-pill" style={{ whiteSpace: 'nowrap' }} onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}>
                <div className="avatar-circle">{userRole === 'sub_admin' ? 'SA' : 'AD'}</div>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{userRole === 'sub_admin' ? 'Sub Admin ▼' : 'Admin ▼'}</span>
              </div>
              {isProfileDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '110%', right: 0, background: 'var(--glass-bg)',
                  border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '0.5rem',
                  display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '160px',
                  boxShadow: 'var(--card-shadow)', zIndex: 1000
                }}>
                  <div style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-main)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => { handleNavigate('admin'); setIsProfileDropdownOpen(false); }}>🛡️ Admin Panel</div>
                  <div style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-main)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => { handleNavigate('account'); setIsProfileDropdownOpen(false); }}>⚙️ Account</div>
                  <div style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-main)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => { handleNavigate('leaderboard'); setIsProfileDropdownOpen(false); }}>🏆 Leaderboard</div>
                  <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.25rem 0' }}></div>
                  <div style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: '8px', fontSize: '0.9rem', color: '#ef4444', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => { handleLogout(); setIsProfileDropdownOpen(false); }}>🚪 Log Out</div>
                </div>
              )}
            </div>
          ) : userRole === 'user' ? (
            <div style={{ position: 'relative' }}>
              <div className="profile-pill" style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.75rem' }} onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}>
                {currentUser && currentUser.avatar && currentUser.avatar.startsWith('http') ? (
                  <img src={currentUser.avatar} alt="Avatar" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div className="avatar-circle" style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)', width: '28px', height: '28px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {currentUser ? currentUser.avatar : 'US'}
                  </div>
                )}
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                  {currentUser ? currentUser.username.substring(0, 10) : 'Profile'} ▼
                </span>
              </div>
              {isProfileDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '110%', right: 0, background: 'var(--glass-bg)',
                  border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '0.5rem',
                  display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '160px',
                  boxShadow: 'var(--card-shadow)', zIndex: 1000
                }}>
                  <div style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-main)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => { handleNavigate('profile'); setIsProfileDropdownOpen(false); }}>👤 Profile</div>
                  <div style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-main)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => { handleNavigate('account'); setIsProfileDropdownOpen(false); }}>⚙️ Account</div>
                  <div style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-main)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => { handleNavigate('leaderboard'); setIsProfileDropdownOpen(false); }}>🏆 Leaderboard</div>
                  <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.25rem 0' }}></div>
                  <div style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: '8px', fontSize: '0.9rem', color: '#ef4444', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => { handleLogout(); setIsProfileDropdownOpen(false); }}>🚪 Log Out</div>
                </div>
              )}
            </div>
          ) : (
            <button className="newsletter-btn" onClick={() => setIsLoginOpen(true)}>
              Log In / Register
            </button>
          )}
          <button className="newsletter-btn" onClick={() => handleNavigate('leaderboard')}>
            🏆 Leaderboard
          </button>
        </div>
      </nav>

      <div style={{ flexGrow: 1 }}>
        {currentScreen === 'home' && <BrowseScreen onNavigate={handleNavigate} games={filteredGames} searchQuery={searchQuery} newQuizzes={newQuizzes} editorsPicksTitle={editorsPicksTitle} popularTitle={popularTitle} showFeaturedGames={showFeaturedGames} />}
        {currentScreen === 'quiz' && <QuizScreen quiz={activeQuiz} onNavigate={handleNavigate} onComplete={handleQuizComplete} />}
        {currentScreen === 'leaderboard' && <LeaderboardScreen onNavigate={handleNavigate} data={leaderboardData} />}
        {currentScreen === 'profile' && <ProfileScreen onNavigate={handleNavigate} onLogout={handleLogout} currentUser={currentUser} />}

      </div>

      <div className="scroll-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        ↑
      </div>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

function ImageUploadInput({ value, onChange, placeholder, style }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', ...(style || {}) }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '120px',
          border: isDragging ? '2px dashed var(--accent-1)' : '2px dashed var(--border-subtle)',
          borderRadius: '12px',
          background: isDragging ? 'rgba(56, 189, 248, 0.05)' : 'rgba(255,255,255,0.02)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          overflow: 'hidden'
        }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
      >
        {value && value.length > 0 ? (
          <div style={{ position: 'relative', width: '100%', height: '100px', display: 'flex', justifyContent: 'center' }}>
            <img 
              src={value} 
              alt="Preview" 
              onError={(e) => { 
                e.target.style.display = 'none'; 
                if(e.target.nextElementSibling) e.target.nextElementSibling.innerHTML = '⚠️ Invalid Image URL';
              }} 
              style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }} 
            />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', color: 'white', fontWeight: 'bold', borderRadius: '8px' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
              Click or Drop to Replace
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📸</div>
            <div style={{ color: 'var(--text-main)', fontWeight: 'bold', fontSize: '0.9rem' }}>Drag & Drop Image Here</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>or click to browse local files</div>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => { if (e.target.files[0]) handleFile(e.target.files[0]); }}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Or Image URL:</span>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "https://..."}
          style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}

function AdminPanel({ games, setGames, onNavigate, addToast, onQuizAdded, newQuizzes, userRole, editorsPicksTitle, setEditorsPicksTitle, popularTitle, setPopularTitle, showFeaturedGames, setShowFeaturedGames }) {
  const [activeTab, setActiveTab] = useState(userRole === 'sub_admin' ? 'games' : 'dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');
  const [editingGame, setEditingGame] = useState(null);
  const [formData, setFormData] = useState({ name: '', image: '', questions: [] });

  // Live Simulator preview index
  const [previewQIdx, setPreviewQIdx] = useState(0);

  // Quick game add form state for the main admin dashboard
  const [dashboardGameForm, setDashboardGameForm] = useState({ name: '', image: '' });

  // Live Database monitoring states
  const [dbData, setDbData] = useState({ users: [], quizzes: [], history: [], databaseStatus: 'Offline', databaseEngine: 'Mock Engine' });
  const [loadingDb, setLoadingDb] = useState(false);

  const fetchDbData = async () => {
    setLoadingDb(true);
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/debug/db');
      if (res.ok) {
        const data = await res.json();
        setDbData(data);
      }
    } catch (err) {
      console.error('Error fetching database dump in AdminPanel:', err);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchDbData();
    }
  }, [activeTab]);

  const handleDashboardQuickAddGame = () => {
    if (!dashboardGameForm.name.trim()) {
      addToast('Please enter a game name', 'error');
      return;
    }
    const finalImage = dashboardGameForm.image.trim() || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80';
    const newGame = { name: dashboardGameForm.name.trim(), image: finalImage };
    setGames([...games, newGame]);
    addToast(`Added ${newGame.name} to library!`, 'success');
    setDashboardGameForm({ name: '', image: '' });
  };

  // Quiz Management States
  const [quizzesList, setQuizzesList] = useState([
    ...FEATURED_QUIZZES.map(q => ({ id: q.id, title: q.title, category: 'Featured', difficulty: 'Medium', status: 'ACTIVE', questions: q.questions || [] })),
    ...newQuizzes.map(q => ({ id: q.id, title: q.title, category: 'New', difficulty: 'Easy', status: 'ACTIVE', questions: q.questions || [] })),
    ...EDITORS_PICKS_DATA.map(q => ({ id: q.id, title: q.title, category: 'Editors Pick', difficulty: 'Medium', status: 'ACTIVE', questions: [] })),
    ...POPULAR_DATA.map(q => ({ id: q.id, title: q.title, category: 'Popular', difficulty: 'Hard', status: 'ACTIVE', questions: [] }))
  ]);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const emptyQuiz = { title: '', desc: '', image: '', category: 'General', difficulty: 'Easy', status: 'ACTIVE', questions: [] };
  const [quizFormData, setQuizFormData] = useState(emptyQuiz);

  const handleOpenQuizModal = (q = null) => {
    if (q) {
      setEditingQuiz(q);
      setQuizFormData(JSON.parse(JSON.stringify(q)));
    } else {
      setEditingQuiz(null);
      setQuizFormData(JSON.parse(JSON.stringify(emptyQuiz)));
    }
    setIsQuizModalOpen(true);
  };

  const handleSaveQuiz = () => {
    if (editingQuiz) {
      setQuizzesList(quizzesList.map(q => q.id === editingQuiz.id ? quizFormData : q));
      addToast(`Updated ${quizFormData.title}`, 'success');
    } else {
      const newQ = { ...quizFormData, id: Date.now() };
      setQuizzesList([...quizzesList, newQ]);
      if (onQuizAdded) {
        onQuizAdded({
          id: newQ.id,
          title: newQ.title,
          desc: newQ.desc || newQ.category + ' Quiz - ' + newQ.difficulty,
          image: newQ.image || 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=400&q=80',
          questions: newQ.questions
        });
      }
      addToast(`Created ${quizFormData.title}`, 'success');
    }
    setIsQuizModalOpen(false);
  };

  const handleDeleteQuiz = (id) => {
    if (window.confirm('Delete this quiz?')) {
      setQuizzesList(quizzesList.filter(q => q.id !== id));
      addToast('Quiz deleted', 'error');
    }
  };

  const handleOpenModal = (game = null) => {
    if (game) {
      setEditingGame(game);
      setFormData({ name: game.name, image: game.image, questions: game.questions || [] });
    } else {
      setEditingGame(null);
      setFormData({ name: '', image: '', questions: [] });
    }
    setPreviewQIdx(0);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingGame) {
      setGames(games.map(g => g.name === editingGame.name ? formData : g));
      addToast(`Updated ${formData.name} successfully`, 'success');
    } else {
      setGames([...games, formData]);
      if (onQuizAdded) {
        onQuizAdded({
          id: Date.now(),
          title: formData.name,
          desc: 'Newly added game',
          image: formData.image || 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=400&q=80',
          questions: formData.questions || []
        });
      }
      addToast(`Added ${formData.name} to library`, 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (name) => {
    if (window.confirm(`Delete ${name}?`)) {
      setGames(games.filter(g => g.name !== name));
      addToast(`Deleted ${name}`, 'error');
    }
  };

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <h2>🛡️ KMS Admin</h2>
        <div className="admin-nav">
          {userRole !== 'sub_admin' && <div className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</div>}
          <div className={`admin-nav-item ${activeTab === 'games' ? 'active' : ''}`} onClick={() => setActiveTab('games')}>🎮 Manage Games</div>
          {userRole !== 'sub_admin' && (
            <>
              <div className={`admin-nav-item ${activeTab === 'quizzes' ? 'active' : ''}`} onClick={() => setActiveTab('quizzes')}>❓ Manage Quizzes</div>
              <div className={`admin-nav-item ${activeTab === 'question_bank' ? 'active' : ''}`} onClick={() => setActiveTab('question_bank')}>📚 Question Bank</div>
              <div className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>👥 User Management</div>
              <div className={`admin-nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>📈 Analytics & Reports</div>
              <div className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>⚙️ Settings</div>
            </>
          )}

          <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div className="admin-nav-item" onClick={() => onNavigate('home')}>🌐 View Site</div>
            <div className="admin-nav-item" style={{ color: '#ef4444' }} onClick={() => { onNavigate('home'); }}>🔙 Back / Log Out</div>
          </div>
        </div>
      </div>

      <div className="admin-main">
        <header className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ margin: 0 }}>
            {activeTab === 'games' && 'Games Management'}
            {activeTab === 'quizzes' && 'Quizzes Management'}
            {activeTab === 'question_bank' && 'Question Bank'}
            {activeTab === 'users' && 'User Management'}
            {activeTab === 'analytics' && 'Analytics & Reports'}
            {activeTab === 'settings' && 'Settings'}
            {activeTab === 'dashboard' && 'Performance Dashboard'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', width: '100%', justifyContent: 'flex-end', maxWidth: '400px' }}>
            <div className="search-container" style={{ margin: 0, flex: 1, minWidth: '150px', maxWidth: '250px' }}>
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
              />
            </div>
            <div className="user-profile" style={{ margin: 0 }}>{userRole === 'sub_admin' ? 'Sub Admin 🛡️' : 'Super Admin 🛡️'}</div>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <>
            <div className="admin-stats-grid">
              <div className="stat-card">
                <span className="label">Total Games</span>
                <span className="value">{games.length}</span>
                <div className="metric-progress"><div className="metric-fill" style={{ width: '65%' }}></div></div>
              </div>
              <div className="stat-card">
                <span className="label">Total Quizzes</span>
                <span className="value">{quizzesList.length}</span>
                <div className="metric-progress"><div className="metric-fill" style={{ width: '80%', background: '#ffcc00' }}></div></div>
              </div>
              <div className="stat-card">
                <span className="label">Active Users</span>
                <span className="value">1,248</span>
                <div className="metric-progress"><div className="metric-fill" style={{ width: '45%', background: '#00cc66' }}></div></div>
              </div>
              <div className="stat-card">
                <span className="label">Retention Rate</span>
                <span className="value">92%</span>
                <div className="metric-progress"><div className="metric-fill" style={{ width: '92%', background: '#ff3366' }}></div></div>
              </div>
            </div>

            {/* Quick Manage & Add Games Dashboard Row */}
            <div className="admin-dashboard-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginTop: '2.5rem' }}>

              {/* Left Column: Quick Add Game Form */}
              <div className="admin-table-container" style={{ margin: 0 }}>
                <div className="admin-table-header">
                  <h3>⚡ Quick Add Game</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Game Name</label>
                    <input
                      type="text"
                      value={dashboardGameForm.name}
                      onChange={e => setDashboardGameForm({ ...dashboardGameForm, name: e.target.value })}
                      placeholder="e.g. Wordle Extreme"
                      style={{ background: 'rgba(255,255,255,0.02)' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Thumbnail Image URL</label>
                    <ImageUploadInput
                      value={dashboardGameForm.image}
                      onChange={val => setDashboardGameForm({ ...dashboardGameForm, image: val })}
                      placeholder="https://images.unsplash.com/... or drop image"
                      style={{ background: 'rgba(255,255,255,0.02)' }}
                    />
                  </div>

                  {/* Preset Background Picker */}
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold' }}>OR SELECT A HIGH-QUALITY PRESET:</label>
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                      {[
                        { name: 'Retro Arcade', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80', icon: '🎮' },
                        { name: 'Letters/Cross', url: 'https://images.unsplash.com/photo-1605235548773-455b706c88f1?auto=format&fit=crop&w=400&q=80', icon: '🧩' },
                        { name: 'Pattern', url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=400&q=80', icon: '🎨' },
                        { name: 'Neon Board', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80', icon: '👾' },
                        { name: 'Cards', url: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&w=400&q=80', icon: '🃏' }
                      ].map(preset => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setDashboardGameForm({
                              ...dashboardGameForm,
                              image: preset.url
                            });
                            addToast(`Selected ${preset.name} thumbnail`, 'success');
                          }}
                          style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            background: dashboardGameForm.image === preset.url ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.05)',
                            border: dashboardGameForm.image === preset.url ? 'none' : '1px solid var(--border-subtle)',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <span>{preset.icon}</span> {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    className="primary-btn"
                    onClick={handleDashboardQuickAddGame}
                    style={{ width: '100%', marginTop: '0.5rem', padding: '1rem' }}
                  >
                    🚀 Add to Game Catalog
                  </button>
                </div>
              </div>

              {/* Right Column: Live Games Grid Preview & Direct Manage */}
              <div className="admin-table-container" style={{ margin: 0 }}>
                <div className="admin-table-header">
                  <h3>🎮 Live Game Dashboard Catalog</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--accent-1)', fontWeight: 'bold' }}>{games.length} Games</span>
                </div>

                <div
                  style={{
                    maxHeight: '380px',
                    overflowY: 'auto',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
                    gap: '1rem',
                    paddingRight: '0.5rem'
                  }}
                >
                  {games.map(game => (
                    <div
                      key={game.name}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <div style={{ position: 'relative', aspectRatio: '4/3', width: '100%', overflow: 'hidden' }}>
                        <img
                          src={game.image}
                          alt={game.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {/* Status pill overlay */}
                        <div style={{
                          position: 'absolute',
                          top: '0.5rem',
                          left: '0.5rem',
                          background: game.isHidden ? 'rgba(239, 68, 68, 0.9)' : 'rgba(34, 197, 94, 0.9)',
                          color: '#fff',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.6rem',
                          fontWeight: '800'
                        }}>
                          {game.isHidden ? 'HIDDEN' : 'ACTIVE'}
                        </div>
                      </div>

                      <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                        <div style={{
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          color: '#fff',
                          lineHeight: '1.2',
                          marginBottom: '0.5rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {game.name}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleOpenModal(game)}
                            style={{
                              flex: 1,
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '8px',
                              padding: '0.3rem',
                              cursor: 'pointer',
                              color: '#fff',
                              fontSize: '0.75rem',
                              transition: 'all 0.2s'
                            }}
                          >
                            ✏️ Edit
                          </button>
                          {userRole !== 'sub_admin' && (
                            <button
                              onClick={() => handleDelete(game.name)}
                              style={{
                                flex: 1,
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '8px',
                                padding: '0.3rem',
                                cursor: 'pointer',
                                color: '#f87171',
                                fontSize: '0.75rem',
                                transition: 'all 0.2s'
                              }}
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'games' && (
          <div className="admin-table-container">
            <div className="admin-table-header">
              <h3>Live Game Catalog</h3>
              <button className="btn-add" onClick={() => handleOpenModal()}>+ Add New Game</button>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Game Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {games.filter(g =>
                  (g.name || '').toLowerCase().includes((adminSearch || '').toLowerCase()) ||
                  (g.questions && g.questions.some(q =>
                    (q.q || '').toLowerCase().includes((adminSearch || '').toLowerCase()) ||
                    (q.options || []).some(o => (o || '').toLowerCase().includes((adminSearch || '').toLowerCase())) ||
                    (q.exp && q.exp.toLowerCase().includes((adminSearch || '').toLowerCase()))
                  ))
                ).map(game => (
                  <tr key={game.name}>
                    <td><img src={game.image} className="admin-img-preview" alt="" /></td>
                    <td><strong>{game.name}</strong></td>
                    <td>
                      <span style={{
                        background: game.isHidden ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                        color: game.isHidden ? '#f87171' : '#4ade80',
                        padding: '4px 10px',
                        borderRadius: '99px',
                        fontSize: '0.75rem',
                        fontWeight: '800'
                      }}>
                        {game.isHidden ? 'HIDDEN' : 'ACTIVE'}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button
                          className="btn-icon"
                          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-subtle)' }}
                          onClick={() => {
                            const updatedGames = games.map(g => g.name === game.name ? { ...g, isHidden: !g.isHidden } : g);
                            setGames(updatedGames);
                            addToast(`Game ${game.name} is now ${game.isHidden ? 'Visible' : 'Hidden'}`, 'success');
                          }}
                          title={game.isHidden ? "Unhide Game" : "Hide Game"}
                        >
                          {game.isHidden ? '👁️‍🗨️' : '👁️'}
                        </button>
                        <button className="btn-icon btn-edit" onClick={() => handleOpenModal(game)}>✏️</button>
                        {userRole !== 'sub_admin' && <button className="btn-icon btn-delete" onClick={() => handleDelete(game.name)}>🗑️</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'quizzes' && (
          <div className="admin-table-container">
            <div className="admin-table-header">
              <h3>Live Quizzes Catalog</h3>
              <button className="btn-add" onClick={() => handleOpenQuizModal()}>+ Create Quiz</button>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Quiz Title</th>
                  <th>Questions</th>
                  <th>Difficulty</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quizzesList.filter(quiz =>
                  (quiz.title || '').toLowerCase().includes((adminSearch || '').toLowerCase()) ||
                  (quiz.category || '').toLowerCase().includes((adminSearch || '').toLowerCase()) ||
                  (quiz.questions && quiz.questions.some(q =>
                    (q.q || '').toLowerCase().includes((adminSearch || '').toLowerCase()) ||
                    (q.options || []).some(o => (o || '').toLowerCase().includes((adminSearch || '').toLowerCase())) ||
                    (q.exp && q.exp.toLowerCase().includes((adminSearch || '').toLowerCase()))
                  ))
                ).map(quiz => (
                  <tr key={quiz.id}>
                    <td><strong>{quiz.title}</strong><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{quiz.category}</div></td>
                    <td>{quiz.questions.length}</td>
                    <td><span style={{ color: quiz.difficulty === 'Hard' ? '#ef4444' : quiz.difficulty === 'Medium' ? '#3b82f6' : '#10b981', fontWeight: 'bold' }}>{quiz.difficulty}</span></td>
                    <td><span style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '800' }}>ACTIVE</span></td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon btn-edit" onClick={() => handleOpenQuizModal(quiz)}>✏️</button>
                        <button className="btn-icon btn-delete" onClick={() => handleDeleteQuiz(quiz.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="admin-table-container">
            <div className="admin-table-header">
              <h3>Registered Users</h3>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Quizzes Played</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>AlexGamer</strong></td>
                  <td>alex@example.com</td>
                  <td><span style={{ color: '#3b82f6' }}>User</span></td>
                  <td>24</td>
                  <td><button className="btn-icon btn-delete">🗑️</button></td>
                </tr>
                <tr>
                  <td><strong>Guest_8492</strong></td>
                  <td>-</td>
                  <td><span style={{ color: 'var(--text-muted)' }}>Guest</span></td>
                  <td>{localStorage.getItem('quiznova_guest_count') || 0}</td>
                  <td><button className="btn-icon btn-delete">🗑️</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {isModalOpen && (
          <div className="modal-overlay">
            <div className="admin-modal" style={{ maxWidth: '1000px', width: '95%', maxHeight: '92vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'Outfit, sans-serif' }}>
                {editingGame ? '🎮 Edit Game Catalog & Questions' : '🎮 Add New Game with Custom Questions'}
              </h3>

              {/* Grid Wrapper for Side-by-Side: Form Editor on Left, Live Simulator on Right */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'start' }}>

                {/* Left Column: Form Editor */}
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Game Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Wordle"
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Thumbnail URL</label>
                      <ImageUploadInput
                        value={formData.image}
                        onChange={val => setFormData({ ...formData, image: val })}
                        placeholder="https://images.unsplash.com/... or drop image"
                      />
                    </div>
                  </div>

                  {/* Question Customizer Side for Games */}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--accent-1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ❓ Question Customizer Side ({formData.questions ? formData.questions.length : 0})
                      </h4>
                      <button
                        className="primary-btn"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        onClick={() => {
                          const newQList = [...(formData.questions || []), { q: '', options: ['', '', '', ''], ans: 0, image: '', exp: '' }];
                          setFormData({ ...formData, questions: newQList });
                          setPreviewQIdx(newQList.length - 1); // Auto-focus the newly added question for preview
                        }}
                      >
                        ➕ Add Question
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '55vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                      {formData.questions && formData.questions.map((q, qIdx) => (
                        <div
                          key={qIdx}
                          onClick={() => setPreviewQIdx(qIdx)}
                          style={{
                            background: previewQIdx === qIdx ? 'rgba(56, 189, 248, 0.05)' : 'rgba(255,255,255,0.02)',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            border: `1px solid ${previewQIdx === qIdx ? 'var(--accent-1)' : 'var(--border-subtle)'}`,
                            transition: 'all 0.2s',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                            <strong style={{ color: previewQIdx === qIdx ? 'var(--accent-1)' : '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              Question {qIdx + 1} {previewQIdx === qIdx ? '👁️ (Previewing)' : ''}
                            </strong>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              {qIdx > 0 && (
                                <button
                                  className="btn-icon"
                                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.3rem 0.6rem', color: '#fff', fontSize: '0.75rem', cursor: 'pointer' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newQs = [...formData.questions];
                                    [newQs[qIdx - 1], newQs[qIdx]] = [newQs[qIdx], newQs[qIdx - 1]];
                                    setFormData({ ...formData, questions: newQs });
                                    setPreviewQIdx(qIdx - 1);
                                  }}
                                >⬆️ Up</button>
                              )}
                              {qIdx < formData.questions.length - 1 && (
                                <button
                                  className="btn-icon"
                                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.3rem 0.6rem', color: '#fff', fontSize: '0.75rem', cursor: 'pointer' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newQs = [...formData.questions];
                                    [newQs[qIdx + 1], newQs[qIdx]] = [newQs[qIdx], newQs[qIdx + 1]];
                                    setFormData({ ...formData, questions: newQs });
                                    setPreviewQIdx(qIdx + 1);
                                  }}
                                >⬇️ Down</button>
                              )}
                              <button
                                className="btn-icon btn-delete"
                                style={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.2)',
                                  borderRadius: '8px',
                                  padding: '0.3rem 0.6rem',
                                  color: '#f87171',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const filtered = formData.questions.filter((_, i) => i !== qIdx);
                                  setFormData({ ...formData, questions: filtered });
                                  setPreviewQIdx(Math.max(0, Math.min(previewQIdx, filtered.length - 1)));
                                }}
                              >
                                🗑️ Remove
                              </button>
                            </div>
                          </div>

                          <div className="form-group" onClick={e => e.stopPropagation()}>
                            <label>Question Text</label>
                            <input
                              type="text"
                              value={q.q}
                              onChange={e => {
                                const newQ = [...formData.questions];
                                newQ[qIdx].q = e.target.value;
                                setFormData({ ...formData, questions: newQ });
                              }}
                              placeholder="Enter question text..."
                            />
                          </div>

                          <div className="form-group" onClick={e => e.stopPropagation()}>
                            <label>Optional Image URL (Shown above question)</label>
                            <ImageUploadInput
                              value={q.image || ''}
                              onChange={val => {
                                const newQ = [...formData.questions];
                                newQ[qIdx].image = val;
                                setFormData({ ...formData, questions: newQ });
                              }}
                              placeholder="https://images.unsplash.com/... or drop image"
                            />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }} onClick={e => e.stopPropagation()}>
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                  <input
                                    type="radio"
                                    name={`game_q_${qIdx}_ans`}
                                    checked={q.ans === oIdx}
                                    onChange={() => {
                                      const newQ = [...formData.questions];
                                      newQ[qIdx].ans = oIdx;
                                      setFormData({ ...formData, questions: newQ });
                                    }}
                                  />
                                  Option {oIdx + 1} {q.ans === oIdx ? '(Correct ✓)' : ''}
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={e => {
                                      const newQ = [...formData.questions];
                                      newQ[qIdx].options[oIdx] = e.target.value;
                                      setFormData({ ...formData, questions: newQ });
                                    }}
                                    placeholder={`Option ${oIdx + 1}`}
                                    style={{ flex: 1 }}
                                  />
                                  {q.options.length > 2 && (
                                    <button
                                      type="button"
                                      className="btn-icon btn-delete"
                                      style={{ padding: '0 0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: 'none', borderRadius: '8px', cursor: 'pointer', minWidth: '40px' }}
                                      onClick={() => {
                                        const newQ = [...formData.questions];
                                        if (newQ[qIdx].ans === oIdx) newQ[qIdx].ans = 0; // reset ans if deleted
                                        else if (newQ[qIdx].ans > oIdx) newQ[qIdx].ans -= 1;
                                        newQ[qIdx].options = newQ[qIdx].options.filter((_, i) => i !== oIdx);
                                        setFormData({ ...formData, questions: newQ });
                                      }}
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                            {q.options.length < 6 && (
                              <button
                                type="button"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--border-subtle)', borderRadius: '8px', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', minHeight: '60px', transition: 'all 0.2s', alignSelf: 'end' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onClick={() => {
                                  const newQ = [...formData.questions];
                                  newQ[qIdx].options.push('');
                                  setFormData({ ...formData, questions: newQ });
                                }}
                              >
                                ➕ Add Option
                              </button>
                            )}
                          </div>

                          <div className="form-group" style={{ marginBottom: 0 }} onClick={e => e.stopPropagation()}>
                            <label>Explanation (shown after answering)</label>
                            <input
                              type="text"
                              value={q.exp || ''}
                              onChange={e => {
                                const newQ = [...formData.questions];
                                newQ[qIdx].exp = e.target.value;
                                setFormData({ ...formData, questions: newQ });
                              }}
                              placeholder="Why is this answer correct?"
                            />
                          </div>
                        </div>
                      ))}

                      {(!formData.questions || formData.questions.length === 0) && (
                        <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px dashed var(--border-subtle)', color: 'var(--text-muted)' }}>
                          No questions customized yet. Click "Add Question" above to start!
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: 📱 Live Interactive Simulator Preview */}
                <div style={{ position: 'sticky', top: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ marginBottom: '1rem', width: '100%', textAlign: 'center' }}>
                    <h4 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontFamily: 'Outfit, sans-serif' }}>📱 Live Game-Screen Preview Simulator</h4>
                    <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Real-time simulator of the user game-play view</p>
                  </div>

                  {/* Smartphone simulated bezel frame */}
                  <div style={{
                    width: '320px',
                    height: '520px',
                    border: '12px solid #1e293b',
                    borderRadius: '40px',
                    background: '#030712',
                    boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.9), inset 0 0 20px rgba(0,0,0,0.8)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: 'Outfit, sans-serif'
                  }}>
                    {/* Speaker notch */}
                    <div style={{
                      position: 'absolute',
                      top: '0',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '110px',
                      height: '18px',
                      background: '#1e293b',
                      borderBottomLeftRadius: '14px',
                      borderBottomRightRadius: '14px',
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{ width: '40px', height: '3px', background: '#475569', borderRadius: '2px' }}></div>
                    </div>

                    {/* Simulated status bar */}
                    <div style={{
                      height: '35px',
                      padding: '10px 1.5rem 0 1.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      color: 'rgba(255,255,255,0.3)',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      zIndex: 5
                    }}>
                      <span>9:41</span>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <span>📶</span>
                        <span>🔋</span>
                      </div>
                    </div>

                    {/* Simulated screen body */}
                    <div style={{
                      flex: 1,
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      overflowY: 'auto',
                      background: 'radial-gradient(circle at top, #0f172a, #020617)',
                      position: 'relative'
                    }}>
                      {formData.questions && formData.questions.length > 0 && formData.questions[previewQIdx] ? (
                        <>
                          {/* Top Bar of Quiz inside simulator */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#fff', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              🎮 {formData.name || 'Custom Game'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', color: 'var(--accent-1)' }}>
                              <span style={{ background: 'var(--accent-gradient)', color: '#fff', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 'bold' }}>15</span>
                              <span>{previewQIdx + 1} of {formData.questions.length}</span>
                            </div>
                          </div>

                          {/* Image rendering inside simulator */}
                          {formData.questions[previewQIdx].image ? (
                            <div style={{ width: '100%', height: '110px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.75rem', flexShrink: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <img
                                src={formData.questions[previewQIdx].image}
                                alt="Simulator Context"
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                              />
                            </div>
                          ) : (
                            <div style={{ width: '100%', height: '90px', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '0.7rem', marginBottom: '0.75rem', flexShrink: 0 }}>
                              Optional image not provided
                            </div>
                          )}

                          {/* Question Text inside simulator */}
                          <div style={{
                            padding: '0.75rem',
                            background: 'rgba(255,255,255,0.01)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            textAlign: 'center',
                            marginBottom: '0.75rem',
                            lineHeight: '1.3'
                          }}>
                            {formData.questions[previewQIdx].q || 'Type question text on the left...'}
                          </div>

                          {/* Option Pills inside simulator */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {formData.questions[previewQIdx].options.map((opt, oIdx) => {
                              const isCorrect = formData.questions[previewQIdx].ans === oIdx;
                              return (
                                <div
                                  key={oIdx}
                                  style={{
                                    width: '100%',
                                    padding: '0.6rem 0.8rem',
                                    borderRadius: '8px',
                                    background: isCorrect ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.02)',
                                    border: `1.5px solid ${isCorrect ? 'rgba(34, 197, 94, 0.5)' : 'rgba(255,255,255,0.05)'}`,
                                    color: isCorrect ? '#4ade80' : 'rgba(255,255,255,0.8)',
                                    fontSize: '0.75rem',
                                    fontWeight: isCorrect ? '700' : '500',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    boxShadow: isCorrect ? '0 4px 12px rgba(34, 197, 94, 0.1)' : 'none'
                                  }}
                                >
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                                    {opt || `Option ${oIdx + 1}`}
                                  </span>
                                  {isCorrect && <span style={{ fontSize: '0.75rem' }}>✓</span>}
                                </div>
                              );
                            })}
                          </div>

                          {/* Learning Explanation inside simulator */}
                          {formData.questions[previewQIdx].exp && (
                            <div style={{
                              marginTop: '0.75rem',
                              padding: '0.6rem 0.8rem',
                              borderRadius: '8px',
                              background: 'rgba(56, 189, 248, 0.05)',
                              border: '1px dashed rgba(56, 189, 248, 0.2)',
                              color: 'rgba(255,255,255,0.7)',
                              fontSize: '0.65rem',
                              lineHeight: '1.3'
                            }}>
                              {formData.questions[previewQIdx].exp}
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', padding: '1.5rem', gap: '1rem' }}>
                          <span style={{ fontSize: '2.5rem' }}>🚀</span>
                          <span>Customize a question on the left to see the live smartphone simulator come to life!</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Simulator Navigation Buttons below Bezel */}
                  {formData.questions && formData.questions.length > 1 && (
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button
                        onClick={() => setPreviewQIdx(Math.max(0, previewQIdx - 1))}
                        disabled={previewQIdx === 0}
                        style={{
                          padding: '0.4rem 0.8rem',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          opacity: previewQIdx === 0 ? 0.3 : 1
                        }}
                      >
                        ◀ Previous
                      </button>
                      <button
                        onClick={() => setPreviewQIdx(Math.min(formData.questions.length - 1, previewQIdx + 1))}
                        disabled={previewQIdx === formData.questions.length - 1}
                        style={{
                          padding: '0.4rem 0.8rem',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          opacity: previewQIdx === formData.questions.length - 1 ? 0.3 : 1
                        }}
                      >
                        Next ▶
                      </button>
                    </div>
                  )}
                </div>

              </div>

              <div className="modal-footer" style={{ position: 'sticky', bottom: 0, background: 'var(--bg-dark)', padding: '1rem 0 0 0', borderTop: '1px solid var(--border-subtle)', marginTop: '2rem' }}>
                <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button className="btn-save" onClick={handleSave}>Save Game & Close</button>
              </div>
            </div>
          </div>
        )}

        {isQuizModalOpen && (
          <div className="modal-overlay">
            <div className="admin-modal" style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <h3>{editingQuiz ? 'Edit Quiz Builder' : 'Create New Quiz'}</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Quiz Title</label>
                  <input type="text" value={quizFormData.title} onChange={e => setQuizFormData({ ...quizFormData, title: e.target.value })} placeholder="e.g. Science Trivia" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Quiz Sub-title (Description)</label>
                  <input type="text" value={quizFormData.desc || ''} onChange={e => setQuizFormData({ ...quizFormData, desc: e.target.value })} placeholder="e.g. Test your basic science knowledge" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Quiz Thumbnail URL</label>
                  <ImageUploadInput value={quizFormData.image || ''} onChange={val => setQuizFormData({ ...quizFormData, image: val })} placeholder="https://..." />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={quizFormData.category} onChange={e => setQuizFormData({ ...quizFormData, category: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)', color: 'white' }}>
                    <option value="General">General</option>
                    <option value="Science">Science</option>
                    <option value="Mythology">Mythology</option>
                    <option value="History">History</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Difficulty</label>
                  <select value={quizFormData.difficulty} onChange={e => setQuizFormData({ ...quizFormData, difficulty: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)', color: 'white' }}>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0 }}>Questions ({quizFormData.questions.length})</h4>
                  <button className="primary-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => setQuizFormData({ ...quizFormData, questions: [...quizFormData.questions, { q: '', options: ['', '', '', ''], ans: 0, image: '', explanation: '' }] })}>+ Add Question</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {quizFormData.questions.map((q, qIdx) => (
                    <div key={qIdx} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <strong>Question {qIdx + 1}</strong>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {qIdx > 0 && (
                            <button
                              className="btn-icon"
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.3rem 0.6rem', color: '#fff', fontSize: '0.75rem', cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const newQs = [...quizFormData.questions];
                                [newQs[qIdx - 1], newQs[qIdx]] = [newQs[qIdx], newQs[qIdx - 1]];
                                setQuizFormData({ ...quizFormData, questions: newQs });
                              }}
                            >⬆️ Up</button>
                          )}
                          {qIdx < quizFormData.questions.length - 1 && (
                            <button
                              className="btn-icon"
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.3rem 0.6rem', color: '#fff', fontSize: '0.75rem', cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const newQs = [...quizFormData.questions];
                                [newQs[qIdx + 1], newQs[qIdx]] = [newQs[qIdx], newQs[qIdx + 1]];
                                setQuizFormData({ ...quizFormData, questions: newQs });
                              }}
                            >⬇️ Down</button>
                          )}
                          <button
                            className="btn-icon btn-delete"
                            style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '0.3rem 0.6rem', color: '#f87171', fontSize: '0.75rem', cursor: 'pointer' }}
                            onClick={() => setQuizFormData({ ...quizFormData, questions: quizFormData.questions.filter((_, i) => i !== qIdx) })}
                          >🗑️ Remove</button>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Question Text</label>
                        <input type="text" value={q.q} onChange={e => { const newQ = [...quizFormData.questions]; newQ[qIdx].q = e.target.value; setQuizFormData({ ...quizFormData, questions: newQ }); }} placeholder="Enter question..." />
                      </div>
                      <div className="form-group">
                        <label>Optional Image URL</label>
                        <ImageUploadInput value={q.image || ''} onChange={val => { const newQ = [...quizFormData.questions]; newQ[qIdx].image = val; setQuizFormData({ ...quizFormData, questions: newQ }); }} placeholder="https://... or drop image" />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <input type="radio" name={`q_${qIdx}_ans`} checked={q.ans === oIdx} onChange={() => { const newQ = [...quizFormData.questions]; newQ[qIdx].ans = oIdx; setQuizFormData({ ...quizFormData, questions: newQ }); }} />
                              Option {oIdx + 1} (Correct)
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <input type="text" value={opt} onChange={e => { const newQ = [...quizFormData.questions]; newQ[qIdx].options[oIdx] = e.target.value; setQuizFormData({ ...quizFormData, questions: newQ }); }} placeholder={`Option ${oIdx + 1}`} style={{ flex: 1 }} />
                              {q.options.length > 2 && (
                                <button
                                  type="button"
                                  className="btn-icon btn-delete"
                                  style={{ padding: '0 0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: 'none', borderRadius: '8px', cursor: 'pointer', minWidth: '40px' }}
                                  onClick={() => {
                                    const newQ = [...quizFormData.questions];
                                    if (newQ[qIdx].ans === oIdx) newQ[qIdx].ans = 0;
                                    else if (newQ[qIdx].ans > oIdx) newQ[qIdx].ans -= 1;
                                    newQ[qIdx].options = newQ[qIdx].options.filter((_, i) => i !== oIdx);
                                    setQuizFormData({ ...quizFormData, questions: newQ });
                                  }}
                                >✕</button>
                              )}
                            </div>
                          </div>
                        ))}
                        {q.options.length < 6 && (
                          <button
                            type="button"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--border-subtle)', borderRadius: '8px', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', minHeight: '60px', transition: 'all 0.2s', alignSelf: 'end' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onClick={() => {
                              const newQ = [...quizFormData.questions];
                              newQ[qIdx].options.push('');
                              setQuizFormData({ ...quizFormData, questions: newQ });
                            }}
                          >
                            ➕ Add Option
                          </button>
                        )}
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Explanation (shown after answer)</label>
                        <input type="text" value={q.explanation} onChange={e => { const newQ = [...quizFormData.questions]; newQ[qIdx].explanation = e.target.value; setQuizFormData({ ...quizFormData, questions: newQ }); }} placeholder="Why is this the correct answer?" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer" style={{ position: 'sticky', bottom: 0, background: 'var(--bg-main)', padding: '1rem', borderTop: '1px solid var(--border-subtle)', margin: '0 -2rem -2rem -2rem' }}>
                <button className="btn-cancel" onClick={() => setIsQuizModalOpen(false)}>Cancel</button>
                <button className="btn-save" onClick={handleSaveQuiz}>Save Quiz & Close</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'question_bank' && (() => {
          const allQuestions = [];
          quizzesList.forEach(q => {
            if (q.questions) {
              q.questions.forEach((question, idx) => {
                allQuestions.push({ ...question, source: q.title, sourceId: q.id, type: 'Quiz', idx });
              });
            }
          });
          games.forEach(g => {
            if (g.questions) {
              g.questions.forEach((question, idx) => {
                allQuestions.push({ ...question, source: g.name, type: 'Game', idx });
              });
            }
          });

          return (
            <div className="admin-table-container">
              <div className="admin-table-header">
                <h3>All Questions Database ({allQuestions.length})</h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                  />
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Question Text</th>
                      <th>Source</th>
                      <th>Correct Answer</th>
                      <th>Options Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allQuestions
                      .filter(q => (q.q || '').toLowerCase().includes((adminSearch || '').toLowerCase()) || (q.source || '').toLowerCase().includes((adminSearch || '').toLowerCase()))
                      .map((q, i) => (
                        <tr key={i}>
                          <td style={{ maxWidth: '300px' }}>
                            <strong>{q.q || 'Untitled Question'}</strong>
                            {q.image && <div style={{ fontSize: '0.75rem', color: 'var(--accent-1)', marginTop: '0.2rem' }}>🖼️ Has Image Attachment</div>}
                          </td>
                          <td>
                            <span style={{ background: q.type === 'Game' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: q.type === 'Game' ? '#38bdf8' : '#10b981', padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '800' }}>{q.type}</span>
                            <div style={{ fontSize: '0.8rem', marginTop: '0.4rem', color: 'var(--text-muted)' }}>{q.source}</div>
                          </td>
                          <td>
                            <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '0.3rem 0.6rem', borderRadius: '6px', display: 'inline-block', fontSize: '0.85rem' }}>
                              ✓ {q.options[q.ans]}
                            </div>
                          </td>
                          <td>{q.options.filter(o => o).length} Options</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {allQuestions.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No questions found. Add some questions to your games or quizzes first!
                </div>
              )}
            </div>
          );
        })()}

        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Live Database Mode Card */}
            <div style={{ background: 'var(--glass-bg)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>System Status</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <span style={{ 
                    display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', 
                    background: dbData.databaseStatus?.includes('Online') ? '#10b981' : '#f59e0b',
                    boxShadow: dbData.databaseStatus?.includes('Online') ? '0 0 10px #10b981' : '0 0 10px #f59e0b'
                  }}></span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                    {dbData.databaseStatus || 'Offline'} ({dbData.databaseEngine || 'Mock Engine'})
                  </span>
                </div>
              </div>
              <button className="primary-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={fetchDbData} disabled={loadingDb}>
                {loadingDb ? 'Loading...' : '🔄 Refresh Live Data'}
              </button>
            </div>

            {/* Users Table */}
            <div className="admin-table-container">
              <div className="admin-table-header">
                <h3>Registered Accounts ({dbData.users?.length || 0})</h3>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User / Initials</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Total XP</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dbData.users && dbData.users.length > 0 ? (
                    dbData.users.map((user, idx) => (
                      <tr key={user._id || idx}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold', color: 'white', overflow: 'hidden', flexShrink: 0 }}>
                              {user.avatar && user.avatar.startsWith('http') ? (
                                <img src={user.avatar} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display='none'; e.target.parentNode.innerText = user.username ? user.username.substring(0,2).toUpperCase() : 'US'; }} />
                              ) : (
                                user.avatar || (user.username ? user.username.substring(0, 2).toUpperCase() : 'US')
                              )}
                            </div>
                            <strong>{user.username}</strong>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span style={{ 
                            background: user.role === 'admin' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)', 
                            color: user.role === 'admin' ? '#10b981' : '#3b82f6', 
                            padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '800' 
                          }}>{(user.role || 'user').toUpperCase()}</span>
                        </td>
                        <td>{user.totalXP !== undefined ? user.totalXP.toLocaleString() : 0} XP</td>
                        <td>
                          <div className="action-btns">
                            <button className="btn-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }} onClick={() => addToast('Actions are disabled for debug safety', 'error')} title="Manage User">⚙️</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No user accounts registered. Try registering a user to see them populate here!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Quiz Play Log History */}
            <div className="admin-table-container">
              <div className="admin-table-header">
                <h3>Live Quiz Completion Logs ({dbData.history?.length || 0})</h3>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User ID / Account</th>
                    <th>Quiz Title</th>
                    <th>Accuracy</th>
                    <th>XP Gained</th>
                    <th>Max Streak</th>
                    <th>Completed Date</th>
                  </tr>
                </thead>
                <tbody>
                  {dbData.history && dbData.history.length > 0 ? (
                    dbData.history.map((log, idx) => (
                      <tr key={log._id || idx}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{log.userId}</td>
                        <td><strong>{log.quizTitle}</strong></td>
                        <td>{log.accuracy}%</td>
                        <td style={{ color: 'var(--accent-1)', fontWeight: 'bold' }}>+{log.xpEarned} XP</td>
                        <td>{log.maxStreak}x</td>
                        <td>{new Date(log.date || log.createdAt).toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No quiz completions recorded yet. Complete a quiz to watch logs sync!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="admin-table-container">
            <h3>Analytics Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '1.5rem' }}>
              <div style={{ background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>User Growth (Last 6 Months)</h4>
                <div style={{ display: 'flex', alignItems: 'flex-end', height: '150px', gap: '10px', marginTop: '1rem' }}>
                  <div style={{ flex: 1, background: 'var(--accent-1)', height: '40%', borderRadius: '4px 4px 0 0', opacity: 0.7 }}></div>
                  <div style={{ flex: 1, background: 'var(--accent-1)', height: '50%', borderRadius: '4px 4px 0 0', opacity: 0.7 }}></div>
                  <div style={{ flex: 1, background: 'var(--accent-1)', height: '65%', borderRadius: '4px 4px 0 0', opacity: 0.8 }}></div>
                  <div style={{ flex: 1, background: 'var(--accent-1)', height: '80%', borderRadius: '4px 4px 0 0', opacity: 0.9 }}></div>
                  <div style={{ flex: 1, background: 'var(--accent-1)', height: '95%', borderRadius: '4px 4px 0 0' }}></div>
                  <div style={{ flex: 1, background: 'var(--accent-1)', height: '100%', borderRadius: '4px 4px 0 0', boxShadow: '0 0 10px var(--accent-1)' }}></div>
                </div>
              </div>
              <div style={{ background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Most Popular Categories</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}><span>Science</span><span>45%</span></div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}><div style={{ width: '45%', height: '100%', background: '#3b82f6', borderRadius: '4px' }}></div></div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}><span>History</span><span>30%</span></div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}><div style={{ width: '30%', height: '100%', background: '#10b981', borderRadius: '4px' }}></div></div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}><span>Pop Culture</span><span>25%</span></div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}><div style={{ width: '25%', height: '100%', background: '#f59e0b', borderRadius: '4px' }}></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="admin-table-container">
            <h3>Platform Settings</h3>
            <div style={{ maxWidth: '600px', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group">
                <label>Platform Name</label>
                <input type="text" defaultValue="KMS Academy" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', color: 'white' }} />
              </div>
              <div className="form-group">
                <label>Support Email</label>
                <input type="email" defaultValue="support@kmsacademy.edu" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', color: 'white' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <strong style={{ display: 'block' }}>Theme Color</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Customize the platform's primary accent color</span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {[
                    { color1: '#38bdf8', color2: '#818cf8', name: 'Blue' },
                    { color1: '#10b981', color2: '#34d399', name: 'Green' },
                    { color1: '#c084fc', color2: '#f472b6', name: 'Purple' },
                    { color1: '#fb923c', color2: '#facc15', name: 'Orange' },
                    { color1: '#f43f5e', color2: '#fb7185', name: 'Rose' }
                  ].map(theme => (
                    <div
                      key={theme.name}
                      onClick={() => {
                        document.documentElement.style.setProperty('--accent-1', theme.color1);
                        document.documentElement.style.setProperty('--accent-2', theme.color2);
                        localStorage.setItem('quiznova_theme', JSON.stringify({ color1: theme.color1, color2: theme.color2 }));
                        addToast(`Theme changed to ${theme.name}`, 'success');
                      }}
                      title={theme.name}
                      style={{
                        width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
                        background: `linear-gradient(135deg, ${theme.color1}, ${theme.color2})`,
                        border: '2px solid rgba(255,255,255,0.2)',
                        transition: 'transform 0.2s',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    ></div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ flex: 1, marginRight: '1rem' }}>
                  <strong style={{ display: 'block' }}>2nd Title Section</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Customize the title of the Editors' Picks section on the homepage</span>
                </div>
                <input
                  type="text"
                  value={editorsPicksTitle}
                  onChange={e => {
                    setEditorsPicksTitle(e.target.value);
                    localStorage.setItem('quiznova_editors_picks_title', e.target.value);
                  }}
                  style={{ width: '200px', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ flex: 1, marginRight: '1rem' }}>
                  <strong style={{ display: 'block' }}>3rd Title Section</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Customize the title of the Popular section on the homepage</span>
                </div>
                <input
                  type="text"
                  value={popularTitle}
                  onChange={e => {
                    setPopularTitle(e.target.value);
                    localStorage.setItem('quiznova_popular_title', e.target.value);
                  }}
                  style={{ width: '200px', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <strong style={{ display: 'block' }}>Enable Public Registration</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Allow new users to sign up automatically</span>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked onChange={() => { }} />
                  <span className="slider"></span>
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <strong style={{ display: 'block' }}>Show Featured Games</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Toggle visibility of the Featured Games section on the homepage</span>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={showFeaturedGames} onChange={(e) => { setShowFeaturedGames(e.target.checked); localStorage.setItem('quiznova_show_featured', e.target.checked); }} />
                  <span className="slider"></span>
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <strong style={{ display: 'block' }}>Maintenance Mode</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Take the site offline for updates</span>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" onChange={() => { }} />
                  <span className="slider"></span>
                </label>
              </div>
              <button className="primary-btn" onClick={() => addToast('Settings saved successfully', 'success')} style={{ marginTop: '1rem' }}>Save Settings</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoginModal({ isOpen, onClose, onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const initGoogleSignIn = () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "1234567890-placeholderclientid.apps.googleusercontent.com",
          callback: handleGoogleLogin
        });

        const btnDiv = document.getElementById("google-signin-btn");
        if (btnDiv) {
          window.google.accounts.id.renderButton(btnDiv, {
            theme: "filled_blue",
            size: "large",
            width: "100%",
            text: "signin_with"
          });
        }
      } else {
        setTimeout(initGoogleSignIn, 300);
      }
    };

    initGoogleSignIn();
  }, [isOpen]);

  const handleGoogleLogin = async (response) => {
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Google sign-in failed');
      }
      onLogin(data.user.role, data.token, data.user);
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Google login failed. Falling back to local guest simulation.');
      onLogin('user');
      onClose();
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/register' : '/login';
      const body = isRegister
        ? {
            username: name.trim() || email.split('@')[0],
            email: email.includes('@') ? email : `${email}@quiznova.org`,
            password,
            role: 'user'
          }
        : { identifier: email, password };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      onLogin(data.user.role, data.token, data.user, data.refreshToken || null);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-card" onClick={e => e.stopPropagation()}>
        <span className="login-close" onClick={onClose}>✕</span>
        <div className="login-brand-icon">🏵️</div>
        <h2>{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
        <p>{isRegister ? 'Join KMS Academy to save scores and climb the leaderboard.' : 'Log in to continue your learning journey.'}</p>

        <form className="login-form" onSubmit={handleSubmit}>
          {isRegister && (
            <div className="login-input-wrapper">
              <label>Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required />
            </div>
          )}
          <div className="login-input-wrapper">
            <label>Email or Username</label>
            <input
              type="text"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder={isRegister ? 'john@example.com' : 'your@email.com or username'}
              required
            />
          </div>
          <div className="login-input-wrapper">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              required
            />
          </div>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '8px', padding: '0.65rem 1rem', color: '#f87171', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              ⚠️ {error}
            </div>
          )}
          <button type="submit" className="login-submit-btn" disabled={loading} style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? (isRegister ? 'Creating account...' : 'Logging in...') : (isRegister ? 'Register' : 'Log In')}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', width: '100%' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span style={{ padding: '0 0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        <div id="google-signin-btn" style={{ width: '100%', display: 'flex', justifyContent: 'center', minHeight: '44px', marginBottom: '0.5rem' }}></div>

        <p style={{ marginTop: '1.25rem', cursor: 'pointer', color: 'var(--accent-1)', fontSize: '0.9rem' }} onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Already have an account? Log in' : "Don't have an account? Register"}
        </p>
      </div>
    </div>
  );
}

function Footer({ onNavigate }) {
  return (
    <footer className="dark-footer">
      <div className="footer-social">
        STAY CONNECTED
        <div className="social-icons">
          <span>f</span>
          <span>𝕏</span>
          <span>▶</span>
          <span>📷</span>
          <span>P</span>
        </div>
      </div>
      <div className="footer-links">
        <a href="#">About Us & Legal Info</a>
        <a href="#">Advertising</a>
        <a href="#">Contact Us</a>
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Use</a>
        <a href="#">Equal Opportunity</a>
      </div>
      <div className="copyright">
        ©2026 KMS ACADEMY, Inc.
      </div>
    </footer>
  );
}

export default App;
