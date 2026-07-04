import 'package:flutter/material.dart';
import '../api_client.dart';
import 'login_screen.dart';

class SuperAdminScreen extends StatefulWidget {
  const SuperAdminScreen({super.key});

  @override
  State<SuperAdminScreen> createState() => _SuperAdminScreenState();
}

class _SuperAdminScreenState extends State<SuperAdminScreen> {
  Map<String, dynamic>? _stats;
  List<dynamic> _fincas = [];
  bool _loading = true;
  String? _error;
  String _busqueda = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final results = await Future.wait([
        ApiClient.get('/superadmin/stats'),
        ApiClient.get('/superadmin/fincas'),
      ]);
      setState(() {
        _stats = results[0] as Map<String, dynamic>;
        _fincas = results[1] as List<dynamic>;
        _loading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString().replaceFirst('Exception: ', ''); _loading = false; });
    }
  }

  Future<void> _toggleFinca(String id) async {
    try {
      await ApiClient.patch('/superadmin/fincas/$id/toggle', {});
      _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('Exception: ', '')), backgroundColor: Colors.red[800]),
      );
    }
  }

  List<dynamic> get _fincasFiltradas {
    if (_busqueda.isEmpty) return _fincas;
    final q = _busqueda.toLowerCase();
    return _fincas.where((f) {
      final nombre = (f['nombre'] ?? '').toLowerCase();
      final email = ((f['usuarios'] as List?)?.isNotEmpty == true ? f['usuarios'][0]['email'] : '').toLowerCase();
      return nombre.contains(q) || email.contains(q);
    }).toList();
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
                  ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                      const Text('⚠️', style: TextStyle(fontSize: 40)),
                      const SizedBox(height: 12),
                      Text(_error!, style: TextStyle(color: Colors.white.withOpacity(0.5)), textAlign: TextAlign.center),
                      const SizedBox(height: 16),
                      ElevatedButton(onPressed: _load, child: const Text('Reintentar')),
                    ]))
                  : ListView(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
                      children: [
                        _header(),
                        const SizedBox(height: 16),
                        _statsGrid(),
                        const SizedBox(height: 16),
                        _informesBtn(),
                        const SizedBox(height: 20),
                        const Text('🏠 Fincas registradas',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18)),
                        const SizedBox(height: 4),
                        Text('${_fincas.length} fincas encontradas',
                            style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 12)),
                        const SizedBox(height: 12),
                        _searchBar(),
                        const SizedBox(height: 12),
                        ..._fincasFiltradas.map((f) => _fincaCard(f)),
                      ],
                    ),
        ),
      ),
    );
  }

  Widget _header() {
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
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('SUPER ADMINISTRADOR',
                  style: TextStyle(color: Color(0xFF2D9E3F), fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1)),
              Text('Panel del Administrador',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18)),
            ],
          ),
        ),
        GestureDetector(
          onTap: () async {
            await ApiClient.logout();
            if (mounted) Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(builder: (_) => const LoginScreen()), (r) => false);
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFFE53E3E).withOpacity(0.15),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFE53E3E).withOpacity(0.4)),
            ),
            child: const Text('🚪 Salir', style: TextStyle(color: Color(0xFFFC8181), fontWeight: FontWeight.w700, fontSize: 12)),
          ),
        ),
      ],
    );
  }

  Widget _statsGrid() {
    final s = _stats ?? {};
    final items = [
      ['🏠', '${s['totalFincas'] ?? 0}', 'Fincas registradas', const Color(0xFF2D9E3F)],
      ['✅', '${s['fincasActivas'] ?? 0}', 'Fincas activas', const Color(0xFF38A169)],
      ['🐄', '${s['totalAnimales'] ?? 0}', 'Animales totales', const Color(0xFF3182CE)],
      ['👥', '${s['totalUsuarios'] ?? 0}', 'Usuarios totales', const Color(0xFF805AD5)],
      ['💰', 'C\$ ${_fmt(s['totalVentas'])}', 'Ventas totales', const Color(0xFFD69E2E)],
    ];
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 1.6,
      children: items.take(4).map((it) {
        final color = it[3] as Color;
        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: color.withOpacity(0.15),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: color.withOpacity(0.4)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(it[0] as String, style: const TextStyle(fontSize: 26)),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(it[1] as String, style: TextStyle(color: color, fontSize: 24, fontWeight: FontWeight.w900)),
                  Text(it[2] as String, style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 11)),
                ],
              ),
            ],
          ),
        );
      }).toList()
      ..add(Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFFD69E2E).withOpacity(0.15),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFD69E2E).withOpacity(0.4)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('💰', style: TextStyle(fontSize: 26)),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('C\$ ${_fmt(s['totalVentas'])}',
                    style: const TextStyle(color: Color(0xFFD69E2E), fontSize: 20, fontWeight: FontWeight.w900)),
                Text('Ventas totales', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 11)),
              ],
            ),
          ],
        ),
      )),
    );
  }

  Widget _informesBtn() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF3182CE).withOpacity(0.15),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF3182CE).withOpacity(0.4)),
      ),
      child: Row(
        children: [
          const Text('📄', style: TextStyle(fontSize: 24)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Informes por Finca',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
                Text('Descarga PDF completo de cada finca',
                    style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
              ],
            ),
          ),
          Icon(Icons.chevron_right, color: Colors.white.withOpacity(0.3)),
        ],
      ),
    );
  }

  Widget _searchBar() {
    return TextField(
      onChanged: (v) => setState(() => _busqueda = v),
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        hintText: 'Buscar finca o email...',
        hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
        prefixIcon: Icon(Icons.search, color: Colors.white.withOpacity(0.3)),
        filled: true,
        fillColor: const Color(0xFF051908).withOpacity(0.85),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFF2D9E3F)),
        ),
      ),
    );
  }

  Widget _fincaCard(Map<String, dynamic> finca) {
    final activa = finca['activa'] != false;
    final usuarios = (finca['usuarios'] as List?) ?? [];
    final admin = usuarios.isNotEmpty ? usuarios[0] : null;
    final animales = finca['_count']?['animales'] ?? finca['animales'] ?? 0;
    final ventas = finca['_count']?['ventas'] ?? finca['ventas'] ?? 0;

    return GestureDetector(
      onTap: () => _verDetalleFinca(finca),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: const Color(0xFF051908).withOpacity(0.85),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withOpacity(0.08)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Imagen de finca (si tiene)
            if (finca['imagen'] != null)
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                child: Image.network(finca['imagen'], height: 120, width: double.infinity, fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const SizedBox.shrink()),
              ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: activa ? const Color(0xFF2D9E3F).withOpacity(0.2) : Colors.red.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(activa ? '✅ Activa' : '🔒 Suspendida',
                            style: TextStyle(
                              color: activa ? const Color(0xFF2D9E3F) : Colors.red,
                              fontSize: 11, fontWeight: FontWeight.w700,
                            )),
                      ),
                      const Spacer(),
                      _miniTag('🐄 $animales', 'animales'),
                      const SizedBox(width: 6),
                      _miniTag('👥 ${usuarios.length}', 'usuarios'),
                      const SizedBox(width: 6),
                      _miniTag('💰 $ventas', 'ventas'),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(finca['nombre'] ?? 'Sin nombre',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
                  if (finca['ubicacion'] != null)
                    Row(children: [
                      const Text('📍', style: TextStyle(fontSize: 11)),
                      const SizedBox(width: 4),
                      Text(finca['ubicacion'], style: TextStyle(color: const Color(0xFF2D9E3F).withOpacity(0.8), fontSize: 12)),
                    ]),
                  if (admin != null) ...[
                    const SizedBox(height: 4),
                    Row(children: [
                      const Text('👤', style: TextStyle(fontSize: 11)),
                      const SizedBox(width: 4),
                      Expanded(child: Text('${admin['nombre'] ?? ''} · ${admin['email'] ?? ''}',
                          style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 11),
                          overflow: TextOverflow.ellipsis)),
                    ]),
                  ],
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Registrada: ${_fecha(finca['createdAt'])}',
                          style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 11)),
                      GestureDetector(
                        onTap: () => _confirmarToggle(finca),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.red.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: Colors.red.withOpacity(0.4)),
                          ),
                          child: Text(activa ? '🔒 Suspender' : '✅ Activar',
                              style: const TextStyle(color: Color(0xFFFC8181), fontWeight: FontWeight.w700, fontSize: 12)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _miniTag(String value, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.08),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text('$value\n$label',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 9, height: 1.3)),
    );
  }

  void _confirmarToggle(Map<String, dynamic> finca) {
    final activa = finca['activa'] != false;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF0A2812),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(activa ? '🔒 Suspender finca' : '✅ Activar finca',
            style: const TextStyle(color: Colors.white)),
        content: Text(
          activa
              ? '¿Seguro que quieres suspender "${finca['nombre']}"? Los usuarios no podrán acceder.'
              : '¿Activar "${finca['nombre']}"?',
          style: TextStyle(color: Colors.white.withOpacity(0.7)),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx),
              child: Text('Cancelar', style: TextStyle(color: Colors.white.withOpacity(0.5)))),
          TextButton(
            onPressed: () { Navigator.pop(ctx); _toggleFinca(finca['id']); },
            child: Text(activa ? 'Suspender' : 'Activar',
                style: TextStyle(color: activa ? Colors.red : const Color(0xFF2D9E3F), fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  void _verDetalleFinca(Map<String, dynamic> finca) {
    // Por ahora muestra info básica — se puede expandir
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF0A2812),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(finca['nombre'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20)),
            const SizedBox(height: 16),
            if (finca['ubicacion'] != null) _detRow('📍 Ubicación', finca['ubicacion']),
            _detRow('🐄 Animales', '${finca['_count']?['animales'] ?? 0}'),
            _detRow('💰 Ventas', '${finca['_count']?['ventas'] ?? 0}'),
            _detRow('👥 Usuarios', '${(finca['usuarios'] as List?)?.length ?? 0}'),
            _detRow('📅 Registrada', _fecha(finca['createdAt'])),
          ],
        ),
      ),
    );
  }

  Widget _detRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Text(label, style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 13)),
          const Spacer(),
          Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13)),
        ],
      ),
    );
  }

  String _fecha(dynamic d) {
    if (d == null) return '—';
    try {
      final dt = DateTime.parse(d.toString());
      return '${dt.day} ${_mes(dt.month)} ${dt.year}';
    } catch (_) { return '—'; }
  }

  String _mes(int m) => ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][m - 1];

  String _fmt(dynamic n) {
    if (n == null) return '0';
    final num v = n is num ? n : double.tryParse(n.toString()) ?? 0;
    if (v >= 1000000) return '${(v / 1000000).toStringAsFixed(1)}M';
    if (v >= 1000) return '${(v / 1000).toStringAsFixed(1)}K';
    return v.toStringAsFixed(0);
  }
}
