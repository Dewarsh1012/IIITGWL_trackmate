import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/clay_widgets.dart';

class AuthorityAnalyticsPage extends StatefulWidget {
  const AuthorityAnalyticsPage({super.key});

  @override
  State<AuthorityAnalyticsPage> createState() => _AuthorityAnalyticsPageState();
}

class _AuthorityAnalyticsPageState extends State<AuthorityAnalyticsPage> {
  bool _loading = true;
  String? _error;

  Map<String, dynamic> _summary = {
    'totalUsers': 0,
    'openIncidents': 0,
    'sosLastHour': 0,
    'activeUsersToday': 0,
  };
  Map<String, dynamic> _incidentStats = {};
  Map<String, dynamic> _touristStats = {};
  List<dynamic> _zoneStats = [];

  @override
  void initState() {
    super.initState();
    _fetchAnalytics();
  }

  Future<void> _fetchAnalytics() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final responses = await Future.wait<dynamic>([
        ApiClient.get('/analytics/incidents'),
        ApiClient.get('/analytics/tourists'),
        ApiClient.get('/analytics/zones'),
        ApiClient.get('/analytics/summary'),
      ]);

      if (!mounted) return;

      final incidents = responses[0];
      final tourists = responses[1];
      final zones = responses[2];
      final summary = responses[3];

