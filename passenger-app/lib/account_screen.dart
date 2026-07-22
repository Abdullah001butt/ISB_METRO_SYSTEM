import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'auth_provider.dart';
import 'language_provider.dart';

class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key});

  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  bool _showRegister = false;
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit(AuthProvider auth) async {
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      if (_showRegister) {
        await auth.register(_nameController.text.trim(), _emailController.text.trim(), _passwordController.text);
      } else {
        await auth.login(_emailController.text.trim(), _passwordController.text);
      }
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('ApiException: ', ''));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LanguageProvider>();
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Text(lang.t('account')),
        backgroundColor: const Color(0xFF059669),
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: auth.isLoggedIn ? _buildLoggedIn(lang, auth) : _buildLoggedOut(lang, auth),
      ),
    );
  }

  Widget _buildLoggedIn(LanguageProvider lang, AuthProvider auth) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(auth.passenger!.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(auth.passenger!.email, style: const TextStyle(color: Colors.black54)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),
        ElevatedButton.icon(
          onPressed: () async {
            await auth.logout();
            if (mounted) Navigator.of(context).pop();
          },
          icon: const Icon(Icons.logout),
          label: Text(lang.t('signOut')),
          style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent, foregroundColor: Colors.white),
        ),
      ],
    );
  }

  Widget _buildLoggedOut(LanguageProvider lang, AuthProvider auth) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            lang.t('guestFavoritesNote'),
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.black54),
          ),
          const SizedBox(height: 20),
          if (_showRegister)
            TextField(
              controller: _nameController,
              decoration: InputDecoration(labelText: lang.t('name'), border: const OutlineInputBorder()),
            ),
          if (_showRegister) const SizedBox(height: 12),
          TextField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            decoration: InputDecoration(labelText: lang.t('email'), border: const OutlineInputBorder()),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _passwordController,
            obscureText: true,
            decoration: InputDecoration(labelText: lang.t('password'), border: const OutlineInputBorder()),
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: Colors.red)),
          ],
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _submitting ? null : () => _submit(auth),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF059669), foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 14)),
            child: _submitting
                ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : Text(_showRegister ? lang.t('signUp') : lang.t('signIn')),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => setState(() => _showRegister = !_showRegister),
            child: Text(_showRegister ? lang.t('alreadyHaveAccount') : lang.t('noAccountYet')),
          ),
          const SizedBox(height: 8),
          OutlinedButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(lang.t('continueAsGuest')),
          ),
        ],
      ),
    );
  }
}
