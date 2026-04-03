import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/clay_widgets.dart';

class BusinessProfilePage extends StatefulWidget {
  const BusinessProfilePage({super.key});

  @override
  State<BusinessProfilePage> createState() => _BusinessProfilePageState();
}

class _BusinessProfilePageState extends State<BusinessProfilePage> {
  bool _loading = true;
  bool _saving = false;

  final _nameCtrl = TextEditingController();
  final _categoryCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _websiteCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadBusiness();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _categoryCtrl.dispose();
    _descCtrl.dispose();
    _addressCtrl.dispose();
    _phoneCtrl.dispose();
    _websiteCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadBusiness() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient.get('/businesses/me');
      if (res['success'] == true && res['data'] != null) {
        final b = Map<String, dynamic>.from(res['data']);
        _nameCtrl.text = b['business_name'] ?? '';
        _categoryCtrl.text = b['category'] ?? '';
        _descCtrl.text = b['description'] ?? '';
        _addressCtrl.text = b['address'] ?? '';
        _phoneCtrl.text = b['phone'] ?? '';
        _websiteCtrl.text = b['website'] ?? '';
      }
    } catch (_) {
      // ignore
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _saveBusiness() async {
    setState(() => _saving = true);
    try {
      final payload = {
        'business_name': _nameCtrl.text.trim(),
        'category': _categoryCtrl.text.trim().isEmpty ? null : _categoryCtrl.text.trim(),
        'description': _descCtrl.text.trim(),
        'address': _addressCtrl.text.trim(),
        'phone': _phoneCtrl.text.trim(),
        'website': _websiteCtrl.text.trim(),
      };
      final res = await ApiClient.patch('/businesses/me', payload);
      if (res['success'] == true && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Business profile updated.')));
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to save: $e')));
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
        title: const Text('Business Profile', style: TextStyle(fontWeight: FontWeight.w800, color: Clay.text)),
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
                      const Text('Business Information', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: Clay.text)),
                      const SizedBox(height: 10),
                      const Text('Business Name', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.textMuted)),
                      const SizedBox(height: 4),
                      ClayInput(controller: _nameCtrl, hint: 'Business name'),
                      const SizedBox(height: 8),
                      const Text('Category', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.textMuted)),
                      const SizedBox(height: 4),
                      ClayInput(controller: _categoryCtrl, hint: 'accommodation / food_beverage'),
                      const SizedBox(height: 8),
                      const Text('Description', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.textMuted)),
                      const SizedBox(height: 4),
                      ClayInput(controller: _descCtrl, hint: 'Short description', maxLines: 2),
                      const SizedBox(height: 8),
                      const Text('Address', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.textMuted)),
                      const SizedBox(height: 4),
                      ClayInput(controller: _addressCtrl, hint: 'Address'),
                      const SizedBox(height: 8),
                      const Text('Phone', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.textMuted)),
                      const SizedBox(height: 4),
                      ClayInput(controller: _phoneCtrl, hint: 'Phone'),
                      const SizedBox(height: 8),
                      const Text('Website', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.textMuted)),
                      const SizedBox(height: 4),
                      ClayInput(controller: _websiteCtrl, hint: 'https://...'),
                      const SizedBox(height: 12),
                      ClayButton(
                        label: 'SAVE PROFILE',
                        isLoading: _saving,
                        variant: ClayButtonVariant.primary,
                        onTap: _saveBusiness,
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
