import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'api_client.dart';
import 'auth_provider.dart';
import 'language_provider.dart';
import 'home_screen.dart';
import 'stations_screen.dart';
import 'planner_screen.dart';
import 'fares_screen.dart';
import 'notifications.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeNotifications();
  runApp(const PassengerApp());
}

class PassengerApp extends StatelessWidget {
  const PassengerApp({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ApiClient();
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => LanguageProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider(api)),
        Provider<ApiClient>.value(value: api),
      ],
      child: Consumer<LanguageProvider>(
        builder: (context, lang, _) {
          return Directionality(
            textDirection: lang.textDirection,
            child: MaterialApp(
              title: 'Metro Bus Islamabad',
              debugShowCheckedModeBanner: false,
              theme: ThemeData(
                colorSchemeSeed: const Color(0xFF059669),
                useMaterial3: true,
              ),
              home: const RootShell(),
            ),
          );
        },
      ),
    );
  }
}

class RootShell extends StatefulWidget {
  const RootShell({super.key});

  @override
  State<RootShell> createState() => _RootShellState();
}

class _RootShellState extends State<RootShell> {
  int _index = 0;

  static const _screens = [
    HomeScreen(),
    StationsScreen(),
    PlannerScreen(),
    FaresScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LanguageProvider>();

    return Scaffold(
      body: IndexedStack(index: _index, children: _screens),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: [
          NavigationDestination(icon: const Icon(Icons.home_outlined), selectedIcon: const Icon(Icons.home), label: lang.t('navHome')),
          NavigationDestination(icon: const Icon(Icons.location_on_outlined), selectedIcon: const Icon(Icons.location_on), label: lang.t('navStations')),
          NavigationDestination(icon: const Icon(Icons.alt_route_outlined), selectedIcon: const Icon(Icons.alt_route), label: lang.t('navPlanner')),
          NavigationDestination(icon: const Icon(Icons.payments_outlined), selectedIcon: const Icon(Icons.payments), label: lang.t('navFares')),
        ],
      ),
    );
  }
}
