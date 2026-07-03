import 'package:flutter/material.dart';
import '../api_client.dart';
import '../widgets/glass_card.dart';

class VentasScreen extends StatefulWidget {
  const VentasScreen({super.key});

  @override
  State<VentasScreen> createState() => _VentasScreenState();
}

class _VentasScreenState extends State<VentasScreen> {
  List<dynamic> _ventas = [];
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
      final data = await ApiClient.get('/ventas');
      setState(() { _ventas = data ?? []; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString().replaceFirst('Exception: ', ''); _loading = false; });
    }
  }

  Color _estadoColor(String? estado) {
    switch (estado) {
      case 'PAGADO': return const Color(0xFF2D9E3F);
      case 'PENDIENTE': return Colors.red;
      case 'PARCIAL': return const Color(0xFFD69E2E);
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF020F05),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
              child: Row(
                children: [
                  const Text('💰 Ventas', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900)),
                  const Spacer(),
                  IconButton(onPressed: _load, icon: Icon(Icons.refresh, color: Colors.white.withOpacity(0.4))),
                ],
              ),
            ),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: Color(0xFF2D9E3F)))
                  : _error != null
                      ? Center(child: Text(_error!, style: TextStyle(color: Colors.white.withOpacity(0.5))))
                      : _ventas.isEmpty
                          ? Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Text('💰', style: TextStyle(fontSize: 48)),
                                  const SizedBox(height: 12),
                                  Text('Aún no hay ventas registradas',
                                      style: TextStyle(color: Colors.white.withOpacity(0.5), fontWeight: FontWeight.w700)),
                                  const SizedBox(height: 4),
                                  Text('Registra ventas desde la web',
                                      style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 12)),
                                ],
                              ),
                            )
                          : RefreshIndicator(
                              onRefresh: _load,
                              color: const Color(0xFF2D9E3F),
                              child: ListView.builder(
                                padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                                itemCount: _ventas.length,
                                itemBuilder: (ctx, i) => _ventaTile(_ventas[i]),
                              ),
                            ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _ventaTile(Map<String, dynamic> v) {
    final esEnPie = v['tipoVenta'] == 'EN_PIE';
    final estadoColor = _estadoColor(v['estadoPago']);
    final fecha = DateTime.tryParse(v['fecha'] ?? '');
    final fechaStr = fecha != null ? '${fecha.day}/${fecha.month}/${fecha.year}' : '—';
    final precioNIO = (v['precioNIO'] as num?)?.toStringAsFixed(0) ?? '0';
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF051908).withOpacity(0.85),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: esEnPie ? [const Color(0xFF1A6B2A), const Color(0xFF2D9E3F)] : [const Color(0xFF9B2626), const Color(0xFFE53E3E)],
              ),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
            ),
            child: Row(
              children: [
                Text(esEnPie ? '🐄 En Pie' : '⚖️ Por Peso',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13)),
                const SizedBox(width: 8),
                Text(fechaStr, style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12)),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: estadoColor.withOpacity(0.8), borderRadius: BorderRadius.circular(10)),
                  child: Text(v['estadoPago'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700)),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(v['animal']?['nombre'] ?? v['animal']?['identificador'] ?? '—',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15)),
                      Text('${v['animal']?['raza'] ?? 'Sin raza'} · ${v['animal']?['identificador'] ?? ''}',
                          style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 12)),
                      if (v['comprador'] != null) ...[
                        const SizedBox(height: 4),
                        Text('👤 ${v['comprador']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 12)),
                      ],
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('C\$ $precioNIO',
                        style: const TextStyle(color: Color(0xFFF6D860), fontWeight: FontWeight.w900, fontSize: 18)),
                    Text('${v['metodoPago'] ?? ''}',
                        style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 11)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
