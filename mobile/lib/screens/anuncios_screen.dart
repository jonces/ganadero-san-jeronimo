import 'package:flutter/material.dart';
import '../api_client.dart';

const _emojis = ['📢', '⚠️', '✅', '🎯', '📌', '🔔', '💡', '🚀', '❗', '🙌'];

String _timeAgo(String? dateStr) {
  final d = DateTime.tryParse(dateStr ?? '');
  if (d == null) return '—';
  final diff = DateTime.now().difference(d);
  if (diff.inMinutes < 1) return 'Hace un momento';
  if (diff.inMinutes < 60) return 'Hace ${diff.inMinutes} min';
  if (diff.inHours < 24) return 'Hace ${diff.inHours} h';
  return '${d.day}/${d.month}/${d.year}';
}

class AnunciosScreen extends StatefulWidget {
  const AnunciosScreen({super.key});

  @override
  State<AnunciosScreen> createState() => _AnunciosScreenState();
}

class _AnunciosScreenState extends State<AnunciosScreen> {
  List<dynamic> _anuncios = [];
  bool _loading = true;
  bool _esAdmin = false;
  String? _miId;
  String? _error;
  final Set<String> _abiertos = {};

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final u = await ApiClient.usuarioActual();
    _esAdmin = u['role'] == 'ADMIN' || u['role'] == 'SUPER_ADMIN';
    _miId = u['sub'];
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await ApiClient.get('/anuncios');
      setState(() { _anuncios = data ?? []; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString().replaceFirst('Exception: ', ''); _loading = false; });
    }
  }

  Future<bool> _confirmar(String titulo) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF051908),
        title: Text(titulo, style: const TextStyle(color: Colors.white, fontSize: 16)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Eliminar', style: TextStyle(color: Colors.redAccent))),
        ],
      ),
    );
    return ok == true;
  }

  Future<void> _eliminarAnuncio(String id) async {
    if (!await _confirmar('¿Eliminar este anuncio?')) return;
    try { await ApiClient.delete('/anuncios/$id'); _load(); } catch (_) {}
  }

  Future<void> _eliminarComentario(String anuncioId, String comentarioId) async {
    if (!await _confirmar('¿Eliminar comentario?')) return;
    try { await ApiClient.delete('/anuncios/$anuncioId/comentarios/$comentarioId'); _load(); } catch (_) {}
  }

  Future<void> _comentar(String anuncioId, String mensaje) async {
    try {
      await ApiClient.post('/anuncios/$anuncioId/comentarios', {'mensaje': mensaje});
      _abiertos.add(anuncioId);
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', '')), backgroundColor: Colors.red[800]));
      }
    }
  }

  Future<void> _nuevoAnuncio() async {
    final tituloCtrl = TextEditingController();
    final mensajeCtrl = TextEditingController();
    String emoji = '📢';
    bool guardando = false;
    String? errorForm;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF051908),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) {
          Future<void> publicar() async {
            if (tituloCtrl.text.trim().isEmpty || mensajeCtrl.text.trim().isEmpty) {
              setSt(() => errorForm = 'Título y mensaje son requeridos');
              return;
            }
            setSt(() { guardando = true; errorForm = null; });
            try {
              await ApiClient.post('/anuncios', {
                'titulo': tituloCtrl.text.trim(),
                'mensaje': mensajeCtrl.text.trim(),
                'emoji': emoji,
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
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFF3182CE))),
              );

          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('✏️ Redactar Anuncio', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 16),
                  Text('TIPO DE MENSAJE', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 11, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8, runSpacing: 8,
                    children: _emojis.map((em) {
                      final sel = emoji == em;
                      return GestureDetector(
                        onTap: () => setSt(() => emoji = em),
                        child: Container(
                          width: 42, height: 42,
                          decoration: BoxDecoration(
                            color: sel ? const Color(0xFF2D9E3F).withOpacity(0.4) : Colors.white.withOpacity(0.07),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: sel ? const Color(0xFF2D9E3F) : Colors.white.withOpacity(0.1), width: sel ? 2 : 1),
                          ),
                          child: Center(child: Text(em, style: const TextStyle(fontSize: 20))),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 14),
                  TextField(controller: tituloCtrl, style: const TextStyle(color: Colors.white),
                      decoration: deco('Título * (ej: Reunión mañana a las 7am)')),
                  const SizedBox(height: 12),
                  TextField(controller: mensajeCtrl, maxLines: 4, style: const TextStyle(color: Colors.white),
                      decoration: deco('Mensaje para tu equipo *')),
                  if (errorForm != null) ...[
                    const SizedBox(height: 12),
                    Text(errorForm!, style: const TextStyle(color: Colors.redAccent, fontSize: 13)),
                  ],
                  const SizedBox(height: 18),
                  ElevatedButton(
                    onPressed: guardando ? null : publicar,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF3182CE),
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: Text(guardando ? 'Publicando...' : '📢 Publicar Anuncio',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
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
        title: const Text('📣 Tablón de Anuncios', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
        actions: [
          if (_esAdmin)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Container(
                decoration: BoxDecoration(color: const Color(0xFF2D9E3F), borderRadius: BorderRadius.circular(12)),
                child: IconButton(onPressed: _nuevoAnuncio, icon: const Icon(Icons.edit, color: Colors.white, size: 20)),
              ),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF2D9E3F)))
          : _error != null
              ? Center(child: Text(_error!, style: TextStyle(color: Colors.white.withOpacity(0.5))))
              : _anuncios.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text('📭', style: TextStyle(fontSize: 48)),
                          const SizedBox(height: 12),
                          Text('Sin anuncios todavía', style: TextStyle(color: Colors.white.withOpacity(0.5), fontWeight: FontWeight.w700)),
                          Text(
                            _esAdmin ? 'Publica tu primer anuncio para informar a tu equipo' : 'Aquí aparecerán los mensajes de tu administrador',
                            style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 12),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      color: const Color(0xFF2D9E3F),
                      child: ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                        itemCount: _anuncios.length,
                        itemBuilder: (ctx, i) => _anuncioCard(_anuncios[i], i),
                      ),
                    ),
    );
  }

  Widget _rolBadge(String? role) {
    final map = {
      'ADMIN': {'label': 'Admin', 'color': const Color(0xFF805AD5)},
      'TRABAJADOR': {'label': 'Trabajador', 'color': const Color(0xFF2D9E3F)},
      'SUPER_ADMIN': {'label': 'SuperAdmin', 'color': const Color(0xFFC53030)},
    };
    final r = map[role] ?? {'label': role ?? '', 'color': Colors.grey};
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(color: r['color'] as Color, borderRadius: BorderRadius.circular(10)),
      child: Text(r['label'] as String, style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w800)),
    );
  }

  Widget _anuncioCard(Map<String, dynamic> a, int idx) {
    final colores = [
      const [Color(0xFF2D9E3F), Color(0xFF27AE60)],
      const [Color(0xFF3182CE), Color(0xFF2980B9)],
      const [Color(0xFFD69E2E), Color(0xFFF39C12)],
      const [Color(0xFF805AD5), Color(0xFF6B46C1)],
    ];
    final comentarios = (a['comentarios'] as List?) ?? [];
    final abierto = _abiertos.contains(a['id']);
    final comentarioCtrl = TextEditingController();

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: const Color(0xFF051908).withOpacity(0.85),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 4,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: colores[idx % colores.length]),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(a['emoji'] ?? '📢', style: const TextStyle(fontSize: 30)),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(a['titulo'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
                          const SizedBox(height: 6),
                          Text(a['mensaje'] ?? '', style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 13, height: 1.4)),
                        ],
                      ),
                    ),
                    if (_esAdmin)
                      IconButton(
                        onPressed: () => _eliminarAnuncio(a['id']),
                        icon: Icon(Icons.delete_outline, color: Colors.white.withOpacity(0.3), size: 20),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Text(a['autor']?['nombre'] ?? '', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 11, fontWeight: FontWeight.w600)),
                    const SizedBox(width: 6),
                    _rolBadge(a['autor']?['role']),
                    const SizedBox(width: 8),
                    Text(_timeAgo(a['createdAt']), style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 11)),
                  ],
                ),
                Divider(color: Colors.white.withOpacity(0.08), height: 22),
                GestureDetector(
                  onTap: () => setState(() => abierto ? _abiertos.remove(a['id']) : _abiertos.add(a['id'])),
                  child: Text(
                    '💬 ${comentarios.length} ${comentarios.length == 1 ? 'comentario' : 'comentarios'}  ${abierto ? '▲ ocultar' : '▼ ver'}',
                    style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12, fontWeight: FontWeight.w700),
                  ),
                ),
                if (abierto) ...[
                  const SizedBox(height: 10),
                  ...comentarios.map<Widget>((c) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 28, height: 28,
                              decoration: BoxDecoration(
                                gradient: LinearGradient(colors: c['autor']?['role'] == 'ADMIN'
                                    ? const [Color(0xFF44337A), Color(0xFF805AD5)]
                                    : const [Color(0xFF1A6B2A), Color(0xFF2D9E3F)]),
                                shape: BoxShape.circle,
                              ),
                              child: Center(
                                child: Text((c['autor']?['nombre'] ?? '?').toString().substring(0, 1).toUpperCase(),
                                    style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w900)),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.07),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: Colors.white.withOpacity(0.1)),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Text(c['autor']?['nombre'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
                                        const SizedBox(width: 6),
                                        _rolBadge(c['autor']?['role']),
                                        const Spacer(),
                                        Text(_timeAgo(c['createdAt']), style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 10)),
                                        if (c['autorId'] == _miId || _esAdmin)
                                          GestureDetector(
                                            onTap: () => _eliminarComentario(a['id'], c['id']),
                                            child: Padding(
                                              padding: const EdgeInsets.only(left: 8),
                                              child: Icon(Icons.delete_outline, color: Colors.white.withOpacity(0.3), size: 15),
                                            ),
                                          ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(c['mensaje'] ?? '', style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 12)),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      )),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: comentarioCtrl,
                          style: const TextStyle(color: Colors.white, fontSize: 13),
                          decoration: InputDecoration(
                            hintText: 'Escribe un comentario...',
                            hintStyle: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 13),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.15))),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF2D9E3F))),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: () {
                          final txt = comentarioCtrl.text.trim();
                          if (txt.isNotEmpty) {
                            comentarioCtrl.clear();
                            _comentar(a['id'], txt);
                          }
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(colors: [Color(0xFF1A6B2A), Color(0xFF2D9E3F)]),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text('Enviar', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w800)),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
