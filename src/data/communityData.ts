export const BRAND_CONFIG = {
  name: 'NAADANSMASH',
  tagline: 'COME PLAY. CONNECT. REPEAT.',
  location: {
    city: 'Kochi',
    state: 'Kerala',
    country: 'India',
    address: 'Premier Badminton Arenas across Kochi, Kerala'
  },
  contacts: {
    whatsapp: '918304883872',
    whatsappFormatted: '+91 83048 83872',
    instagram: 'naadansmash.co',
    instagramUrl: 'https://instagram.com/naadansmash.co',
    email: 'naadansmash@gmail.com',
  },
  meta: {
    schedule: 'Weekends • Evening times announced per session',
    pastEventsCount: 2,
  }
};

export const TEAM_MEMBERS = [
  {
    id: 'organizer-1',
    name: 'SIVARAM P BABU',
    role: 'Co-Founder & Main Organizer',
    badge: 'Main Organizer',
    badgeType: 'organizer' as const,
    bio: 'An experienced badminton coach and the driving force behind NAADANSMASH. Sivaram coordinates court bookings, balances match rotations, and creates a welcoming meetup environment for players across Kochi.',
    photo: '/images/organizer1.jpeg',
    isPlaceholder: false,
    action: {
      type: 'whatsapp' as const,
      label: 'Chat on WhatsApp',
      href: `https://wa.me/${BRAND_CONFIG.contacts.whatsapp}?text=Hi%20Sivaram!%20I'd%20love%20to%20connect%20about%20NAADANSMASH%20sessions.`,
    }
  },
  {
    id: 'organizer-2',
    name: 'Co-Organizer',
    role: 'Co-Founder & Operations Lead',
    badge: 'Organizer 02',
    badgeType: 'organizer' as const,
    bio: 'Oversees court operations, player hospitality, welcoming newcomers, and logistics. Details and profile photo will be updated shortly.',
    photo: '/images/gallery/team-huddle.jpg',
    isPlaceholder: true,
    placeholderNote: 'Organizer 2 — Details arriving soon',
    action: {
      type: 'reserved' as const,
      label: 'Space Reserved',
    }
  },
  {
    id: 'media-head',
    name: 'MITHRAVINDA',
    role: 'Media Head & Creative Lead',
    badge: 'Media Head',
    badgeType: 'media' as const,
    bio: 'Directs photography, Sunday session reels, and visual storytelling for NAADANSMASH weekend matches across Kochi.',
    photo: '/images/mediahead.jpeg',
    isPlaceholder: false,
    action: {
      type: 'instagram' as const,
      label: 'Follow on Instagram',
      href: BRAND_CONFIG.contacts.instagramUrl,
    }
  }
];

export const ORGANIZERS_DATA = [
  {
    id: 'organizer-1',
    name: 'SIVARAM P BABU',
    role: 'Co-Founder & Main Organizer',
    badge: 'Main Organizer',
    bio: 'An experienced badminton coach and the driving force behind NAADANSMASH. Sivaram coordinates court bookings, balances match rotations, and creates a welcoming meetup environment for players across Kochi.',
    photo: '/images/organizer1.jpeg',
    isPlaceholder: false,
    social: {
      whatsapp: '918304883872',
    }
  },
  {
    id: 'organizer-2',
    name: 'Co-Organizer',
    role: 'Co-Founder & Operations Lead',
    badge: 'Organizer 02',
    bio: 'Oversees court operations, player hospitality, welcoming newcomers, and logistics. Details and profile photo will be updated shortly.',
    photo: '/images/gallery/team-huddle.jpg',
    isPlaceholder: true,
    placeholderNote: 'Organizer 2 — Details arriving soon',
    social: {
      whatsapp: '918304883872',
    }
  }
];

