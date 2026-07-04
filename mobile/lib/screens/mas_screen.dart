import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../api_client.dart';
import 'gastos_screen.dart';
import 'documentos_screen.dart';
import 'equipo_screen.dart';
import 'anuncios_screen.dart';
import 'actividad_screen.dart';
import 'perfil_screen.dart';
import 'login_screen.dart';

// Secciones adicionales — el equivalente del menu lateral de la web.
class MasScreen extends StatelessWidget {
  const MasScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final items = [
      _Item('💸', 'Gastos', 'Control de gastos de la finca', const Color(0xFF805AD5), (ctx) => const GastosScreen()),
      _Item('📄', 'Docs', 'Documentos legales y permisos', const Color(0xFF3182CE), (ctx) => const DocumentosScreen()),
      _Item('👥', 'Equipo', 'Administradores y trabajadores', const Color(0xFF44337A), (ctx) => const EquipoScreen()),
      _Item('📣', 'Tablón', 'Anuncios y comentarios del equipo', const Color(0xFF2D9E3F), (ctx) => const AnunciosScreen()),
      _Item('📋', 'Actividad', 'Historial de acciones del sistema', const Color(0xFF10B981), (ctx) => const ActividadScreen()),
      _Item('👤', 'Perfil', 'Tu cuenta, nombre y contraseña', const Color(0xFFD69E2E), (ctx) => const PerfilScreen()),
    ];

    return Scaffold(
      backgroundColor: const Color(0xFF020F05),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
          children: [
            const Text('☰ Más', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900)),
            const SizedBox(height: 4),
            Text('Todas las secciones de tu finca', style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 12)),
            const SizedBox(height: 16),
            ...items.map((it) => _tile(context, it)),
            // Reportes PDF: se generan en la web
            GestureDetector(
              onTap: () => launchUrl(Uri.parse('https://www.ganaderosg.app/reportes'), mode: LaunchMode.externalApplication),
              child: _tileBase(
                '📊', 'Reportes', 'Descarga los PDF de inventario, ventas y gastos', const Color(0xFF1A4A8A),
                trailing: Icon(Icons.open_in_new, color: Colors.white.withOpacity(0.3), size: 18),
              ),
            ),
            const SizedBox(height: 18),
            GestureDetector(
              onTap: () async {
                await ApiClient.logout();
                if (context.mounted) {
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(builder: (_) => const LoginScreen()),
                    (route) => false,
                  );
                }
              },
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  color: const Color(0xFFE53E3E).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE53E3E).withOpacity(0.4)),
                ),
                child: const Center(
                  child: Text('🚪 Cerrar sesión', style: TextStyle(color: Color(0xFFFC8181), fontWeight: FontWeight.w800, fontSize: 14)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _tile(BuildContext context, _Item it) {
    return GestureDetector(
      onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: it.builder)),
      child: _tileBase(it.emoji, it.titulo, it.sub, it.color,
          trailing: Icon(Icons.chevron_right, color: Colors.white.withOpacity(0.25))),
    );
  }

  Widget _tileBase(String emoji, String titulo, String sub, Color color, {Widget? trailing}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF051908).withOpacity(0.85),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Row(
        children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(
              color: color.withOpacity(0.2),
              borderRadius: BorderRadius.circular(13),
              border: Border.all(color: color.withOpacity(0.45)),
            ),
            child: Center(child: Text(emoji, style: const TextStyle(fontSize: 20))),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(titulo, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
                Text(sub, style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 11)),
              ],
            ),
          ),
          if (trailing != null) trailing,
        ],
      ),
    );
  }
}

class _Item {
  final String emoji, titulo, sub;
  final Color color;
  final Widget Function(BuildContext) builder;
  _Item(this.emoji, this.titulo, this.sub, this.color, this.builder);
}
