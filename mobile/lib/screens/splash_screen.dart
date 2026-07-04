import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'home_screen.dart';
import 'login_screen.dart';
import 'super_admin_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _fade;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
    _fade = CurvedAnimation(parent: _ctrl, curve: Curves.easeIn);
    _ctrl.forward();
    _check();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _check() async {
    await Future.delayed(const Duration(milliseconds: 1500));
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (!mounted) return;
    if (token != null && _isTokenValid(token)) {
      final rol = _getRol(token);
      if (rol == 'SUPER_ADMIN') {
        Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const SuperAdminScreen()));
      } else {
        Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const HomeScreen()));
      }
    } else {
      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const LoginScreen()));
    }
  }

  Map<String, dynamic> _decodeToken(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return {};
      return jsonDecode(utf8.decode(base64Url.decode(base64Url.normalize(parts[1]))));
    } catch (_) { return {}; }
  }

  bool _isTokenValid(String token) {
    try {
      final payload = _decodeToken(token);
      final exp = payload['exp'] as int?;
      if (exp == null) return false;
      return DateTime.fromMillisecondsSinceEpoch(exp * 1000).isAfter(DateTime.now());
    } catch (_) { return false; }
  }

  String _getRol(String token) {
    final payload = _decodeToken(token);
    return payload['rol'] ?? payload['role'] ?? '';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF051908),
      body: FadeTransition(
        opacity: _fade,
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(28),
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF1A6B2A), Color(0xFF2D9E3F)],
                  ),
                  boxShadow: [BoxShadow(color: const Color(0xFF2D9E3F).withOpacity(0.4), blurRadius: 30, spreadRadius: 4)],
                ),
                child: const Center(child: Text('🐄', style: TextStyle(fontSize: 52))),
              ),
              const SizedBox(height: 24),
              const Text('Ganaderos G',
                  style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
              const SizedBox(height: 6),
              Text('Software Ganadero Henriquez',
                  style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 13)),
              const SizedBox(height: 48),
              SizedBox(
                width: 28,
                height: 28,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: const Color(0xFF2D9E3F).withOpacity(0.7),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
