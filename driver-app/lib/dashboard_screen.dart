import 'package:flutter/material.dart';
import 'api_client.dart';
import 'models.dart';
import 'reporting_screen.dart';
import 'login_screen.dart';

class DashboardScreen extends StatelessWidget {
  final ApiClient api;
  final Driver driver;
  const DashboardScreen({super.key, required this.api, required this.driver});

  Future<void> _signOut(BuildContext context) async {
    await api.clearToken();
    if (!context.mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => LoginScreen(api: api)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('My Buses'),
        backgroundColor: const Color(0xFF059669),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => _signOut(context),
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            color: const Color(0xFF059669),
            child: Text(
              'Welcome, ${driver.name}',
              style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600),
            ),
          ),
          Expanded(
            child: driver.buses.isEmpty
                ? const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: Text(
                        'No bus is currently assigned to you. Contact the dispatch admin.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.black54),
                      ),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: driver.buses.length,
                    itemBuilder: (context, index) {
                      final bus = driver.buses[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          leading: const CircleAvatar(
                            backgroundColor: Color(0xFFD1FAE5),
                            child: Icon(Icons.directions_bus, color: Color(0xFF059669)),
                          ),
                          title: Text(bus.busNumber, style: const TextStyle(fontWeight: FontWeight.bold)),
                          subtitle: Text(bus.route?.name ?? 'Unassigned route'),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => ReportingScreen(api: api, bus: bus),
                              ),
                            );
                          },
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
