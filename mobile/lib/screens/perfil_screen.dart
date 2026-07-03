import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../api_client.dart';
import 'login_screen.dart';

class PerfilScreen extends StatefulWidget {
  const PerfilScreen({super.key});

  @override
  State<PerfilScreen> createState() => _PerfilScreenState();
}

class _PerfilScreenState extends State<PerfilScreen> {
  Map<String, dynamic>? _perfil;
  bool _loading = true;
  final _nombreCtrl = TextEditingController();
  final _passActualCtrl = TextEditingController();
  final _passNuevaCtrl = TextEditingController();
  final _passConfirmCtrl = TextEditingController();
  bool _showPass = false;
  String? _msgNombre;
  String? _msgPass;
  bool _guardandoNombre = false;
  bool _guardandoPass = false;
  bool _subiendoFoto = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _nombreCtrl.dispose();
    _passActualCtrl.dispose();
    _passNuevaCtrl.dispose();
    _passConfirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final data = await ApiClient.get('/usuarios/perfil');
      setState(() {
        _perfil = data;
        _nombreCtrl.text = data['nombre'] ?? '';
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _subirFoto() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (picked == null) return;
    setState(() => _subiendoFoto = true);
    try {
      final result = await ApiClient.patchMultipart('/usuarios/perfil/foto', File(picked.path), 'foto');
      setState(() => _perfil = {..._perfil!, 'fotoPerfil': result['fotoPerfil']});
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString().replaceFirst('Exception: ', '')}'), backgroundColor: Colors.red[800]));
    } finally {
      if (mounted) setState(() => _subiendoFoto = false);
    }
  }

  Future<void> _guardarNombre() async {
    if (_nombreCtrl.text.trim().isEmpty) return;
    setState(() { _guardandoNombre = true; _msgNombre = null; });
    try {
      await ApiClient.patch('/usuarios/perfil', {'nombre': _nombreCtrl.text.trim()});
      setState(() { _msgNombre = '✅ Nombre actualizado'; _perfil = {..._perfil!, 'nombre': _nombreCtrl.text.trim()}; });
    } catch (e) {
      setState(() => _msgNombre = '❌ ${e.toString().replaceFirst('Exception: ', '')}');
    } finally {
      setState(() => _guardandoNombre = false);
    }
  }

  Future<void> _cambiarPassword() async {
    if (_passNuevaCtrl.text != _passConfirmCtrl.text) {
      setState(() => _msgPass = '❌ Las contraseñas no coinciden');
      return;
    }
    if (_passNuevaCtrl.text.length < 6) {
      setState(() => _msgPass = '❌ Mínimo 6 caracteres');
      return;
    }
    setState(() { _guardandoPass = true; _msgPass = null; });
    try {
      await ApiClient.patch('/usuarios/perfil/password', {
        'passwordActual': _passActualCtrl.text,
        'nuevaPassword': _passNuevaCtrl.text,
      });
      setState(() => _msgPass = '✅ Contraseña cambiada');
      _passActualCtrl.clear(); _passNuevaCtrl.clear(); _passConfirmCtrl.clear();
    } catch (e) {
      setState(() => _msgPass = '❌ ${e.toString().replaceFirst('Exception: ', '')}');
    } finally {
      setState(() => _guardandoPass = false);
    }
  }

