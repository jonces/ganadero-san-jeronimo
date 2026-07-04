import 'package:flutter/material.dart';
import '../api_client.dart';

const _categorias = [
  {'value': 'ALIMENTACION', 'label': '🌾 Alimentación', 'color': Color(0xFF2D9E3F)},
  {'value': 'MEDICAMENTO', 'label': '💊 Medicamentos', 'color': Color(0xFF3182CE)},
  {'value': 'MANTENIMIENTO', 'label': '🔧 Mantenimiento', 'color': Color(0xFF718096)},
  {'value': 'SALARIO', 'label': '👷 Salarios', 'color': Color(0xFF805AD5)},
  {'value': 'COMBUSTIBLE', 'label': '⛽ Combustible', 'color': Color(0xFFED8936)},
  {'value': 'OTRO', 'label': '📋 Otro', 'color': Color(0xFFA0AEC0)},
];

const _periodos = [
  {'value': '', 'label': '📅 Todos'},
  {'value': 'DIARIO', 'label': '☀️ Hoy'},
  {'value': 'SEMANAL', 'label': '📆 Esta semana'},
  {'value': 'QUINCENAL', 'label': '🗓️ Últimos 15 días'},
  {'value': 'MENSUAL', 'label': '📊 Este mes'},
];

const _periodicidades = [
  {'value': 'UNICO', 'label': '1️⃣ Único / puntual'},
  {'value': 'DIARIO', 'label': '☀️ Diario'},
  {'value': 'SEMANAL', 'label': '📆 Semanal'},
  {'value': 'QUINCENAL', 'label': '🗓️ Cada 15 días'},
  {'value': 'MENSUAL', 'label': '📊 Mensual'},
];

class GastosScreen extends StatefulWidget {
  const GastosScreen({super.key});

  @override
  State<GastosScreen> createState() => _GastosScreenState();
}

