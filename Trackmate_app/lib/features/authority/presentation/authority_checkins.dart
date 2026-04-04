import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/socket_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/clay_widgets.dart';

class AuthorityDailyCheckinsPage extends StatefulWidget {
  const AuthorityDailyCheckinsPage({super.key});

  @override
  State<AuthorityDailyCheckinsPage> createState() => _AuthorityDailyCheckinsPageState();
}

class _AuthorityDailyCheckinsPageState extends State<AuthorityDailyCheckinsPage> {
  final TextEditingController _searchCtrl = TextEditingController();
  bool _loading = true;
  List<dynamic> _checkins = [];
  String _query = '';
  String _dateFilter = 'today';

  @override
  void initState() {
    super.initState();
    _searchCtrl.text = _query;
    _fetchCheckins();
    _bindRealtime();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    SocketService.instance.off('new-incident');
    super.dispose();
  }

  void _bindRealtime() {
    SocketService.instance.on('new-incident', (payload) {
      if (!mounted || payload == null) return;
      if (payload['incident_type'] == 'checkin') {
        setState(() {
          _checkins = [payload, ..._checkins].take(100).toList();
        });
      }
    });
  }

  Future<void> _fetchCheckins() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient.get('/locations/checkins/all');
      if (!mounted) return;
      if (res['success'] == true) {
        setState(() => _checkins = List<dynamic>.from(res['data'] ?? const []));
      }
    } catch (_) {
      // Keep UI usable even when endpoint is temporarily unavailable.
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<dynamic> _filteredCheckins() {
    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);
    final weekAgo = now.subtract(const Duration(days: 7));

    return _checkins.where((item) {
      final title = (item['title'] ?? '').toString().toLowerCase();
      final description = (item['description'] ?? '').toString().toLowerCase();
      final reporter = (item['reporter']?['full_name'] ?? '').toString().toLowerCase();
      final zoneName = (item['zone']?['name'] ?? '').toString().toLowerCase();

      if (_query.trim().isNotEmpty) {
        final q = _query.toLowerCase();
        final matches = title.contains(q) || description.contains(q) || reporter.contains(q) || zoneName.contains(q);
        if (!matches) return false;
      }

      final createdAtRaw = item['created_at']?.toString();
      final createdAt = createdAtRaw == null ? null : DateTime.tryParse(createdAtRaw);
      if (createdAt == null) return _dateFilter == 'all';

      if (_dateFilter == 'today') return !createdAt.isBefore(todayStart);
      if (_dateFilter == 'week') return !createdAt.isBefore(weekAgo);
      return true;
    }).toList();
  }

  int _todayCount() {
    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);
    return _checkins.where((item) {
      final createdAt = DateTime.tryParse(item['created_at']?.toString() ?? '');
      if (createdAt == null) return false;
      return !createdAt.isBefore(todayStart);
    }).length;
  }

  int _uniqueUsersCount(List<dynamic> items) {
    final ids = <String>{};
    for (final item in items) {
      final id = item['reporter']?['_id']?.toString();
      if (id != null && id.isNotEmpty) ids.add(id);
    }
    return ids.length;
  }

  String _kindLabel(String title) {
    if (title.contains('Verified')) return 'STAY VERIFIED';
    if (title.contains('Failed')) return 'VERIFY FAILED';
    return 'CHECK-IN';
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredCheckins();

    return Scaffold(
      backgroundColor: Clay.bg,
      appBar: AppBar(
        backgroundColor: Clay.surface,
        title: const Text(
          'Daily Check-Ins',
          style: TextStyle(fontWeight: FontWeight.w800, color: Clay.text),
        ),
        actions: [
          IconButton(
            onPressed: _fetchCheckins,
            icon: const Icon(Icons.refresh, color: Clay.text),
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Clay.primary))
          : RefreshIndicator(
              onRefresh: _fetchCheckins,
              color: Clay.primary,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: ClayCard(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Filtered', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 10, color: Clay.textMuted)),
                              const SizedBox(height: 6),
                              Text('${filtered.length}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 22, color: Clay.primary)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ClayCard(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Unique Users', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 10, color: Clay.textMuted)),
                              const SizedBox(height: 6),
                              Text('${_uniqueUsersCount(filtered)}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 22, color: Clay.safe)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ClayCard(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Today', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 10, color: Clay.textMuted)),
                              const SizedBox(height: 6),
                              Text('${_todayCount()}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 22, color: Clay.moderate)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _searchCtrl,
                    onChanged: (value) => setState(() => _query = value),
                    decoration: InputDecoration(
                      hintText: 'Search by tourist, zone, or note',
                      hintStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: Clay.textMuted),
                      prefixIcon: const Icon(Icons.search, size: 16, color: Clay.textMuted),
                      filled: true,
                      fillColor: Clay.surfaceAlt,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Clay.border),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Clay.border),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _filterChip('today', 'Today'),
                      const SizedBox(width: 8),
                      _filterChip('week', 'This Week'),
                      const SizedBox(width: 8),
                      _filterChip('all', 'All Time'),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (filtered.isEmpty)
                    const ClayCard(
                      child: Center(
                        child: Padding(
                          padding: EdgeInsets.symmetric(vertical: 20),
                          child: Text(
                            'No check-ins found for current filters.',
                            style: TextStyle(fontWeight: FontWeight.w600, color: Clay.textMuted),
                          ),
                        ),
                      ),
                    )
                  else
                    ...filtered.map((item) {
                      final reporterId = item['reporter']?['_id']?.toString();
                      final reporterName = item['reporter']?['full_name']?.toString() ?? 'Unknown Tourist';
                      final kind = _kindLabel((item['title'] ?? '').toString());
                      final zoneName = item['zone']?['name']?.toString();
                      final createdAt = DateTime.tryParse(item['created_at']?.toString() ?? '');
                      final timeText = createdAt == null
                          ? 'Unknown time'
                          : '${createdAt.toLocal().hour.toString().padLeft(2, '0')}:${createdAt.toLocal().minute.toString().padLeft(2, '0')}';

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: ClayCard(
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                width: 10,
                                height: 10,
                                margin: const EdgeInsets.only(top: 6),
                                decoration: const BoxDecoration(color: Clay.safe, shape: BoxShape.circle),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(reporterName, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: Clay.text)),
                                    const SizedBox(height: 2),
                                    Text(item['description']?.toString() ?? item['title']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 11, color: Clay.textSecondary)),
                                    const SizedBox(height: 6),
                                    Text(
                                      zoneName != null && zoneName.isNotEmpty ? zoneName : 'Outside registered zones',
                                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 10, color: Clay.textMuted),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 10),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  ClayBadge(
                                    label: kind,
                                    color: Clay.surfaceAlt,
                                    textColor: kind == 'VERIFY FAILED' ? Clay.high : Clay.primary,
                                  ),
                                  const SizedBox(height: 6),
                                  Text(timeText, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 10, color: Clay.textMuted)),
                                  if (reporterId != null) ...[
                                    const SizedBox(height: 8),
                                    InkWell(
                                      onTap: () => context.push('/authority/user/$reporterId'),
                                      child: const Text(
                                        'VIEW',
                                        style: TextStyle(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 10,
                                          color: Clay.primary,
                                          decoration: TextDecoration.underline,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                ],
              ),
            ),
    );
  }

  Widget _filterChip(String value, String label) {
    final active = _dateFilter == value;
    return InkWell(
      borderRadius: BorderRadius.circular(10),
      onTap: () => setState(() => _dateFilter = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: active ? Clay.primary.withValues(alpha: 0.12) : Clay.surfaceAlt,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: active ? Clay.primary.withValues(alpha: 0.28) : Clay.border),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 11,
            color: active ? Clay.primary : Clay.textMuted,
          ),
        ),
      ),
    );
  }
}
