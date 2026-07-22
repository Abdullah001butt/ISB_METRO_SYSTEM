typedef LangMap = Map<String, String>;

const Map<String, LangMap> translations = {
  // Nav / brand
  'navHome': {'en': 'Home', 'ur': 'ہوم'},
  'navStations': {'en': 'Stations', 'ur': 'اسٹیشنز'},
  'navPlanner': {'en': 'Trip Planner', 'ur': 'سفری منصوبہ'},
  'navFares': {'en': 'Fares', 'ur': 'کرایہ'},
  'navAbout': {'en': 'About', 'ur': 'تعارف'},
  'brandName': {'en': 'Metro Bus Islamabad', 'ur': 'میٹرو بس اسلام آباد'},

  // Home
  'heroTitle': {'en': 'Track your Metro Bus in real time', 'ur': 'اپنی میٹرو بس کو حقیقی وقت میں ٹریک کریں'},
  'heroSubtitle': {
    'en': 'Live locations, arrival estimates, and route information for the Islamabad Metro Bus network.',
    'ur': 'اسلام آباد میٹرو بس نیٹ ورک کے لیے لائیو مقامات، آمد کا تخمینہ، اور روٹ کی معلومات۔',
  },
  'searchPlaceholder': {'en': 'Search for a station...', 'ur': 'اسٹیشن تلاش کریں...'},
  'liveBusMap': {'en': 'Live Bus Map', 'ur': 'لائیو بس نقشہ'},
  'busesLive': {'en': 'buses live', 'ur': 'بسیں لائیو ہیں'},
  'findNearMe': {'en': 'Find stations near me', 'ur': 'میرے قریب اسٹیشنز تلاش کریں'},
  'locating': {'en': 'Locating...', 'ur': 'مقام تلاش ہو رہا ہے...'},
  'nearestStations': {'en': 'Nearest stations', 'ur': 'قریب ترین اسٹیشنز'},
  'locationDenied': {
    'en': "Couldn't get your location. Please allow location access and try again.",
    'ur': 'آپ کا مقام حاصل نہیں ہو سکا۔ براہ کرم مقام تک رسائی کی اجازت دیں اور دوبارہ کوشش کریں۔',
  },
  'away': {'en': 'away', 'ur': 'دور'},

  // Stations
  'stationsTitle': {'en': 'Stations', 'ur': 'اسٹیشنز'},
  'stationsSubtitle': {'en': 'Browse all metro bus stops, or search by name.', 'ur': 'تمام میٹرو بس اسٹاپس دیکھیں، یا نام سے تلاش کریں۔'},
  'searchStations': {'en': 'Search stations...', 'ur': 'اسٹیشنز تلاش کریں...'},
  'loading': {'en': 'Loading...', 'ur': 'لوڈ ہو رہا ہے...'},
  'noStationsFound': {'en': 'No stations found.', 'ur': 'کوئی اسٹیشن نہیں ملا۔'},
  'favoriteStations': {'en': 'Favorites', 'ur': 'پسندیدہ'},
  'allStations': {'en': 'All Stations', 'ur': 'تمام اسٹیشنز'},

  // Station detail
  'backToStations': {'en': 'Back to stations', 'ur': 'اسٹیشنز کی طرف واپس'},
  'busesServing': {'en': 'buses currently serving this station', 'ur': 'بسیں اس وقت اس اسٹیشن کی خدمت کر رہی ہیں'},
  'busServing': {'en': 'bus currently serving this station', 'ur': 'بس اس وقت اس اسٹیشن کی خدمت کر رہی ہے'},
  'noBusesEnRoute': {'en': 'No buses are currently en route to this station.', 'ur': 'فی الحال کوئی بس اس اسٹیشن کی طرف نہیں آ رہی۔'},
  'etaUnavailable': {'en': 'ETA unavailable', 'ur': 'تخمینی وقت دستیاب نہیں'},
  'aiPrediction': {'en': 'AI prediction', 'ur': 'اے آئی تخمینہ'},
  'estimated': {'en': 'estimated', 'ur': 'تخمینہ'},
  'crowdSuffix': {'en': 'crowd', 'ur': 'ہجوم'},
  'notifyMe': {'en': 'Notify me', 'ur': 'مجھے مطلع کریں'},
  'notifyMeActive': {'en': 'Notifications on', 'ur': 'اطلاعات فعال'},
  'stationNotFound': {'en': 'Station not found', 'ur': 'اسٹیشن نہیں ملا'},
  'minShort': {'en': 'min', 'ur': 'منٹ'},
  'secShort': {'en': 'sec', 'ur': 'سیکنڈ'},

  // Planner
  'plannerTitle': {'en': 'Trip Planner', 'ur': 'سفری منصوبہ'},
  'plannerSubtitle': {
    'en': 'Pick your origin and destination to estimate travel time along the route.',
    'ur': 'روٹ پر سفر کے وقت کا تخمینہ لگانے کے لیے اپنی ابتدائی اور منزل کا انتخاب کریں۔',
  },
  'from': {'en': 'From', 'ur': 'کہاں سے'},
  'to': {'en': 'To', 'ur': 'کہاں تک'},
  'selectStation': {'en': 'Select a station...', 'ur': 'اسٹیشن منتخب کریں...'},
  'noRouteConnects': {
    'en': 'No single route directly connects these two stations yet.',
    'ur': 'ابھی تک کوئی ایک روٹ ان دونوں اسٹیشنز کو براہ راست نہیں جوڑتا۔',
  },
  'selectToSeeEstimate': {
    'en': 'Select an origin and destination to see the estimate.',
    'ur': 'تخمینہ دیکھنے کے لیے ابتدائی اور منزل کا انتخاب کریں۔',
  },

  // Fares & Routes
  'faresTitle': {'en': 'Fares & Routes', 'ur': 'کرایہ اور روٹس'},
  'faresSubtitle': {
    'en': 'A flat fare applies across the entire network, regardless of distance travelled.',
    'ur': 'پورے نیٹ ورک پر ایک ہی کرایہ لاگو ہوتا ہے، طے شدہ فاصلے سے قطع نظر۔',
  },
  'flatFareLabel': {'en': 'Flat fare per journey', 'ur': 'فی سفر یکساں کرایہ'},
  'fareNote': {
    'en': 'Pay by card at the station gate, or with cash on board. Children under 5 ride free.',
    'ur': 'اسٹیشن گیٹ پر کارڈ سے یا بس میں نقد ادائیگی کریں۔ 5 سال سے کم عمر بچوں کے لیے مفت سفر۔',
  },
  'routesOnNetwork': {'en': 'Routes on this network', 'ur': 'اس نیٹ ورک پر روٹس'},
  'stationsCount': {'en': 'stations', 'ur': 'اسٹیشنز'},

  // About
  'aboutTitle': {'en': 'About This Project', 'ur': 'اس منصوبے کے بارے میں'},
  'aboutP1': {
    'en': 'The Islamabad Metro Bus AI Information System is a prototype transportation platform that layers real-time tracking, predictive analytics, and passenger information on top of the existing Metro Bus network.',
    'ur': 'اسلام آباد میٹرو بس اے آئی انفارمیشن سسٹم ایک پروٹو ٹائپ ٹرانسپورٹیشن پلیٹ فارم ہے جو موجودہ میٹرو بس نیٹ ورک پر ریئل ٹائم ٹریکنگ، پیشن گوئی کا تجزیہ، اور مسافروں کی معلومات فراہم کرتا ہے۔',
  },
  'aboutP2': {
    'en': 'This is a functional prototype: GPS, buses, and drivers are simulated alongside real driver-app data. No production-scale hosting is used.',
    'ur': 'یہ ایک فعال پروٹو ٹائپ ہے: جی پی ایس، بسیں، اور ڈرائیورز سمیولیٹ کیے گئے ہیں۔ کوئی پروڈکشن سطح کی ہوسٹنگ استعمال نہیں کی جاتی۔',
  },

  // Auth
  'signIn': {'en': 'Sign In', 'ur': 'سائن ان'},
  'signUp': {'en': 'Sign Up', 'ur': 'سائن اپ'},
  'signOut': {'en': 'Sign Out', 'ur': 'سائن آؤٹ'},
  'continueAsGuest': {'en': 'Continue as Guest', 'ur': 'مہمان کے طور پر جاری رکھیں'},
  'name': {'en': 'Name', 'ur': 'نام'},
  'email': {'en': 'Email', 'ur': 'ای میل'},
  'password': {'en': 'Password', 'ur': 'پاس ورڈ'},
  'noAccountYet': {'en': "Don't have an account? Sign up", 'ur': 'اکاؤنٹ نہیں ہے؟ سائن اپ کریں'},
  'alreadyHaveAccount': {'en': 'Already have an account? Sign in', 'ur': 'پہلے سے اکاؤنٹ ہے؟ سائن ان کریں'},
  'guestFavoritesNote': {
    'en': 'Sign in to sync your favorite stations across devices.',
    'ur': 'اپنے پسندیدہ اسٹیشنز کو آلات کے درمیان ہم آہنگ کرنے کے لیے سائن ان کریں۔',
  },
  'account': {'en': 'Account', 'ur': 'اکاؤنٹ'},
  'guestMode': {'en': 'Guest', 'ur': 'مہمان'},
};

String t(String key, String lang) {
  return translations[key]?[lang] ?? key;
}