class _GastosScreenState extends State<GastosScreen> {
  List<dynamic> _gastos = [];
  double _total = 0;
  String _periodo = '';
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
      final q = _periodo.isNotEmpty ? '?periodo=$_periodo' : '';
      final data = await ApiClient.get('/gastos$q');
      setState(() {
        _gastos = (data?['gastos'] as List?) ?? [];
        _total = ((data?['total'] ?? 0) as num).toDouble();
        _loading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString().replaceFirst('Exception: ', ''); _loading = false; });
    }
  }

  Future<void> _eliminar(String id) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF051908),
        title: const Text('¿Eliminar este gasto?', style: TextStyle(color: Colors.white, fontSize: 16)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Eliminar', style: TextStyle(color: Colors.redAccent))),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ApiClient.delete('/gastos/$id');
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', '')), backgroundColor: Colors.red[800]));
      }
    }
  }

  Future<void> _nuevoGasto() async {
    final descCtrl = TextEditingController();
    final montoCtrl = TextEditingController();
    final notasCtrl = TextEditingController();
    String categoria = 'ALIMENTACION';
    String periodicidad = 'UNICO';
    DateTime fecha = DateTime.now();
    bool guardando = false;
    String? errorForm;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF051908),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) {
          Future<void> guardar() async {
            if (descCtrl.text.trim().isEmpty) { setSt(() => errorForm = 'La descripción es requerida'); return; }
            final monto = double.tryParse(montoCtrl.text.trim());
            if (monto == null || monto <= 0) { setSt(() => errorForm = 'Escribe el monto del gasto'); return; }
            setSt(() { guardando = true; errorForm = null; });
            try {
              await ApiClient.post('/gastos', {
                'descripcion': descCtrl.text.trim(),
                'categoria': categoria,
                'monto': monto,
                'moneda': 'NIO',
                'periodicidad': periodicidad,
                'fecha': fecha.toIso8601String().substring(0, 10),
                if (notasCtrl.text.trim().isNotEmpty) 'notas': notasCtrl.text.trim(),
              });
              if (ctx.mounted) Navigator.pop(ctx);
              _load();
            } catch (e) {
              setSt(() { guardando = false; errorForm = e.toString().replaceFirst('Exception: ', ''); });
            }
          }

          InputDecoration deco(String label) => InputDecoration(
                labelText: label,
                labelStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.white.withOpacity(0.15))),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFF805AD5))),
              );

          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('💸 Nuevo Gasto', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 16),
                  Text('CATEGORÍA', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 11, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8, runSpacing: 8,
                    children: _categorias.map((c) {
                      final sel = categoria == c['value'];
                      final color = c['color'] as Color;
                      return GestureDetector(
                        onTap: () => setSt(() => categoria = c['value'] as String),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: sel ? color : Colors.white.withOpacity(0.06),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: color.withOpacity(sel ? 1 : 0.5)),
                          ),
                          child: Text(c['label'] as String,
                              style: TextStyle(color: sel ? Colors.white : Colors.white.withOpacity(0.7), fontSize: 12, fontWeight: FontWeight.w700)),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 14),
                  TextField(controller: descCtrl, style: const TextStyle(color: Colors.white),
                      decoration: deco('Descripción * (ej: compra de concentrado)')),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(controller: montoCtrl,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            style: const TextStyle(color: Colors.white),
                            decoration: deco('Monto (C\$) *')),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: GestureDetector(
                          onTap: () async {
                            final f = await showDatePicker(
                              context: ctx, initialDate: fecha,
                              firstDate: DateTime(2020), lastDate: DateTime.now(),
                            );
                            if (f != null) setSt(() => fecha = f);
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: Colors.white.withOpacity(0.15)),
                            ),
                            child: Text('📅 ${fecha.day}/${fecha.month}/${fecha.year}',
                                style: const TextStyle(color: Colors.white, fontSize: 14)),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Text('PERIODICIDAD', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 11, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8, runSpacing: 8,
                    children: _periodicidades.map((p) {
                      final sel = periodicidad == p['value'];
                      return GestureDetector(
                        onTap: () => setSt(() => periodicidad = p['value'] as String),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: sel ? const Color(0xFF805AD5) : Colors.white.withOpacity(0.06),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFF805AD5).withOpacity(sel ? 1 : 0.5)),
                          ),
                          child: Text(p['label'] as String,
                              style: TextStyle(color: sel ? Colors.white : Colors.white.withOpacity(0.7), fontSize: 12, fontWeight: FontWeight.w700)),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 12),
                  TextField(controller: notasCtrl, style: const TextStyle(color: Colors.white),
                      maxLines: 2, decoration: deco('Notas (opcional)')),
                  if (errorForm != null) ...[
                    const SizedBox(height: 12),
                    Text(errorForm!, style: const TextStyle(color: Colors.redAccent, fontSize: 13)),
                  ],
                  const SizedBox(height: 18),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: guardando ? null : guardar,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF805AD5),
                        padding: const EdgeInsets.symmetric(vertical: 15),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: Text(guardando ? 'Guardando...' : 'Guardar Gasto',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final porCategoria = _categorias.map((c) {
      final delCat = _gastos.where((g) => g['categoria'] == c['value']).toList();
      final total = delCat.fold<double>(0, (s, g) => s + ((g['monto'] ?? 0) as num).toDouble());
      return {'cat': c, 'total': total, 'count': delCat.length};
    }).where((x) => (x['count'] as int) > 0).toList();

    return Scaffold(
      backgroundColor: const Color(0xFF020F05),
      appBar: AppBar(
        backgroundColor: const Color(0xFF020F05),
        foregroundColor: Colors.white,
        title: const Text('💸 Control de Gastos', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Container(
              decoration: BoxDecoration(color: const Color(0xFF805AD5), borderRadius: BorderRadius.circular(12)),
              child: IconButton(onPressed: _nuevoGasto, icon: const Icon(Icons.add, color: Colors.white)),
            ),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF805AD5)))
          : RefreshIndicator(
              onRefresh: _load,
              color: const Color(0xFF805AD5),
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                children: [
                  // Total banner (morado como en la web)
                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [Color(0xFF553C9A), Color(0xFF805AD5)]),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Column(
                      children: [
                        Text('TOTAL DE GASTOS', style: TextStyle(color: Colors.white.withOpacity(0.75), fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 2)),
                        const SizedBox(height: 4),
                        Text('C\$ ${_total.toStringAsFixed(0)}', style: const TextStyle(color: Colors.white, fontSize: 34, fontWeight: FontWeight.w900)),
                        Text('≈ USD \$ ${(_total / 36.5).toStringAsFixed(0)}', style: const TextStyle(color: Color(0xFFD6BCFA), fontSize: 13)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Filtro de periodo
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: _periodos.map((p) {
                        final sel = _periodo == p['value'];
                        return GestureDetector(
                          onTap: () { setState(() => _periodo = p['value'] as String); _load(); },
                          child: Container(
                            margin: const EdgeInsets.only(right: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              color: sel ? const Color(0xFF805AD5) : Colors.white.withOpacity(0.06),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFF805AD5).withOpacity(sel ? 1 : 0.4)),
                            ),
                            child: Text(p['label'] as String,
                                style: TextStyle(color: sel ? Colors.white : Colors.white.withOpacity(0.7), fontSize: 12, fontWeight: FontWeight.w700)),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Resumen por categoría
                  if (porCategoria.isNotEmpty) ...[
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: 8, crossAxisSpacing: 8, childAspectRatio: 2.6,
                      children: porCategoria.map((x) {
                        final c = x['cat'] as Map;
                        return Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFF051908).withOpacity(0.85),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: Colors.white.withOpacity(0.08)),
                          ),
                          child: Row(
                            children: [
                              Text((c['label'] as String).split(' ')[0], style: const TextStyle(fontSize: 22)),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text('C\$ ${(x['total'] as double).toStringAsFixed(0)}',
                                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13)),
                                    Text('${(c['label'] as String).split(' ').sublist(1).join(' ')} · ${x['count']}',
                                        style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 10),
                                        overflow: TextOverflow.ellipsis),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 12),
                  ],
                  if (_error != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(_error!, style: const TextStyle(color: Colors.redAccent)),
                    ),
                  // Lista de gastos
                  if (_gastos.isEmpty && !_loading)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 60),
                      child: Column(
                        children: [
                          const Text('💸', style: TextStyle(fontSize: 48)),
                          const SizedBox(height: 12),
                          Text('Sin gastos registrados', style: TextStyle(color: Colors.white.withOpacity(0.5), fontWeight: FontWeight.w700)),
                          Text('Registra los gastos diarios de tu finca', style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 12)),
                        ],
                      ),
                    )
                  else
                    ..._gastos.map((g) => _gastoTile(g)),
                ],
              ),
            ),
    );
  }

  Widget _gastoTile(Map<String, dynamic> g) {
    final cat = _categorias.firstWhere((c) => c['value'] == g['categoria'], orElse: () => _categorias[5]);
    final per = _periodicidades.firstWhere((p) => p['value'] == g['periodicidad'], orElse: () => _periodicidades[0]);
    final color = cat['color'] as Color;
    final fecha = DateTime.tryParse(g['fecha'] ?? '');
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF051908).withOpacity(0.85),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(color: color, borderRadius: const BorderRadius.vertical(top: Radius.circular(16))),
            child: Row(
              children: [
                Text(cat['label'] as String, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12)),
                const Spacer(),
                Text(per['label'] as String, style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 11)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(g['descripcion'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14)),
                      if (g['notas'] != null && (g['notas'] as String).isNotEmpty)
                        Text('📝 ${g['notas']}', style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 11)),
                      Text(
                        '${fecha != null ? '${fecha.day}/${fecha.month}/${fecha.year}' : '—'}${g['usuario'] != null ? ' · ${g['usuario']['nombre']}' : ''}',
                        style: TextStyle(color: Colors.white.withOpacity(0.35), fontSize: 11),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('C\$ ${((g['monto'] ?? 0) as num).toStringAsFixed(0)}',
                        style: const TextStyle(color: Color(0xFF805AD5), fontWeight: FontWeight.w900, fontSize: 17)),
                    const SizedBox(height: 4),
                    GestureDetector(
                      onTap: () => _eliminar(g['id']),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(color: const Color(0xFFE53E3E), borderRadius: BorderRadius.circular(10)),
                        child: const Text('🗑️', style: TextStyle(fontSize: 12)),
                      ),
                    ),
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
