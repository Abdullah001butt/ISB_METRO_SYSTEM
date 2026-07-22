import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'api_client.dart';
import 'auth_provider.dart';
import 'language_provider.dart';
import 'models.dart';
import 'station_detail_screen.dart';
import 'widgets/app_top_bar.dart';

class StationsScreen extends StatefulWidget {
  const StationsScreen({super.key});

  @override
  State<StationsScreen> createState() => _StationsScreenState();
}

class _StationsScreenState extends State<StationsScreen> {
  List<Station> _stations = [];
  bool _loading = true;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final stations = await context.read<ApiClient>().fetchStations();
      if (!mounted) return;
      setState(() {
        _stations = stations;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LanguageProvider>();
    final auth = context.watch<AuthProvider>();

    final filtered = _query.isEmpty
        ? _stations
        : _stations.where((s) => s.name.toLowerCase().contains(_query.toLowerCase())).toList();
    final favorites = filtered.where((s) => auth.isFavorite(s.id)).toList();
    final others = filtered.where((s) => !auth.isFavorite(s.id)).toList();

    return Scaffold(
      appBar: AppTopBar(title: lang.t('stationsTitle')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              onChanged: (v) => setState(() => _query = v),
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.search),
                hintText: lang.t('searchStations'),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
          Expanded(
            child: _loading
                ? Center(child: Text(lang.t('loading')))
                : filtered.isEmpty
                    ? Center(child: Text(lang.t('noStationsFound')))
                    : ListView(
                        children: [
                          if (favorites.isNotEmpty) ...[
                            _sectionLabel(lang.t('favoriteStations')),
                            ...favorites.map((s) => _stationTile(s, auth, context)),
                          ],
                          if (favorites.isNotEmpty) _sectionLabel(lang.t('allStations')),
                          ...others.map((s) => _stationTile(s, auth, context)),
                        ],
                      ),
          ),
        ],
      ),
    );
  }

  Widget _sectionLabel(String text) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: Text(text, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black54)),
    );
  }

  Widget _stationTile(Station s, AuthProvider auth, BuildContext context) {
    final isFav = auth.isFavorite(s.id);
    return ListTile(
      leading: const CircleAvatar(
        backgroundColor: Color(0xFFD1FAE5),
        child: Icon(Icons.location_on, color: Color(0xFF059669), size: 18),
      ),
      title: Text(s.name),
      trailing: IconButton(
        icon: Icon(isFav ? Icons.star : Icons.star_border, color: isFav ? Colors.amber : Colors.black38),
        onPressed: () => auth.toggleFavorite(s.id),
      ),
      onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => StationDetailScreen(station: s))),
    );
  }
}