export const MEDIA_HEAD_DATA = {
  id: 'media-head',
  name: 'MITHRAVINDA',
  role: 'Media Head & Creative Lead',
  badge: 'Media Head',
  quote: 'Capturing every smash, court smile, and Sunday badminton memory across Kochi.',
  bio: 'Directs photography, match cinematography, social media storytelling, and community documentation for all NAADANSMASH weekend sessions. Capturing the intensity, smiles, and Kerala badminton culture both on and off the court.',
  photo: '/images/mediahead.jpeg',
  social: {
    instagram: 'https://instagram.com/naadansmash.co',
    whatsapp: '918304883872',
  },
  highlights: [
    'Courtside Match Action Photography',
    'Session Reels & Video Production',
    'Community Highlights & Social Campaigns',
    'Brand & Visual Identity Archiving',
  ]
};

export const CORE_PILLARS = [
  {
    num: '01',
    title: 'PLAY',
    tag: 'ON THE COURT',
    description: 'Crisp rallies, dynamic rotations, and competitive badminton matches structured for all skill levels. From beginners finding their footwork to seasoned players trading smashes, every player gets real court time.',
    details: ['Doubles & Mixed Rotations', 'Social Meetup Atmosphere', 'Quality Indoor Arenas (Location Varies)']
  },
  {
    num: '02',
    title: 'CONNECT',
    tag: 'OFF THE COURT',
    description: 'Badminton is our medium; community is our heartbeat. Step off the court and into conversations with badminton lovers across Kochi over post-game refreshments and shared excitement.',
    details: ['Diverse Member Network', 'Post-Game Refreshments', 'Inclusive & Warm Culture']
  },
  {
    num: '03',
    title: 'REPEAT',
    tag: 'EVERY WEEKEND',
    description: 'Weekend games are our ritual. Scheduled in the evenings to fit busy schedules, giving you the perfect active reset to elevate your week.',
    details: ['Weekend Evening Sessions', 'Balanced Match Rotations', 'Consistency & Fitness Habit']
  }
];

export const COMMUNITY_PILLARS = [
  {
    title: 'Open to All Skill Levels',
    description: 'Whether you haven’t touched a racket since school or play regularly, court rotations are balanced by skill level so you get competitive, engaging games.',
    icon: 'Sparkles'
  },
  {
    title: 'Friendly, Zero-Ego Atmosphere',
    description: 'Warm welcomes, constructive tips, encouraging high-fives, and laughter. We leave egos at the door and bring positivity to every rally.',
    icon: 'Smile'
  },
  {
    title: 'Weekend Evening Sessions',
    description: 'Sessions take place mostly on weekend evenings, with precise times announced in advance for each meetup.',
    icon: 'CalendarCheck'
  },
  {
    title: 'Genuine New Friendships',
    description: 'Kochi badminton enthusiasts finding reliable playing partners, workout buddies, and friends through our weekend games.',
    icon: 'Users'
  },
  {
    title: 'Healthy, High-Vibe Competition',
    description: 'Play hard for every point, dive for retrievals, and smile across the net when the rally ends. Real sportsmanship in action.',
    icon: 'Trophy'
  },
  {
    title: 'Growing Kochi Sports Movement',
    description: 'Reinvigorating grassroots sports culture in Kochi. Making badminton social, accessible, and high-standard.',
    icon: 'TrendingUp'
  }
];

export const SESSION_FLOW = [
  {
    time: 'Warmup',
    title: 'Arrival & Dynamic Warmup',
    desc: 'Stretching, light rallies, and welcoming newcomers to the court.'
  },
  {
    time: 'Rounds',
    title: 'Structured Match Rotations',
    desc: 'Timed doubles rotations coordinated so everyone plays balanced games.'
  },
  {
    time: 'Climax',
    title: 'Power Mini-Tournament',
    desc: 'King of the Court or tiebreakers with high tempo rallies and sideline cheering.'
  },
  {
    time: 'Social',
    title: 'Session Wrap & Community Chai',
    desc: 'Commemorative group photos, cool-down, and connecting over local Kerala tea and snacks.'
  }
];