      setState(() {
        _incidentStats = (incidents['data'] as Map?)?.cast<String, dynamic>() ?? {};
        _touristStats = (tourists['data'] as Map?)?.cast<String, dynamic>() ?? {};
        _zoneStats = List<dynamic>.from(zones['data'] ?? const []);
        _summary = (summary['data'] as Map?)?.cast<String, dynamic>() ?? _summary;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Unable to fetch analytics right now. Pull to refresh.';
      });
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  int _asInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }

  List<MapEntry<String, int>> _incidentByDaySeries() {
    final byDay = List<dynamic>.from(_incidentStats['byDay'] ?? const []);
    final merged = <String, int>{};

    for (final item in byDay) {
      final id = item['_id'];
      final date = (id is Map) ? id['date']?.toString() : null;
      if (date == null) continue;
      merged[date] = (merged[date] ?? 0) + _asInt(item['count']);
    }

    final sorted = merged.entries.toList()..sort((a, b) => a.key.compareTo(b.key));
    if (sorted.length <= 15) return sorted;
    return sorted.sublist(sorted.length - 15);
  }

  List<MapEntry<String, int>> _touristDailySeries() {
    final daily = List<dynamic>.from(_touristStats['daily'] ?? const []);
    final points = <MapEntry<String, int>>[];

    for (final item in daily) {
      final date = item['date']?.toString();
      if (date == null) continue;
      points.add(MapEntry(date, _asInt(item['count'])));
    }

    points.sort((a, b) => a.key.compareTo(b.key));
    if (points.length <= 7) return points;
    return points.sublist(points.length - 7);
  }

  String _shortDate(String raw) {
    final parts = raw.split('-');
    if (parts.length == 3) {
      return '${parts[1]}/${parts[2]}';
    }
    return raw;
  }

  Color _riskColor(String risk) {
    switch (risk.toLowerCase()) {
      case 'safe':
        return Clay.safe;
      case 'moderate':
        return Clay.moderate;
      case 'high':
        return Clay.high;
      case 'restricted':
        return Clay.restricted;
      default:
        return Clay.primary;
    }
  }

  Widget _summaryCard({
    required String title,
    required int value,
    required Color accent,
    required IconData icon,
  }) {
    return ClayCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, size: 16, color: accent),
              ),
              ClayBadge(
                label: title.toUpperCase(),
                color: Clay.surfaceAlt,
                textColor: Clay.textMuted,
              ),
            ],
          ),
          const Spacer(),
          Text(
            '$value',
            style: TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 22,
              color: accent,
            ),
          ),
        ],
      ),
    );
  }

  Widget _barsCard({
    required String title,
    required List<MapEntry<String, int>> points,
    required Color barColor,
    String emptyLabel = 'No data available',
  }) {
    final max = points.isEmpty ? 1 : points.map((p) => p.value).reduce((a, b) => a > b ? a : b).clamp(1, 999999);

    return ClayCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: Clay.text),
          ),
          const SizedBox(height: 14),
          if (points.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 32),
              child: Center(
                child: Text(
                  emptyLabel,
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: Clay.textMuted),
                ),
              ),
            )
          else
            SizedBox(
              height: 130,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: points.map((point) {
                  final ratio = point.value / max;
                  final height = (ratio * 98).clamp(8, 98).toDouble();
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 2),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Container(
                            height: height,
                            decoration: BoxDecoration(
                              color: barColor,
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
                            ),
                          ),
                          const SizedBox(height: 5),
                          Text(
                            _shortDate(point.key),
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 9,
                              color: Clay.textMuted,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
        ],
      ),
    );
  }

  Widget _incidentTypeCard() {
    final byType = List<dynamic>.from(_incidentStats['byType'] ?? const []);
    final max = byType.isEmpty
        ? 1
        : byType.map((e) => _asInt(e['count'])).reduce((a, b) => a > b ? a : b).clamp(1, 999999);

    return ClayCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Incident Type Distribution',
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: Clay.text),
          ),
          const SizedBox(height: 12),
          if (byType.isEmpty)
            const Text('No incident types found.', style: TextStyle(fontWeight: FontWeight.w600, color: Clay.textMuted))
          else
            ...byType.take(6).map((item) {
              final label = item['_id']?.toString() ?? 'Unknown';
              final count = _asInt(item['count']);
              final ratio = count / max;
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            label,
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.text),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Text('$count', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 11, color: Clay.textMuted)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Container(
                      height: 8,
                      decoration: BoxDecoration(
                        color: Clay.surfaceAlt,
                        borderRadius: BorderRadius.circular(99),
                        border: Border.all(color: Clay.border),
                      ),
                      child: FractionallySizedBox(
                        widthFactor: ratio.clamp(0.05, 1).toDouble(),
                        alignment: Alignment.centerLeft,
                        child: Container(
                          decoration: BoxDecoration(
                            color: Clay.primary,
                            borderRadius: BorderRadius.circular(99),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _zoneRiskCard() {
    return ClayCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Zone Risk Assessment',
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: Clay.text),
          ),
          const SizedBox(height: 12),
          if (_zoneStats.isEmpty)
            const Text('No zones available.', style: TextStyle(fontWeight: FontWeight.w600, color: Clay.textMuted))
          else
            ..._zoneStats.take(5).map((z) {
              final name = z['name']?.toString() ?? 'Unknown Zone';
              final risk = z['risk_level']?.toString() ?? 'safe';
              final incidents = _asInt(z['active_incidents']);
              final resolved = _asInt(z['resolved_last_7d']);
              final color = _riskColor(risk);
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Clay.surfaceAlt,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Clay.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.text)),
                          ),
                          ClayBadge(
                            label: risk.toUpperCase(),
                            color: color.withValues(alpha: 0.14),
                            textColor: color,
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '$incidents active · $resolved resolved (7d)',
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 10, color: Clay.textMuted),
                      ),
                    ],
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _lifecycleCard() {
    final lifecycle = List<dynamic>.from(_incidentStats['lifecycle'] ?? const []);
    final total = lifecycle.fold<int>(0, (sum, item) => sum + _asInt(item['count']));

    return ClayCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Lifecycle Funnel',
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: Clay.text),
          ),
          const SizedBox(height: 12),
          if (lifecycle.isEmpty)
            const Text('No lifecycle data found.', style: TextStyle(fontWeight: FontWeight.w600, color: Clay.textMuted))
          else
            ...lifecycle.map((item) {
              final label = item['_id']?.toString().replaceAll('_', ' ').toUpperCase() ?? 'UNKNOWN';
              final count = _asInt(item['count']);
              final ratio = total == 0 ? 0.0 : count / total;
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 10, color: Clay.textMuted)),
                        Text('$count', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 10, color: Clay.text)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Container(
                      height: 8,
                      decoration: BoxDecoration(
                        color: Clay.surfaceAlt,
                        borderRadius: BorderRadius.circular(99),
                      ),
                      child: FractionallySizedBox(
                        widthFactor: ratio.clamp(0.03, 1).toDouble(),
                        alignment: Alignment.centerLeft,
                        child: Container(
                          decoration: BoxDecoration(
                            color: Clay.primaryLight,
                            borderRadius: BorderRadius.circular(99),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _exportCard() {
    return ClayCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Operations Export',
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: Clay.text),
          ),
          const SizedBox(height: 8),
          const Text(
            'Use eFIR Desk for legally binding reports and blockchain verification records.',
            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 11, color: Clay.textMuted),
          ),
          const SizedBox(height: 12),
          ClayButton(
            label: 'OPEN EFIR DESK',
            icon: Icons.open_in_new,
            onTap: () => context.push('/authority/efir'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final incidentSeries = _incidentByDaySeries();
    final touristSeries = _touristDailySeries();

    return Scaffold(
      backgroundColor: Clay.bg,
      appBar: AppBar(
        backgroundColor: Clay.surface,
        title: const Text('Safety Analytics', style: TextStyle(fontWeight: FontWeight.w800, color: Clay.text)),
        actions: [
          IconButton(
            onPressed: _fetchAnalytics,
            icon: const Icon(Icons.refresh, color: Clay.text),
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Clay.primary))
          : RefreshIndicator(
              onRefresh: _fetchAnalytics,
              color: Clay.primary,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (_error != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Clay.high.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Clay.high.withValues(alpha: 0.2)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.warning_amber_rounded, color: Clay.high),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _error!,
                              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: Clay.text),
                            ),
                          ),
                        ],
                      ),
                    ),
                  GridView.count(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.3,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    children: [
                      _summaryCard(
                        title: 'Total Users',
                        value: _asInt(_summary['totalUsers']),
                        accent: Clay.primary,
                        icon: Icons.groups,
                      ),
                      _summaryCard(
                        title: 'Open Incidents',
                        value: _asInt(_summary['openIncidents']),
                        accent: Clay.high,
                        icon: Icons.warning,
                      ),
                      _summaryCard(
                        title: 'SOS (1h)',
                        value: _asInt(_summary['sosLastHour']),
                        accent: Clay.critical,
                        icon: Icons.sos,
                      ),
                      _summaryCard(
                        title: 'Live Active',
                        value: _asInt(_summary['activeUsersToday']),
                        accent: Clay.safe,
                        icon: Icons.sync,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _barsCard(
                    title: 'Daily Incident Count (Last 15 Days)',
                    points: incidentSeries,
                    barColor: Clay.high,
                  ),
                  const SizedBox(height: 12),
                  _incidentTypeCard(),
                  const SizedBox(height: 12),
                  _zoneRiskCard(),
                  const SizedBox(height: 12),
                  _barsCard(
                    title: 'Tourist Activity (Last 7 Days)',
                    points: touristSeries,
                    barColor: Clay.moderate,
                  ),
                  const SizedBox(height: 12),
                  _lifecycleCard(),
                  const SizedBox(height: 12),
                  _exportCard(),
                ],
              ),
            ),
    );
  }
}
