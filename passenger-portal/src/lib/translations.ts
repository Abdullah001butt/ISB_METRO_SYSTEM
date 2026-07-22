export type Lang = "en" | "ur";

export const translations = {
  // Header
  navHome: { en: "Home", ur: "ہوم" },
  navStations: { en: "Stations", ur: "اسٹیشنز" },
  navPlanner: { en: "Trip Planner", ur: "سفری منصوبہ" },
  navAbout: { en: "About", ur: "تعارف" },
  navFares: { en: "Fares", ur: "کرایہ" },
  brandName: { en: "Metro Bus Islamabad", ur: "میٹرو بس اسلام آباد" },

  // Footer
  footerText: {
    en: "Islamabad Metro Bus AI Information System — Prototype. Live data is simulated for demonstration purposes.",
    ur: "اسلام آباد میٹرو بس اے آئی انفارمیشن سسٹم — پروٹو ٹائپ۔ لائیو ڈیٹا مظاہرے کے مقاصد کے لیے سمیولیٹ کیا گیا ہے۔",
  },

  // Home
  heroTitle: { en: "Track your Metro Bus in real time", ur: "اپنی میٹرو بس کو حقیقی وقت میں ٹریک کریں" },
  heroSubtitle: {
    en: "Live locations, arrival estimates, and route information for the Islamabad Metro Bus network — no login required.",
    ur: "اسلام آباد میٹرو بس نیٹ ورک کے لیے لائیو مقامات، آمد کا تخمینہ، اور روٹ کی معلومات — لاگ ان کی ضرورت نہیں۔",
  },
  searchPlaceholder: { en: "Search for a station...", ur: "اسٹیشن تلاش کریں..." },
  liveBusMap: { en: "Live Bus Map", ur: "لائیو بس نقشہ" },
  realTime: { en: "Real-time", ur: "حقیقی وقت" },
  polling: { en: "Polling", ur: "پولنگ" },
  busesLive: { en: "buses live", ur: "بسیں لائیو ہیں" },
  findNearMe: { en: "Find stations near me", ur: "میرے قریب اسٹیشنز تلاش کریں" },
  locating: { en: "Locating...", ur: "مقام تلاش ہو رہا ہے..." },
  nearestStations: { en: "Nearest stations", ur: "قریب ترین اسٹیشنز" },
  locationDenied: {
    en: "Couldn't get your location. Please allow location access and try again.",
    ur: "آپ کا مقام حاصل نہیں ہو سکا۔ براہ کرم مقام تک رسائی کی اجازت دیں اور دوبارہ کوشش کریں۔",
  },
  away: { en: "away", ur: "دور" },

  // Stations
  stationsTitle: { en: "Stations", ur: "اسٹیشنز" },
  stationsSubtitle: { en: "Browse all metro bus stops, or search by name.", ur: "تمام میٹرو بس اسٹاپس دیکھیں، یا نام سے تلاش کریں۔" },
  searchStations: { en: "Search stations...", ur: "اسٹیشنز تلاش کریں..." },
  loading: { en: "Loading...", ur: "لوڈ ہو رہا ہے..." },
  noStationsFound: { en: "No stations found.", ur: "کوئی اسٹیشن نہیں ملا۔" },
  favoriteStations: { en: "Favorites", ur: "پسندیدہ" },
  allStations: { en: "All Stations", ur: "تمام اسٹیشنز" },

  // Station detail
  backToStations: { en: "Back to stations", ur: "اسٹیشنز کی طرف واپس" },
  busesServing: { en: "buses currently serving this station", ur: "بسیں اس وقت اس اسٹیشن کی خدمت کر رہی ہیں" },
  busServing: { en: "bus currently serving this station", ur: "بس اس وقت اس اسٹیشن کی خدمت کر رہی ہے" },
  noBusesEnRoute: { en: "No buses are currently en route to this station.", ur: "فی الحال کوئی بس اس اسٹیشن کی طرف نہیں آ رہی۔" },
  etaUnavailable: { en: "ETA unavailable", ur: "تخمینی وقت دستیاب نہیں" },
  aiPrediction: { en: "AI prediction", ur: "اے آئی تخمینہ" },
  estimated: { en: "estimated", ur: "تخمینہ" },
  crowdSuffix: { en: "crowd", ur: "ہجوم" },
  notifyMe: { en: "Notify me", ur: "مجھے مطلع کریں" },
  notifyMeActive: { en: "Notifications on", ur: "اطلاعات فعال" },
  stationNotFound: { en: "Station not found", ur: "اسٹیشن نہیں ملا" },
  minShort: { en: "min", ur: "منٹ" },
  secShort: { en: "sec", ur: "سیکنڈ" },

  // Planner
  plannerTitle: { en: "Trip Planner", ur: "سفری منصوبہ" },
  plannerSubtitle: {
    en: "Pick your origin and destination to estimate travel time along the route.",
    ur: "روٹ پر سفر کے وقت کا تخمینہ لگانے کے لیے اپنی ابتدائی اور منزل کا انتخاب کریں۔",
  },
  from: { en: "From", ur: "کہاں سے" },
  to: { en: "To", ur: "کہاں تک" },
  selectStation: { en: "Select a station...", ur: "اسٹیشن منتخب کریں..." },
  loadingRoutes: { en: "Loading routes...", ur: "روٹس لوڈ ہو رہے ہیں..." },
  noRouteConnects: {
    en: "No single route directly connects these two stations yet.",
    ur: "ابھی تک کوئی ایک روٹ ان دونوں اسٹیشنز کو براہ راست نہیں جوڑتا۔",
  },
  selectToSeeEstimate: {
    en: "Select an origin and destination to see the estimate.",
    ur: "تخمینہ دیکھنے کے لیے ابتدائی اور منزل کا انتخاب کریں۔",
  },

  // About
  aboutTitle: { en: "About This Project", ur: "اس منصوبے کے بارے میں" },
  aboutP1: {
    en: "The Islamabad Metro Bus AI Information System is a prototype transportation platform that layers real-time tracking, predictive analytics, and passenger information on top of the existing Metro Bus network. This portal is the public-facing passenger experience — no registration required.",
    ur: "اسلام آباد میٹرو بس اے آئی انفارمیشن سسٹم ایک پروٹو ٹائپ ٹرانسپورٹیشن پلیٹ فارم ہے جو موجودہ میٹرو بس نیٹ ورک پر ریئل ٹائم ٹریکنگ، پیشن گوئی کا تجزیہ، اور مسافروں کی معلومات فراہم کرتا ہے۔ یہ پورٹل عوامی مسافر تجربہ ہے — رجسٹریشن کی ضرورت نہیں۔",
  },
  aboutP2: {
    en: "This is a functional prototype: GPS, buses, and drivers are simulated. No real hardware, live traffic data, or production-scale hosting is used.",
    ur: "یہ ایک فعال پروٹو ٹائپ ہے: جی پی ایس، بسیں، اور ڈرائیورز سمیولیٹ کیے گئے ہیں۔ کوئی حقیقی ہارڈویئر، لائیو ٹریفک ڈیٹا، یا پروڈکشن سطح کی ہوسٹنگ استعمال نہیں کی جاتی۔",
  },
  featLiveTitle: { en: "Live Tracking", ur: "لائیو ٹریکنگ" },
  featLiveDesc: { en: "See simulated bus positions update in real time across the network.", ur: "نیٹ ورک بھر میں سمیولیٹڈ بس کے مقامات کو حقیقی وقت میں اپ ڈیٹ ہوتے دیکھیں۔" },
  featAiTitle: { en: "AI-Powered ETAs", ur: "اے آئی سے چلنے والے تخمینے" },
  featAiDesc: { en: "Arrival estimates blend live GPS data with predictions from the AI module.", ur: "آمد کے تخمینے لائیو جی پی ایس ڈیٹا کو اے آئی ماڈیول کی پیش گوئیوں کے ساتھ ملاتے ہیں۔" },
  featRouteTitle: { en: "Route Information", ur: "روٹ کی معلومات" },
  featRouteDesc: { en: "Browse routes, ordered station sequences, and which buses serve each stop.", ur: "روٹس، اسٹیشنز کی ترتیب، اور ہر اسٹاپ پر کون سی بسیں خدمت دیتی ہیں دیکھیں۔" },
  featNoLoginTitle: { en: "No Login Required", ur: "لاگ ان کی ضرورت نہیں" },
  featNoLoginDesc: {
    en: "Built for quick access — at a stop, on a phone, or on a station display screen.",
    ur: "فوری رسائی کے لیے بنایا گیا — اسٹاپ پر، فون پر، یا اسٹیشن کی ڈسپلے اسکرین پر۔",
  },

  // Fares & Routes
  faresTitle: { en: "Fares & Routes", ur: "کرایہ اور روٹس" },
  faresSubtitle: {
    en: "A flat fare applies across the entire network, regardless of distance travelled.",
    ur: "پورے نیٹ ورک پر ایک ہی کرایہ لاگو ہوتا ہے، طے شدہ فاصلے سے قطع نظر۔",
  },
  flatFareLabel: { en: "Flat fare per journey", ur: "فی سفر یکساں کرایہ" },
  fareNote: {
    en: "Pay by card at the station gate, or with cash on board. Children under 5 ride free.",
    ur: "اسٹیشن گیٹ پر کارڈ سے یا بس میں نقد ادائیگی کریں۔ 5 سال سے کم عمر بچوں کے لیے مفت سفر۔",
  },
  routesOnNetwork: { en: "Routes on this network", ur: "اس نیٹ ورک پر روٹس" },
  stationsCount: { en: "stations", ur: "اسٹیشنز" },
} as const;

export type TranslationKey = keyof typeof translations;
