// One entry per app module: the copy for both languages and the demo recording shown in the phone frame.
// Recordings live in public/demos/<id>.{webm,mp4,jpg}; see scripts/demos to re-record them.

export type Locale = 'pl' | 'en';

export interface ModuleCopy {
  /** The module's name as the app shows it on the home screen. */
  name: string;
  /** What the module is, shown above the name when the name alone doesn't say it (e.g. "Garnek"). */
  kicker?: string;
  summary: string;
  /** What the recording shows, for screen readers. */
  videoLabel: string;
  features: string[];
}

export interface Module {
  id: string;
  accent: string;
  bg: string;
  /** Uses AI under the hood; the row gets an "AI" badge. */
  ai: boolean;
  /** Inner markup of a 24x24 stroke icon. */
  icon: string;
  pl: ModuleCopy;
  en: ModuleCopy;
}

export const modules: Module[] = [
  {
    id: 'tasks',
    ai: true,
    accent: '#567866',
    bg: 'rgba(201,235,208,0.35)',
    icon: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    pl: {
      name: 'Zadania',
      summary: 'Zrób zdjęcie kartki z listą spraw, a aplikacja zamieni ją w zadania i sama znajdzie w nich daty, telefony i adresy.',
      videoLabel: 'Nagranie: zdjęcie odręcznej notatki zamienia się w listę zadań z rozpoznaną datą i numerem telefonu.',
      features: [
        'Dodawanie zadań tekstem, ze zdjęcia lub z pliku PDF',
        'AI rozpoznaje daty, telefony, adresy, linki, e-maile i numery kont',
        'Jedno dotknięcie: zadzwoń, napisz SMS, dodaj do Kalendarza Google, otwórz mapę',
        'Edycja, usuwanie i zmiana kolejności przeciąganiem',
        'Widok listy lub siatki, wyszukiwarka',
        'Wysyłanie zadania innym osobom',
        'Zadania na dziś na ekranie głównym',
      ],
    },
    en: {
      name: 'Zadania',
      kicker: 'Tasks',
      summary: 'Take a photo of a to-do note and the app turns it into tasks, finding the dates, phone numbers and addresses in them.',
      videoLabel: 'Recording: a photo of a handwritten note becomes a task list with a detected date and phone number.',
      features: [
        'Add tasks by typing, from a photo or from a PDF',
        'AI detects dates, phone numbers, addresses, links, e-mails and bank account numbers',
        'One tap to call, text, add to Google Calendar or open the map',
        'Edit, delete and reorder by dragging',
        'List or grid view, with search',
        'Send a task to other people',
        "Today's tasks on the home screen",
      ],
    },
  },
  {
    id: 'recipes',
    ai: true,
    accent: '#E2B25F',
    bg: '#fcf4e2',
    icon: '<path d="M15 11h.01"/><path d="M11 15h.01"/><path d="M16 16h.01"/><path d="m2 16 20 6-6-20A20 20 0 0 0 2 16"/><path d="M5.71 17.11a17.04 17.04 0 0 1 11.4-11.4"/>',
    pl: {
      name: 'Garnek',
      kicker: 'Przepisy',
      summary: 'Wklej link do przepisu z dowolnej strony. Aplikacja pobierze go, przetłumaczy na polski i ułoży składniki oraz kroki.',
      videoLabel: 'Nagranie: wklejony link do przepisu zamienia się w uporządkowany przepis po polsku.',
      features: [
        'Dodawanie z linku, z wklejonego tekstu albo na prośbę, np. „coś szybkiego z kurczakiem”',
        'Import przepisu ze zdjęcia lub pliku PDF',
        'AI układa składniki z ilościami i jednostkami oraz kroki przygotowania',
        'Czas przygotowania i gotowania',
        'Siedem kategorii, od śniadań po przetwory',
        'Ręczna edycja każdego przepisu',
        'Wyszukiwarka i link do źródła',
      ],
    },
    en: {
      name: 'Garnek',
      kicker: 'Recipes',
      summary: 'Paste a link to a recipe from any site. The app fetches it and lays out the ingredients and steps in your language.',
      videoLabel: 'Recording: a pasted recipe link becomes a neatly structured recipe.',
      features: [
        'Add from a link, from pasted text or by asking, e.g. "something quick with chicken"',
        'Import a recipe from a photo or a PDF',
        'AI lays out ingredients with amounts and units, and the preparation steps',
        'Prep and cooking time',
        'Seven categories, from breakfasts to preserves',
        'Edit any recipe by hand',
        'Search, and a link back to the source',
      ],
    },
  },
  {
    id: 'shopping',
    ai: true,
    accent: '#8FAC94',
    bg: 'rgba(201,235,208,0.25)',
    icon: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
    pl: {
      name: 'Lista zakupów',
      summary: 'Wpisz kilka produktów naraz. Każdy trafi do właściwej kategorii, tak jak leżą w sklepie.',
      videoLabel: 'Nagranie: wpisane produkty trafiają do kategorii na liście zakupów.',
      features: [
        'Dodawanie wielu produktów jednym wpisem',
        'Dodawanie produktów ze zdjęcia lub z pliku',
        'Automatyczny podział na kategorie',
        'Wyszukiwarka produktów',
        'Wysyłanie listy domownikom',
      ],
    },
    en: {
      name: 'Lista zakupów',
      kicker: 'Shopping list',
      summary: 'Type several products at once. Each one lands in the right category, the way a shop is laid out.',
      videoLabel: 'Recording: typed products are sorted into categories on the shopping list.',
      features: [
        'Add several products in one entry',
        'Add products from a photo or a file',
        'Automatic categories',
        'Product search',
        'Send the list to your household',
      ],
    },
  },
  {
    id: 'weather',
    ai: true,
    accent: '#97B6D4',
    bg: '#eff5fa',
    icon: '<path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/><circle cx="12" cy="12" r="4"/>',
    pl: {
      name: 'Pogoda',
      summary: 'Sprawdź pogodę i od razu zobacz, co dziś założyć. Twoje oceny uczą aplikację, jak odczuwasz temperaturę.',
      videoLabel: 'Nagranie: po wpisaniu miasta pojawia się pogoda i propozycja stroju.',
      features: [
        'Pogoda dla wpisanego miasta lub Twojej lokalizacji',
        'Temperatura rzeczywista i odczuwalna',
        'Propozycja kompletnego stroju z ilustracją postaci',
        'Strój dopasowany do płci',
        'Ocena „za zimno”, „w sam raz”, „za ciepło” poprawia kolejne propozycje',
      ],
    },
    en: {
      name: 'Pogoda',
      kicker: 'Weather and outfit',
      summary: 'Check the weather and see what to wear today. Your ratings teach the app how you feel the temperature.',
      videoLabel: 'Recording: after a city is entered, the weather and an outfit suggestion appear.',
      features: [
        'Weather for any city or your current location',
        'Actual and feels-like temperature',
        'A complete outfit suggestion with an illustrated figure',
        'Outfit matched to gender',
        'Rating "too cold", "just right" or "too warm" improves the next suggestions',
      ],
    },
  },
  {
    id: 'quiz',
    ai: true,
    accent: '#7D5C78',
    bg: '#f6eef2',
    icon: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    pl: {
      name: 'Quiz',
      summary: 'Podaj temat i wiek dziecka, a po chwili masz gotowy quiz. Do nauki, zabawy i sprawdzania wiedzy.',
      videoLabel: 'Nagranie: z wpisanego tematu powstaje quiz, a użytkownik odpowiada na pytanie.',
      features: [
        'Quiz na dowolny temat',
        'Wybór liczby pytań i poziomu, np. „dla dziecka w wieku 10 lat”',
        'Odpowiedź sprawdzana od razu, z możliwością poprawy',
        'Granie ponownie w zapisane quizy',
        'Wyszukiwarka quizów',
      ],
    },
    en: {
      name: 'Quiz',
      summary: "Give a topic and your child's age and a quiz is ready moments later. For learning, play and checking knowledge.",
      videoLabel: 'Recording: a typed topic becomes a quiz and the user answers a question.',
      features: [
        'A quiz on any topic',
        'Choose the number of questions and the level, e.g. "for a 10-year-old"',
        'Answers checked right away, with another try',
        'Replay saved quizzes',
        'Quiz search',
      ],
    },
  },
  {
    id: 'notebook',
    ai: true,
    accent: '#627A6B',
    bg: 'rgba(98,122,107,0.08)',
    icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
    pl: {
      name: 'Teczka',
      kicker: 'Notatki',
      summary: 'Domowe notatki i dokumenty ułożone w strony i podstrony: wakacje, remont, wyniki badań. Z formatowaniem i wyszukiwarką.',
      videoLabel: 'Nagranie: tworzenie nowej strony notatnika z listą punktowaną.',
      features: [
        'Strony i podstrony bez limitu zagnieżdżeń',
        'Pogrubienie, kursywa, podkreślenie, nagłówki, listy i linki',
        'Dodawanie strony ze zdjęcia lub pliku PDF',
        'Przenoszenie stron między działami',
        'Wyszukiwanie w całym notatniku',
        'Licznik słów i status zapisu',
      ],
    },
    en: {
      name: 'Teczka',
      kicker: 'Notes',
      summary: 'Household notes and documents arranged in pages and subpages: holidays, renovation, test results. With formatting and search.',
      videoLabel: 'Recording: creating a new notebook page with a bullet list.',
      features: [
        'Pages and subpages, nested as deep as you need',
        'Bold, italic, underline, headings, lists and links',
        'Add a page from a photo or a PDF',
        'Move pages between sections',
        'Search across the whole notebook',
        'Word count and save status',
      ],
    },
  },
  {
    id: 'timer',
    ai: false,
    accent: '#97472e',
    bg: '#fbf0eb',
    icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    pl: {
      name: 'Timer',
      summary: 'Czas, który widać: klepsydra z piaskiem albo naczynie z wodą pokazują dziecku, ile jeszcze zostało.',
      videoLabel: 'Nagranie: uruchomienie timera z klepsydrą piaskową.',
      features: [
        'Trzy tryby: odliczanie, piasek i woda',
        'Czas od 15 sekund do 2 godzin',
        'Pauza, wznowienie i powtórka',
        'Powiadomienie na koniec',
        'Blokada wygaszania ekranu',
      ],
    },
    en: {
      name: 'Timer',
      summary: 'Time you can see: a sand glass or a vessel of water shows a child how much is left.',
      videoLabel: 'Recording: starting the sand timer.',
      features: [
        'Three modes: countdown, sand and water',
        'From 15 seconds to 2 hours',
        'Pause, resume and repeat',
        'Notification at the end',
        'Keep-screen-on switch',
      ],
    },
  },
];

export const aiBadge: Record<Locale, string> = { pl: 'Wspierane przez AI', en: 'AI-powered' };

export const appWide: Record<Locale, { title: string; items: string[] }> = {
  pl: {
    title: 'W całej aplikacji',
    items: [
      'Ekran główny z modułami, które układasz po swojemu',
      'Zapisane dane dostępne także offline',
      'Powiadomienia o zadaniach',
      'Po polsku i po angielsku',
    ],
  },
  en: {
    title: 'Across the whole app',
    items: [
      'A home screen with modules you arrange your way',
      'Saved data available offline too',
      'Notifications about tasks',
      'In Polish and English',
    ],
  },
};
