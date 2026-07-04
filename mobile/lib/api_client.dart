import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  static const String baseUrl = 'https://ganadero-san-jeronimo-production.up.railway.app/api';

  static Future<String?> _token() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
  }

  // Datos del usuario actual (rol, id, nombre) desde el token JWT.
  static Future<Map<String, dynamic>> usuarioActual() async {
    final t = await _token();
    if (t == null) return {};
    final parts = t.split('.');
    if (parts.length != 3) return {};
    try {
      return jsonDecode(utf8.decode(base64Url.decode(base64Url.normalize(parts[1]))));
    } catch (_) {
      return {};
    }
  }

  static Future<dynamic> get(String path) async {
    final token = await _token();
    final res = await http.get(
      Uri.parse('$baseUrl$path'),
      headers: {if (token != null) 'Authorization': 'Bearer $token'},
    );
    return _handle(res);
  }

  static Future<dynamic> post(String path, Map<String, dynamic> body) async {
    final token = await _token();
    final res = await http.post(
      Uri.parse('$baseUrl$path'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode(body),
    );
    return _handle(res);
  }

  static Future<dynamic> patch(String path, Map<String, dynamic> body) async {
    final token = await _token();
    final res = await http.patch(
      Uri.parse('$baseUrl$path'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode(body),
    );
    return _handle(res);
  }

  static Future<dynamic> delete(String path) async {
    final token = await _token();
    final res = await http.delete(
      Uri.parse('$baseUrl$path'),
      headers: {if (token != null) 'Authorization': 'Bearer $token'},
    );
    return _handle(res);
  }

  // Tipo MIME segun la extension del archivo — necesario para que el
  // servidor clasifique bien fotos y videos (sin esto todo llega como
  // application/octet-stream).
  static MediaType _mimeDe(String path) {
    final p = path.toLowerCase();
    if (p.endsWith('.mp4')) return MediaType('video', 'mp4');
    if (p.endsWith('.mov')) return MediaType('video', 'quicktime');
    if (p.endsWith('.3gp')) return MediaType('video', '3gpp');
    if (p.endsWith('.webm')) return MediaType('video', 'webm');
    if (p.endsWith('.mkv')) return MediaType('video', 'x-matroska');
    if (p.endsWith('.avi')) return MediaType('video', 'x-msvideo');
    if (p.endsWith('.png')) return MediaType('image', 'png');
    if (p.endsWith('.webp')) return MediaType('image', 'webp');
    if (p.endsWith('.heic')) return MediaType('image', 'heic');
    if (p.endsWith('.gif')) return MediaType('image', 'gif');
    return MediaType('image', 'jpeg');
  }

  static Future<dynamic> patchMultipart(String path, File file, String fieldName) async {
    final token = await _token();
    final request = http.MultipartRequest('PATCH', Uri.parse('$baseUrl$path'));
    if (token != null) request.headers['Authorization'] = 'Bearer $token';
    request.files.add(await http.MultipartFile.fromPath(fieldName, file.path, contentType: _mimeDe(file.path)));
    final streamed = await request.send();
    final res = await http.Response.fromStream(streamed);
    return _handle(res);
  }

  static Future<dynamic> postMultipart(
    String path,
    Map<String, String> fields,
    List<String> filePaths,
  ) async {
    final token = await _token();
    final request = http.MultipartRequest('POST', Uri.parse('$baseUrl$path'));
    if (token != null) request.headers['Authorization'] = 'Bearer $token';
    request.fields.addAll(fields);
    for (final path in filePaths) {
      request.files.add(await http.MultipartFile.fromPath('archivos', path, contentType: _mimeDe(path)));
    }
    final streamed = await request.send();
    final res = await http.Response.fromStream(streamed);
    return _handle(res);
  }

  // Multipart con un solo archivo en un campo con nombre propio
  // (p. ej. documentos usa el campo "archivo").
  static Future<dynamic> postMultipartCampo(
    String path,
    Map<String, String> fields,
    String fileField,
    String filePath,
  ) async {
    final token = await _token();
    final request = http.MultipartRequest('POST', Uri.parse('$baseUrl$path'));
    if (token != null) request.headers['Authorization'] = 'Bearer $token';
    request.fields.addAll(fields);
    final esPdf = filePath.toLowerCase().endsWith('.pdf');
    request.files.add(await http.MultipartFile.fromPath(
      fileField, filePath,
      contentType: esPdf ? MediaType('application', 'pdf') : _mimeDe(filePath),
    ));
    final streamed = await request.send();
    final res = await http.Response.fromStream(streamed);
    return _handle(res);
  }

  static dynamic _handle(http.Response res) {
    final data = res.body.isNotEmpty ? jsonDecode(res.body) : null;
    if (res.statusCode >= 400) {
      throw Exception(data?['error'] ?? 'Error en la solicitud');
    }
    return data;
  }
}
