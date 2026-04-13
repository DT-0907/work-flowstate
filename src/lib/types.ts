export type TimeOfDay = "morning" | "midday" | "night";
export type HabitFrequency = "daily" | "weekdays" | "weekends" | "custom";
export type AssignmentPriority = "low" | "medium" | "high" | "urgent";
export type AssignmentStatus = "pending" | "in_progress" | "completed";
export type TaskType = "habit" | "assignment";
export type LifeArea = "intellectual" | "mental" | "spiritual" | "financial" | "physical" | "social";
export type Theme = "dark" | "light";

export const LIFE_AREAS: LifeArea[] = ["intellectual", "mental", "spiritual", "financial", "physical", "social"];

export const AREA_LABELS: Record<LifeArea, string> = {
  intellectual: "Intellectual",
  mental: "Mental",
  spiritual: "Spiritual",
  financial: "Financial",
  physical: "Physical",
  social: "Social",
};

export const AREA_KEYWORDS: Record<LifeArea, string[]> = {
  intellectual: [
    // Core academics
    "study", "read", "learn", "research", "homework", "class", "lecture", "write", "code", "programming",
    "book", "course", "exam", "test", "quiz", "essay", "paper", "thesis", "dissertation", "assignment",
    "grade", "gpa", "syllabus", "textbook", "notebook", "notes", "review", "revise", "cram", "tutor",
    "tutoring", "professor", "teacher", "instructor", "ta", "office hours", "lab", "laboratory", "seminar",
    "workshop", "conference", "presentation", "project", "group project", "midterm", "final", "academic",
    // STEM
    "math", "calculus", "algebra", "geometry", "statistics", "physics", "chemistry", "biology", "science",
    "engineering", "computer science", "data science", "machine learning", "artificial intelligence", "ai",
    "algorithm", "data structure", "database", "software", "hardware", "circuit", "robotics", "aerospace",
    "mechanical", "electrical", "civil", "bioengineering", "neuroscience", "genetics", "biochemistry",
    "organic chemistry", "quantum", "thermodynamics", "linear algebra", "differential equations", "discrete",
    "probability", "optimization", "compiler", "operating system", "network", "cybersecurity", "cryptography",
    // Programming & Tech
    "python", "java", "javascript", "typescript", "react", "node", "sql", "html", "css", "git",
    "github", "leetcode", "hackerrank", "debug", "deploy", "api", "backend", "frontend", "fullstack",
    "web dev", "app dev", "mobile dev", "ios", "android", "swift", "kotlin", "rust", "golang", "c++",
    "docker", "kubernetes", "aws", "cloud", "devops", "agile", "scrum", "sprint", "standup", "jira",
    "figma", "design system", "ui", "ux", "prototype", "wireframe", "mockup", "user research",
    "terminal", "command line", "vim", "vscode", "ide", "refactor", "pull request", "code review",
    "pair programming", "open source", "documentation", "readme", "changelog", "version control",
    // Humanities & Arts
    "history", "philosophy", "literature", "psychology", "sociology", "anthropology", "political science",
    "economics", "linguistics", "art", "music", "theater", "film", "photography", "creative writing",
    "poetry", "fiction", "nonfiction", "journalism", "media", "communication", "rhetoric", "ethics",
    "logic", "critical thinking", "analysis", "synthesis", "argument", "debate", "discussion",
    // Reading & Knowledge
    "article", "blog", "podcast", "audiobook", "ebook", "kindle", "library", "wikipedia", "documentary",
    "ted talk", "youtube", "tutorial", "online course", "mooc", "coursera", "edx", "udemy", "khan academy",
    "skillshare", "masterclass", "certification", "credential", "diploma", "degree", "minor", "major",
    "concentration", "specialization", "elective", "prerequisite", "curriculum", "syllabus",
    // Thinking & Problem Solving
    "think", "analyze", "brainstorm", "problem solve", "strategize", "plan", "organize", "outline",
    "diagram", "flowchart", "mind map", "concept map", "framework", "model", "theory", "hypothesis",
    "experiment", "observe", "measure", "quantify", "evaluate", "assess", "critique", "synthesize",
    "abstract", "concrete", "deductive", "inductive", "reasoning", "logic puzzle", "chess", "sudoku",
    "crossword", "puzzle", "riddle", "brain teaser", "trivia", "quiz bowl", "academic decathlon",
    // Languages
    "language", "spanish", "french", "mandarin", "chinese", "japanese", "korean", "german", "italian",
    "portuguese", "arabic", "hindi", "russian", "latin", "greek", "duolingo", "rosetta", "vocabulary",
    "grammar", "conjugation", "translation", "interpretation", "fluency", "immersion", "dialect",
    // Professional Development
    "skill", "competency", "expertise", "mastery", "proficiency", "knowledge", "wisdom", "insight",
    "discovery", "innovation", "invention", "patent", "publish", "peer review", "journal article",
    "citation", "reference", "bibliography", "abstract", "methodology", "findings", "conclusion",
    "intellectual", "scholar", "academic", "collegiate", "university", "college", "school", "education",
  ],
  mental: [
    // Meditation & Mindfulness
    "meditate", "mindful", "mindfulness", "therapy", "journal", "reflect", "breathe", "calm", "stress",
    "sleep", "rest", "break", "relax", "unwind", "decompress", "recharge", "recovery", "restore",
    "meditation", "guided meditation", "body scan", "breathing exercise", "deep breath", "box breathing",
    "pranayama", "breathwork", "visualization", "affirmation", "mantra", "zen", "present moment",
    "awareness", "consciousness", "attention", "focus", "concentration", "clarity", "peace", "tranquility",
    "serenity", "stillness", "silence", "quiet", "solitude", "alone time", "me time", "self care",
    // Therapy & Counseling
    "therapist", "counselor", "psychologist", "psychiatrist", "counseling", "cbt", "dbt", "emdr",
    "cognitive behavioral", "dialectical", "psychotherapy", "talk therapy", "group therapy", "support group",
    "mental health", "emotional health", "psychological", "wellbeing", "well being", "wellness",
    "self help", "self improvement", "personal growth", "inner work", "shadow work", "inner child",
    "attachment", "boundaries", "codependency", "trauma", "ptsd", "anxiety", "depression", "ocd",
    "adhd", "bipolar", "mood", "emotion", "feeling", "sentiment", "affect", "regulation", "dysregulation",
    // Emotional Intelligence
    "emotional intelligence", "eq", "empathy", "compassion", "self compassion", "kindness", "patience",
    "tolerance", "acceptance", "forgiveness", "letting go", "surrender", "release", "grief", "loss",
    "healing", "coping", "resilience", "grit", "perseverance", "endurance", "tenacity", "courage",
    "vulnerability", "authenticity", "honesty", "integrity", "self awareness", "self knowledge",
    "introspection", "self reflection", "contemplation", "rumination", "overthinking", "worry",
    // Stress Management
    "stress management", "stress relief", "destress", "burnout", "overwhelm", "overwork", "exhaustion",
    "fatigue", "tired", "weariness", "tension", "pressure", "deadline anxiety", "performance anxiety",
    "imposter syndrome", "self doubt", "insecurity", "confidence", "self esteem", "self worth",
    "self love", "self respect", "self trust", "self efficacy", "agency", "autonomy", "independence",
    // Sleep & Rest
    "nap", "power nap", "sleep hygiene", "bedtime", "wake up", "morning routine", "night routine",
    "wind down", "screen time", "digital detox", "phone break", "social media break", "dopamine detox",
    "dopamine fast", "stimulus", "overstimulation", "understimulation", "boredom", "restlessness",
    "insomnia", "sleep schedule", "circadian", "melatonin", "rem", "deep sleep", "dream",
    // Journaling & Reflection
    "diary", "gratitude journal", "morning pages", "evening reflection", "daily review", "weekly review",
    "monthly review", "yearly review", "goal setting", "intention setting", "vision board", "bucket list",
    "life audit", "values", "priorities", "purpose", "meaning", "fulfillment", "satisfaction",
    "contentment", "happiness", "joy", "bliss", "flow state", "peak experience", "optimal",
    // Habits & Routines
    "routine", "habit", "ritual", "practice", "discipline", "consistency", "streak", "accountability",
    "commitment", "dedication", "motivation", "inspiration", "willpower", "determination",
    "procrastination", "avoidance", "distraction", "focus", "attention span", "deep work",
    "flow", "zone", "productivity", "efficiency", "effectiveness", "time management", "prioritize",
    "mental", "psychological", "cognitive", "neurological", "brain", "mind", "psyche", "consciousness",
  ],
  spiritual: [
    // Religion & Faith
    "pray", "prayer", "gratitude", "church", "temple", "mosque", "synagogue", "faith", "purpose",
    "spiritual", "yoga", "thankful", "grateful", "blessing", "blessed", "grace", "divine", "sacred",
    "holy", "worship", "praise", "devotion", "devotional", "scripture", "bible", "quran", "torah",
    "gospel", "psalm", "verse", "chapter", "sermon", "homily", "mass", "service", "congregation",
    "parish", "ministry", "mission", "missionary", "evangelize", "testimony", "witness", "baptism",
    "communion", "eucharist", "confession", "repentance", "redemption", "salvation", "resurrection",
    "heaven", "paradise", "eternity", "eternal", "afterlife", "soul", "spirit", "holy spirit",
    // Meditation & Eastern Practices
    "zen", "buddhism", "buddhist", "dharma", "karma", "nirvana", "enlightenment", "awakening",
    "satori", "samadhi", "moksha", "liberation", "transcendence", "transcendent", "mystical",
    "mysticism", "esoteric", "occult", "metaphysical", "supernatural", "paranormal", "intuition",
    "sixth sense", "clairvoyance", "psychic", "aura", "chakra", "kundalini", "prana", "qi", "chi",
    "tai chi", "qigong", "reiki", "energy healing", "crystal", "sage", "smudge", "incense",
    "altar", "shrine", "offering", "ritual", "ceremony", "rite", "sacrament", "pilgrimage",
    // Yoga & Body-Spirit
    "asana", "vinyasa", "hatha", "ashtanga", "bikram", "yin yoga", "restorative yoga", "power yoga",
    "sun salutation", "namaste", "om", "chant", "kirtan", "mantra", "mudra", "bandha", "pranayama",
    // Gratitude & Purpose
    "thankfulness", "appreciation", "count blessings", "grateful heart", "thank you", "thanks",
    "meaning of life", "life purpose", "calling", "vocation", "destiny", "fate", "providence",
    "synchronicity", "coincidence", "miracle", "wonder", "awe", "reverence", "humility", "humble",
    "surrender", "trust", "belief", "doubt", "questioning", "seeking", "searching", "journey",
    "path", "way", "tao", "dao", "truth", "wisdom", "sage", "elder", "guru", "teacher", "master",
    "disciple", "student", "learner", "seeker", "pilgrim", "wanderer", "explorer", "adventurer",
    // Nature & Connection
    "nature", "creation", "creator", "universe", "cosmos", "cosmic", "celestial", "stars", "moon",
    "sun", "earth", "ocean", "mountain", "forest", "river", "garden", "flower", "tree", "animal",
    "connection", "oneness", "unity", "wholeness", "completeness", "integration", "harmony",
    "balance", "equilibrium", "alignment", "attunement", "resonance", "vibration", "frequency",
    // Values & Ethics
    "virtue", "moral", "ethical", "integrity", "honesty", "truthful", "sincere", "genuine",
    "authentic", "compassionate", "merciful", "charitable", "generous", "altruistic", "selfless",
    "service", "serve", "give", "donate", "tithe", "offering", "sacrifice", "discipline",
    "temperance", "moderation", "abstinence", "fasting", "fast", "lent", "ramadan", "sabbath",
    "sabbatical", "retreat", "silent retreat", "contemplative", "monastic", "ascetic",
    "spiritual", "spirituality", "religion", "religious", "devout", "pious", "faithful",
  ],
  financial: [
    // Budgeting & Saving
    "budget", "save", "invest", "money", "finance", "income", "side project", "freelance", "startup",
    "business", "expense", "spending", "frugal", "thrift", "thrifty", "cheap", "affordable", "discount",
    "coupon", "deal", "sale", "bargain", "negotiate", "haggle", "price", "cost", "fee", "charge",
    "bill", "invoice", "receipt", "tax", "taxes", "irs", "deduction", "write off", "refund",
    "savings account", "checking account", "bank", "banking", "credit union", "atm", "deposit",
    "withdrawal", "transfer", "wire", "zelle", "venmo", "paypal", "cashapp", "apple pay",
    "emergency fund", "rainy day fund", "nest egg", "piggy bank", "jar", "envelope method",
    // Investing
    "stock", "stocks", "bond", "bonds", "etf", "index fund", "mutual fund", "portfolio", "diversify",
    "diversification", "asset allocation", "rebalance", "dividend", "yield", "return", "roi",
    "capital gains", "appreciation", "depreciation", "inflation", "deflation", "recession",
    "bull market", "bear market", "volatility", "risk", "risk tolerance", "hedge", "option",
    "options", "futures", "commodity", "forex", "cryptocurrency", "crypto", "bitcoin", "ethereum",
    "blockchain", "defi", "nft", "token", "wallet", "exchange", "trading", "day trading",
    "swing trading", "position trading", "value investing", "growth investing", "passive income",
    "compound interest", "compounding", "dollar cost averaging", "dca", "lump sum",
    "roth ira", "401k", "ira", "hsa", "529", "brokerage", "fidelity", "vanguard", "schwab",
    "robinhood", "webull", "td ameritrade", "e-trade", "merrill", "wealthfront", "betterment",
    // Career & Income
    "salary", "wage", "hourly", "annual", "compensation", "benefits", "bonus", "commission",
    "raise", "promotion", "career", "job", "employment", "employer", "employee", "contractor",
    "freelancer", "gig", "gig economy", "side hustle", "side gig", "moonlight", "overtime",
    "part time", "full time", "remote", "hybrid", "office", "work from home", "wfh",
    "interview", "resume", "cv", "cover letter", "linkedin", "networking", "recruiter",
    "headhunter", "job board", "indeed", "glassdoor", "handshake", "career fair", "internship",
    "co-op", "apprenticeship", "entry level", "junior", "senior", "manager", "director", "vp",
    "ceo", "cto", "cfo", "coo", "founder", "co-founder", "entrepreneur", "entrepreneurship",
    // Business & Entrepreneurship
    "revenue", "profit", "loss", "margin", "overhead", "operating cost", "fixed cost", "variable cost",
    "cash flow", "balance sheet", "income statement", "p&l", "accounting", "bookkeeping", "quickbooks",
    "invoice", "accounts receivable", "accounts payable", "payroll", "equity", "valuation", "funding",
    "venture capital", "vc", "angel investor", "seed round", "series a", "ipo", "acquisition",
    "merger", "partnership", "llc", "corporation", "sole proprietorship", "ein", "dba",
    "product", "market", "customer", "client", "user", "growth", "scale", "pivot", "iterate",
    "mvp", "product market fit", "traction", "metrics", "kpi", "okr", "quarterly", "annual report",
    // Debt & Credit
    "debt", "loan", "mortgage", "student loan", "credit card", "interest rate", "apr", "principal",
    "payment", "minimum payment", "payoff", "debt free", "debt snowball", "debt avalanche",
    "credit score", "credit report", "fico", "credit bureau", "experian", "equifax", "transunion",
    "credit limit", "utilization", "hard inquiry", "soft inquiry", "dispute", "collection",
    // Real Estate
    "rent", "lease", "landlord", "tenant", "property", "real estate", "house", "apartment", "condo",
    "townhouse", "mortgage rate", "down payment", "closing cost", "escrow", "appraisal", "inspection",
    "refinance", "heloc", "home equity", "rental income", "airbnb", "property management",
    "financial", "fiscal", "monetary", "economic", "wealth", "prosperity", "abundance", "affluent",
    "rich", "millionaire", "net worth", "assets", "liabilities", "liquid", "illiquid",
  ],
  physical: [
    // Exercise & Gym
    "exercise", "gym", "run", "walk", "sport", "nutrition", "stretch", "workout", "fitness", "hike",
    "swim", "lift", "weight", "weightlifting", "powerlifting", "bodybuilding", "crossfit", "hiit",
    "cardio", "aerobic", "anaerobic", "endurance", "stamina", "strength", "power", "speed", "agility",
    "flexibility", "mobility", "balance", "coordination", "plyometric", "calisthenics", "bodyweight",
    "pushup", "push up", "pullup", "pull up", "squat", "deadlift", "bench press", "overhead press",
    "curl", "row", "lunge", "plank", "burpee", "jumping jack", "mountain climber", "sit up",
    "crunch", "leg raise", "dip", "muscle up", "handstand", "pistol squat", "box jump",
    // Running & Cardio
    "jog", "jogging", "sprint", "sprinting", "marathon", "half marathon", "5k", "10k", "trail run",
    "treadmill", "elliptical", "stairmaster", "stationary bike", "spin", "spinning", "cycling",
    "bike", "biking", "bicycle", "peloton", "rowing", "rower", "jump rope", "skipping",
    "stair climbing", "walking", "power walk", "incline", "interval", "tempo", "pace", "mile",
    "kilometer", "distance", "lap", "track", "field", "stadium", "arena", "court",
    // Sports
    "basketball", "football", "soccer", "tennis", "golf", "baseball", "softball", "volleyball",
    "hockey", "lacrosse", "rugby", "cricket", "badminton", "table tennis", "ping pong", "squash",
    "racquetball", "handball", "water polo", "polo", "boxing", "mma", "ufc", "wrestling",
    "jiu jitsu", "bjj", "karate", "taekwondo", "judo", "kung fu", "muay thai", "kickboxing",
    "fencing", "archery", "shooting", "climbing", "rock climbing", "bouldering", "rappelling",
    "surfing", "skateboarding", "snowboarding", "skiing", "ice skating", "roller skating",
    "parkour", "trampoline", "gymnastics", "cheerleading", "dance", "dancing", "ballet",
    "salsa", "hip hop dance", "breakdancing", "contemporary", "jazz dance", "tap dance",
    // Nutrition & Diet
    "meal prep", "cook", "cooking", "recipe", "ingredient", "grocery", "supermarket", "farmer market",
    "protein", "carb", "carbohydrate", "fat", "fiber", "vitamin", "mineral", "supplement",
    "creatine", "whey", "casein", "bcaa", "pre workout", "post workout", "shake", "smoothie",
    "calories", "calorie", "macro", "macros", "micro", "micronutrient", "nutrient", "nutritionist",
    "dietitian", "diet", "keto", "paleo", "vegan", "vegetarian", "intermittent fasting", "if",
    "clean eating", "whole food", "organic", "gluten free", "dairy free", "sugar free", "low carb",
    "high protein", "meal plan", "portion", "serving", "food journal", "food log", "myfitnesspal",
    "water", "hydrate", "hydration", "drink water", "gallon", "electrolyte", "sodium", "potassium",
    // Health & Body
    "health", "healthy", "body", "physique", "weight loss", "fat loss", "muscle gain", "bulk",
    "cut", "lean", "shredded", "toned", "ripped", "fit", "in shape", "out of shape", "overweight",
    "bmi", "body fat", "waist", "measurement", "progress photo", "before after", "transformation",
    "doctor", "physician", "checkup", "physical", "blood test", "blood pressure", "heart rate",
    "pulse", "resting heart rate", "vo2 max", "cholesterol", "glucose", "insulin", "a1c",
    "dentist", "optometrist", "dermatologist", "chiropractor", "physical therapy", "pt",
    "massage", "foam roll", "ice bath", "cold plunge", "sauna", "hot tub", "epsom salt",
    "recovery", "rest day", "active recovery", "deload", "injury", "pain", "sore", "soreness",
    "doms", "sprain", "strain", "fracture", "tendonitis", "rehab", "rehabilitation",
    // Sleep & Recovery
    "sleep", "nap", "rest", "recover", "bedtime", "wake", "alarm", "morning", "night",
    "circadian rhythm", "melatonin", "rem sleep", "deep sleep", "sleep tracker", "oura ring",
    "whoop", "fitbit", "apple watch", "garmin", "strava", "nike run club", "couch to 5k",
    // Outdoor Activities
    "outdoor", "outside", "nature walk", "trail", "park", "beach", "lake", "river", "mountain",
    "camping", "backpacking", "kayaking", "canoeing", "paddleboarding", "snorkeling", "diving",
    "fishing", "hunting", "gardening", "yard work", "lawn", "mowing", "landscaping",
    "physical", "body", "somatic", "kinesthetic", "athletic", "sporty", "active", "movement",
  ],
  social: [
    // Relationships & People
    "friend", "family", "network", "volunteer", "community", "call", "meet", "social", "club",
    "team", "group", "hangout", "hang out", "chill", "kick it", "link up", "pull up", "get together",
    "gathering", "party", "event", "function", "mixer", "happy hour", "dinner", "lunch", "brunch",
    "coffee", "drinks", "bar", "restaurant", "cafe", "movie", "concert", "show", "festival",
    "game night", "board game", "card game", "video game", "co-op", "multiplayer", "lan party",
    // Communication
    "text", "message", "dm", "email", "letter", "postcard", "phone call", "facetime", "zoom",
    "video call", "skype", "discord", "slack", "whatsapp", "telegram", "signal", "imessage",
    "conversation", "chat", "talk", "discuss", "debate", "argue", "listen", "hear", "understand",
    "empathize", "sympathize", "console", "comfort", "support", "encourage", "motivate", "inspire",
    "compliment", "praise", "thank", "appreciate", "acknowledge", "recognize", "celebrate",
    "congratulate", "toast", "cheer", "applaud", "hug", "handshake", "fist bump", "high five",
    // Family
    "mom", "dad", "parent", "mother", "father", "brother", "sister", "sibling", "grandparent",
    "grandmother", "grandfather", "aunt", "uncle", "cousin", "niece", "nephew", "son", "daughter",
    "child", "children", "kid", "baby", "toddler", "teenager", "teen", "spouse", "husband", "wife",
    "partner", "significant other", "boyfriend", "girlfriend", "fiance", "fiancee", "wedding",
    "marriage", "anniversary", "birthday", "holiday", "thanksgiving", "christmas", "easter",
    "hanukkah", "eid", "diwali", "lunar new year", "valentines", "mothers day", "fathers day",
    "family reunion", "family dinner", "family time", "quality time", "bonding", "connection",
    // Professional Networking
    "linkedin", "handshake", "career fair", "info session", "coffee chat", "informational interview",
    "mentor", "mentee", "mentorship", "sponsor", "sponsorship", "recommendation", "referral",
    "reference", "endorsement", "introduction", "warm intro", "cold email", "outreach", "follow up",
    "business card", "elevator pitch", "pitch", "presentation", "public speaking", "toastmasters",
    "speech", "keynote", "panel", "roundtable", "fireside chat", "q&a", "ama", "webinar",
    // Community & Service
    "volunteer", "volunteering", "service", "community service", "nonprofit", "ngo", "charity",
    "donate", "donation", "fundraise", "fundraising", "gofundme", "kickstarter", "campaign",
    "cause", "activism", "advocate", "advocacy", "protest", "rally", "march", "petition", "vote",
    "election", "politics", "government", "civic", "citizenship", "democracy", "policy",
    "habitat for humanity", "red cross", "food bank", "soup kitchen", "shelter", "tutoring",
    "coaching", "teaching", "training", "onboarding", "orientation", "welcome", "hospitality",
    // Clubs & Organizations
    "fraternity", "sorority", "greek life", "rush", "pledge", "chapter", "organization", "org",
    "student org", "student government", "senate", "council", "board", "committee", "subcommittee",
    "president", "vice president", "secretary", "treasurer", "officer", "member", "membership",
    "dues", "meeting", "general meeting", "executive meeting", "retreat", "social event", "mixer",
    "philanthropy", "recruitment", "outreach", "tabling", "flyering", "poster", "flyer",
    "intramural", "recreational", "rec", "pickup game", "open gym", "league", "tournament",
    "competition", "hackathon", "case competition", "consulting", "pro bono", "clinic",
    // Dating & Romance
    "date", "dating", "relationship", "romance", "romantic", "love", "crush", "flirt", "ask out",
    "first date", "second date", "dinner date", "movie date", "picnic", "walk", "hinge", "bumble",
    "tinder", "coffee meets bagel", "match", "compatibility", "chemistry", "spark", "connection",
    // Social Skills
    "social skill", "charisma", "charm", "likability", "approachable", "friendly", "outgoing",
    "extrovert", "introvert", "ambivert", "small talk", "icebreaker", "opener", "rapport",
    "body language", "eye contact", "posture", "smile", "laugh", "humor", "joke", "wit",
    "storytelling", "anecdote", "narrative", "share", "open up", "vulnerable", "authentic",
    "genuine", "sincere", "trustworthy", "reliable", "dependable", "loyal", "faithful",
    "respectful", "considerate", "thoughtful", "kind", "nice", "polite", "courteous", "gracious",
    "social", "interpersonal", "relational", "communal", "collective", "collaborative", "cooperative",
  ],
};

