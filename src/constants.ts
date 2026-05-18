import { Film, PenTool, Megaphone } from 'lucide-react';

export const CATEGORIES = [
  {
    id: 1,
    title: 'Video Editing',
    desc: 'Cinematic, YouTube, and short-form social media video editing workflows.',
    gradient: 'from-cyan-400 to-blue-600',
    icon: Film,
    subcategories: [
      { id: 101, title: 'General Video Editing' },
      { id: 102, title: 'Motion Graphics' }
    ]
  },
  {
    id: 2,
    title: 'Graphic Design',
    desc: 'Creative graphic design, logos, borders, and typography.',
    gradient: 'from-purple-500 to-indigo-600',
    icon: PenTool,
    subcategories: [
      { id: 201, title: 'Typography' },
      { id: 202, title: 'Poster Design' },
      { id: 203, title: 'Ad Poster' },
      { id: 204, title: 'General Design' }
    ]
  },
  {
    id: 3,
    title: 'Meta Marketing',
    desc: 'Strategic Facebook & Instagram ad campaigns, tracking, and management.',
    gradient: 'from-orange-400 to-red-500',
    icon: Megaphone,
    subcategories: []
  }
];
