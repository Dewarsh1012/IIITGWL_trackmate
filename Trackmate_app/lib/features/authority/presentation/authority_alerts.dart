import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/clay_widgets.dart';

class AuthorityAlertComposerPage extends StatefulWidget {
  const AuthorityAlertComposerPage({super.key});

  @override
  State<AuthorityAlertComposerPage> createState() => _AuthorityAlertComposerPageState();
}

class _AuthorityAlertComposerPageState extends State<AuthorityAlertComposerPage> {
  final TextEditingController _titleCtrl = TextEditingController();
  final TextEditingController _messageCtrl = TextEditingController();
  final TextEditingController _targetUserCtrl = TextEditingController();

  bool _sending = false;
  bool _loading = true;

  String _alertType = 'general';
  String _priority = 'medium';
  String _targetGroup = 'all';
  String? _targetZoneId;

  List<dynamic> _history = [];
  List<dynamic> _zones = [];

  String? _notice;
  bool _noticeIsError = false;

  static const List<String> _alertTypes = [
    'emergency',
    'safety_warning',
    'weather',
    'traffic',
    'zone_update',
    'curfew',
    'evacuation',
    'general',
  ];

  static const List<String> _priorities = ['low', 'medium', 'high', 'critical'];
  static const List<String> _targetGroups = ['all', 'tourists', 'residents', 'businesses', 'user', 'zone'];

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _messageCtrl.dispose();
    _targetUserCtrl.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    setState(() => _loading = true);
    await Future.wait([_loadHistory(), _loadZones()]);
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _loadHistory() async {
    try {
      final res = await ApiClient.get('/alerts?limit=30');
      if (res['success'] == true && mounted) {
        setState(() => _history = List<dynamic>.from(res['data'] ?? const []));
      }
    } catch (_) {
      // ignore transient failures
    }
  }

  Future<void> _loadZones() async {
    try {
      final res = await ApiClient.get('/zones');
      if (res['success'] == true && mounted) {
        setState(() {
          _zones = List<dynamic>.from(res['data'] ?? const []);
          _targetZoneId ??= _zones.isNotEmpty ? _zones.first['_id']?.toString() : null;
        });
      }
    } catch (_) {
      // ignore transient failures
    }
  }

