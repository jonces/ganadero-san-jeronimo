import 'dart:io';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:image_picker/image_picker.dart';
import '../api_client.dart';
import '../widgets/glass_card.dart';
import 'animal_detail_screen.dart';

class InventarioScreen extends StatefulWidget {
  const InventarioScreen({super.key});

  @override
  State<InventarioScreen> createState() => _InventarioScreenState();
}

class _InventarioScreenState extends State<InventarioScreen> {
  List<dynamic> _animales = [];
  bool _loading = true;
  String? _error;
  final _busquedaCtrl = TextEditingController();
  String _filtroSexo = 'TODOS';
  String _filtroEstado = 'ACTIVO';

  @override
  void initState() {
    super.initState();
    _load();
    _busquedaCtrl.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _busquedaCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await ApiClient.get('/animales');
      setState(() { _animales = data ?? []; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString().replaceFirst('Exception: ', ''); _loading = false; });
    }
  }

  List<dynamic> get _filtrados {
    var lista = _animales.where((a) => a['estado'] != 'ELIMINADO').toList();
    if (_filtroEstado != 'TODOS') lista = lista.where((a) => a['estado'] == _filtroEstado).toList();
    if (_filtroSexo != 'TODOS') lista = lista.where((a) => a['sexo'] == _filtroSexo).toList();
    final q = _busquedaCtrl.text.toLowerCase().trim();
    if (q.isNotEmpty) {
      lista = lista.where((a) =>
        (a['nombre'] ?? '').toString().toLowerCase().contains(q) ||
        (a['identificador'] ?? '').toString().toLowerCase().contains(q) ||
        (a['raza'] ?? '').toString().toLowerCase().contains(q) ||
        (a['fierro'] ?? '').toString().toLowerCase().contains(q)
      ).toList();
    }
    return lista;
  }

  Future<void> _crearAnimal() async {
    final idCtrl = TextEditingController();
    final nombreCtrl = TextEditingController();
    final razaCtrl = TextEditingController();
    final fierroCtrl = TextEditingController();
    final pesoCtrl = TextEditingController();
    String sexo = 'HEMBRA';
    final List<XFile> fotos = [];
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
            if (idCtrl.text.trim().isEmpty) {
              setSt(() => errorForm = 'El identificador / arete es requerido');
              return;
            }
            setSt(() { guardando = true; errorForm = null; });
            try {
              final animal = await ApiClient.post('/animales', {
                'identificador': idCtrl.text.trim(),
                if (nombreCtrl.text.trim().isNotEmpty) 'nombre': nombreCtrl.text.trim(),
                if (razaCtrl.text.trim().isNotEmpty) 'raza': razaCtrl.text.trim(),
                if (fierroCtrl.text.trim().isNotEmpty) 'fierro': fierroCtrl.text.trim(),
                if (pesoCtrl.text.trim().isNotEmpty) 'pesoActual': double.tryParse(pesoCtrl.text.trim()),
                'sexo': sexo,
              });
              if (fotos.isNotEmpty) {
                await ApiClient.postMultipart(
                  '/animales/${animal['id']}/media',
                  {},
                  fotos.map((f) => f.path).toList(),
                );
              }
              if (ctx.mounted) Navigator.pop(ctx);
              _load();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                  content: Text(fotos.isEmpty ? '✅ Animal registrado' : '✅ Animal registrado con ${fotos.length} foto(s)'),
                  backgroundColor: const Color(0xFF1A6B2A),
                ));
              }
            } catch (e) {
              setSt(() {
                guardando = false;
                errorForm = e.toString().replaceFirst('Exception: ', '');
              });
            }
          }

          Future<void> agregarFoto(ImageSource origen) async {
            try {
              final f = await ImagePicker().pickImage(source: origen, imageQuality: 80, maxWidth: 1600);
              if (f != null) setSt(() => fotos.add(f));
            } catch (_) {}
          }

          Widget botonFoto(IconData icono, String label, VoidCallback onTap) => Expanded(
                child: GestureDetector(
                  onTap: guardando ? null : onTap,
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.07),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF2D9E3F).withOpacity(0.5)),
                    ),
                    child: Column(
                      children: [
                        Icon(icono, color: const Color(0xFF2D9E3F), size: 22),
                        const SizedBox(height: 4),
                        Text(label, style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 11, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ),
              );

          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('🐄 Nuevo Animal', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 18),
                  TextField(controller: idCtrl, style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(labelText: 'Identificador / Arete *')),
                  const SizedBox(height: 12),
                  TextField(controller: nombreCtrl, style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(labelText: 'Nombre')),
                  const SizedBox(height: 12),
                  TextField(controller: razaCtrl, style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(labelText: 'Raza')),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(controller: fierroCtrl, style: const TextStyle(color: Colors.white),
                            decoration: const InputDecoration(labelText: 'Fierro')),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(controller: pesoCtrl,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            style: const TextStyle(color: Colors.white),
                            decoration: const InputDecoration(labelText: 'Peso (kg)')),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: ['HEMBRA', 'MACHO'].map((s) => Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: GestureDetector(
                          onTap: () => setSt(() => sexo = s),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: sexo == s ? (s == 'HEMBRA' ? const Color(0xFFD69E2E) : const Color(0xFF3182CE)) : Colors.white.withOpacity(0.07),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: s == 'HEMBRA' ? const Color(0xFFD69E2E) : const Color(0xFF3182CE)),
                            ),
                            child: Text(s == 'HEMBRA' ? '🐄 Hembra' : '🐂 Macho',
                                textAlign: TextAlign.center,
                                style: TextStyle(color: sexo == s ? Colors.white : Colors.white.withOpacity(0.6), fontWeight: FontWeight.w700)),
                          ),
                        ),
                      ),
                    )).toList(),
                  ),
                  const SizedBox(height: 16),
                  Text('Fotos del animal', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
                  const SizedBox(height: 8),
                  if (fotos.isNotEmpty) ...[
                    SizedBox(
                      height: 72,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: fotos.length,
                        itemBuilder: (_, i) => Stack(
                          children: [
                            Container(
                              margin: const EdgeInsets.only(right: 8),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(10),
                                child: Image.file(File(fotos[i].path), width: 72, height: 72, fit: BoxFit.cover),
                              ),
                            ),
                            Positioned(
                              top: 2, right: 10,
                              child: GestureDetector(
                                onTap: () => setSt(() => fotos.removeAt(i)),
                                child: Container(
                                  padding: const EdgeInsets.all(2),
                                  decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                                  child: const Icon(Icons.close, color: Colors.white, size: 14),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],
                  Row(
                    children: [
                      botonFoto(Icons.camera_alt, 'Tomar foto', () => agregarFoto(ImageSource.camera)),
                      botonFoto(Icons.photo_library, 'Galería', () => agregarFoto(ImageSource.gallery)),
                    ],
                  ),
                  if (errorForm != null) ...[
                    const SizedBox(height: 12),
                    Text(errorForm!, style: const TextStyle(color: Colors.redAccent, fontSize: 13)),
                  ],
                  const SizedBox(height: 18),
                  ElevatedButton(
                    onPressed: guardando ? null : guardar,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2D9E3F),
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(48),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: Text(guardando ? 'Guardando...' : 'Guardar animal',
                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Color _estadoColor(String? estado) {
    switch (estado) {
      case 'ACTIVO': return const Color(0xFF2D9E3F);
      case 'VENDIDO': return const Color(0xFFD69E2E);
      case 'MUERTO': return Colors.red;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final lista = _filtrados;
    return Scaffold(
      backgroundColor: const Color(0xFF020F05),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Column(
                children: [
                  Row(
                    children: [
                      const Text('🐄 Inventario',
                          style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900)),
                      const Spacer(),
                      IconButton(
                        onPressed: _crearAnimal,
                        icon: Container(
                          width: 36, height: 36,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(colors: [Color(0xFF1A6B2A), Color(0xFF2D9E3F)]),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.add, color: Colors.white, size: 20),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _busquedaCtrl,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Buscar por nombre, arete, raza...',
                      prefixIcon: const Icon(Icons.search, color: Color(0xFF2D9E3F)),
                      suffixIcon: _busquedaCtrl.text.isNotEmpty
                          ? IconButton(onPressed: () => _busquedaCtrl.clear(), icon: Icon(Icons.clear, color: Colors.white.withOpacity(0.4)))
                          : null,
                    ),
                  ),
                  const SizedBox(height: 10),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        for (final f in [
                          ('TODOS', 'Todos'),
                          ('ACTIVO', '✅ Activos'),
                          ('VENDIDO', '💰 Vendidos'),
                          ('MUERTO', '💀 Muertos'),
                        ]) _filtroChip(f.$1, f.$2, _filtroEstado, (v) => setState(() => _filtroEstado = v)),
                        const SizedBox(width: 8),
                        for (final f in [
                          ('TODOS', 'Ambos'),
                          ('HEMBRA', '🐄 Hembras'),
                          ('MACHO', '🐂 Machos'),
                        ]) _filtroChip(f.$1, f.$2, _filtroSexo, (v) => setState(() => _filtroSexo = v)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: Color(0xFF2D9E3F)))
                  : _error != null
                      ? Center(child: Text(_error!, style: TextStyle(color: Colors.white.withOpacity(0.5))))
                      : lista.isEmpty
                          ? Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Text('🐄', style: TextStyle(fontSize: 48)),
                                  const SizedBox(height: 12),
                                  Text('Sin animales', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 16, fontWeight: FontWeight.w700)),
                                ],
                              ),
                            )
                          : RefreshIndicator(
                              onRefresh: _load,
                              color: const Color(0xFF2D9E3F),
                              child: ListView.builder(
                                padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
                                itemCount: lista.length,
                                itemBuilder: (ctx, i) => _animalTile(lista[i]),
                              ),
                            ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _filtroChip(String valor, String label, String actual, void Function(String) onTap) {
    final sel = actual == valor;
    return GestureDetector(
      onTap: () => onTap(valor),
      child: Container(
        margin: const EdgeInsets.only(right: 6),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: sel ? const Color(0xFF2D9E3F) : Colors.white.withOpacity(0.07),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: sel ? const Color(0xFF2D9E3F) : Colors.white.withOpacity(0.15)),
        ),
        child: Text(label, style: TextStyle(color: sel ? Colors.white : Colors.white.withOpacity(0.6), fontSize: 12, fontWeight: FontWeight.w600)),
      ),
    );
  }

  Widget _animalTile(Map<String, dynamic> a) {
    final media = (a['media'] as List?) ?? [];
    final foto = media.where((m) => m['tipo'] == 'FOTO').isNotEmpty ? media.first['url'] as String? : null;
    final estadoColor = _estadoColor(a['estado']);
    return GestureDetector(
      onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => AnimalDetailScreen(animalId: a['id']))).then((_) => _load()),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF051908).withOpacity(0.85),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withOpacity(0.08)),
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: foto != null
                  ? CachedNetworkImage(imageUrl: foto, width: 56, height: 56, fit: BoxFit.cover,
                      errorWidget: (_, __, ___) => _avatar(a))
                  : _avatar(a),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(a['nombre'] ?? a['identificador'],
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15)),
                  Text('${a['raza'] ?? 'Sin raza'} · ${a['identificador']}',
                      style: TextStyle(color: Colors.white.withOpacity(0.45), fontSize: 12)),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: estadoColor.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: estadoColor.withOpacity(0.4)),
                        ),
                        child: Text(a['estado'] ?? '', style: TextStyle(color: estadoColor, fontSize: 10, fontWeight: FontWeight.w700)),
                      ),
                      if (a['pesoActual'] != null) ...[
                        const SizedBox(width: 6),
                        Text('⚖️ ${a['pesoActual']} kg', style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 11)),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: Colors.white.withOpacity(0.2)),
          ],
        ),
      ),
    );
  }

  Widget _avatar(Map<String, dynamic> a) {
    return Container(
      width: 56, height: 56,
      decoration: BoxDecoration(
        color: a['sexo'] == 'HEMBRA' ? const Color(0xFFD69E2E).withOpacity(0.2) : const Color(0xFF3182CE).withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Center(child: Text(a['sexo'] == 'HEMBRA' ? '🐄' : '🐂', style: const TextStyle(fontSize: 26))),
    );
  }
}
