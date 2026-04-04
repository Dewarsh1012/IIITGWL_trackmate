import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/clay_widgets.dart';

class AuthorityEfirPage extends StatefulWidget {
  final String? incidentId;

  const AuthorityEfirPage({super.key, this.incidentId});

  @override
  State<AuthorityEfirPage> createState() => _AuthorityEfirPageState();
}

class _AuthorityEfirPageState extends State<AuthorityEfirPage> {
  final TextEditingController _subjectSearchController = TextEditingController();
  final TextEditingController _voiceTranscriptController = TextEditingController();
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _locationController = TextEditingController();
  final TextEditingController _evidenceUrlController = TextEditingController();

  bool _loading = true;
  bool _submitting = false;
  bool _voiceDraftLoading = false;
  bool _verifyingHash = false;
  String _status = 'draft';
  String _incidentType = 'Theft/Larceny';
  DateTime? _incidentTime;

  Map<String, dynamic>? _subject;
  List<Map<String, String>> _witnesses = [];
  List<String> _evidenceUrls = [];
  List<dynamic> _recentEfirs = [];

  String? _notice;
  bool _isNoticeError = false;
  String? _blockchainHash;
  String? _lastEfirId;
  String? _voiceDraftSource;
  String? _verifyMessage;
  bool _verifyMessageIsError = false;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
    _subjectSearchController.dispose();
    _voiceTranscriptController.dispose();
    _titleController.dispose();
    _descriptionController.dispose();
    _locationController.dispose();
    _evidenceUrlController.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    setState(() => _loading = true);
    await Future.wait([
      _loadRecentEfirs(),
      if (widget.incidentId != null) _prefillFromIncident(widget.incidentId!),
    ]);
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _loadRecentEfirs() async {
    try {
      final res = await ApiClient.get('/efirs');
      if (res['success'] == true && mounted) {
        setState(() => _recentEfirs = List<dynamic>.from(res['data'] ?? const []));
      }
    } catch (_) {
      // Keep page functional even if history cannot be loaded.
    }
  }

  Future<void> _prefillFromIncident(String incidentId) async {
    try {
      final res = await ApiClient.get('/incidents/$incidentId');
      if (res['success'] != true || !mounted) return;
      final incident = (res['data'] as Map?)?.cast<String, dynamic>() ?? {};

      _titleController.text = 'eFIR: ${incident['title'] ?? 'Untitled Incident'}';
      _descriptionController.text = (incident['description'] ?? '').toString();
      _incidentType = (incident['incident_type'] ?? 'General Safety').toString();

      final lat = incident['latitude'];
      final lng = incident['longitude'];
      if (lat is num && lng is num) {
        _locationController.text = '${lat.toStringAsFixed(5)}, ${lng.toStringAsFixed(5)}';
      }

      final createdAt = incident['created_at']?.toString();
      if (createdAt != null) {
        _incidentTime = DateTime.tryParse(createdAt);
      }

      final reporter = incident['reporter'];
      if (reporter is Map<String, dynamic>) {
        _subject = reporter;
      } else if (reporter is Map) {
        _subject = reporter.cast<String, dynamic>();
      }
    } catch (_) {
      if (!mounted) return;
      _showNotice('Could not prefill details from incident.', isError: true);
    }
  }

  void _showNotice(String message, {required bool isError}) {
    if (!mounted) return;
    setState(() {
      _notice = message;
      _isNoticeError = isError;
    });
  }

