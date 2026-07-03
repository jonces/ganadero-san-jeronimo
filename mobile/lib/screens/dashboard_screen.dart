import 'package:flutter/material.dart';
import '../api_client.dart';
import '../widgets/glass_card.dart';
import '../widgets/stat_chip.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _stats;
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
      final data = await ApiClient.get('/ventas/stats');
      setState(() { _stats = data; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString().replaceFirst('Exception: ', ''); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF020F05), Color(0xFF051908)],
          ),
        ),
        child: SafeArea(
          child: RefreshIndicator(
            onRefresh: _load,
            color: const Color(0xFF2D9E3F),
            child: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                    child: Row(
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
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Ganaderos G',
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18)),
                            Text('Panel de control',
                                style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 12)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                if (_loading)
                  const SliverFillRemaining(
                    child: Center(child: CircularProgressIndicator(color: Color(0xFF2D9E3F))),
                  )
                else if (_error != null)
                  SliverFillRemaining(
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text('⚠️', style: TextStyle(fontSize: 40)),
                          const SizedBox(height: 12),
                          Text(_error!, style: TextStyle(color: Colors.white.withOpacity(0.5))),
                          const SizedBox(height: 16),
                          ElevatedButton(onPressed: _load, child: const Text('Reintentar')),
                        ],
                      ),
                    ),
                  )
                else ...[
                  SliverPadding(
                    padding: const EdgeInsets.all(20),
                    sliver: SliverList(
                      delegate: SliverChildListDelegate([
                        // Animales stats
                        const Text('🐄 Inventario', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15)),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Expanded(child: StatChip(label: 'Total', value: '${_stats!['animales']['total']}', color: const Color(0xFF2D9E3F))),
                            const SizedBox(width: 10),
                            Expanded(child: StatChip(label: 'Activos', value: '${_stats!['animales']['activos']}', color: const Color(0xFF38A169))),
                            const SizedBox(width: 10),
                            Expanded(child: StatChip(label: 'Machos', value: '${_stats!['animales']['machos']}', color: const Color(0xFF3182CE))),
                            const SizedBox(width: 10),
                            Expanded(child: StatChip(label: 'Hembras', value: '${_stats!['animales']['hembras']}', color: const Color(0xFFD69E2E))),
                          ],
                        ),
                        const SizedBox(height: 24),

                        // Ventas stats
                        const Text('💰 Ventas del mes', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15)),
                        const SizedBox(height: 10),
                        GlassCard(
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Ventas', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
                                    Text('${_stats!['ventas']['cantidadMes']} animales',
                                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
                                  ],
                                ),
                              ),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text('Total NIO', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
                                    Text('C\$ ${_formatNum(_stats!['ventas']['totalMesNIO'])}',
                                        style: const TextStyle(color: Color(0xFFD69E2E), fontWeight: FontWeight.w900, fontSize: 18)),
                                    Text('≈ \$ ${_formatNum(_stats!['ventas']['totalMesUSD'])}',
                                        style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 12)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Gráfica últimos 6 meses
                        if (_stats!['grafica'] != null) ...[
                          const Text('📊 Últimos 6 meses', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15)),
                          const SizedBox(height: 10),
                          GlassCard(
                            child: _buildChart(_stats!['grafica'] as List),
                          ),
                          const SizedBox(height: 24),
                        ],

                        // Peso promedio
                        GlassCard(
                          child: Row(
                            children: [
                              const Text('⚖️', style: TextStyle(fontSize: 28)),
                              const SizedBox(width: 12),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Peso promedio del hato',
                                      style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
                                  Text('${(_stats!['pesoPromedio'] as num?)?.toStringAsFixed(1) ?? '—'} kg',
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20)),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ]),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildChart(List data) {
    if (data.isEmpty) return const SizedBox.shrink();
    final maxV = data.fold<double>(0, (m, e) {
      final v = (e['ventas'] as num).toDouble();
      final g = (e['gastos'] as num).toDouble();
      return [m, v, g].reduce((a, b) => a > b ? a : b);
    });
    return Column(
      children: [
        SizedBox(
          height: 120,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: data.map<Widget>((m) {
              final v = (m['ventas'] as num).toDouble();
              final g = (m['gastos'] as num).toDouble();
              final h = maxV > 0 ? 100.0 : 0.0;
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 3),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Expanded(
                            child: Container(
                              height: maxV > 0 ? (v / maxV) * h : 4,
                              decoration: BoxDecoration(
                                color: const Color(0xFF2D9E3F),
                                borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 2),
                          Expanded(
                            child: Container(
                              height: maxV > 0 ? (g / maxV) * h : 4,
                              decoration: BoxDecoration(
                                color: Colors.red.withOpacity(0.7),
                                borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: data.map<Widget>((m) => Expanded(
            child: Text(m['label'], textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 10)),
          )).toList(),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(width: 10, height: 10, decoration: BoxDecoration(color: const Color(0xFF2D9E3F), borderRadius: BorderRadius.circular(2))),
            const SizedBox(width: 4),
            Text('Ventas', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 11)),
            const SizedBox(width: 16),
            Container(width: 10, height: 10, decoration: BoxDecoration(color: Colors.red.withOpacity(0.7), borderRadius: BorderRadius.circular(2))),
            const SizedBox(width: 4),
            Text('Gastos', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 11)),
          ],
        ),
      ],
    );
  }

  String _formatNum(dynamic n) {
    if (n == null) return '0';
    final num v = n is num ? n : double.tryParse(n.toString()) ?? 0;
    if (v >= 1000000) return '${(v / 1000000).toStringAsFixed(1)}M';
    if (v >= 1000) return '${(v / 1000).toStringAsFixed(1)}K';
    return v.toStringAsFixed(0);
  }
}
