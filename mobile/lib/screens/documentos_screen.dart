import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';
import '../api_client.dart';

const _tiposDoc = [
  {'value': 'FIERRO_ANUAL', 'label': '🔥 Fierro Anual', 'color': Color(0xFFE53E3E)},
  {'value': 'PERMISO_ALCALDIA', 'label': '🏛️ Permiso de Alcaldía', 'color': Color(0xFF3182CE)},
  {'value': 'CARTA_VENTA', 'label': '📝 Carta de Venta', 'color': Color(0xFF2D9E3F)},
  {'value': 'OTRO', 'label': '📎 Otro Documento', 'color': Color(0xFF718096)},
];

class DocumentosScreen extends StatefulWidget {
  const DocumentosScreen({super.key});

  @override
  State<DocumentosScreen> createState() => _DocumentosScreenState();
}

class _DocumentosScreenState extends State<DocumentosScreen> {
  List<dynamic> _docs = [];
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
      final data = await ApiClient.get('/documentos');
      setState(() { _docs = data ?? []; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString().replaceFirst('Exception: ', ''); _loading = false; });
    }
  }

  Future<void> _eliminar(String id) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF051908),
        title: const Text('¿Eliminar este documento?', style: TextStyle(color: Colors.white, fontSize: 16)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Eliminar', style: TextStyle(color: Colors.redAccent))),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ApiClient.delete('/documentos/$id');
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', '')), backgroundColor: Colors.red[800]));
      }
    }
  }

  Future<void> _subirDocumento() async {
    final nombreCtrl = TextEditingController();
    String tipo = 'FIERRO_ANUAL';
    String? archivoPath;
    String? archivoNombre;
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
            if (nombreCtrl.text.trim().isEmpty) { setSt(() => errorForm = 'El nombre del documento es requerido'); return; }
            if (archivoPath == null) { setSt(() => errorForm = 'Selecciona el archivo (PDF o imagen)'); return; }
            setSt(() { guardando = true; errorForm = null; });
            try {
              await ApiClient.postMultipartCampo(
                '/documentos',
                {'nombre': nombreCtrl.text.trim(), 'tipo': tipo},
                'archivo',
                archivoPath!,
              );
              if (ctx.mounted) Navigator.pop(ctx);
              _load();
            } catch (e) {
              setSt(() { guardando = false; errorForm = e.toString().replaceFirst('Exception: ', ''); });
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
                  const Text('📄 Subir Documento', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 16),
                  TextField(
                    controller: nombreCtrl,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      labelText: 'Nombre del documento * (ej: Fierro anual 2026)',
                      labelStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.white.withOpacity(0.15))),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFF3182CE))),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text('TIPO', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 11, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8, runSpacing: 8,
                    children: _tiposDoc.map((t) {
                      final sel = tipo == t['value'];
                      final color = t['color'] as Color;
                      return GestureDetector(
                        onTap: () => setSt(() => tipo = t['value'] as String),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: sel ? color : Colors.white.withOpacity(0.06),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: color.withOpacity(sel ? 1 : 0.5)),
                          ),
                          child: Text(t['label'] as String,
                              style: TextStyle(color: sel ? Colors.white : Colors.white.withOpacity(0.7), fontSize: 12, fontWeight: FontWeight.w700)),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 14),
                  GestureDetector(
                    onTap: guardando ? null : () async {
                      final res = await FilePicker.platform.pickFiles(
                        type: FileType.custom,
                        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'heic'],
                      );
                      if (res != null && res.files.single.path != null) {
                        setSt(() {
                          archivoPath = res.files.single.path;
                          archivoNombre = res.files.single.name;
                        });
                      }
                    },
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFF3182CE).withOpacity(0.5), style: BorderStyle.solid),
                        color: Colors.white.withOpacity(0.04),
                      ),
                      child: Column(
                        children: [
                          const Text('📎', style: TextStyle(fontSize: 26)),
                          const SizedBox(height: 4),
                          Text(
                            archivoNombre ?? 'Toca para seleccionar el archivo (PDF o imagen)',
                            style: TextStyle(
                              color: archivoNombre != null ? const Color(0xFF4ADE80) : Colors.white.withOpacity(0.5),
                              fontSize: 12, fontWeight: FontWeight.w600,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
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
                        backgroundColor: const Color(0xFF3182CE),
                        padding: const EdgeInsets.symmetric(vertical: 15),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: Text(guardando ? 'Subiendo...' : 'Guardar Documento',
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
      appBar: AppBar(
        backgroundColor: const Color(0xFF020F05),
        foregroundColor: Colors.white,
        title: const Text('📄 Documentos Legales', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Container(
              decoration: BoxDecoration(color: const Color(0xFF3182CE), borderRadius: BorderRadius.circular(12)),
              child: IconButton(onPressed: _subirDocumento, icon: const Icon(Icons.add, color: Colors.white)),
            ),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF3182CE)))
          : _error != null
              ? Center(child: Text(_error!, style: TextStyle(color: Colors.white.withOpacity(0.5))))
              : _docs.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text('📄', style: TextStyle(fontSize: 48)),
                          const SizedBox(height: 12),
                          Text('Sin documentos aún', style: TextStyle(color: Colors.white.withOpacity(0.5), fontWeight: FontWeight.w700)),
                          Text('Sube tus certificados y permisos legales', style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 12)),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      color: const Color(0xFF3182CE),
                      child: ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                        itemCount: _docs.length,
                        itemBuilder: (ctx, i) => _docTile(_docs[i]),
                      ),
                    ),
    );
  }

  Widget _docTile(Map<String, dynamic> doc) {
    final t = _tiposDoc.firstWhere((x) => x['value'] == doc['tipo'], orElse: () => _tiposDoc[3]);
    final color = t['color'] as Color;
    final url = doc['url'] as String? ?? '';
    final esImagen = RegExp(r'\.(jpg|jpeg|png|gif|webp)$', caseSensitive: false).hasMatch(url);
    final esPDF = RegExp(r'\.pdf$', caseSensitive: false).hasMatch(url);
    final fecha = DateTime.tryParse(doc['createdAt'] ?? '');
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF051908).withOpacity(0.85),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (esImagen)
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              child: CachedNetworkImage(imageUrl: url, height: 140, fit: BoxFit.cover),
            ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Text(esPDF ? '📄' : esImagen ? '🖼️' : '📎', style: const TextStyle(fontSize: 26)),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(doc['nombre'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14)),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(10)),
                        child: Text(t['label'] as String, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700)),
                      ),
                      if (fecha != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text('${fecha.day}/${fecha.month}/${fecha.year}', style: TextStyle(color: Colors.white.withOpacity(0.35), fontSize: 11)),
                        ),
                    ],
                  ),
                ),
                Column(
                  children: [
                    GestureDetector(
                      onTap: () => launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(10)),
                        child: Text(esPDF ? 'Ver PDF' : 'Ver', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800)),
                      ),
                    ),
                    const SizedBox(height: 6),
                    GestureDetector(
                      onTap: () => _eliminar(doc['id']),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(color: const Color(0xFFE53E3E), borderRadius: BorderRadius.circular(10)),
                        child: const Text('🗑️', style: TextStyle(fontSize: 11)),
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