  Future<void> _generateVoiceDraft() async {
    final transcript = _voiceTranscriptController.text.trim();
    if (transcript.length < 25) {
      _showNotice('Provide at least 25 characters of transcript before generating a draft.', isError: true);
      return;
    }

    try {
      setState(() {
        _voiceDraftLoading = true;
        _notice = null;
      });

      final res = await ApiClient.post('/efirs/voice-draft', {
        'transcript': transcript,
        'incident_hint': _incidentType,
        'locale': 'en-IN',
      });

      if (res['success'] != true) {
        _showNotice('Voice draft generation failed.', isError: true);
        return;
      }

      final draft = (res['data'] as Map?)?.cast<String, dynamic>() ?? {};

      List<Map<String, String>> parsedWitnesses = [];
      final witnessList = draft['witness_statements'];
      if (witnessList is List) {
        parsedWitnesses = witnessList.whereType<Map>().map((raw) {
          final map = raw.cast<dynamic, dynamic>();
          return {
            'name': (map['name'] ?? '').toString(),
            'contact': (map['contact'] ?? '').toString(),
            'statement': (map['statement'] ?? '').toString(),
          };
        }).toList();
      }

      setState(() {
        final title = draft['title']?.toString();
        if (title != null && title.trim().isNotEmpty) {
          _titleController.text = title;
        }

        final description = draft['description']?.toString();
        if (description != null && description.trim().isNotEmpty) {
          _descriptionController.text = description;
        }

        final incidentType = draft['incident_type']?.toString();
        if (incidentType != null && incidentType.trim().isNotEmpty) {
          _incidentType = incidentType;
        }

        final location = draft['incident_location']?.toString();
        if (location != null && location.trim().isNotEmpty) {
          _locationController.text = location;
        }

        final incidentTime = draft['incident_time']?.toString();
        if (incidentTime != null && incidentTime.trim().isNotEmpty) {
          final parsed = DateTime.tryParse(incidentTime);
          if (parsed != null) {
            _incidentTime = parsed;
          }
        }

        if (parsedWitnesses.isNotEmpty) {
          _witnesses = parsedWitnesses;
        }

        _voiceDraftSource = draft['source']?.toString();
      });

      _showNotice(
        'Voice draft generated${_voiceDraftSource != null ? ' (${_voiceDraftSource!})' : ''}. Review fields before submit.',
        isError: false,
      );
    } catch (e) {
      _showNotice('Voice draft failed: $e', isError: true);
    } finally {
      if (mounted) setState(() => _voiceDraftLoading = false);
    }
  }

  Future<void> _verifyHash(String efirId) async {
    if (efirId.isEmpty) return;

    try {
      setState(() {
        _verifyingHash = true;
        _verifyMessage = null;
      });

      final res = await ApiClient.post('/efirs/$efirId/verify-hash', {});
      if (res['success'] != true) {
        _showNotice('Hash verification failed.', isError: true);
        return;
      }

      final data = (res['data'] as Map?)?.cast<String, dynamic>() ?? {};
      final verified = data['verified'] == true;
      final message = data['message']?.toString() ?? (verified ? 'Hash verified successfully.' : 'Hash verification failed.');

      setState(() {
        _lastEfirId = efirId;
        _verifyMessage = message;
        _verifyMessageIsError = !verified;

        final storedHash = data['storedHash']?.toString();
        if (storedHash != null && storedHash.isNotEmpty) {
          _blockchainHash = storedHash;
        }
      });

      _showNotice(message, isError: !verified);
    } catch (e) {
      _showNotice('Verification request failed: $e', isError: true);
    } finally {
      if (mounted) setState(() => _verifyingHash = false);
    }
  }

  Future<void> _findSubject() async {
    final query = _subjectSearchController.text.trim();
    if (query.isEmpty) {
      _showNotice('Enter blockchain ID, email, or name to search.', isError: true);
      return;
    }

    try {
      final res = await ApiClient.get('/profiles?search=$query');
      if (res['success'] == true && mounted) {
        final data = List<dynamic>.from(res['data'] ?? const []);
        if (data.isEmpty) {
          _showNotice('No subject found for "$query".', isError: true);
          return;
        }

        final first = data.first;
        if (first is Map<String, dynamic>) {
          setState(() => _subject = first);
        } else if (first is Map) {
          setState(() => _subject = first.cast<String, dynamic>());
        }
        _showNotice('Subject loaded successfully.', isError: false);
      }
    } catch (_) {
      _showNotice('Subject search failed. Please retry.', isError: true);
    }
  }

  Future<void> _pickIncidentDateTime() async {
    final now = DateTime.now();
    final initial = _incidentTime ?? now;

    final pickedDate = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(now.year - 2),
      lastDate: DateTime(now.year + 1),
    );
    if (pickedDate == null || !mounted) return;

