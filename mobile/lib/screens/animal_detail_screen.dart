import 'dart:async';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../api_client.dart';

const tipos = ['VACUNACION', 'TRATAMIENTO', 'PESAJE', 'PARTO', 'OBSERVACION', 'MOVIMIENTO'];

class AnimalDetailScreen extends StatefulWidget {
  final String animalId;
  const AnimalDetailScreen({super.key, required this.animalId});

  @override
  State<AnimalDetailScreen> createState() => _AnimalDetailScreenState();
}

class _AnimalDetailScreenState extends State<AnimalDetailScreen> {
  Map<String, dynamic>? _animal;
  String? _error;
  Timer? _timer;

  String _tipo = 'OBSERVACION';
  final _descripcionCtrl = TextEditingController();
  final _pesoCtrl = TextEditingController();
  final List<XFile> _archivos = [];
  bool _enviando = false;

  @override
  void initState() {
    super.initState();
    _load();
    _timer = Timer.periodic(const Duration(seconds: 15), (_) => _load());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final data = await ApiClient.get('/animales/${widget.animalId}');
      setState(() {
        _animal = data;
        _error = null;
      });
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _tomarFoto() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.camera);
    if (picked != null) setState(() => _archivos.add(picked));
  }

  Future<void> _grabarVideo() async {
    final picked = await ImagePicker().pickVideo(source: ImageSource.camera);
    if (picked != null) setState(() => _archivos.add(picked));
  }

  Future<void> _elegirGaleria() async {
    final picked = await ImagePicker().pickMultipleMedia();
    if (picked.isNotEmpty) setState(() => _archivos.addAll(picked));
  }

  Future<void> _enviarReporte() async {
    setState(() => _enviando = true);
    try {
      await ApiClient.postMultipart(
        '/eventos',
        {
          'animalId': widget.animalId,
          'tipo': _tipo,
          'descripcion': _descripcionCtrl.text,
          if (_pesoCtrl.text.isNotEmpty) 'peso': _pesoCtrl.text,
        },
        _archivos.map((f) => f.path).toList(),
      );
      _descripcionCtrl.clear();
      _pesoCtrl.clear();
      setState(() => _archivos.clear());
      _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      setState(() => _enviando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) return Scaffold(body: Center(child: Text(_error!)));
    if (_animal == null) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    final eventos = (_animal!['eventos'] as List?) ?? [];

    return Scaffold(
      appBar: AppBar(title: Text(_animal!['nombre'] ?? _animal!['identificador'])),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('${_animal!['raza'] ?? 'Sin raza'} · ${_animal!['sexo']} · Peso: ${_animal!['pesoActual'] ?? '—'} kg'),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('Nuevo reporte', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: _tipo,
                    items: tipos.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                    onChanged: (v) => setState(() => _tipo = v ?? _tipo),
                  ),
                  TextField(controller: _descripcionCtrl, decoration: const InputDecoration(labelText: 'Descripción')),
                  if (_tipo == 'PESAJE')
                    TextField(
                      controller: _pesoCtrl,
                      decoration: const InputDecoration(labelText: 'Peso (kg)'),
                      keyboardType: TextInputType.number,
                    ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      OutlinedButton.icon(onPressed: _tomarFoto, icon: const Icon(Icons.camera_alt), label: const Text('Foto')),
                      OutlinedButton.icon(onPressed: _grabarVideo, icon: const Icon(Icons.videocam), label: const Text('Video')),
                      OutlinedButton.icon(onPressed: _elegirGaleria, icon: const Icon(Icons.photo_library), label: const Text('Galería')),
                    ],
                  ),
                  if (_archivos.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Text('${_archivos.length} archivo(s) adjunto(s)'),
                    ),
                  const SizedBox(height: 8),
                  FilledButton(
                    onPressed: _enviando ? null : _enviarReporte,
                    child: _enviando ? const CircularProgressIndicator() : const Text('Guardar reporte'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          const Text('Historial', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          ...eventos.map((ev) {
            final media = (ev['media'] as List?) ?? [];
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(ev['tipo'], style: TextStyle(color: Colors.green[800], fontWeight: FontWeight.bold)),
                        Text(ev['fecha'].toString().substring(0, 16)),
                      ],
                    ),
                    if ((ev['descripcion'] ?? '').toString().isNotEmpty) Text(ev['descripcion']),
                    if (ev['peso'] != null) Text('Peso registrado: ${ev['peso']} kg'),
                    if (media.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: media.map<Widget>((m) {
                            if (m['tipo'] == 'FOTO') {
                              return ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.network(m['url'], width: 80, height: 80, fit: BoxFit.cover),
                              );
                            }
                            return Container(
                              width: 80,
                              height: 80,
                              color: Colors.black12,
                              child: const Icon(Icons.play_circle, size: 32),
                            );
                          }).toList(),
                        ),
                      ),
                  ],
                ),
              ),
            );
          }),
          if (eventos.isEmpty) const Text('Sin reportes todavía.'),
        ],
      ),
    );
  }
}
