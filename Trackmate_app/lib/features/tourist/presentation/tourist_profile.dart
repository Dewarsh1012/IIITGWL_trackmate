import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/clay_widgets.dart';

class TouristProfilePage extends StatefulWidget {
  const TouristProfilePage({super.key});

  @override
  State<TouristProfilePage> createState() => _TouristProfilePageState();
}

class _TouristProfilePageState extends State<TouristProfilePage> {
  bool _loading = true;
  bool _saving = false;

  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _langCtrl = TextEditingController();
  String _blockchainId = '';

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _langCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadProfile() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient.get('/profiles/me');
      if (res['success'] == true && res['data'] != null) {
        final p = Map<String, dynamic>.from(res['data']);
        _nameCtrl.text = p['full_name'] ?? '';
        _phoneCtrl.text = p['phone'] ?? '';
        _langCtrl.text = p['preferred_language'] ?? '';
        _blockchainId = p['blockchain_id'] ?? '';
      }
    } catch (_) {
      // ignore
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _saveProfile() async {
    setState(() => _saving = true);
    try {
      final payload = {
        'full_name': _nameCtrl.text.trim(),
        'phone': _phoneCtrl.text.trim(),
        'preferred_language': _langCtrl.text.trim(),
      };
      final res = await ApiClient.patch('/profiles/me', payload);
      if (res['success'] == true && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated.')));
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to update: $e')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Clay.bg,
      appBar: AppBar(
        backgroundColor: Clay.surface,
        title: const Text('Tourist Profile', style: TextStyle(fontWeight: FontWeight.w800, color: Clay.text)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Clay.primary))
          : ListView(
              padding: const EdgeInsets.all(12),
              children: [
                ClayCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Identity', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: Clay.text)),
                      const SizedBox(height: 10),
                      const Text('Blockchain ID', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.textMuted)),
                      const SizedBox(height: 4),
                      ClayInset(
                        child: Text(
                          _blockchainId.isEmpty ? 'Not available' : _blockchainId,
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: Clay.primary),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                ClayCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Personal Details', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: Clay.text)),
                      const SizedBox(height: 10),
                      const Text('Full Name', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.textMuted)),
                      const SizedBox(height: 4),
                      ClayInput(controller: _nameCtrl, hint: 'Name'),
                      const SizedBox(height: 8),
                      const Text('Phone', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.textMuted)),
                      const SizedBox(height: 4),
                      ClayInput(controller: _phoneCtrl, hint: 'Phone number'),
                      const SizedBox(height: 8),
                      const Text('Preferred Language', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.textMuted)),
                      const SizedBox(height: 4),
                      ClayInput(controller: _langCtrl, hint: 'e.g. English'),
                      const SizedBox(height: 12),
                      ClayButton(
                        label: 'SAVE PROFILE',
                        isLoading: _saving,
                        variant: ClayButtonVariant.primary,
                        onTap: _saveProfile,
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
