import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'api_client.dart';
import 'language_provider.dart';
import 'models.dart';
import 'widgets/app_top_bar.dart';

const _flatFarePkr = 30;

class FaresScreen extends StatefulWidget {
  const FaresScreen({super.key});

  @override
  State<FaresScreen> createState() => _FaresScreenState();
}

class _FaresScreenState extends State<FaresScreen> {
  List<BusRoute> _routes = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    context.read<ApiClient>().fetchRoutes().then((routes) {
      if (!mounted) return;
      setState(() {
        _routes = routes;
        _loading = false;
      });
    }).catchError((_) {
      if (mounted) setState(() => _loading = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LanguageProvider>();

    return Scaffold(
      appBar: AppTopBar(title: lang.t('faresTitle')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(lang.t('faresSubtitle'), style: const TextStyle(color: Colors.black54)),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(color: const Color(0xFFD1FAE5), borderRadius: BorderRadius.circular(10)),
                    child: const Icon(Icons.payments, color: Color(0xFF059669)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(lang.t('flatFareLabel'), style: const TextStyle(fontWeight: FontWeight.bold)),
                        Text(lang.t('fareNote'), style: const TextStyle(fontSize: 12, color: Colors.black54)),
                      ],
                    ),
                  ),
                  Text('Rs $_flatFarePkr', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF047857))),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text(lang.t('routesOnNetwork'), style: const TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          if (_loading)
            Center(child: Text(lang.t('loading')))
          else
            ..._routes.map((r) => Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: const CircleAvatar(
                      backgroundColor: Color(0xFFD1FAE5),
                      child: Icon(Icons.directions_bus, color: Color(0xFF059669), size: 18),
                    ),
                    title: Text(r.name),
                    subtitle: r.description != null ? Text(r.description!) : null,
                    trailing: Text('${r.busRoutes.length} ${lang.t('stationsCount')}', style: const TextStyle(fontSize: 12, color: Colors.black54)),
                  ),
                )),
        ],
      ),
    );
  }
}
