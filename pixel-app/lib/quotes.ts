export interface Quote {
  text: string;
  author: string | null;
}

export const quotes: Quote[] = [
  { text: "You're not tired, you're uninspired. Find something worth losing sleep over.", author: null },
  { text: "Someone busier than you is working right now.", author: null },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "The graveyard is full of people who had potential.", author: null },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "David Goggins" },
  { text: "Suffer the pain of discipline or suffer the pain of regret.", author: "Jim Rohn" },
  { text: "Your competition is working while you're scrolling.", author: null },
  { text: "Nobody cares. Work harder.", author: "Cameron Hanes" },
  { text: "You don't rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "Hard choices, easy life. Easy choices, hard life.", author: "Jerzy Gregorek" },
  { text: "If you're not embarrassed by who you were last year, you're not growing fast enough.", author: null },
  { text: "Motivation is garbage. Motivation is for amateurs.", author: "David Goggins" },
  { text: "Rest at the end, not in the middle.", author: "Kobe Bryant" },
  { text: "I don't count my sit-ups. I only start counting when it starts hurting.", author: "Muhammad Ali" },
  { text: "The only thing standing between you and your goal is the story you keep telling yourself.", author: "Jordan Belfort" },
  { text: "If it was easy, everyone would do it.", author: null },
  { text: "Success is not owned. It's leased. And rent is due every day.", author: "J.J. Watt" },
  { text: "Be so good they can't ignore you.", author: "Steve Martin" },
  { text: "Your future self is watching you right now through memories.", author: null },
  { text: "Every next level of your life will demand a different version of you.", author: null },
  { text: "Comfort is the enemy of progress.", author: "P.T. Barnum" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "You didn't come this far to only come this far.", author: null },
  { text: "Don't wish it were easier. Wish you were better.", author: "Jim Rohn" },
  { text: "I fear not the man who has practiced 10,000 kicks once, but I fear the man who has practiced one kick 10,000 times.", author: "Bruce Lee" },
  { text: "Your mind will quit a thousand times before your body will.", author: null },
  { text: "Obsessed is a word the lazy use to describe the dedicated.", author: null },
  { text: "Pain is temporary. Quitting lasts forever.", author: "Lance Armstrong" },
  { text: "The grind includes days you don't feel like grinding.", author: null },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Go the extra mile. It's never crowded.", author: null },
  { text: "Talent is cheaper than table salt. What separates the talented individual from the successful one is hard work.", author: "Stephen King" },
  { text: "While you're overthinking, someone else is doing.", author: null },
  { text: "The only person you should try to be better than is the person you were yesterday.", author: null },
  { text: "The magic you're looking for is in the work you're avoiding.", author: null },
  { text: "Consistency beats intensity. Show up every day.", author: null },
  { text: "A year from now, you'll wish you had started today.", author: "Karen Lamb" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { text: "Champions aren't made in the gym. Champions are made from something deep inside them.", author: "Muhammad Ali" },
  { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
  { text: "If you're going through hell, keep going.", author: "Winston Churchill" },
  { text: "Work until your idols become your rivals.", author: null },
  { text: "Your comfort zone will kill your ambitions.", author: null },
  { text: "Close the tab. Open the textbook.", author: null },
  { text: "That assignment isn't going to write itself.", author: null },
  { text: "Study like your future depends on it. Because it does.", author: null },
  { text: "The library closes. Your ambition shouldn't.", author: null },
  { text: "Berkeley doesn't hand out degrees. You earn them.", author: null },
  { text: "Hustle in silence and let your success make the noise.", author: null },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "Either you run the day, or the day runs you.", author: "Jim Rohn" },
  { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
  { text: "Do something today that your future self will thank you for.", author: null },
  { text: "You are what you repeatedly do. Excellence is not an act, but a habit.", author: "Aristotle" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "Outwork everyone in the room. Then find a bigger room.", author: null },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Lock in.", author: null },
];

const gradientColors: string[][] = [
  ["#1e1b4b", "#18181b", "#27272a"], // blue-950 -> zinc
  ["#3b0764", "#18181b", "#27272a"], // purple-950 -> zinc
  ["#022c22", "#18181b", "#27272a"], // emerald-950 -> zinc
  ["#4c0519", "#18181b", "#27272a"], // rose-950 -> zinc
  ["#451a03", "#18181b", "#27272a"], // amber-950 -> zinc
  ["#083344", "#18181b", "#27272a"], // cyan-950 -> zinc
];

export function getGradientColors(index: number): string[] {
  return gradientColors[index % gradientColors.length];
}

export function shuffleQuotes(): Quote[] {
  const arr = [...quotes];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