  Future<void> _logout() async {
    await ApiClient.logout();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()), (_) => false);
  }

  Color _roleColor(String? r) {
    switch (r) {
      case 'ADMIN': return const Color(0xFF4ADE80);
      case 'SUPER_ADMIN': return const Color(0xFFC084FC);
      default: return const Color(0xFF60A5FA);
    }
  }

  String _roleLabel(String? r) {
    switch (r) {
      case 'ADMIN': return 'Administrador';
      case 'SUPER_ADMIN': return 'Super Admin';
      default: return 'Trabajador';
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(backgroundColor: Color(0xFF020F05),
        body: Center(child: CircularProgressIndicator(color: Color(0xFF2D9E3F))));

    final role = _perfil?['role'] as String?;
    final foto = _perfil?['fotoPerfil'] as String?;
    final inicial = (_perfil?['nombre'] as String? ?? 'U')[0].toUpperCase();

    return Scaffold(
      backgroundColor: const Color(0xFF020F05),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const Text('👤 Mi Perfil', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900)),
            const SizedBox(height: 24),

            // Avatar
            Center(
              child: Stack(
                children: [
                  GestureDetector(
                    onTap: _subirFoto,
                    child: Container(
                      width: 90, height: 90,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: _roleColor(role).withOpacity(0.2),
                        border: Border.all(color: _roleColor(role), width: 2),
                      ),
                      child: ClipOval(
                        child: foto != null
                            ? CachedNetworkImage(imageUrl: foto, fit: BoxFit.cover)
                            : Center(child: Text(inicial, style: TextStyle(color: _roleColor(role), fontSize: 36, fontWeight: FontWeight.w900))),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 0, right: 0,
                    child: GestureDetector(
                      onTap: _subirFoto,
                      child: Container(
                        width: 28, height: 28,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(colors: [Color(0xFF1A6B2A), Color(0xFF2D9E3F)]),
                          shape: BoxShape.circle,
                          border: Border.all(color: const Color(0xFF020F05), width: 2),
                        ),
                        child: _subiendoFoto
                            ? const Padding(padding: EdgeInsets.all(6), child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Icon(Icons.camera_alt, color: Colors.white, size: 14),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Center(child: Text(_perfil?['nombre'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800))),
            const SizedBox(height: 4),
            Center(child: Text(_perfil?['email'] ?? '', style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 13))),
            const SizedBox(height: 8),
            Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                decoration: BoxDecoration(
                  color: _roleColor(role).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: _roleColor(role).withOpacity(0.5)),
                ),
                child: Text(_roleLabel(role), style: TextStyle(color: _roleColor(role), fontWeight: FontWeight.w700, fontSize: 12)),
              ),
            ),
            const SizedBox(height: 28),

            // Cambiar nombre
            _section('✏️ Cambiar nombre', [
              TextField(controller: _nombreCtrl, style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(labelText: 'Nombre completo')),
              const SizedBox(height: 12),
              if (_msgNombre != null) Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(_msgNombre!, style: TextStyle(
                    color: _msgNombre!.startsWith('✅') ? const Color(0xFF4ADE80) : const Color(0xFFFC8181), fontSize: 13)),
              ),
              ElevatedButton(
                onPressed: _guardandoNombre ? null : _guardarNombre,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2D9E3F),
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(46),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(_guardandoNombre ? 'Guardando...' : 'Guardar nombre', style: const TextStyle(fontWeight: FontWeight.w800)),
              ),
            ]),
            const SizedBox(height: 16),

            // Cambiar contraseña
            _section('🔐 Cambiar contraseña', [
              _passField(_passActualCtrl, 'Contraseña actual'),
              const SizedBox(height: 10),
              _passField(_passNuevaCtrl, 'Nueva contraseña'),
              const SizedBox(height: 10),
              _passField(_passConfirmCtrl, 'Confirmar contraseña', suffix: IconButton(
                onPressed: () => setState(() => _showPass = !_showPass),
                icon: Icon(_showPass ? Icons.visibility_off_outlined : Icons.visibility_outlined, color: Colors.white38),
              )),
              const SizedBox(height: 12),
              if (_msgPass != null) Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(_msgPass!, style: TextStyle(
                    color: _msgPass!.startsWith('✅') ? const Color(0xFF4ADE80) : const Color(0xFFFC8181), fontSize: 13)),
              ),
              ElevatedButton(
                onPressed: _guardandoPass ? null : _cambiarPassword,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6B46C1),
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(46),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(_guardandoPass ? 'Cambiando...' : 'Cambiar contraseña', style: const TextStyle(fontWeight: FontWeight.w800)),
              ),
            ]),
            const SizedBox(height: 24),

            // Cerrar sesión
            OutlinedButton.icon(
              onPressed: _logout,
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.red[400],
                side: BorderSide(color: Colors.red.withOpacity(0.3)),
                minimumSize: const Size.fromHeight(48),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              icon: const Icon(Icons.logout),
              label: const Text('Cerrar sesión', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
            const SizedBox(height: 20),
            Center(child: Text('© 2026 Software Ganadero Henriquez',
                style: TextStyle(color: Colors.white.withOpacity(0.15), fontSize: 11))),
          ],
        ),
      ),
    );
  }

  Widget _section(String title, List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF051908).withOpacity(0.85),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
          const SizedBox(height: 14),
          ...children,
        ],
      ),
    );
  }

  Widget _passField(TextEditingController ctrl, String label, {Widget? suffix}) {
    return TextField(
      controller: ctrl,
      obscureText: !_showPass,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(labelText: label, suffixIcon: suffix),
    );
  }
}