  Future<void> _sendAlert() async {
    if (_titleCtrl.text.trim().length < 2 || _messageCtrl.text.trim().length < 2) {
      setState(() {
        _notice = 'Title and message are required.';
        _noticeIsError = true;
      });
      return;
    }

    if (_targetGroup == 'user' && _targetUserCtrl.text.trim().isEmpty) {
      setState(() {
        _notice = 'Target user id is required for user-targeted alerts.';
        _noticeIsError = true;
      });
      return;
    }

    if (_targetGroup == 'zone' && (_targetZoneId == null || _targetZoneId!.isEmpty)) {
      setState(() {
        _notice = 'Please select a target zone.';
        _noticeIsError = true;
      });
      return;
    }

    setState(() {
      _sending = true;
      _notice = null;
    });

    try {
      final payload = <String, dynamic>{
        'title': _titleCtrl.text.trim(),
        'message': _messageCtrl.text.trim(),
        'alert_type': _alertType,
        'priority': _priority,
        'target_group': _targetGroup,
      };

      if (_targetGroup == 'user') {
        payload['target_user_id'] = _targetUserCtrl.text.trim();
      }
      if (_targetGroup == 'zone') {
        payload['target_zone_id'] = _targetZoneId;
      }

      final res = await ApiClient.post('/alerts', payload);
      if (res['success'] == true) {
        final recipients = res['recipientCount'] ?? 0;
        setState(() {
          _notice = 'Alert sent to $recipients users.';
          _noticeIsError = false;
          _titleCtrl.clear();
          _messageCtrl.clear();
          _targetUserCtrl.clear();
          _targetGroup = 'all';
          _priority = 'medium';
          _alertType = 'general';
        });
        await _loadHistory();
      }
    } catch (e) {
      setState(() {
        _notice = 'Failed to send alert: $e';
        _noticeIsError = true;
      });
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Color _priorityColor(String priority) {
    switch (priority) {
      case 'critical':
        return Clay.critical;
      case 'high':
        return Clay.high;
      case 'medium':
        return Clay.moderate;
      default:
        return Clay.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Clay.bg,
      appBar: AppBar(
        backgroundColor: Clay.surface,
        title: const Text('Alert Broadcaster', style: TextStyle(fontWeight: FontWeight.w800, color: Clay.text)),
        actions: [
          IconButton(
            onPressed: _bootstrap,
            icon: const Icon(Icons.refresh, color: Clay.text),
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Clay.primary))
          : RefreshIndicator(
              onRefresh: _bootstrap,
              color: Clay.primary,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (_notice != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _noticeIsError ? Clay.high.withValues(alpha: 0.10) : Clay.safe.withValues(alpha: 0.10),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _noticeIsError ? Clay.high.withValues(alpha: 0.22) : Clay.safe.withValues(alpha: 0.22),
                        ),
                      ),
                      child: Text(
                        _notice!,
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: Clay.text),
                      ),
                    ),
                  ClayCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Compose Alert', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: Clay.text)),
                        const SizedBox(height: 12),
                        const Text('Title', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.textMuted)),
                        const SizedBox(height: 6),
                        ClayInput(controller: _titleCtrl, hint: 'Alert title'),
                        const SizedBox(height: 10),
                        const Text('Message', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.textMuted)),
                        const SizedBox(height: 6),
                        ClayInput(controller: _messageCtrl, hint: 'Detailed advisory message', maxLines: 4),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Expanded(child: _buildDropdownCard('Type', _alertType, _alertTypes, (v) => setState(() => _alertType = v))),
                            const SizedBox(width: 10),
                            Expanded(child: _buildDropdownCard('Priority', _priority, _priorities, (v) => setState(() => _priority = v))),
                          ],
                        ),
                        const SizedBox(height: 10),
                        _buildDropdownCard('Target Group', _targetGroup, _targetGroups, (v) => setState(() => _targetGroup = v)),
                        if (_targetGroup == 'user') ...[
                          const SizedBox(height: 10),
                          const Text('Target User ID', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.textMuted)),
                          const SizedBox(height: 6),
                          ClayInput(controller: _targetUserCtrl, hint: 'Paste user id'),
                        ],
                        if (_targetGroup == 'zone') ...[
                          const SizedBox(height: 10),
                          _buildZoneSelector(),
                        ],
                        const SizedBox(height: 12),
                        ClayButton(
                          label: 'SEND ALERT',
                          icon: Icons.send,
                          isLoading: _sending,
                          onTap: _sending ? null : _sendAlert,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  ClayCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Alert History', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: Clay.text)),
                            ClayBadge(
                              label: '${_history.length} SENT',
                              color: Clay.surfaceAlt,
                              textColor: Clay.textMuted,
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        if (_history.isEmpty)
                          const Text('No alerts sent yet.', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 11, color: Clay.textMuted))
                        else
                          ..._history.map((item) {
                            final priority = item['priority']?.toString() ?? 'low';
                            final createdAt = DateTime.tryParse(item['created_at']?.toString() ?? '');
                            final createdText = createdAt == null
                                ? 'Unknown time'
                                : '${createdAt.toLocal().year}-${createdAt.toLocal().month.toString().padLeft(2, '0')}-${createdAt.toLocal().day.toString().padLeft(2, '0')} ${createdAt.toLocal().hour.toString().padLeft(2, '0')}:${createdAt.toLocal().minute.toString().padLeft(2, '0')}';

                            return Container(
                              margin: const EdgeInsets.only(bottom: 10),
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
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Expanded(
                                        child: Text(
                                          item['title']?.toString() ?? 'Untitled Alert',
                                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: Clay.text),
                                        ),
                                      ),
                                      ClayBadge(
                                        label: priority.toUpperCase(),
                                        color: _priorityColor(priority).withValues(alpha: 0.14),
                                        textColor: _priorityColor(priority),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    item['message']?.toString() ?? '',
                                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 11, color: Clay.textSecondary),
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        '${item['readCount'] ?? 0}/${item['recipientCount'] ?? 0} read • ${item['ackCount'] ?? 0} ack',
                                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 10, color: Clay.textMuted),
                                      ),
                                      Text(
                                        createdText,
                                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 10, color: Clay.textMuted),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            );
                          }),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildDropdownCard(
    String label,
    String value,
    List<String> options,
    ValueChanged<String> onChanged,
  ) {
    final isValid = options.contains(value);
    final selected = isValid ? value : options.first;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.textMuted)),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: Clay.surfaceAlt,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Clay.border),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: selected,
              isExpanded: true,
              items: options
                  .map((item) => DropdownMenuItem<String>(
                        value: item,
                        child: Text(item.toUpperCase(), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                      ))
                  .toList(),
              onChanged: (next) {
                if (next == null) return;
                onChanged(next);
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildZoneSelector() {
    if (_zones.isEmpty) {
      return const Text('No active zones available.', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 11, color: Clay.textMuted));
    }

    return _buildDropdownCard(
      'Target Zone',
      _targetZoneId ?? _zones.first['_id']?.toString() ?? '',
      _zones.map((z) => z['_id']?.toString() ?? '').where((id) => id.isNotEmpty).toList(),
      (selectedId) => setState(() => _targetZoneId = selectedId),
    );
  }
}
