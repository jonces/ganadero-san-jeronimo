import 'package:flutter/material.dart';
import '../api_client.dart';

const _moduloColores = {
  'Tablón': Color(0xFF2D9E3F),
  'Animales': Color(0xFFF59E0B),
  'Ventas': Color(0xFF10B981),
  'Gastos': Color(0xFF8B5CF6),
  'Incidentes': Color(0xFFEF4444),
  'Equipo': Color(0xFF3B82F6),
  'Documentos': Color(0xFF06B6D4),
};

const _moduloIconos = {
  'Tablón': '📢',
  'Animales': '🐄',
  'Ventas': '💰',
  'Gastos': '💸',
  'Incidentes': '🚨',
  'Equipo': '👥',
  'Documentos': '📄',
};

String _timeAgo(String? dateStr) {
  final d = DateTime.tryParse(dateStr ?? '');
  if (d == null) return '—';
  final diff = DateTime.now().difference(d);
  if (diff.inMinutes < 1) return 'ahora mismo';
  if (diff.inMinutes < 60) return 'hace ${diff.inMinutes} min';
  if (diff.inHours < 24) return 'hace ${diff.inHours}h';
  return 'hace ${diff.inDays} día${diff.inDays > 1 ? 's' : ''}';
}

class ActividadScreen extends StatefulWidget {
  const ActividadScreen({super.key});

  @override
  State<ActividadScreen> createState() => _ActividadScreenState();
}

class _ActividadScreenState extends State<ActividadScreen> {
  List<dynamic> _logs = [];
  bool _loading = true;
  String _filtro = 'Todos';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await ApiClient.get('/actividad');
      setState(() { _logs = data is List ? data : []; _loading = false; });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final modulos = ['Todos', ..._logs.map((l) => l['modulo'] as String? ?? '').toSet().where((m) => m.isNotEmpty)];
    final filtrados = _filtro == 'Todos' ? _logs : _logs.where((l) => l['modulo'] == _filtro).toList();

    return Scaffold(
      backgroundColor: const Color(0xFF020F05),
      appBar: AppBar(
        backgroundColor: const Color(0xFF020F05),
        foregroundColor: Colors.white,
        title: const Text('📋 Registro de Actividad', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF2D9E3F)))
          : RefreshIndicator(
              onRefresh: _load,
              color: const Color(0xFF2D9E3F),
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                children: [
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: modulos.map((m) {
                        final sel = _filtro == m;
                        return GestureDetector(
                          onTap: () => setState(() => _filtro = m),
                          child: Container(
                            margin: const EdgeInsets.only(right: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                            decoration: BoxDecoration(
                              color: sel ? const Color(0xFF2D9E3F).withOpacity(0.5) : Colors.white.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: sel ? const Color(0xFF2D9E3F) : Colors.white.withOpacity(0.15)),
                            ),
                            child: Text('${_moduloIconos[m] ?? '🔧'} $m',
                                style: TextStyle(color: sel ? const Color(0xFF86EFAC) : Colors.white.withOpacity(0.6), fontSize: 12, fontWeight: FontWeight.w700)),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (filtrados.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 60),
                      child: Column(
                        children: [
                          const Text('📋', style: TextStyle(fontSize: 48)),
                          const SizedBox(height: 12),
                          Text('No hay actividad registrada todavía', style: TextStyle(color: Colors.white.withOpacity(0.5), fontWeight: FontWeight.w700)),
                          Text('Cada acción en el sistema aparecerá aquí', style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 12)),
                        ],
                      ),
                    )
                  else
                    Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFF051908).withOpacity(0.85),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white.withOpacity(0.08)),
                      ),
                      child: Column(
                        children: [
                          for (int i = 0; i < filtrados.length; i++) _logTile(filtrados[i], i < filtrados.length - 1),
                        ],
                      ),
                    ),
                ],
              ),
            ),
    );
  }

  Widget _logTile(Map<String, dynamic> log, bool conBorde) {
    final color = _moduloColores[log['modulo']] ?? const Color(0xFF6B7280);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        border: conBorde ? Border(bottom: BorderSide(color: Colors.white.withOpacity(0.07))) : null,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 38, height: 38,
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: color.withOpacity(0.35)),
            ),
            child: Center(child: Text(_moduloIconos[log['modulo']] ?? '🔧', style: const TextStyle(fontSize: 16))),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(log['usuario']?['nombre'] ?? 'Usuario',
                          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700),
                          overflow: TextOverflow.ellipsis),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(color: color.withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
                      child: Text(log['modulo'] ?? '', style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w700)),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(log['accion'] ?? '', style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12)),
                if (log['detalle'] != null && (log['detalle'] as String).isNotEmpty)
                  Text(log['detalle'], style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 11), maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
          Text(_timeAgo(log['createdAt']), style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 10)),
        ],
      ),
    );
  }
}
