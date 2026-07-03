import 'package:flutter/material.dart';
import '../api_client.dart';

class IncidentesScreen extends StatefulWidget {
  const IncidentesScreen({super.key});

  @override
  State<IncidentesScreen> createState() => _IncidentesScreenState();
}

class _IncidentesScreenState extends State<IncidentesScreen> {
  List<dynamic> _incidentes = [];
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
      final data = await ApiClient.get('/incidentes');
      setState(() { _incidentes = data ?? []; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString().replaceFirst('Exception: ', ''); _loading = false; });
    }
  }

  Color _gravedadColor(String? g) {
    switch (g) {
      case 'LEVE': return const Color(0xFF2D9E3F);
      case 'MODERADA': return const Color(0xFFD69E2E);
      case 'GRAVE': return Colors.orange;
      case 'CRITICA': return Colors.red;
      default: return Colors.grey;
    }
  }

  Future<void> _crearIncidente(List<dynamic> animales) async {
    String? animalId;
    String gravedad = 'LEVE';
    final tituloCtrl = TextEditingController();
    final descCtrl = TextEditingController();

    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF051908),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) => Padding(
          padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(width: 36, height: 4, margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(2)),
                    alignment: Alignment.center),
                const Text('Nuevo Incidente', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800)),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: animalId,
                  dropdownColor: const Color(0xFF051908),
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(labelText: 'Animal afectado (opcional)'),
                  items: [
                    const DropdownMenuItem(value: null, child: Text('— Sin animal específico —', style: TextStyle(color: Colors.white54))),
                    ...animales.map((a) => DropdownMenuItem(
                      value: a['id'] as String,
                      child: Text(a['nombre'] ?? a['identificador'], style: const TextStyle(color: Colors.white)),
                    )),
                  ],
                  onChanged: (v) => setSt(() => animalId = v),
                ),
                const SizedBox(height: 12),
                TextField(controller: tituloCtrl, style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(labelText: 'Título del incidente *')),
                const SizedBox(height: 12),
                TextField(controller: descCtrl, style: const TextStyle(color: Colors.white), maxLines: 3,
                    decoration: const InputDecoration(labelText: 'Descripción')),
                const SizedBox(height: 12),
                const Text('Gravedad', style: TextStyle(color: Colors.white54, fontSize: 12)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: ['LEVE', 'MODERADA', 'GRAVE', 'CRITICA'].map((g) => GestureDetector(
                    onTap: () => setSt(() => gravedad = g),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: gravedad == g ? _gravedadColor(g) : _gravedadColor(g).withOpacity(0.12),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: _gravedadColor(g).withOpacity(0.5)),
                      ),
                      child: Text(g, style: TextStyle(
                        color: gravedad == g ? Colors.white : _gravedadColor(g),
                        fontSize: 12, fontWeight: FontWeight.w700)),
                    ),
                  )).toList(),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () => Navigator.pop(ctx, true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red[700],
                    foregroundColor: Colors.white,
                    minimumSize: const Size.fromHeight(48),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Reportar incidente', style: TextStyle(fontWeight: FontWeight.w800)),
                ),
              ],
            ),
          ),
        ),
      ),
    );

    if (ok == true && tituloCtrl.text.isNotEmpty) {
      try {
        await ApiClient.post('/incidentes', {
          'titulo': tituloCtrl.text.trim(),
          if (descCtrl.text.isNotEmpty) 'descripcion': descCtrl.text.trim(),
          'gravedad': gravedad,
          if (animalId != null) 'animalId': animalId,
        });
        _load();
      } catch (e) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', '')), backgroundColor: Colors.red[800]));
      }
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
                  const Text('⚠️ Incidentes', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900)),
                  const Spacer(),
                  IconButton(
                    onPressed: () async {
                      try {
                        final animales = await ApiClient.get('/animales') as List? ?? [];
                        if (mounted) _crearIncidente(animales);
                      } catch (_) {
                        _crearIncidente([]);
                      }
                    },
                    icon: Container(
                      width: 36, height: 36,
                      decoration: BoxDecoration(color: Colors.red.withOpacity(0.2), borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.red.withOpacity(0.4))),
                      child: const Icon(Icons.add, color: Colors.red, size: 20),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: Color(0xFF2D9E3F)))
                  : _error != null
                      ? Center(child: Text(_error!, style: TextStyle(color: Colors.white.withOpacity(0.5))))
                      : _incidentes.isEmpty
                          ? Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Text('✅', style: TextStyle(fontSize: 48)),
                                  const SizedBox(height: 12),
                                  Text('Sin incidentes registrados',
                                      style: TextStyle(color: Colors.white.withOpacity(0.5), fontWeight: FontWeight.w700)),
                                ],
                              ),
                            )
                          : RefreshIndicator(
                              onRefresh: _load,
                              color: const Color(0xFF2D9E3F),
                              child: ListView.builder(
                                padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                                itemCount: _incidentes.length,
                                itemBuilder: (ctx, i) => _incidenteTile(_incidentes[i]),
                              ),
                            ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _incidenteTile(Map<String, dynamic> inc) {
    final color = _gravedadColor(inc['gravedad']);
    final fecha = DateTime.tryParse(inc['fecha'] ?? inc['createdAt'] ?? '');
    final fechaStr = fecha != null ? '${fecha.day}/${fecha.month}/${fecha.year}' : '—';
    final resuelto = inc['resuelto'] == true;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF051908).withOpacity(0.85),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: resuelto ? Colors.white.withOpacity(0.08) : color.withOpacity(0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(child: Text(
              inc['gravedad'] == 'CRITICA' ? '🚨' : inc['gravedad'] == 'GRAVE' ? '⚠️' : 'ℹ️',
              style: const TextStyle(fontSize: 18),
            )),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(child: Text(inc['titulo'] ?? 'Sin título',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14))),
                    if (resuelto)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(color: const Color(0xFF2D9E3F).withOpacity(0.2), borderRadius: BorderRadius.circular(6)),
                        child: const Text('✅ Resuelto', style: TextStyle(color: Color(0xFF2D9E3F), fontSize: 10, fontWeight: FontWeight.w700)),
                      ),
                  ],
                ),
                if (inc['descripcion'] != null && (inc['descripcion'] as String).isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Text(inc['descripcion'], style: TextStyle(color: Colors.white.withOpacity(0.45), fontSize: 12), maxLines: 2, overflow: TextOverflow.ellipsis),
                ],
                const SizedBox(height: 6),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(color: color.withOpacity(0.15), borderRadius: BorderRadius.circular(8)),
                      child: Text(inc['gravedad'] ?? '', style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w700)),
                    ),
                    const SizedBox(width: 8),
                    Text(fechaStr, style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 11)),
                    if (inc['animal'] != null) ...[
                      const SizedBox(width: 8),
                      Text('🐄 ${inc['animal']['nombre'] ?? inc['animal']['identificador']}',
                          style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 11)),
                    ],
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
