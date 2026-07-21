import 'package:flutter/material.dart';
import 'api_client.dart';
import 'login_screen.dart';
import 'dashboard_screen.dart';

void main() {
  runApp(const DriverApp());
}

class DriverApp extends StatelessWidget {
  const DriverApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Metro Bus Driver',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: const Color(0xFF059669),
        useMaterial3: true,
      ),
      home: SplashGate(api: ApiClient()),
    );
  }
}

class SplashGate extends StatefulWidget {
  final ApiClient api;
  const SplashGate({super.key, required this.api});

  @override
  State<SplashGate> createState() => _SplashGateState();
}

class _SplashGateState extends State<SplashGate> {
  @override
  void initState() {
    super.initState();
    _resume();
  }

  Future<void> _resume() async {
    final hasToken = await widget.api.hasToken();
    if (!hasToken) {
      _goToLogin();
      return;
    }
    try {
      final driver = await widget.api.me();
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => DashboardScreen(api: widget.api, driver: driver),
        ),
      );
    } catch (_) {
      await widget.api.clearToken();
      _goToLogin();
    }
  }

  void _goToLogin() {
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => LoginScreen(api: widget.api)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }
}
