import 'package:flutter/material.dart';
import '../api_client.dart';

class EquipoScreen extends StatefulWidget {
  const EquipoScreen({super.key});

  @override
  State<EquipoScreen> createState() => _EquipoScreenState();
}

class _EquipoScreenState extends State<EquipoScreen> {
  List<dynamic> _equipo = [];
  bool _loading = true;
  bool _esAdmin = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final u = await ApiClient.usuarioActual();
    _esAdmin = u['role'] == 'ADMIN' || u['role'] == 'SUPER_ADMIN';
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await ApiClient.get('/equipo');
      setState(() { _equipo = data ?? []; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString().replaceFirst('Exception: ', ''); _loading = false; });
    }
  }

  Future<void> _eliminar(String id) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF051908),
        title: const Text('¿Eliminar este usuario?', style: TextStyle(color: Colors.white, fontSize: 16)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Eliminar', style: TextStyle(color: Colors.redAccent))),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ApiClient.delete('/equipo/$id');
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', '')), backgroundColor: Colors.red[800]));
      }
    }
  }

  Future<void> _nuevoUsuario() async {
    final nombreCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    final passCtrl = TextEditingController();
    String role = 'TRABAJADOR';
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
            if (nombreCtrl.text.trim().isEmpty || emailCtrl.text.trim().isEmpty || passCtrl.text.length < 6) {
              setSt(() => errorForm = 'Nombre, email y contraseña (mínimo 6 caracteres) son requeridos');
              return;
            }
            setSt(() { guardando = true; errorForm = null; });
            try {
              await ApiClient.post('/equipo', {
                'nombre': nombreCtrl.text.trim(),
                'email': emailCtrl.text.trim(),
                'password': passCtrl.text,
                'role': role,
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
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('👥 Nuevo Usuario', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 4),
                  Text('El usuario podrá acceder con su email y contraseña',
                      style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 12)),
                  const SizedBox(height: 16),
                  TextField(controller: nombreCtrl, style: const TextStyle(color: Colors.white), decoration: deco('Nombre completo *')),
                  const SizedBox(height: 12),
                  TextField(controller: emailCtrl, keyboardType: TextInputType.emailAddress,
                      style: const TextStyle(color: Colors.white), decoration: deco('Email *')),
                  const SizedBox(height: 12),
                  TextField(controller: passCtrl, obscureText: true,
                      style: const TextStyle(color: Colors.white), decoration: deco('Contraseña * (mínimo 6 caracteres)')),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      {'value': 'TRABAJADOR', 'label': '👷 Trabajador', 'sub': 'Reporta datos', 'color': const Color(0xFF2D9E3F)},
                      {'value': 'ADMIN', 'label': '👑 Administrador', 'sub': 'Acceso completo', 'color': const Color(0xFF805AD5)},
                    ].map((r) {
                      final sel = role == r['value'];
                      final color = r['color'] as Color;
                      return Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                          child: GestureDetector(
                            onTap: () => setSt(() => role = r['value'] as String),
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: sel ? color : Colors.white.withOpacity(0.05),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: color.withOpacity(sel ? 1 : 0.4)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(r['label'] as String,
                                      style: TextStyle(color: sel ? Colors.white : Colors.white.withOpacity(0.7), fontSize: 13, fontWeight: FontWeight.w800)),
                                  Text(r['sub'] as String,
                                      style: TextStyle(color: (sel ? Colors.white : Colors.white).withOpacity(0.6), fontSize: 10)),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  if (errorForm != null) ...[
                    const SizedBox(height: 12),
                    Text(errorForm!, style: const TextStyle(color: Colors.redAccent, fontSize: 13)),
                  ],
                  const SizedBox(height: 18),
                  ElevatedButton(
                    onPressed: guardando ? null : guardar,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF805AD5),
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: Text(guardando ? 'Creando...' : 'Crear Usuario',
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
    final admins = _equipo.where((u) => u['role'] == 'ADMIN').toList();
    final trabajadores = _equipo.where((u) => u['role'] == 'TRABAJADOR').toList();

    return Scaffold(
      backgroundColor: const Color(0xFF020F05),
      appBar: AppBar(
        backgroundColor: const Color(0xFF020F05),
        foregroundColor: Colors.white,
        title: const Text('👥 Mi Equipo', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
        actions: [
          if (_esAdmin)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Container(
                decoration: BoxDecoration(color: const Color(0xFF805AD5), borderRadius: BorderRadius.circular(12)),
                child: IconButton(onPressed: _nuevoUsuario, icon: const Icon(Icons.add, color: Colors.white)),
              ),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF805AD5)))
          : _error != null
              ? Center(child: Text(_error!, style: TextStyle(color: Colors.white.withOpacity(0.5))))
              : RefreshIndicator(
                  onRefresh: _load,
                  color: const Color(0xFF805AD5),
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                    children: [
                      Row(
                        children: [
                          _statCard('Administradores', admins.length, const [Color(0xFF44337A), Color(0xFF805AD5)]),
                          const SizedBox(width: 10),
                          _statCard('Trabajadores', trabajadores.length, const [Color(0xFF1A6B2A), Color(0xFF2D9E3F)]),
                        ],
                      ),
                      const SizedBox(height: 16),
                      if (_equipo.isEmpty)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 60),
                          child: Column(
                            children: [
                              const Text('👥', style: TextStyle(fontSize: 48)),
                              const SizedBox(height: 12),
                              Text('Sin usuarios aún', style: TextStyle(color: Colors.white.withOpacity(0.5), fontWeight: FontWeight.w700)),
                              Text('Agrega trabajadores para que reporten desde sus cuentas',
                                  style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 12), textAlign: TextAlign.center),
                            ],
                          ),
                        ),
                      if (admins.isNotEmpty) ...[
                        Text('👑 Administradores', style: TextStyle(color: Colors.white.withOpacity(0.7), fontWeight: FontWeight.w800)),
                        const SizedBox(height: 10),
                        ...admins.map((u) => _usuarioTile(u, const [Color(0xFF44337A), Color(0xFF805AD5)])),
                        const SizedBox(height: 14),
                      ],
                      if (trabajadores.isNotEmpty) ...[
                        Text('👷 Trabajadores', style: TextStyle(color: Colors.white.withOpacity(0.7), fontWeight: FontWeight.w800)),
                        const SizedBox(height: 10),
                        ...trabajadores.map((u) => _usuarioTile(u, const [Color(0xFF1A6B2A), Color(0xFF2D9E3F)])),
                      ],
                    ],
                  ),
                ),
    );
  }

  Widget _statCard(String label, int valor, List<Color> grad) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: grad),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withOpacity(0.2)),
        ),
        child: Column(
          children: [
            Text('$valor', style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900)),
            Text(label, style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 11, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  Widget _usuarioTile(Map<String, dynamic> u, List<Color> grad) {
    final fecha = DateTime.tryParse(u['createdAt'] ?? '');
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF051908).withOpacity(0.85),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Row(
        children: [
          Container(
            width: 46, height: 46,
            decoration: BoxDecoration(gradient: LinearGradient(colors: grad), borderRadius: BorderRadius.circular(14)),
            child: Center(
              child: Text((u['nombre'] ?? '?').toString().substring(0, 1).toUpperCase(),
                  style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900)),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(u['nombre'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14)),
                Text(u['email'] ?? '', style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 12)),
                if (fecha != null)
                  Text('Desde: ${fecha.day}/${fecha.month}/${fecha.year}', style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 10)),
              ],
            ),
          ),
          if (_esAdmin && u['role'] == 'TRABAJADOR')
            GestureDetector(
              onTap: () => _eliminar(u['id']),
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFE53E3E).withOpacity(0.3),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFE53E3E).withOpacity(0.5)),
                ),
                child: const Text('🗑️', style: TextStyle(fontSize: 13)),
              ),
            ),
        ],
      ),
    );
  }
}
