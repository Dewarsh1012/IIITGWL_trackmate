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
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchZones();
  }

  Future<void> _fetchZones() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiClient.get('/zones');
      if (res['success'] == true && mounted) {
        setState(() => _zones = res['data'] ?? []);
      }
    } catch (_) {
      // ignore
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
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
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Zone creation UI will be added next.')),
          );
        },
      ),
    );
  }
}
