import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
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
  bool _modelActionLoading = false;
  bool _sandboxLoading = false;
  bool _auditLoading = false;
  String? _modelNotice;
  bool _modelNoticeIsError = false;

  Map<String, dynamic> _summary = {
    'totalUsers': 0,
    'openIncidents': 0,
    'sosLastHour': 0,
    'activeUsersToday': 0,
  };
  Map<String, dynamic> _incidentStats = {};
  Map<String, dynamic> _touristStats = {};
  List<dynamic> _zoneStats = [];
  Map<String, dynamic>? _modelStatus;
  Map<String, dynamic>? _sandboxResult;

  final TextEditingController _maxSamplesCtrl = TextEditingController(text: '500');
  final TextEditingController _iterationsCtrl = TextEditingController(text: '700');
  final TextEditingController _learningRateCtrl = TextEditingController(text: '0.1');
  final TextEditingController _inactivityCtrl = TextEditingController(text: '42');
  final TextEditingController _speedCtrl = TextEditingController(text: '24');
  final TextEditingController _nearbyIncidentsCtrl = TextEditingController(text: '1');
  final TextEditingController _nearbyCriticalCtrl = TextEditingController(text: '0');
  final TextEditingController _anomaliesCtrl = TextEditingController(text: '0');
  final TextEditingController _ruleScoreCtrl = TextEditingController(text: '0.8');
  bool _outsideZone = false;

  @override
  void initState() {
    super.initState();
    _fetchAnalytics();
  }

  Future<void> _generateAuditReport() async {
    try {
      setState(() => _auditLoading = true);
      final token = await ApiClient.getToken();

      final res = await http.post(
        Uri.parse('${ApiClient.baseUrl}/reports/audit'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/pdf',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'sections': ['incidents', 'zones'],
        }),
      );

      if (!mounted) return;

      if (res.statusCode >= 200 && res.statusCode < 300) {
        final kb = (res.bodyBytes.length / 1024).toStringAsFixed(1);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Audit PDF generated (${kb} KB).')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Audit export failed (${res.statusCode}).')),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Audit export failed: $e')),
      );
    } finally {
      if (mounted) setState(() => _auditLoading = false);
    }
  }

  @override
  void dispose() {
    _maxSamplesCtrl.dispose();
    _iterationsCtrl.dispose();
    _learningRateCtrl.dispose();
    _inactivityCtrl.dispose();
    _speedCtrl.dispose();
    _nearbyIncidentsCtrl.dispose();
    _nearbyCriticalCtrl.dispose();
    _anomaliesCtrl.dispose();
    _ruleScoreCtrl.dispose();
    super.dispose();
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

      try {
        final modelRes = await ApiClient.get('/analytics/anomaly-model');
        if (modelRes['success'] == true) {
          _modelStatus = (modelRes['data'] as Map?)?.cast<String, dynamic>();
        }
      } catch (_) {
        // model endpoints are optional for degraded modes.
      }

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

  Future<void> _trainModel() async {
    final maxSamples = int.tryParse(_maxSamplesCtrl.text.trim());
    final iterations = int.tryParse(_iterationsCtrl.text.trim());
    final learningRate = double.tryParse(_learningRateCtrl.text.trim());

    if (maxSamples == null || iterations == null || learningRate == null) {
      setState(() {
        _modelNotice = 'Training config must be numeric values.';
        _modelNoticeIsError = true;
      });
      return;
    }

    setState(() {
      _modelActionLoading = true;
      _modelNotice = null;
    });

    try {
      final res = await ApiClient.post('/analytics/anomaly-model/train', {
        'maxSamples': maxSamples,
        'iterations': iterations,
        'learningRate': learningRate,
      });

      if (res['success'] == true) {
        final data = (res['data'] as Map?)?.cast<String, dynamic>() ?? {};
        final accuracy = (data['accuracy'] is num)
            ? ((data['accuracy'] as num) * 100).toStringAsFixed(2)
            : 'n/a';
        setState(() {
          _modelNotice = 'Model ${data['modelVersion'] ?? ''} trained: $accuracy% accuracy';
          _modelNoticeIsError = false;
        });
        await _fetchAnalytics();
      }
    } catch (e) {
      setState(() {
        _modelNotice = 'Model training failed: $e';
        _modelNoticeIsError = true;
      });
    } finally {
      if (mounted) setState(() => _modelActionLoading = false);
    }
  }

  Future<void> _scoreSandbox() async {
    final inactivity = int.tryParse(_inactivityCtrl.text.trim());
    final speed = double.tryParse(_speedCtrl.text.trim());
    final nearbyIncidents = int.tryParse(_nearbyIncidentsCtrl.text.trim());
    final nearbyCritical = int.tryParse(_nearbyCriticalCtrl.text.trim());
    final anomalies = int.tryParse(_anomaliesCtrl.text.trim());
    final ruleScore = double.tryParse(_ruleScoreCtrl.text.trim());

    if (inactivity == null || speed == null || nearbyIncidents == null || nearbyCritical == null || anomalies == null || ruleScore == null) {
      setState(() {
        _modelNotice = 'Sandbox inputs must be numeric.';
        _modelNoticeIsError = true;
      });
      return;
    }

    setState(() {
      _sandboxLoading = true;
      _modelNotice = null;
    });

    try {
      final res = await ApiClient.post('/analytics/anomaly-model/score', {
        'inactivityMinutes': inactivity,
        'speedKmh': speed,
        'isOutsideZone': _outsideZone,
        'nearbyIncidents15m': nearbyIncidents,
        'nearbyCriticalIncidents15m': nearbyCritical,
        'userAnomalies24h': anomalies,
        'ruleScore': ruleScore,
      });

      if (res['success'] == true) {
        setState(() {
          _sandboxResult = (res['data'] as Map?)?.cast<String, dynamic>() ?? {};
        });
      }
    } catch (e) {
      setState(() {
        _modelNotice = 'Sandbox scoring failed: $e';
        _modelNoticeIsError = true;
      });
    } finally {
      if (mounted) setState(() => _sandboxLoading = false);
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
            label: 'GENERATE AUDIT PDF',
            icon: Icons.picture_as_pdf_outlined,
            variant: ClayButtonVariant.ghost,
            isLoading: _auditLoading,
            onTap: _auditLoading ? null : _generateAuditReport,
          ),
          const SizedBox(height: 8),
          ClayButton(
            label: 'OPEN EFIR DESK',
            icon: Icons.open_in_new,
            onTap: () => context.push('/authority/efir'),
          ),
        ],
      ),
    );
  }

  Widget _modelControlCard() {
    final modelVersion = _modelStatus?['activeModelVersion']?.toString() ?? 'Unavailable';
    final accuracy = (_modelStatus?['accuracy'] is num)
        ? '${((_modelStatus!['accuracy'] as num) * 100).toStringAsFixed(2)}%'
        : 'N/A';

    return ClayCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Anomaly Model Control', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: Clay.text)),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: ClayInset(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('ACTIVE MODEL', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 9, color: Clay.textMuted)),
                      const SizedBox(height: 2),
                      Text(modelVersion, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.text)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ClayInset(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('ACCURACY', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 9, color: Clay.textMuted)),
                      const SizedBox(height: 2),
                      Text(accuracy, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.text)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(child: TextField(controller: _maxSamplesCtrl, decoration: const InputDecoration(labelText: 'Max Samples', isDense: true, border: OutlineInputBorder()))),
              const SizedBox(width: 8),
              Expanded(child: TextField(controller: _iterationsCtrl, decoration: const InputDecoration(labelText: 'Iterations', isDense: true, border: OutlineInputBorder()))),
              const SizedBox(width: 8),
              Expanded(child: TextField(controller: _learningRateCtrl, decoration: const InputDecoration(labelText: 'Learning Rate', isDense: true, border: OutlineInputBorder()))),
            ],
          ),
          const SizedBox(height: 10),
          ClayButton(
            label: 'TRAIN MODEL',
            variant: ClayButtonVariant.primary,
            isLoading: _modelActionLoading,
            onTap: _modelActionLoading ? null : _trainModel,
          ),
          if (_modelNotice != null) ...[
            const SizedBox(height: 8),
            Text(
              _modelNotice!,
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 11,
                color: _modelNoticeIsError ? Clay.high : Clay.safe,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _sandboxCard() {
    final modelScore = (_sandboxResult?['modelScore'] is num)
        ? '${(((_sandboxResult!['modelScore'] as num) * 100)).toStringAsFixed(2)}%'
        : '--';
    final hybridScore = (_sandboxResult?['hybridScore'] is num)
        ? '${(((_sandboxResult!['hybridScore'] as num) * 100)).toStringAsFixed(2)}%'
        : '--';

    return ClayCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Anomaly Sandbox', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: Clay.text)),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(child: TextField(controller: _inactivityCtrl, decoration: const InputDecoration(labelText: 'Inactivity (min)', isDense: true, border: OutlineInputBorder()))),
              const SizedBox(width: 8),
              Expanded(child: TextField(controller: _speedCtrl, decoration: const InputDecoration(labelText: 'Speed (km/h)', isDense: true, border: OutlineInputBorder()))),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(child: TextField(controller: _nearbyIncidentsCtrl, decoration: const InputDecoration(labelText: 'Nearby Incidents', isDense: true, border: OutlineInputBorder()))),
              const SizedBox(width: 8),
              Expanded(child: TextField(controller: _nearbyCriticalCtrl, decoration: const InputDecoration(labelText: 'Nearby Critical', isDense: true, border: OutlineInputBorder()))),
              const SizedBox(width: 8),
              Expanded(child: TextField(controller: _anomaliesCtrl, decoration: const InputDecoration(labelText: 'Anomalies 24h', isDense: true, border: OutlineInputBorder()))),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(child: TextField(controller: _ruleScoreCtrl, decoration: const InputDecoration(labelText: 'Rule Score', isDense: true, border: OutlineInputBorder()))),
              const SizedBox(width: 8),
              Expanded(
                child: Row(
                  children: [
                    Checkbox(value: _outsideZone, onChanged: (v) => setState(() => _outsideZone = v ?? false)),
                    const Text('Outside Zone', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.textMuted)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClayButton(
            label: 'SCORE PAYLOAD',
            variant: ClayButtonVariant.ghost,
            isLoading: _sandboxLoading,
            onTap: _sandboxLoading ? null : _scoreSandbox,
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(child: ClayInset(child: Text('Model Score: $modelScore', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.text)))),
              const SizedBox(width: 8),
              Expanded(child: ClayInset(child: Text('Hybrid Score: $hybridScore', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.text)))),
            ],
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
                  _modelControlCard(),
                  const SizedBox(height: 12),
                  _sandboxCard(),
                  const SizedBox(height: 12),
                  _exportCard(),
                ],
              ),
            ),
    );
  }
}
