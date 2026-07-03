import 'dart:async';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:video_player/video_player.dart';
import '../api_client.dart';

const _tipos = ['VACUNACION', 'TRATAMIENTO', 'PESAJE', 'PARTO', 'OBSERVACION', 'MOVIMIENTO'];
const _tipoEmoji = {
  'VACUNACION': '💉', 'TRATAMIENTO': '🩺', 'PESAJE': '⚖️',
  'PARTO': '🐣', 'OBSERVACION': '👁️', 'MOVIMIENTO': '🚚',
};

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
  bool _showForm = false;
  int _mediaSel = 0;
  VideoPlayerController? _videoCtrl;
  String? _videoUrl;

  @override
  void initState() {
    super.initState();
    _load();
    _timer = Timer.periodic(const Duration(seconds: 30), (_) => _load());
  }

  @override
  void dispose() {
    _timer?.cancel();
    _videoCtrl?.dispose();
    _descripcionCtrl.dispose();
    _pesoCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final data = await ApiClient.get('/animales/${widget.animalId}');
      if (mounted) setState(() { _animal = data; _error = null; });
    } catch (e) {
      if (mounted) setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _enviarReporte() async {
    if (_descripcionCtrl.text.trim().isEmpty && _tipo == 'OBSERVACION') return;
    setState(() => _enviando = true);
    try {
      await ApiClient.postMultipart(
        '/eventos',
        {
          'animalId': widget.animalId,
          'tipo': _tipo,
          if (_descripcionCtrl.text.isNotEmpty) 'descripcion': _descripcionCtrl.text.trim(),
          if (_pesoCtrl.text.isNotEmpty) 'peso': _pesoCtrl.text,
        },
        _archivos.map((f) => f.path).toList(),
      );
      _descripcionCtrl.clear();
      _pesoCtrl.clear();
      setState(() { _archivos.clear(); _showForm = false; });
      _load();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('✅ Reporte guardado'), backgroundColor: Color(0xFF2D9E3F)));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('Exception: ', '')), backgroundColor: Colors.red[800]));
    } finally {
      if (mounted) setState(() => _enviando = false);
    }
  }

  Color _estadoColor(String? e) {
    switch (e) {
      case 'ACTIVO': return const Color(0xFF2D9E3F);
      case 'VENDIDO': return const Color(0xFFD69E2E);
      case 'MUERTO': return Colors.red;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) return Scaffold(
      backgroundColor: const Color(0xFF020F05),
      appBar: AppBar(title: const Text('Error')),
      body: Center(child: Text(_error!, style: TextStyle(color: Colors.white.withOpacity(0.5)))),
    );
    if (_animal == null) return const Scaffold(
      backgroundColor: Color(0xFF020F05),
      body: Center(child: CircularProgressIndicator(color: Color(0xFF2D9E3F))),
    );

    final eventos = (_animal!['eventos'] as List?) ?? [];
    final media = (_animal!['media'] as List?) ?? [];
    final estadoColor = _estadoColor(_animal!['estado']);

    return Scaffold(
      backgroundColor: const Color(0xFF020F05),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            backgroundColor: const Color(0xFF020F05),
            foregroundColor: Colors.white,
            title: Text(_animal!['nombre'] ?? _animal!['identificador'],
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
            actions: [
              IconButton(
                onPressed: () => setState(() => _showForm = !_showForm),
                icon: Container(
                  width: 34, height: 34,
                  decoration: BoxDecoration(
                    color: _showForm ? Colors.grey.withOpacity(0.3) : const Color(0xFF2D9E3F).withOpacity(0.3),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFF2D9E3F).withOpacity(0.5)),
                  ),
                  child: Icon(_showForm ? Icons.close : Icons.add, color: Colors.white, size: 18),
                ),
              ),
              const SizedBox(width: 8),
            ],
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Galería de fotos y videos (como en la web)
                  if (media.isNotEmpty) ...[
                    _visorMedia(media),
                    const SizedBox(height: 16),
                  ],

                  // Info básica
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF051908).withOpacity(0.85),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white.withOpacity(0.08)),
                    ),
                    child: Column(
                      children: [
                        _infoRow('Identificador', _animal!['identificador'] ?? '—'),
                        _infoRow('Raza', _animal!['raza'] ?? 'Sin raza'),
                        _infoRow('Sexo', _animal!['sexo'] ?? '—'),
                        _infoRow('Peso actual', _animal!['pesoActual'] != null ? '${_animal!['pesoActual']} kg' : '—'),
                        if (_animal!['fechaNacimiento'] != null)
                          _infoRow('Nacimiento', _animal!['fechaNacimiento'].toString().substring(0, 10)),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Estado', style: TextStyle(color: Colors.white.withOpacity(0.45), fontSize: 13)),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                              decoration: BoxDecoration(color: estadoColor.withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
                              child: Text(_animal!['estado'] ?? '', style: TextStyle(color: estadoColor, fontWeight: FontWeight.w700, fontSize: 12)),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Formulario nuevo reporte
                  if (_showForm) ...[
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF051908).withOpacity(0.85),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFF2D9E3F).withOpacity(0.3)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Text('Nuevo reporte', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
                          const SizedBox(height: 12),
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: _tipos.map((t) => GestureDetector(
                                onTap: () => setState(() => _tipo = t),
                                child: Container(
                                  margin: const EdgeInsets.only(right: 8),
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: _tipo == t ? const Color(0xFF2D9E3F) : Colors.white.withOpacity(0.07),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: _tipo == t ? const Color(0xFF2D9E3F) : Colors.white.withOpacity(0.15)),
                                  ),
                                  child: Text('${_tipoEmoji[t]} $t',
                                      style: TextStyle(color: _tipo == t ? Colors.white : Colors.white.withOpacity(0.6), fontSize: 12, fontWeight: FontWeight.w600)),
                                ),
                              )).toList(),
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _descripcionCtrl,
                            style: const TextStyle(color: Colors.white),
                            maxLines: 3,
                            decoration: const InputDecoration(labelText: 'Descripción', hintText: 'Escribe los detalles...'),
                          ),
                          if (_tipo == 'PESAJE') ...[
                            const SizedBox(height: 10),
                            TextField(
                              controller: _pesoCtrl,
                              style: const TextStyle(color: Colors.white),
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(labelText: 'Peso (kg)', prefixText: '⚖️ '),
                            ),
                          ],
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              _mediaBtn(Icons.camera_alt, 'Foto', () async {
                                final f = await ImagePicker().pickImage(source: ImageSource.camera);
                                if (f != null) setState(() => _archivos.add(f));
                              }),
                              const SizedBox(width: 8),
                              _mediaBtn(Icons.videocam, 'Video', () async {
                                final f = await ImagePicker().pickVideo(source: ImageSource.camera);
                                if (f != null) setState(() => _archivos.add(f));
                              }),
                              const SizedBox(width: 8),
                              _mediaBtn(Icons.photo_library, 'Galería', () async {
                                final files = await ImagePicker().pickMultipleMedia();
                                setState(() => _archivos.addAll(files));
                              }),
                            ],
                          ),
                          if (_archivos.isNotEmpty) ...[
                            const SizedBox(height: 8),
                            Text('📎 ${_archivos.length} archivo(s)',
                                style: const TextStyle(color: Color(0xFF2D9E3F), fontSize: 12, fontWeight: FontWeight.w600)),
                          ],
                          const SizedBox(height: 14),
                          ElevatedButton(
                            onPressed: _enviando ? null : _enviarReporte,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF2D9E3F),
                              foregroundColor: Colors.white,
                              minimumSize: const Size.fromHeight(46),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: _enviando
                                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                : const Text('Guardar reporte', style: TextStyle(fontWeight: FontWeight.w800)),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Historial
                  Text('📋 Historial (${eventos.length})',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
                  const SizedBox(height: 10),
                  if (eventos.isEmpty)
                    Center(child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text('Sin reportes todavía', style: TextStyle(color: Colors.white.withOpacity(0.3))),
                    ))
                  else
                    ...eventos.map<Widget>((ev) => _eventoTile(ev)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Galería de media estilo web: visor grande + miniaturas ──
  Widget _visorMedia(List media) {
    if (_mediaSel >= media.length) _mediaSel = 0;
    final m = media[_mediaSel];
    final esVideo = m['tipo'] == 'VIDEO';
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFF051908).withOpacity(0.85),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Column(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Container(
              height: 230,
              width: double.infinity,
              color: Colors.black,
              child: esVideo
                  ? _reproductorVideo(m['url'])
                  : CachedNetworkImage(
                      imageUrl: m['url'],
                      fit: BoxFit.contain,
                      placeholder: (_, __) => const Center(child: CircularProgressIndicator(color: Color(0xFF2D9E3F))),
                      errorWidget: (_, __, ___) => const Center(child: Icon(Icons.broken_image, color: Colors.white24, size: 40)),
                    ),
            ),
          ),
          if (media.length > 1) ...[
            const SizedBox(height: 10),
            SizedBox(
              height: 62,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: media.length,
                itemBuilder: (_, i) {
                  final mi = media[i];
                  final sel = i == _mediaSel;
                  return GestureDetector(
                    onTap: () => _seleccionarMedia(i, media),
                    child: Container(
                      width: 62,
                      margin: const EdgeInsets.only(right: 8),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: sel ? const Color(0xFF2D9E3F) : Colors.white.withOpacity(0.12),
                          width: sel ? 2 : 1,
                        ),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: mi['tipo'] == 'FOTO'
                            ? CachedNetworkImage(imageUrl: mi['url'], fit: BoxFit.cover)
                            : Container(
                                color: const Color(0xFF0A2812),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(Icons.play_circle_fill, color: Color(0xFF2D9E3F), size: 24),
                                    Text('VIDEO', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 8, fontWeight: FontWeight.w800)),
                                  ],
                                ),
                              ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _seleccionarMedia(int i, List media) {
    setState(() => _mediaSel = i);
    if (media[i]['tipo'] != 'VIDEO') _videoCtrl?.pause();
  }

  Widget _reproductorVideo(String url) {
    if (_videoUrl != url) {
      _videoCtrl?.dispose();
      _videoUrl = url;
      _videoCtrl = VideoPlayerController.networkUrl(Uri.parse(url))
        ..initialize().then((_) { if (mounted) setState(() {}); });
    }
    final c = _videoCtrl!;
    if (!c.value.isInitialized) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFF2D9E3F)));
    }
    return Stack(
      alignment: Alignment.center,
      children: [
        Center(child: AspectRatio(aspectRatio: c.value.aspectRatio, child: VideoPlayer(c))),
        GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () => setState(() => c.value.isPlaying ? c.pause() : c.play()),
          child: AnimatedOpacity(
            opacity: c.value.isPlaying ? 0 : 1,
            duration: const Duration(milliseconds: 200),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
              child: const Icon(Icons.play_arrow, color: Colors.white, size: 42),
            ),
          ),
        ),
        Positioned(
          left: 0, right: 0, bottom: 0,
          child: VideoProgressIndicator(
            c,
            allowScrubbing: true,
            colors: const VideoProgressColors(
              playedColor: Color(0xFF2D9E3F),
              bufferedColor: Colors.white24,
              backgroundColor: Colors.white10,
            ),
          ),
        ),
      ],
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.white.withOpacity(0.45), fontSize: 13)),
          Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
        ],
      ),
    );
  }

  Widget _mediaBtn(IconData icon, String label, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.06),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: Colors.white.withOpacity(0.12)),
          ),
          child: Column(
            children: [
              Icon(icon, color: const Color(0xFF2D9E3F), size: 20),
              const SizedBox(height: 2),
              Text(label, style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 11)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _eventoTile(Map<String, dynamic> ev) {
    final media = (ev['media'] as List?) ?? [];
    final fecha = DateTime.tryParse(ev['fecha'] ?? '');
    final fechaStr = fecha != null ? '${fecha.day}/${fecha.month}/${fecha.year} ${fecha.hour}:${fecha.minute.toString().padLeft(2, '0')}' : '—';
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF051908).withOpacity(0.85),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withOpacity(0.07)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('${_tipoEmoji[ev['tipo']] ?? '📝'} ${ev['tipo']}',
                  style: const TextStyle(color: Color(0xFF4ADE80), fontWeight: FontWeight.w700, fontSize: 13)),
              const Spacer(),
              Text(fechaStr, style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 11)),
            ],
          ),
          if (ev['descripcion'] != null && (ev['descripcion'] as String).isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(ev['descripcion'], style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 13)),
          ],
          if (ev['peso'] != null) ...[
            const SizedBox(height: 4),
            Text('⚖️ Peso: ${ev['peso']} kg', style: const TextStyle(color: Color(0xFFD69E2E), fontSize: 12, fontWeight: FontWeight.w600)),
          ],
          if (media.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 6, runSpacing: 6,
              children: media.map<Widget>((m) => ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: m['tipo'] == 'FOTO'
                    ? CachedNetworkImage(imageUrl: m['url'], width: 72, height: 72, fit: BoxFit.cover)
                    : Container(width: 72, height: 72, color: Colors.white10,
                        child: const Icon(Icons.play_circle_outline, color: Colors.white54, size: 32)),
              )).toList(),
            ),
          ],
          if (ev['usuario'] != null) ...[
            const SizedBox(height: 6),
            Text('👤 ${ev['usuario']['nombre']}', style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 11)),
          ],
        ],
      ),
    );
  }
}
