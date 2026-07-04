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
    String? estadoReproductivo;
    final List<XFile> archivos = [];
    bool guardando = false;
    String? errorForm;

    bool esVideo(XFile f) {
      final p = f.path.toLowerCase();
      return p.endsWith('.mp4') || p.endsWith('.mov') || p.endsWith('.3gp') ||
             p.endsWith('.webm') || p.endsWith('.mkv') || p.endsWith('.avi');
    }

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
                if (estadoReproductivo != null) 'estadoReproductivo': estadoReproductivo,
              });
              if (archivos.isNotEmpty) {
                await ApiClient.postMultipart(
                  '/animales/${animal['id']}/media',
                  {},
                  archivos.map((f) => f.path).toList(),
                );
              }
              if (ctx.mounted) Navigator.pop(ctx);
              _load();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                  content: Text(archivos.isEmpty ? '✅ Animal registrado' : '✅ Animal registrado con ${archivos.length} archivo(s)'),
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

          Future<void> agregarFoto() async {
            try {
              final f = await ImagePicker().pickImage(source: ImageSource.camera, imageQuality: 80, maxWidth: 1600);
              if (f != null) setSt(() => archivos.add(f));
            } catch (_) {}
          }

          Future<void> agregarVideo() async {
            try {
              final f = await ImagePicker().pickVideo(source: ImageSource.camera);
              if (f != null) setSt(() => archivos.add(f));
            } catch (_) {}
          }

          Future<void> agregarDeGaleria() async {
            try {
              final files = await ImagePicker().pickMultipleMedia();
              if (files.isNotEmpty) setSt(() => archivos.addAll(files));
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
                  const SizedBox(height: 14),
                  DropdownButtonFormField<String>(
                    value: estadoReproductivo,
                    decoration: InputDecoration(
                      labelText: 'Estado reproductivo',
                      labelStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide(color: Colors.white.withOpacity(0.15)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: Color(0xFF2D9E3F)),
                      ),
                    ),
                    dropdownColor: const Color(0xFF0A2812),
                    style: const TextStyle(color: Colors.white),
                    items: const [
                      DropdownMenuItem(value: null, child: Text('Sin definir')),
                      DropdownMenuItem(value: 'PREÑADA', child: Text('🤰 Preñada')),
                      DropdownMenuItem(value: 'LACTANCIA', child: Text('🍼 Lactancia')),
                      DropdownMenuItem(value: 'PARIDA', child: Text('🐣 Parida')),
                      DropdownMenuItem(value: 'SECA', child: Text('🌿 Seca')),
                      DropdownMenuItem(value: 'VACIA', child: Text('⭕ Vacía')),
                    ],
                    onChanged: (v) => setSt(() => estadoReproductivo = v),
                  ),
                  const SizedBox(height: 16),
                  Text('Fotos y videos del animal', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
                  const SizedBox(height: 8),
                  if (archivos.isNotEmpty) ...[
                    SizedBox(
                      height: 72,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: archivos.length,
                        itemBuilder: (_, i) => Stack(
                          children: [
                            Container(
                              margin: const EdgeInsets.only(right: 8),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(10),
                                child: esVideo(archivos[i])
                                    ? Container(
                                        width: 72, height: 72,
                                        color: Colors.black45,
                                        child: const Icon(Icons.videocam, color: Color(0xFF2D9E3F), size: 30),
                                      )
                                    : Image.file(File(archivos[i].path), width: 72, height: 72, fit: BoxFit.cover),
                              ),
                            ),
                            Positioned(
                              top: 2, right: 10,
                              child: GestureDetector(
                                onTap: () => setSt(() => archivos.removeAt(i)),
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
                      botonFoto(Icons.camera_alt, 'Tomar foto', agregarFoto),
                      botonFoto(Icons.videocam, 'Grabar video', agregarVideo),
                      botonFoto(Icons.photo_library, 'Galería', agregarDeGaleria),
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

  static const _reproConfig = {
    'PREÑADA':  {'label': 'Preñada',   'emoji': '🤰', 'color': 0xFFE53E3E},
    'LACTANCIA': {'label': 'Lactancia', 'emoji': '🍼', 'color': 0xFF38A169},
    'PARIDA':    {'label': 'Parida',    'emoji': '🐣', 'color': 0xFFD69E2E},
    'SECA':      {'label': 'Seca',      'emoji': '🌿', 'color': 0xFF718096},
    'VACIA':     {'label': 'Vacía',     'emoji': '⭕', 'color': 0xFF718096},
  };

  Future<void> _registrarParto(String animalId, String nombreAnimal) async {
    final idCriaCtrl = TextEditingController();
    final nombreCriaCtrl = TextEditingController();
    final pesoCtrl = TextEditingController();
    String sexoCria = 'HEMBRA';
    final List<XFile> archivosCria = [];
    bool guardando = false;
    String? errorForm;

    bool esVideo(XFile f) {
      final p = f.path.toLowerCase();
      return p.endsWith('.mp4') || p.endsWith('.mov') || p.endsWith('.3gp') || p.endsWith('.webm');
    }

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF051908),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) {
          Future<void> guardar() async {
            if (idCriaCtrl.text.trim().isEmpty) {
              setSt(() => errorForm = 'El identificador de la cría es requerido');
              return;
            }
            setSt(() { guardando = true; errorForm = null; });
            try {
              await ApiClient.postMultipart(
                '/animales/$animalId/parto',
                {
                  'identificadorCria': idCriaCtrl.text.trim(),
                  if (nombreCriaCtrl.text.trim().isNotEmpty) 'nombreCria': nombreCriaCtrl.text.trim(),
                  'sexoCria': sexoCria,
                  if (pesoCtrl.text.trim().isNotEmpty) 'pesoNacimiento': pesoCtrl.text.trim(),
                },
                archivosCria.map((f) => f.path).toList(),
              );
              if (ctx.mounted) Navigator.pop(ctx);
              _load();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                  content: Text('✅ Parto registrado'),
                  backgroundColor: Color(0xFF1A6B2A),
                ));
              }
            } catch (e) {
              setSt(() { guardando = false; errorForm = e.toString().replaceFirst('Exception: ', ''); });
            }
          }

          Future<void> agregarFoto() async {
            try {
              final f = await ImagePicker().pickImage(source: ImageSource.camera, imageQuality: 80, maxWidth: 1600);
              if (f != null) setSt(() => archivosCria.add(f));
            } catch (_) {}
          }

          Future<void> agregarVideo() async {
            try {
              final f = await ImagePicker().pickVideo(source: ImageSource.camera);
              if (f != null) setSt(() => archivosCria.add(f));
            } catch (_) {}
          }

          Future<void> agregarDeGaleria() async {
            try {
              final files = await ImagePicker().pickMultipleMedia();
              if (files.isNotEmpty) setSt(() => archivosCria.addAll(files));
            } catch (_) {}
          }

          Widget botonMedia(IconData icono, String label, VoidCallback onTap) => Expanded(
            child: GestureDetector(
              onTap: guardando ? null : onTap,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 10),
                margin: const EdgeInsets.symmetric(horizontal: 3),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.07),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFF2D9E3F).withOpacity(0.4)),
                ),
                child: Column(
                  children: [
                    Icon(icono, color: const Color(0xFF2D9E3F), size: 20),
                    const SizedBox(height: 3),
                    Text(label, style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ),
          );

          InputDecoration deco(String label) => InputDecoration(
            labelText: label,
            labelStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.white.withOpacity(0.15))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFF2D9E3F))),
          );

          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('🐣 Registrar Parto — $nombreAnimal',
                      style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 4),
                  Text('La madre pasará a estado Parida automáticamente',
                      style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 12)),
                  const SizedBox(height: 16),
                  TextField(controller: idCriaCtrl, style: const TextStyle(color: Colors.white),
                      decoration: deco('Identificador / Arete de la cría *')),
                  const SizedBox(height: 12),
                  TextField(controller: nombreCriaCtrl, style: const TextStyle(color: Colors.white),
                      decoration: deco('Nombre de la cría')),
                  const SizedBox(height: 12),
                  TextField(controller: pesoCtrl,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      style: const TextStyle(color: Colors.white),
                      decoration: deco('Peso al nacer (kg)')),
                  const SizedBox(height: 12),
                  Text('Sexo de la cría', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
                  const SizedBox(height: 6),
                  Row(
                    children: ['HEMBRA', 'MACHO'].map((s) => Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: GestureDetector(
                          onTap: () => setSt(() => sexoCria = s),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: sexoCria == s ? (s == 'HEMBRA' ? const Color(0xFFD69E2E) : const Color(0xFF3182CE)) : Colors.white.withOpacity(0.07),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: s == 'HEMBRA' ? const Color(0xFFD69E2E) : const Color(0xFF3182CE)),
                            ),
                            child: Text(s == 'HEMBRA' ? '🐄 Hembra' : '🐂 Macho',
                                textAlign: TextAlign.center,
                                style: TextStyle(color: sexoCria == s ? Colors.white : Colors.white.withOpacity(0.6), fontWeight: FontWeight.w700)),
                          ),
                        ),
                      ),
                    )).toList(),
                  ),
                  const SizedBox(height: 14),
                  Text('📷 Fotos y 🎥 Videos de la cría',
                      style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
                  const SizedBox(height: 8),
                  if (archivosCria.isNotEmpty) ...[
                    SizedBox(
                      height: 66,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: archivosCria.length,
                        itemBuilder: (_, i) => Stack(
                          children: [
                            Container(
                              margin: const EdgeInsets.only(right: 8),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(10),
                                child: esVideo(archivosCria[i])
                                    ? Container(width: 66, height: 66, color: Colors.black45,
                                        child: const Icon(Icons.videocam, color: Color(0xFF2D9E3F), size: 28))
                                    : Image.file(File(archivosCria[i].path), width: 66, height: 66, fit: BoxFit.cover),
                              ),
                            ),
                            Positioned(
                              top: 2, right: 10,
                              child: GestureDetector(
                                onTap: () => setSt(() => archivosCria.removeAt(i)),
                                child: Container(
                                  padding: const EdgeInsets.all(2),
                                  decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                                  child: const Icon(Icons.close, color: Colors.white, size: 13),
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
                      botonMedia(Icons.camera_alt, 'Tomar foto', agregarFoto),
                      botonMedia(Icons.videocam, 'Grabar video', agregarVideo),
                      botonMedia(Icons.photo_library, 'Galería', agregarDeGaleria),
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
                      backgroundColor: const Color(0xFFE53E3E),
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(48),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: Text(guardando ? 'Guardando...' : '🐣 Registrar Parto',
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

  Widget _animalTile(Map<String, dynamic> a) {
    final media = (a['media'] as List?) ?? [];
    final fotos = media.where((m) => m['tipo'] == 'FOTO').toList();
    final foto = fotos.isNotEmpty ? fotos.first['url'] as String? : null;
    final estadoColor = _estadoColor(a['estado']);
    final repro = a['estadoReproductivo'] as String?;
    final reproInfo = repro != null ? _reproConfig[repro] : null;
    final esPrenada = repro == 'PREÑADA' && a['estado'] == 'ACTIVO' && a['sexo'] == 'HEMBRA';

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
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
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
                          if (reproInfo != null) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: Color(reproInfo['color'] as int).withOpacity(0.15),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: Color(reproInfo['color'] as int).withOpacity(0.5)),
                              ),
                              child: Text('${reproInfo['emoji']} ${reproInfo['label']}',
                                  style: TextStyle(color: Color(reproInfo['color'] as int), fontSize: 10, fontWeight: FontWeight.w700)),
                            ),
                          ],
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
            if (esPrenada) ...[
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => _registrarParto(a['id'], a['nombre'] ?? a['identificador']),
                  icon: const Text('🐣', style: TextStyle(fontSize: 14)),
                  label: const Text('Registrar Parto', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF7B1C1C),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    elevation: 0,
                  ),
                ),
              ),
            ],
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