export interface Profile {
  id: string;
  display_name: string | null;
  email: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string;
  time_of_day: TimeOfDay;
  frequency: HabitFrequency;
  custom_days: number[];
  streak: number;
  is_active: boolean;
  completion_count: number;
  embedding_text: string | null;
  created_at: string;
  updated_at: string;
  completed_today?: boolean;
}

export interface AssignmentGrouping {
  id: string;
  user_id: string;
  name: string;
  course: string;
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: string;
  user_id: string;
  group_id: string | null;
  name: string;
  description: string;
  course: string;
  due_date: string;
  estimated_minutes: number;
  priority: AssignmentPriority;
  status: AssignmentStatus;
  repeats_weekly: boolean;
  completed_at: string | null;
  embedding_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface Recommendation {
  id: string;
  name: string;
  type: TaskType;
  description?: string;
  time_of_day?: TimeOfDay;
  streak?: number;
  course?: string;
  due_date?: string;
  estimated_minutes?: number;
  priority?: AssignmentPriority;
  similarity?: number;
  urgency_score?: number;
  final_score?: number;
  reason?: string;
}

export interface LifeAreaScore {
  area: LifeArea;
  score: number;
  updated_at: string;
}

export interface HabitAreaMapping {
  habit_id: string;
  area: LifeArea;
  relevance: number;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_date: string;
  goals: string[];
  appreciation: string;
  learned: string;
  improve: string;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  theme: Theme;
  pomodoro_work: number;
  pomodoro_break: number;
}

export interface DayOverview {
  date: string;
  dayName: string;
  habits: { total: number; completed: number };
  assignments: Assignment[];
  aiSuggestions: Recommendation[];
}

export interface WeekOverview {
  days: DayOverview[];
}
