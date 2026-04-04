import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/clay_widgets.dart';

class AuthorityZonesPage extends ConsumerStatefulWidget {
  const AuthorityZonesPage({super.key});

  @override
  ConsumerState<AuthorityZonesPage> createState() => _AuthorityZonesPageState();
}

class _AuthorityZonesPageState extends ConsumerState<AuthorityZonesPage> {
  List<dynamic> _zones = [];
  List<dynamic> _safeHouseRequests = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchZones();
  }

  Future<void> _fetchZones() async {
    setState(() => _isLoading = true);
    try {
      final responses = await Future.wait<dynamic>([
        ApiClient.get('/zones'),
        ApiClient.get('/incidents?incident_type=safe_house_request&limit=50'),
      ]);

      if (!mounted) return;

      final zonesRes = responses[0];
      final safeHouseRes = responses[1];

      if (zonesRes['success'] == true) {
        _zones = List<dynamic>.from(zonesRes['data'] ?? const []);
      }
      if (safeHouseRes['success'] == true) {
        _safeHouseRequests = List<dynamic>.from(safeHouseRes['data'] ?? const []);
      }

      setState(() {});
    } catch (_) {
      // ignore
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _createZone() async {
    final nameCtrl = TextEditingController();
    final descriptionCtrl = TextEditingController();
    final latCtrl = TextEditingController();
    final lngCtrl = TextEditingController();
    final radiusCtrl = TextEditingController(text: '250');
    String riskLevel = 'moderate';

    final shouldCreate = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Create Zone'),
          content: StatefulBuilder(
            builder: (context, setModalState) {
              return SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Name')),
                    TextField(controller: descriptionCtrl, decoration: const InputDecoration(labelText: 'Description')),
                    TextField(controller: latCtrl, decoration: const InputDecoration(labelText: 'Center Latitude')),
                    TextField(controller: lngCtrl, decoration: const InputDecoration(labelText: 'Center Longitude')),
                    TextField(controller: radiusCtrl, decoration: const InputDecoration(labelText: 'Radius (meters)')),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: riskLevel,
                      items: const [
                        DropdownMenuItem(value: 'safe', child: Text('SAFE')),
                        DropdownMenuItem(value: 'moderate', child: Text('MODERATE')),
                        DropdownMenuItem(value: 'high', child: Text('HIGH')),
                        DropdownMenuItem(value: 'restricted', child: Text('RESTRICTED')),
                      ],
                      onChanged: (value) {
                        if (value == null) return;
                        setModalState(() => riskLevel = value);
                      },
                      decoration: const InputDecoration(labelText: 'Risk Level'),
                    ),
                  ],
                ),
              );
            },
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
            TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Create')),
          ],
        );
      },
    );

    if (shouldCreate != true) return;

    final lat = double.tryParse(latCtrl.text.trim());
    final lng = double.tryParse(lngCtrl.text.trim());
    final radius = double.tryParse(radiusCtrl.text.trim());

    if (nameCtrl.text.trim().isEmpty || lat == null || lng == null || radius == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Name, center coordinates and radius are required.')),
      );
      return;
    }

    try {
      await ApiClient.post('/zones', {
        'name': nameCtrl.text.trim(),
        'description': descriptionCtrl.text.trim(),
        'risk_level': riskLevel,
        'center_lat': lat,
        'center_lng': lng,
        'radius_meters': radius,
      });
      await _fetchZones();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Zone created successfully.')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to create zone: $e')),
      );
    }
  }

  Future<void> _editZone(Map<String, dynamic> zone) async {
    final nameCtrl = TextEditingController(text: zone['name']?.toString() ?? '');
    final descriptionCtrl = TextEditingController(text: zone['description']?.toString() ?? '');
    final radiusCtrl = TextEditingController(text: (zone['radius_meters'] ?? '').toString());
    String riskLevel = (zone['risk_level'] ?? 'moderate').toString();

    final shouldSave = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Edit Zone'),
          content: StatefulBuilder(
            builder: (context, setModalState) {
              return SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Name')),
                    TextField(controller: descriptionCtrl, decoration: const InputDecoration(labelText: 'Description')),
                    TextField(controller: radiusCtrl, decoration: const InputDecoration(labelText: 'Radius (meters)')),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: riskLevel,
                      items: const [
                        DropdownMenuItem(value: 'safe', child: Text('SAFE')),
                        DropdownMenuItem(value: 'moderate', child: Text('MODERATE')),
                        DropdownMenuItem(value: 'high', child: Text('HIGH')),
                        DropdownMenuItem(value: 'restricted', child: Text('RESTRICTED')),
                      ],
                      onChanged: (value) {
                        if (value == null) return;
                        setModalState(() => riskLevel = value);
                      },
                      decoration: const InputDecoration(labelText: 'Risk Level'),
                    ),
                  ],
                ),
              );
            },
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
            TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Save')),
          ],
        );
      },
    );

    if (shouldSave != true) return;

    final radius = double.tryParse(radiusCtrl.text.trim());

    try {
      await ApiClient.patch('/zones/${zone['_id']}', {
        'name': nameCtrl.text.trim(),
        'description': descriptionCtrl.text.trim(),
        'risk_level': riskLevel,
        if (radius != null) 'radius_meters': radius,
      });
      await _fetchZones();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Zone updated successfully.')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to update zone: $e')),
      );
    }
  }

  Future<void> _deleteZone(Map<String, dynamic> zone) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Delete Zone'),
          content: Text('Delete "${zone['name'] ?? 'this zone'}" permanently?'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
            TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete')),
          ],
        );
      },
    );

    if (confirmed != true) return;

    try {
      await ApiClient.delete('/zones/${zone['_id']}');
      await _fetchZones();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Zone deleted.')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to delete zone: $e')),
      );
    }
  }

  List<dynamic> _requestsForZone(String zoneName) {
    final normalized = zoneName.toLowerCase();
    return _safeHouseRequests.where((item) {
      final text = (item['description'] ?? '').toString().toLowerCase();
      return text.contains(normalized);
    }).toList();
  }

  Color _riskColor(String risk) {
    switch (risk) {
      case 'safe':
        return Clay.safe;
      case 'moderate':
        return Clay.moderate;
      case 'high':
        return Clay.high;
      case 'restricted':
        return Clay.restricted;
      default:
        return Clay.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Clay.bg,
      appBar: AppBar(
        title: const Text('Zone Management', style: TextStyle(fontWeight: FontWeight.w800, color: Clay.text)),
        backgroundColor: Clay.surface,
        iconTheme: const IconThemeData(color: Clay.text),
        actions: [
          IconButton(onPressed: _fetchZones, icon: const Icon(Icons.refresh, color: Clay.text)),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Clay.primary))
          : _zones.isEmpty
              ? const Center(
                  child: Text(
                    'No zones configured.',
                    style: TextStyle(fontWeight: FontWeight.w600, color: Clay.textMuted),
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(12),
                  itemCount: _zones.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final zone = _zones[i];
                    final risk = (zone['risk_level'] ?? 'unknown').toString().toLowerCase();
                    final riskColor = _riskColor(risk);
                    final requests = _requestsForZone((zone['name'] ?? '').toString());
                    final isSafeOrModerate = risk == 'safe' || risk == 'moderate';

                    return ClayCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  zone['name'] ?? 'Untitled Zone',
                                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: Clay.text),
                                ),
                              ),
                              ClayBadge(
                                label: risk.toUpperCase(),
                                color: riskColor.withValues(alpha: 0.14),
                                textColor: riskColor,
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            zone['description'] ?? 'No description.',
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: Clay.textSecondary),
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              const Icon(Icons.people, size: 14, color: Clay.textMuted),
                              const SizedBox(width: 4),
                              Text(
                                '${zone['current_capacity'] ?? 0} active users',
                                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.textMuted),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Expanded(
                                child: ClayButton(
                                  label: 'EDIT',
                                  variant: ClayButtonVariant.ghost,
                                  onTap: () => _editZone(Map<String, dynamic>.from(zone)),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: ClayButton(
                                  label: 'DELETE',
                                  variant: ClayButtonVariant.danger,
                                  onTap: () => _deleteZone(Map<String, dynamic>.from(zone)),
                                ),
                              ),
                            ],
                          ),
                          if (isSafeOrModerate) ...[
                            const SizedBox(height: 10),
                            const Text(
                              'SAFE HOUSE REQUESTS',
                              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 10, color: Clay.textMuted),
                            ),
                            const SizedBox(height: 6),
                            if (requests.isEmpty)
                              const Text(
                                'No requests for this zone.',
                                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 10, color: Clay.textMuted),
                              )
                            else
                              ...requests.take(3).map((request) {
                                final reporter = request['reporter']?['full_name']?.toString() ?? 'Unknown';
                                final createdAt = DateTime.tryParse(request['created_at']?.toString() ?? '');
                                final timeText = createdAt == null
                                    ? 'unknown time'
                                    : '${createdAt.toLocal().hour.toString().padLeft(2, '0')}:${createdAt.toLocal().minute.toString().padLeft(2, '0')}';

                                return Container(
                                  margin: const EdgeInsets.only(bottom: 6),
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: Clay.surfaceAlt,
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: Clay.border),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.shield, size: 14, color: Clay.primary),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          reporter,
                                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 10, color: Clay.text),
                                        ),
                                      ),
                                      Text(
                                        timeText,
                                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 9, color: Clay.textMuted),
                                      ),
                                    ],
                                  ),
                                );
                              }),
                          ],
                        ],
                      ),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: Clay.primary,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: const Icon(Icons.add),
        onPressed: _createZone,
      ),
    );
  }
}
