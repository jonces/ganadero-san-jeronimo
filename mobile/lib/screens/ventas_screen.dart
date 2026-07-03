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

  Future<void> _abrirFormulario() async {
    List<dynamic> animales = [];
    try {
      final data = await ApiClient.get('/animales');
      animales = (data as List).where((a) => a['estado'] == 'ACTIVO').toList();
    } catch (_) {}
    if (!mounted) return;
    if (animales.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No hay animales activos para vender')),
      );
      return;
    }

    String? animalId;
    String tipoVenta = 'EN_PIE';
    String moneda = 'NIO';
    String metodoPago = 'EFECTIVO';
    String estadoPago = 'PAGADO';
    final precioCtrl = TextEditingController();
    final pesoCtrl = TextEditingController();
    final compradorCtrl = TextEditingController();
    bool guardando = false;
    String? errorForm;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF051908),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheet) {
          InputDecoration deco(String label) => InputDecoration(
                labelText: label,
                labelStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: Colors.white.withOpacity(0.15)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: Color(0xFF2D9E3F)),
                ),
              );

          Widget chips(String titulo, List<List<String>> opciones, String valor, void Function(String) onSel) =>
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(titulo, style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 8,
                    children: opciones.map((o) {
                      final sel = valor == o[0];
                      return ChoiceChip(
                        label: Text(o[1]),
                        selected: sel,
                        onSelected: (_) => setSheet(() => onSel(o[0])),
                        selectedColor: const Color(0xFF2D9E3F),
                        backgroundColor: Colors.white.withOpacity(0.08),
                        labelStyle: TextStyle(
                          color: sel ? Colors.white : Colors.white.withOpacity(0.6),
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                        side: BorderSide.none,
                      );
                    }).toList(),
                  ),
                ],
              );

          Future<void> guardar() async {
            if (animalId == null) {
              setSheet(() => errorForm = 'Selecciona el animal vendido');
              return;
            }
            final precio = double.tryParse(precioCtrl.text.trim());
            if (precio == null || precio <= 0) {
              setSheet(() => errorForm = 'Escribe el precio de la venta');
              return;
            }
            setSheet(() { guardando = true; errorForm = null; });
            try {
              await ApiClient.post('/ventas', {
                'animalId': animalId,
                'tipoVenta': tipoVenta,
                'moneda': moneda,
                'precioOriginal': precio,
                if (pesoCtrl.text.trim().isNotEmpty) 'pesoKg': double.tryParse(pesoCtrl.text.trim()),
                'metodoPago': metodoPago,
                'estadoPago': estadoPago,
                if (compradorCtrl.text.trim().isNotEmpty) 'comprador': compradorCtrl.text.trim(),
              });
              if (ctx.mounted) Navigator.pop(ctx);
              _load();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('✅ Venta registrada'), backgroundColor: Color(0xFF1A6B2A)),
                );
              }
            } catch (e) {
              setSheet(() {
                guardando = false;
                errorForm = e.toString().replaceFirst('Exception: ', '');
              });
            }
          }

          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('💰 Registrar venta',
                      style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: animalId,
                    decoration: deco('Animal vendido'),
                    dropdownColor: const Color(0xFF0A2812),
                    style: const TextStyle(color: Colors.white),
                    items: animales
                        .map<DropdownMenuItem<String>>((a) => DropdownMenuItem(
                              value: a['id'],
                              child: Text('${a['nombre'] ?? a['identificador']} · ${a['identificador']}'),
                            ))
                        .toList(),
                    onChanged: (v) => setSheet(() => animalId = v),
                  ),
                  const SizedBox(height: 14),
                  chips('Tipo de venta', [['EN_PIE', '🐄 En pie'], ['POR_PESO', '⚖️ Por peso']], tipoVenta, (v) => tipoVenta = v),
                  const SizedBox(height: 12),
                  TextField(
                    controller: pesoCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    style: const TextStyle(color: Colors.white),
                    decoration: deco('Peso (kg) — opcional'),
                  ),
                  const SizedBox(height: 12),
                  chips('Moneda', [['NIO', 'C\$ Córdobas'], ['USD', '\$ Dólares']], moneda, (v) => moneda = v),
                  const SizedBox(height: 12),
                  TextField(
                    controller: precioCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    style: const TextStyle(color: Colors.white),
                    decoration: deco('Precio total de la venta'),
                  ),
                  const SizedBox(height: 14),
                  chips('Método de pago',
                      [['EFECTIVO', '💵 Efectivo'], ['TRANSFERENCIA', '🏦 Transferencia'], ['CHEQUE', '📄 Cheque'], ['CREDITO', '🤝 Crédito']],
                      metodoPago, (v) => metodoPago = v),
                  const SizedBox(height: 12),
                  chips('Estado del pago',
                      [['PAGADO', '✅ Pagado'], ['PENDIENTE', '⏳ Pendiente'], ['PARCIAL', '➗ Parcial']],
                      estadoPago, (v) => estadoPago = v),
                  const SizedBox(height: 12),
                  TextField(
                    controller: compradorCtrl,
                    style: const TextStyle(color: Colors.white),
                    decoration: deco('Comprador — opcional'),
                  ),
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
                        backgroundColor: const Color(0xFF2D9E3F),
                        padding: const EdgeInsets.symmetric(vertical: 15),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: Text(guardando ? 'Guardando...' : 'Registrar venta',
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
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFF2D9E3F),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: IconButton(
                      onPressed: _abrirFormulario,
                      icon: const Icon(Icons.add, color: Colors.white),
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
                                  Text('Toca el botón + para registrar una venta',
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