    final pickedTime = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initial),
    );

    if (!mounted) return;
    setState(() {
      _incidentTime = DateTime(
        pickedDate.year,
        pickedDate.month,
        pickedDate.day,
        pickedTime?.hour ?? 0,
        pickedTime?.minute ?? 0,
      );
    });
  }

  void _addWitness() {
    setState(() {
      _witnesses.add({
        'name': '',
        'contact': '',
        'statement': '',
      });
    });
  }

  void _updateWitness(int index, String field, String value) {
    final copy = List<Map<String, String>>.from(_witnesses);
    final current = Map<String, String>.from(copy[index]);
    current[field] = value;
    copy[index] = current;
    setState(() => _witnesses = copy);
  }

  void _removeWitness(int index) {
    final copy = List<Map<String, String>>.from(_witnesses);
    if (index < 0 || index >= copy.length) return;
    copy.removeAt(index);
    setState(() => _witnesses = copy);
  }

  void _addEvidenceUrl() {
    final url = _evidenceUrlController.text.trim();
    if (url.isEmpty) return;
    setState(() {
      _evidenceUrls.add(url);
      _evidenceUrlController.clear();
    });
  }

  void _removeEvidenceUrl(int index) {
    final copy = List<String>.from(_evidenceUrls);
    if (index < 0 || index >= copy.length) return;
    copy.removeAt(index);
    setState(() => _evidenceUrls = copy);
  }

  bool _isValidForSubmit() {
    if (_subject == null) return false;
    if (_titleController.text.trim().length < 5) return false;
    if (_descriptionController.text.trim().length < 20) return false;
    return true;
  }

  Map<String, dynamic> _buildPayload() {
    final payload = <String, dynamic>{
      'user': _subject!['_id'],
      'title': _titleController.text.trim(),
      'description': _descriptionController.text.trim(),
      'incident_type': _incidentType,
    };

    if (widget.incidentId != null) {
      payload['incident'] = widget.incidentId;
    }

    final location = _locationController.text.trim();
    if (location.isNotEmpty) {
      payload['incident_location'] = location;
      final parts = location.split(',');
      if (parts.length == 2) {
        final lat = double.tryParse(parts[0].trim());
        final lng = double.tryParse(parts[1].trim());
        if (lat != null && lng != null) {
          payload['incident_lat'] = lat;
          payload['incident_lng'] = lng;
        }
      }
    }

    if (_incidentTime != null) {
      payload['incident_time'] = _incidentTime!.toIso8601String();
    }

    final validWitnesses = _witnesses.where((w) {
      final name = (w['name'] ?? '').trim();
      final statement = (w['statement'] ?? '').trim();
      return name.isNotEmpty && statement.length >= 10;
    }).map((w) {
      return {
        'name': (w['name'] ?? '').trim(),
        'contact': (w['contact'] ?? '').trim(),
        'statement': (w['statement'] ?? '').trim(),
      };
    }).toList();

    if (validWitnesses.isNotEmpty) {
      payload['witness_statements'] = validWitnesses;
    }

    if (_evidenceUrls.isNotEmpty) {
      payload['evidence_urls'] = _evidenceUrls;
    }

    return payload;
  }

  Future<void> _submit(String targetStatus) async {
    if (!_isValidForSubmit()) {
      _showNotice(
        'Complete required fields: subject, title (>=5), and description (>=20).',
        isError: true,
      );
      return;
    }

    try {
      setState(() {
        _submitting = true;
        _notice = null;
      });

      final createRes = await ApiClient.post('/efirs', _buildPayload());
      if (createRes['success'] != true) {
        _showNotice('Failed to create eFIR.', isError: true);
        return;
      }

      final created = (createRes['data'] as Map?)?.cast<String, dynamic>() ?? {};
      var finalStatus = (created['status'] ?? 'draft').toString();
      String? hash = created['blockchain_hash']?.toString();

      if (targetStatus == 'submitted') {
        final id = created['_id']?.toString();
        if (id != null && id.isNotEmpty) {
          final patchRes = await ApiClient.patch('/efirs/$id', {'status': 'submitted'});
          final patched = (patchRes['data'] as Map?)?.cast<String, dynamic>() ?? {};
          finalStatus = (patched['status'] ?? finalStatus).toString();
          hash = patched['blockchain_hash']?.toString();
        }
      }

      if (!mounted) return;
      setState(() {
        _status = finalStatus;
        _blockchainHash = hash;
        _lastEfirId = created['_id']?.toString();
        _verifyMessage = null;
      });

      _showNotice(
        targetStatus == 'submitted'
            ? 'eFIR submitted and anchored for verification.'
            : 'eFIR saved as draft.',
        isError: false,
      );
      await _loadRecentEfirs();
    } catch (e) {
      _showNotice('Submission failed: $e', isError: true);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  String _formatDateTime(DateTime? value) {
    if (value == null) return 'Pick date/time';
    final y = value.year.toString().padLeft(4, '0');
    final m = value.month.toString().padLeft(2, '0');
    final d = value.day.toString().padLeft(2, '0');
    final h = value.hour.toString().padLeft(2, '0');
    final min = value.minute.toString().padLeft(2, '0');
    return '$y-$m-$d $h:$min';
  }

  Widget _sectionTitle(IconData icon, String label) {
    return Row(
      children: [
        Icon(icon, color: Clay.primary, size: 18),
        const SizedBox(width: 8),
        Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: Clay.text),
        ),
      ],
    );
  }

  Widget _subjectCard() {
    return ClayCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle(Icons.person_search, 'Subject Information'),
          const SizedBox(height: 12),
          if (_subject == null) ...[
            const Text(
              'Search by blockchain ID, email, or name.',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 11, color: Clay.textMuted),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: ClayInput(
                    controller: _subjectSearchController,
                    hint: 'e.g. BC-7a3f-8891-2290',
                    prefixIcon: const Icon(Icons.search, size: 16, color: Clay.textMuted),
                  ),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  width: 110,
                  child: ClayButton(
                    label: 'SEARCH',
                    fullWidth: true,
                    onTap: _findSubject,
                  ),
                ),
              ],
            ),
          ] else ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Clay.surfaceAlt,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Clay.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _subject?['full_name']?.toString() ?? 'Unknown',
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: Clay.text),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Blockchain: ${_subject?['blockchain_id'] ?? 'N/A'}',
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 11, color: Clay.primary),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Email: ${_subject?['email'] ?? 'N/A'}',
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 11, color: Clay.textMuted),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () => setState(() => _subject = null),
                child: const Text('Change Subject'),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _incidentDetailsCard() {
    const incidentTypes = [
      'Theft/Larceny',
      'Assault',
      'Harassment',
      'Accident',
      'General Safety',
    ];

    return ClayCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle(Icons.report_problem_outlined, 'Incident Details'),
          const SizedBox(height: 12),
          const Text('FIR Title', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.textMuted)),
          const SizedBox(height: 6),
          ClayInput(
            controller: _titleController,
            hint: 'Unauthorized luggage access at transit hub',
          ),
          const SizedBox(height: 10),
          const Text('Incident Type', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.textMuted)),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: Clay.surfaceAlt,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Clay.border),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: incidentTypes.contains(_incidentType) ? _incidentType : incidentTypes.first,
                isExpanded: true,
                items: incidentTypes
                    .map((type) => DropdownMenuItem<String>(
                          value: type,
                          child: Text(type, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                        ))
                    .toList(),
                onChanged: (value) {
                  if (value == null) return;
                  setState(() => _incidentType = value);
                },
              ),
            ),
          ),
          const SizedBox(height: 10),
          const Text('Description', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.textMuted)),
          const SizedBox(height: 6),
          ClayInput(
            controller: _descriptionController,
            hint: 'Provide complete narrative of the incident...',
            maxLines: 5,
          ),
          const SizedBox(height: 10),
          const Text('Location (coordinates or zone)', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.textMuted)),
          const SizedBox(height: 6),
          ClayInput(
            controller: _locationController,
            hint: '28.6139, 77.2090',
            prefixIcon: const Icon(Icons.location_on_outlined, size: 16, color: Clay.textMuted),
          ),
          const SizedBox(height: 10),
          const Text('Incident Time', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.textMuted)),
          const SizedBox(height: 6),
          InkWell(
            onTap: _pickIncidentDateTime,
            borderRadius: BorderRadius.circular(14),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              decoration: BoxDecoration(
                color: Clay.surfaceAlt,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Clay.border),
              ),
              child: Row(
                children: [
                  const Icon(Icons.calendar_month_outlined, size: 16, color: Clay.textMuted),
                  const SizedBox(width: 8),
                  Text(
                    _formatDateTime(_incidentTime),
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: Clay.text),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _voiceDraftCard() {
    return ClayCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle(Icons.mic_none_outlined, 'Voice-to-eFIR Draft'),
          const SizedBox(height: 8),
          const Text(
            'Paste speech transcript or dictated notes (min 25 chars).',
            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 11, color: Clay.textMuted),
          ),
          const SizedBox(height: 8),
          ClayInput(
            controller: _voiceTranscriptController,
            hint: 'Describe what happened, when, and where...',
            maxLines: 4,
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: ClayButton(
                  label: 'GENERATE DRAFT',
                  icon: Icons.auto_awesome,
                  variant: ClayButtonVariant.primary,
                  isLoading: _voiceDraftLoading,
                  onTap: _voiceDraftLoading ? null : _generateVoiceDraft,
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                width: 92,
                child: ClayButton(
                  label: 'CLEAR',
                  icon: Icons.close,
                  variant: ClayButtonVariant.ghost,
                  fullWidth: true,
                  onTap: _voiceDraftLoading
                      ? null
                      : () {
                          setState(() => _voiceTranscriptController.clear());
                        },
                ),
              ),
            ],
          ),
          if (_voiceDraftSource != null) ...[
            const SizedBox(height: 8),
            Text(
              'Draft source: ${_voiceDraftSource!.toUpperCase()}',
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 10, color: Clay.primary),
            ),
          ],
        ],
      ),
    );
  }

  Widget _witnessCard() {
    return ClayCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _sectionTitle(Icons.groups_2_outlined, 'Witness Statements'),
              SizedBox(
                width: 110,
                child: ClayButton(
                  label: 'ADD',
                  variant: ClayButtonVariant.ghost,
                  fullWidth: true,
                  onTap: _addWitness,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (_witnesses.isEmpty)
            const Text(
              'No witness entries yet.',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 11, color: Clay.textMuted),
            )
          else
            ..._witnesses.asMap().entries.map((entry) {
              final i = entry.key;
              final witness = entry.value;
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Clay.surfaceAlt,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Clay.border),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            initialValue: witness['name'] ?? '',
                            onChanged: (v) => _updateWitness(i, 'name', v),
                            decoration: const InputDecoration(
                              labelText: 'Name',
                              isDense: true,
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextFormField(
                            initialValue: witness['contact'] ?? '',
                            onChanged: (v) => _updateWitness(i, 'contact', v),
                            decoration: const InputDecoration(
                              labelText: 'Contact',
                              isDense: true,
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          onPressed: () => _removeWitness(i),
                          icon: const Icon(Icons.delete_outline, color: Clay.high),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      initialValue: witness['statement'] ?? '',
                      onChanged: (v) => _updateWitness(i, 'statement', v),
                      minLines: 2,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Statement (min 10 chars)',
                        border: OutlineInputBorder(),
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

  Widget _submissionCard() {
    return ClayCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle(Icons.hub_outlined, 'Submission Control'),
          const SizedBox(height: 10),
          ClayButton(
            label: 'SUBMIT EFIR',
            icon: Icons.send,
            variant: ClayButtonVariant.primary,
            isLoading: _submitting,
            onTap: _submitting ? null : () => _submit('submitted'),
          ),
          const SizedBox(height: 8),
          ClayButton(
            label: 'SAVE DRAFT',
            icon: Icons.save_outlined,
            variant: ClayButtonVariant.ghost,
            isLoading: _submitting,
            onTap: _submitting ? null : () => _submit('draft'),
          ),
          const SizedBox(height: 12),
          ClayInset(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.verified_outlined, size: 15, color: Clay.safe),
                    const SizedBox(width: 6),
                    const Text(
                      'Blockchain Verification',
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 10, color: Clay.textMuted),
                    ),
                    const Spacer(),
                    ClayBadge(
                      label: _status.toUpperCase(),
                      color: Clay.surface,
                      textColor: _status == 'submitted' ? Clay.safe : Clay.textMuted,
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  _blockchainHash ?? 'Hash will be generated when submitting this eFIR.',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 10,
                    color: Clay.textSecondary,
                  ),
                ),
                const SizedBox(height: 8),
                ClayButton(
                  label: 'VERIFY HASH',
                  icon: Icons.verified_user_outlined,
                  variant: ClayButtonVariant.ghost,
                  isLoading: _verifyingHash,
                  onTap: (_verifyingHash || _lastEfirId == null || _lastEfirId!.isEmpty)
                      ? null
                      : () => _verifyHash(_lastEfirId!),
                ),
                if (_lastEfirId == null || _lastEfirId!.isEmpty)
                  const Padding(
                    padding: EdgeInsets.only(top: 6),
                    child: Text(
                      'Submit an eFIR first to enable one-tap verification.',
                      style: TextStyle(fontWeight: FontWeight.w600, fontSize: 10, color: Clay.textMuted),
                    ),
                  ),
                if (_verifyMessage != null) ...[
                  const SizedBox(height: 6),
                  Text(
                    _verifyMessage!,
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 10,
                      color: _verifyMessageIsError ? Clay.high : Clay.safe,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _evidenceCard() {
    return ClayCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle(Icons.attachment_outlined, 'Evidence Vault'),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: ClayInput(
                  controller: _evidenceUrlController,
                  hint: 'Paste evidence URL',
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                width: 100,
                child: ClayButton(
                  label: 'ADD',
                  variant: ClayButtonVariant.ghost,
                  fullWidth: true,
                  onTap: _addEvidenceUrl,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (_evidenceUrls.isEmpty)
            const Text('No evidence URLs attached.', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 11, color: Clay.textMuted))
          else
            ..._evidenceUrls.asMap().entries.map((entry) {
              final i = entry.key;
              final url = entry.value;
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                decoration: BoxDecoration(
                  color: Clay.surfaceAlt,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Clay.border),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.link, size: 14, color: Clay.textMuted),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        url,
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 10, color: Clay.textSecondary),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    IconButton(
                      onPressed: () => _removeEvidenceUrl(i),
                      icon: const Icon(Icons.close, size: 16, color: Clay.high),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _recentEfirsCard() {
    return ClayCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle(Icons.folder_open_outlined, 'Recent eFIR Records'),
          const SizedBox(height: 10),
          if (_recentEfirs.isEmpty)
            const Text('No eFIR records found yet.', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 11, color: Clay.textMuted))
          else
            ..._recentEfirs.take(6).map((efir) {
              final title = efir['title']?.toString() ?? 'Untitled';
              final status = efir['status']?.toString() ?? 'draft';
              final subjectName = efir['user']?['full_name']?.toString() ?? 'Unknown Subject';
              final hash = efir['blockchain_hash']?.toString();
              final efirId = efir['_id']?.toString() ?? '';

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
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 11, color: Clay.text),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        ClayBadge(
                          label: status.toUpperCase(),
                          color: status == 'submitted' ? Clay.safe.withValues(alpha: 0.14) : Clay.surface,
                          textColor: status == 'submitted' ? Clay.safe : Clay.textMuted,
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subjectName,
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 10, color: Clay.textMuted),
                    ),
                    if (hash != null && hash.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          hash,
                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 9, color: Clay.textSecondary),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    if (hash != null && hash.isNotEmpty && efirId.isNotEmpty)
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton.icon(
                          onPressed: _verifyingHash ? null : () => _verifyHash(efirId),
                          icon: const Icon(Icons.verified_outlined, size: 14),
                          label: const Text('Verify'),
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

  Widget _pipelineHeader() {
    final steps = const ['draft', 'submitted', 'under_review', 'resolved', 'closed'];

    return ClayCard(
      child: Row(
        children: steps.map((step) {
          final active = _status == step;
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 3),
              child: Column(
                children: [
                  Container(
                    height: 4,
                    decoration: BoxDecoration(
                      color: active ? Clay.primary : Clay.surfaceAlt,
                      borderRadius: BorderRadius.circular(99),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    step.replaceAll('_', ' ').toUpperCase(),
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 9,
                      color: active ? Clay.primary : Clay.textMuted,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Clay.bg,
      appBar: AppBar(
        backgroundColor: Clay.surface,
        title: const Text('Authority eFIR Desk', style: TextStyle(fontWeight: FontWeight.w800, color: Clay.text)),
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
                  _pipelineHeader(),
                  if (_notice != null) ...[
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: _isNoticeError ? Clay.high.withValues(alpha: 0.12) : Clay.safe.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _isNoticeError ? Clay.high.withValues(alpha: 0.24) : Clay.safe.withValues(alpha: 0.24),
                        ),
                      ),
                      child: Text(
                        _notice!,
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.text),
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  LayoutBuilder(
                    builder: (context, constraints) {
                      final compact = constraints.maxWidth < 900;
                      if (compact) {
                        return Column(
                          children: [
                            _subjectCard(),
                            const SizedBox(height: 10),
                            _voiceDraftCard(),
                            const SizedBox(height: 10),
                            _incidentDetailsCard(),
                            const SizedBox(height: 10),
                            _witnessCard(),
                            const SizedBox(height: 10),
                            _submissionCard(),
                            const SizedBox(height: 10),
                            _evidenceCard(),
                            const SizedBox(height: 10),
                            _recentEfirsCard(),
                          ],
                        );
                      }

                      return Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            flex: 3,
                            child: Column(
                              children: [
                                _subjectCard(),
                                const SizedBox(height: 10),
                                _voiceDraftCard(),
                                const SizedBox(height: 10),
                                _incidentDetailsCard(),
                                const SizedBox(height: 10),
                                _witnessCard(),
                              ],
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            flex: 2,
                            child: Column(
                              children: [
                                _submissionCard(),
                                const SizedBox(height: 10),
                                _evidenceCard(),
                                const SizedBox(height: 10),
                                _recentEfirsCard(),
                              ],
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),
    );
  }
}
