import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';
import 'models.dart';

const String _guestFavoritesKey = 'guest_favorite_station_ids';

class AuthProvider extends ChangeNotifier {
  final ApiClient api;
  Passenger? _passenger;
  bool _loading = true;
  Set<String> _guestFavoriteIds = {};
  Set<String> _syncedFavoriteIds = {};

  AuthProvider(this.api) {
    _restore();
  }

  Passenger? get passenger => _passenger;
  bool get isLoggedIn => _passenger != null;
  bool get loading => _loading;
  Set<String> get favoriteStationIds => isLoggedIn ? _syncedFavoriteIds : _guestFavoriteIds;

  Future<void> _restore() async {
    final prefs = await SharedPreferences.getInstance();
    _guestFavoriteIds = (prefs.getStringList(_guestFavoritesKey) ?? []).toSet();

    if (await api.hasToken()) {
      try {
        _passenger = await api.me();
        await _refreshSyncedFavorites();
      } catch (_) {
        await api.clearToken();
        _passenger = null;
      }
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> _refreshSyncedFavorites() async {
    try {
      final stations = await api.fetchFavorites();
      _syncedFavoriteIds = stations.map((s) => s.id).toSet();
    } catch (_) {
      // Leave whatever we had; next toggle will retry.
    }
  }

  Future<void> login(String email, String password) async {
    _passenger = await api.login(email, password);
    await _refreshSyncedFavorites();
    notifyListeners();
  }

  Future<void> register(String name, String email, String password) async {
    _passenger = await api.register(name, email, password);
    await _refreshSyncedFavorites();
    notifyListeners();
  }

  Future<void> logout() async {
    await api.logout();
    await api.clearToken();
    _passenger = null;
    _syncedFavoriteIds = {};
    notifyListeners();
  }

  Future<void> toggleFavorite(String stationId) async {
    if (isLoggedIn) {
      final wasFavorite = _syncedFavoriteIds.contains(stationId);
      if (wasFavorite) {
        _syncedFavoriteIds.remove(stationId);
      } else {
        _syncedFavoriteIds.add(stationId);
      }
      notifyListeners();
      try {
        if (wasFavorite) {
          await api.removeFavorite(stationId);
        } else {
          await api.addFavorite(stationId);
        }
      } catch (_) {
        // Revert on failure.
        if (wasFavorite) {
          _syncedFavoriteIds.add(stationId);
        } else {
          _syncedFavoriteIds.remove(stationId);
        }
        notifyListeners();
      }
    } else {
      if (_guestFavoriteIds.contains(stationId)) {
        _guestFavoriteIds.remove(stationId);
      } else {
        _guestFavoriteIds.add(stationId);
      }
      notifyListeners();
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(_guestFavoritesKey, _guestFavoriteIds.toList());
    }
  }

  bool isFavorite(String stationId) => favoriteStationIds.contains(stationId);
}
