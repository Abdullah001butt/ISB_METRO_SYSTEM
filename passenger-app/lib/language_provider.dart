import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'translations.dart';

const String _storageKey = 'metrobus_lang';

class LanguageProvider extends ChangeNotifier {
  String _lang = 'en';
  String get lang => _lang;
  bool get isRtl => _lang == 'ur';
  TextDirection get textDirection => isRtl ? TextDirection.rtl : TextDirection.ltr;

  LanguageProvider() {
    _restore();
  }

  Future<void> _restore() async {
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getString(_storageKey);
    if (stored == 'ur' || stored == 'en') {
      _lang = stored!;
      notifyListeners();
    }
  }

  Future<void> toggle() async {
    _lang = _lang == 'en' ? 'ur' : 'en';
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_storageKey, _lang);
  }

  String t(String key) => translations[key]?[_lang] ?? key;
}
