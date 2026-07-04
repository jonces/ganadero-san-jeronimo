import 'package:flutter/material.dart';
import '../api_client.dart';
import 'inventario_screen.dart';
import 'ventas_screen.dart';
import 'incidentes_screen.dart';
import 'gastos_screen.dart';
import 'documentos_screen.dart';
import 'equipo_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _stats;
  Map<String, dynamic>? _usuario;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final results = await Future.wait([
        ApiClient.get('/ventas/stats'),
        ApiClient.usuarioActual(),
      ]);
      setState(() {
        _stats = results[0] as Map<String, dynamic>;
        _usuario = results[1] as Map<String, dynamic>;
        _loading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString().replaceFirst('Exception: ', ''); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF020F05),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          color: const Color(0xFF2D9E3F),
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: Color(0xFF2D9E3F)))
              : _error != null
                  ? Center(
                      child: Column(mainAxisSize: MainAxisSize.min, children: [
                        const Text('⚠️', style: TextStyle(fontSize: 40)),
                        const SizedBox(height: 12),
                        Text(_error!, style: TextStyle(color: Colors.white.withOpacity(0.5))),
                        const SizedBox(height: 16),
                        ElevatedButton(onPressed: _load, child: const Text('Reintentar')),
                      ]),
                    )
                  : ListView(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                      children: [
                        _header(),
                        const SizedBox(height: 20),
                        _bienvenida(),
                        const SizedBox(height: 16),
                        _animalesGrid(),
                        const SizedBox(height: 16),
                        _ventasCard(),
                        const SizedBox(height: 16),
                        _graficaCard(),
                        const SizedBox(height: 16),
                        _tipoCambioCard(),
                        const SizedBox(height: 20),
                        _seccionTitulo('Módulos del sistema'),
                        const SizedBox(height: 12),
                        _modulo('🐄', 'Inventario Animal', 'Animales · Raza · Fierro · Peso', const Color(0xFF2D9E3F),
                            () => Navigator.push(context, MaterialPageRoute(builder: (_) => const InventarioScreen()))),
                        _modulo('💰', 'Ventas', 'En pie · Por peso · Facturación', const Color(0xFFD69E2E),
                            () => Navigator.push(context, MaterialPageRoute(builder: (_) => const VentasScreen()))),
                        _modulo('🚨', 'Incidentes', 'Accidentes · Enfermedades · Muertes', const Color(0xFFE53E3E),
                            () => Navigator.push(context, MaterialPageRoute(builder: (_) => const IncidentesScreen()))),
                        _modulo('💸', 'Control de Gastos', 'Diario · Semanal · Quincenal · Mensual', const Color(0xFF805AD5),
                            () => Navigator.push(context, MaterialPageRoute(builder: (_) => const GastosScreen()))),
                        _modulo('📄', 'Documentos Legales', 'Fierro anual · Permisos · Cartas', const Color(0xFF3182CE),
                            () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DocumentosScreen()))),
                        _modulo('👥', 'Mi Equipo', 'Administradores · Trabajadores', const Color(0xFF44337A),
                            () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EquipoScreen()))),
                      ],
                    ),
        ),
      ),
    );
  }

  Widget _header() {
    final nombre = _usuario?['nombre'] ?? _usuario?['name'] ?? 'Usuario';
    final rol = _usuario?['rol'] ?? _usuario?['role'] ?? '';
    final rolLabel = rol == 'SUPER_ADMIN' ? 'Super Admin' : rol == 'ADMIN' ? 'Admin' : 'Trabajador';
    final rolColor = rol == 'SUPER_ADMIN' ? const Color(0xFF805AD5) : rol == 'ADMIN' ? const Color(0xFF2D9E3F) : const Color(0xFF3182CE);

    return Row(
      children: [
        Container(
          width: 42, height: 42,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            gradient: const LinearGradient(colors: [Color(0xFF1A6B2A), Color(0xFF2D9E3F)]),
          ),
          child: const Center(child: Text('🐄', style: TextStyle(fontSize: 22))),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Ganadero San Jerónimo',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
              Text('Sistema de gestión ganadera · Nicaragua',
                  style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 11)),
            ],
          ),
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(nombre, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13)),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(color: rolColor.withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
              child: Text(rolLabel, style: TextStyle(color: rolColor, fontSize: 10, fontWeight: FontWeight.w800)),
            ),
          ],
        ),
      ],
    );
  }

  Widget _bienvenida() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [const Color(0xFF1A6B2A).withOpacity(0.6), const Color(0xFF051908).withOpacity(0.8)],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF2D9E3F).withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Bienvenido a', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 13)),
          const Text('Ganadero San Jerónimo',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 22)),
          const SizedBox(height: 4),
          Text('Sistema de gestión ganadera · Nicaragua',
              style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
          const SizedBox(height: 16),
          const Row(
            children: [
              Text('🐄 🐂 🐄 🐃 🐄', style: TextStyle(fontSize: 22, letterSpacing: 4)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _animalesGrid() {
    final a = _stats?['animales'] ?? {};
    final items = [
      ['🐄', 'Total Animales', '${a['total'] ?? 0}', const Color(0xFF2D9E3F)],
      ['🐂', 'Machos', '${a['machos'] ?? 0}', const Color(0xFF3182CE)],
      ['🐄', 'Hembras', '${a['hembras'] ?? 0}', const Color(0xFFD69E2E)],
      ['💰', 'Ventas mes', 'C\$ ${_fmt(_stats?['ventas']?['totalMesNIO'])}', const Color(0xFF38A169)],
    ];
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 1.6,
      children: items.map((it) {
        final color = it[3] as Color;
        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFF051908).withOpacity(0.85),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: color.withOpacity(0.3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(it[0] as String, style: const TextStyle(fontSize: 24)),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(it[2] as String, style: TextStyle(color: color, fontSize: 22, fontWeight: FontWeight.w900)),
                  Text(it[1] as String, style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 11)),
                ],
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _ventasCard() {
    final v = _stats?['ventas'] ?? {};
    final totalNIO = _fmt(v['totalMes'] ?? v['totalMesNIO']);
    final totalGastosNIO = _fmt(_stats?['gastos']?['totalMes']);
    return _glassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Tendencia últimos 6 meses',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
          const SizedBox(height: 8),
          if (_stats?['grafica'] != null) _buildChart(_stats!['grafica'] as List),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _miniStat('C\$ $totalNIO', 'Total ventas', const Color(0xFF2D9E3F))),
              const SizedBox(width: 12),
              Expanded(child: _miniStat('C\$ $totalGastosNIO', 'Total gastos', Colors.red)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _miniStat(String value, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value, style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 16)),
          Text(label, style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 11)),
        ],
      ),
    );
  }

  Widget _tipoCambioCard() {
    final tc = _stats?['tipoCambio'] ?? 36.5;
    return _glassCard(
      child: Row(
        children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(
              color: const Color(0xFFD69E2E).withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFD69E2E).withOpacity(0.4)),
            ),
            child: const Center(child: Text('💱', style: TextStyle(fontSize: 22))),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Tipo de cambio oficial',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 14)),
                Text('Se aplica en todas las ventas',
                    style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 11)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('C\$ ${tc is num ? tc.toStringAsFixed(1) : tc}',
                  style: const TextStyle(color: Color(0xFFD69E2E), fontWeight: FontWeight.w900, fontSize: 22)),
              Text('/ USD', style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 11)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _graficaCard() {
    final grafica = _stats?['grafica'] as List?;
    if (grafica == null || grafica.isEmpty) return const SizedBox.shrink();
    return _glassCard(child: _buildChart(grafica));
  }

  Widget _buildChart(List data) {
    if (data.isEmpty) return const SizedBox.shrink();
    final maxV = data.fold<double>(0, (m, e) {
      final v = (e['ventas'] as num? ?? 0).toDouble();
      final g = (e['gastos'] as num? ?? 0).toDouble();
      return [m, v, g].reduce((a, b) => a > b ? a : b);
    });
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            _leyenda(const Color(0xFF2D9E3F), 'Ventas'),
            const SizedBox(width: 16),
            _leyenda(Colors.red, 'Gastos'),
          ],
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 100,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: data.map<Widget>((m) {
              final v = (m['ventas'] as num? ?? 0).toDouble();
              final g = (m['gastos'] as num? ?? 0).toDouble();
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 3),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Expanded(child: Container(
                            height: maxV > 0 ? (v / maxV * 80).clamp(4, 80) : 4,
                            decoration: BoxDecoration(
                              color: const Color(0xFF2D9E3F),
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(3)),
                            ),
                          )),
                          const SizedBox(width: 2),
                          Expanded(child: Container(
                            height: maxV > 0 ? (g / maxV * 80).clamp(4, 80) : 4,
                            decoration: BoxDecoration(
                              color: Colors.red.withOpacity(0.7),
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(3)),
                            ),
                          )),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 6),
        Row(
          children: data.map<Widget>((m) => Expanded(
            child: Text(m['label'] ?? '', textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 9)),
          )).toList(),
        ),
      ],
    );
  }

  Widget _leyenda(Color color, String label) {
    return Row(children: [
      Container(width: 10, height: 10, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2))),
      const SizedBox(width: 4),
      Text(label, style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 11)),
    ]);
  }

  Widget _seccionTitulo(String t) {
    return Text(t, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16));
  }

  Widget _modulo(String emoji, String titulo, String sub, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
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
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: color.withOpacity(0.4)),
              ),
              child: Center(child: Text(emoji, style: const TextStyle(fontSize: 20))),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(titulo, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 14)),
                  Text(sub, style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 11)),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: Colors.white.withOpacity(0.25)),
          ],
        ),
      ),
    );
  }

  Widget _glassCard({required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF051908).withOpacity(0.85),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: child,
    );
  }

  String _fmt(dynamic n) {
    if (n == null) return '0';
    final num v = n is num ? n : double.tryParse(n.toString()) ?? 0;
    if (v >= 1000000) return '${(v / 1000000).toStringAsFixed(1)}M';
    if (v >= 1000) return '${(v / 1000).toStringAsFixed(1)}K';
    return v.toStringAsFixed(0);
  }
}
