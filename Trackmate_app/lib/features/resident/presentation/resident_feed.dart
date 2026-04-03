import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/clay_widgets.dart';
import '../../auth/providers/auth_provider.dart';

class ResidentFeedPage extends ConsumerStatefulWidget {
  const ResidentFeedPage({super.key});

  @override
  ConsumerState<ResidentFeedPage> createState() => _ResidentFeedPageState();
}

class _ResidentFeedPageState extends ConsumerState<ResidentFeedPage> {
  bool _loading = true;
  List<dynamic> _incidents = [];

  @override
  void initState() {
    super.initState();
    _loadFeed();
  }

  Future<void> _loadFeed() async {
    setState(() => _loading = true);
    try {
      final auth = ref.read(authProvider);
      final wardId = auth.user?['ward']?['_id'] ?? auth.user?['ward'];
      final endpoint = wardId != null ? '/incidents?ward=$wardId&limit=30' : '/incidents?limit=30';
      final res = await ApiClient.get(endpoint);
      if (res['success'] == true && mounted) {
        setState(() => _incidents = List<dynamic>.from(res['data'] ?? []));
      }
    } catch (_) {
      // ignore
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Color _severityColor(String severity) {
    switch (severity) {
      case 'critical':
        return Clay.critical;
      case 'high':
        return Clay.high;
      case 'medium':
        return Clay.moderate;
      default:
        return Clay.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Clay.bg,
      appBar: AppBar(
        backgroundColor: Clay.surface,
        title: const Text('Resident Feed', style: TextStyle(fontWeight: FontWeight.w800, color: Clay.text)),
        actions: [
          IconButton(onPressed: _loadFeed, icon: const Icon(Icons.refresh, color: Clay.text)),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Clay.primary))
          : _incidents.isEmpty
              ? const Center(
                  child: Text('No incidents in feed.', style: TextStyle(fontWeight: FontWeight.w600, color: Clay.textMuted)),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(12),
                  itemCount: _incidents.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final incident = _incidents[i];
                    final severity = (incident['severity'] ?? 'low').toString().toLowerCase();
                    final color = _severityColor(severity);
                    final reporter = incident['reporter']?['full_name'] ?? 'System';

                    return ClayCard(
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(width: 12, height: 12, margin: const EdgeInsets.only(top: 4), decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(incident['title'] ?? 'Alert', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: Clay.text)),
                                const SizedBox(height: 4),
                                Text(incident['description'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: Clay.textSecondary)),
                                const SizedBox(height: 6),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(reporter, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.textMuted)),
                                    ClayBadge(
                                      label: (incident['status'] ?? 'unknown').toString().toUpperCase(),
                                      color: Clay.surfaceAlt,
                                      textColor: Clay.textMuted,
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
    );
  }
}
