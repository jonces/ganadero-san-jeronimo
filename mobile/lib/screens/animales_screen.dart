import 'dart:async';
import 'package:flutter/material.dart';
import '../api_client.dart';
import 'login_screen.dart';
import 'animal_detail_screen.dart';

class AnimalesScreen extends StatefulWidget {
  const AnimalesScreen({super.key});

  @override
  State<AnimalesScreen> createState() => _AnimalesScreenState();
}

class _AnimalesScreenState extends State<AnimalesScreen> {
  List<dynamic> _animales = [];
  String? _error;
  Timer? _timer;

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
      final data = await ApiClient.get('/animales');
      setState(() {
        _animales = data;
        _error = null;
      });
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _crearAnimal() async {
    final identificadorCtrl = TextEditingController();
    final nombreCtrl = TextEditingController();
    final razaCtrl = TextEditingController();
    String sexo = 'HEMBRA';

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) => AlertDialog(
          title: const Text('Nuevo animal'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: identificadorCtrl, decoration: const InputDecoration(labelText: 'Identificador (arete)')),
              TextField(controller: nombreCtrl, decoration: const InputDecoration(labelText: 'Nombre')),
              TextField(controller: razaCtrl, decoration: const InputDecoration(labelText: 'Raza')),
              DropdownButton<String>(
                value: sexo,
                items: const [
                  DropdownMenuItem(value: 'HEMBRA', child: Text('Hembra')),
                  DropdownMenuItem(value: 'MACHO', child: Text('Macho')),
                ],
                onChanged: (v) => setSt(() => sexo = v ?? 'HEMBRA'),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Guardar')),
          ],
        ),
      ),
    );

    if (ok == true && identificadorCtrl.text.isNotEmpty) {
      try {
        await ApiClient.post('/animales', {
          'identificador': identificadorCtrl.text,
          'nombre': nombreCtrl.text,
          'raza': razaCtrl.text,
          'sexo': sexo,
        });
        _load();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
        }
      }
    }
  }

  Future<void> _logout() async {
    await ApiClient.logout();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mi ganado'),
        actions: [IconButton(onPressed: _logout, icon: const Icon(Icons.logout))],
      ),
      floatingActionButton: FloatingActionButton(onPressed: _crearAnimal, child: const Icon(Icons.add)),
      body: _error != null
          ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
          : RefreshIndicator(
              onRefresh: _load,
              child: _animales.isEmpty
                  ? const Center(child: Text('Aún no hay animales registrados.'))
                  : ListView.builder(
                      itemCount: _animales.length,
                      itemBuilder: (ctx, i) {
                        final a = _animales[i];
                        final media = (a['media'] as List?)?.cast<dynamic>() ?? [];
                        return ListTile(
                          leading: media.isNotEmpty && media[0]['tipo'] == 'FOTO'
                              ? CircleAvatar(backgroundImage: NetworkImage(media[0]['url']))
                              : const CircleAvatar(child: Icon(Icons.pets)),
                          title: Text(a['nombre'] ?? a['identificador']),
                          subtitle: Text('${a['raza'] ?? 'Sin raza'} · ${a['sexo']}'),
                          trailing: Text(a['pesoActual'] != null ? '${a['pesoActual']} kg' : ''),
                          onTap: () => Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => AnimalDetailScreen(animalId: a['id'])),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}
