import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../auth_provider.dart';
import '../language_provider.dart';
import '../account_screen.dart';

class AppTopBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  const AppTopBar({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LanguageProvider>();
    final auth = context.watch<AuthProvider>();

    return AppBar(
      title: Text(title),
      backgroundColor: const Color(0xFF059669),
      foregroundColor: Colors.white,
      actions: [
        TextButton.icon(
          onPressed: () => lang.toggle(),
          icon: const Icon(Icons.translate, color: Colors.white, size: 18),
          label: Text(
            lang.lang == 'en' ? 'اردو' : 'EN',
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          ),
        ),
        IconButton(
          onPressed: () => Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const AccountScreen()),
          ),
          icon: Icon(auth.isLoggedIn ? Icons.account_circle : Icons.account_circle_outlined),
        ),
      ],
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
