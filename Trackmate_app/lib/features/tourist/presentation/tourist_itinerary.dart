import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/clay_widgets.dart';

class TouristItineraryPage extends StatefulWidget {
  const TouristItineraryPage({super.key});

  @override
  State<TouristItineraryPage> createState() => _TouristItineraryPageState();
}

class _TouristItineraryPageState extends State<TouristItineraryPage> {
  bool _loading = true;
  bool _savingTrip = false;
  bool _savingStop = false;

  Map<String, dynamic>? _trip;
  Map<String, dynamic>? _itinerary;
  List<dynamic> _stops = [];

  final _destinationCtrl = TextEditingController();
  final _startCtrl = TextEditingController();
  final _endCtrl = TextEditingController();
  final _entryCtrl = TextEditingController();

  final _stopNameCtrl = TextEditingController();
  final _stopLatCtrl = TextEditingController();
  final _stopLngCtrl = TextEditingController();
  final _stopNoteCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _destinationCtrl.dispose();
    _startCtrl.dispose();
    _endCtrl.dispose();
    _entryCtrl.dispose();
    _stopNameCtrl.dispose();
    _stopLatCtrl.dispose();
    _stopLngCtrl.dispose();
    _stopNoteCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final tripRes = await ApiClient.get('/trips/active');
      if (tripRes['success'] == true && tripRes['data'] != null) {
        final t = Map<String, dynamic>.from(tripRes['data']);
        _trip = t;
        _destinationCtrl.text = t['destination_region'] ?? '';
        _startCtrl.text = (t['start_date'] ?? '').toString().split('T').first;
        _endCtrl.text = (t['end_date'] ?? '').toString().split('T').first;
        _entryCtrl.text = t['entry_point'] ?? '';

        final itineraryRes = await ApiClient.get('/trips/${t['_id']}/itinerary');
        if (itineraryRes['success'] == true && itineraryRes['data'] != null) {
          _itinerary = Map<String, dynamic>.from(itineraryRes['data']);
          _stops = List<dynamic>.from(_itinerary!['stops'] ?? []);
        }
      }
    } catch (_) {
      // ignore
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _createOrUpdateTrip() async {
    if (_destinationCtrl.text.isEmpty || _startCtrl.text.isEmpty || _endCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Destination and dates are required.')));
      return;
    }

    setState(() => _savingTrip = true);
    try {
      final payload = {
        'destination_region': _destinationCtrl.text.trim(),
        'start_date': _startCtrl.text.trim(),
        'end_date': _endCtrl.text.trim(),
        'entry_point': _entryCtrl.text.trim().isEmpty ? null : _entryCtrl.text.trim(),
      };

      if (_trip == null) {
        final res = await ApiClient.post('/trips', payload);
        if (res['success'] == true) {
          _trip = Map<String, dynamic>.from(res['data']);
          final itRes = await ApiClient.post('/trips/${_trip!['_id']}/itinerary', {'title': 'Primary Itinerary'});
          if (itRes['success'] == true && itRes['data'] != null) {
            _itinerary = Map<String, dynamic>.from(itRes['data']);
            _stops = List<dynamic>.from(_itinerary!['stops'] ?? []);
          }
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Trip created.')));
          }
        }
      } else {
        final res = await ApiClient.patch('/trips/${_trip!['_id']}', payload);
        if (res['success'] == true && mounted) {
          _trip = Map<String, dynamic>.from(res['data']);
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Trip updated.')));
        }
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to save trip: $e')));
    } finally {
      if (mounted) setState(() => _savingTrip = false);
    }
  }

  Future<void> _addStop() async {
    if (_itinerary == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Create trip first.')));
      return;
    }
    if (_stopNameCtrl.text.isEmpty || _stopLatCtrl.text.isEmpty || _stopLngCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Stop name and coordinates are required.')));
      return;
    }

    final lat = double.tryParse(_stopLatCtrl.text.trim());
    final lng = double.tryParse(_stopLngCtrl.text.trim());
    if (lat == null || lng == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Invalid coordinates.')));
      return;
    }

    setState(() => _savingStop = true);
    try {
      final payload = {
        'destination_name': _stopNameCtrl.text.trim(),
        'description': _stopNoteCtrl.text.trim(),
        'latitude': lat,
        'longitude': lng,
        'sort_order': _stops.length,
      };
      final res = await ApiClient.post('/trips/itinerary/${_itinerary!['_id']}/stops', payload);
      if (res['success'] == true) {
        _stops = [..._stops, res['data']];
        _stopNameCtrl.clear();
        _stopLatCtrl.clear();
        _stopLngCtrl.clear();
        _stopNoteCtrl.clear();
        if (mounted) {
          setState(() {});
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Stop added.')));
        }
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to add stop: $e')));
    } finally {
      if (mounted) setState(() => _savingStop = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Clay.bg,
      appBar: AppBar(
        backgroundColor: Clay.surface,
        title: const Text('Trip Itinerary', style: TextStyle(fontWeight: FontWeight.w800, color: Clay.text)),
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
                      const Text('Trip Plan', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: Clay.text)),
                      const SizedBox(height: 10),
                      const Text('Destination Region', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.textMuted)),
                      const SizedBox(height: 4),
                      ClayInput(controller: _destinationCtrl, hint: 'e.g. Tawang District'),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Start Date', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.textMuted)),
                                const SizedBox(height: 4),
                                ClayInput(controller: _startCtrl, hint: 'YYYY-MM-DD'),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('End Date', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.textMuted)),
                                const SizedBox(height: 4),
                                ClayInput(controller: _endCtrl, hint: 'YYYY-MM-DD'),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      const Text('Entry Point', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.textMuted)),
                      const SizedBox(height: 4),
                      ClayInput(controller: _entryCtrl, hint: 'Optional'),
                      const SizedBox(height: 12),
                      ClayButton(
                        label: _trip == null ? 'CREATE TRIP' : 'UPDATE TRIP',
                        isLoading: _savingTrip,
                        variant: ClayButtonVariant.primary,
                        onTap: _createOrUpdateTrip,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                ClayCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Add Stop', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: Clay.text)),
                      const SizedBox(height: 10),
                      ClayInput(controller: _stopNameCtrl, hint: 'Destination name'),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(child: ClayInput(controller: _stopLatCtrl, hint: 'Latitude', keyboardType: TextInputType.number)),
                          const SizedBox(width: 8),
                          Expanded(child: ClayInput(controller: _stopLngCtrl, hint: 'Longitude', keyboardType: TextInputType.number)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ClayInput(controller: _stopNoteCtrl, hint: 'Notes', maxLines: 2),
                      const SizedBox(height: 12),
                      ClayButton(
                        label: 'ADD STOP',
                        isLoading: _savingStop,
                        variant: ClayButtonVariant.ghost,
                        onTap: _addStop,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                ClayCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Stops', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: Clay.text)),
                      const SizedBox(height: 10),
                      if (_stops.isEmpty)
                        const Text('No stops yet.', style: TextStyle(fontWeight: FontWeight.w600, color: Clay.textMuted))
                      else
                        ..._stops.map((s) {
                          final status = (s['status'] ?? 'planned').toString().toUpperCase();
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: ClayInset(
                              child: Row(
                                children: [
                                  const Icon(Icons.place, size: 16, color: Clay.primary),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(s['destination_name'] ?? 'Stop', style: const TextStyle(fontWeight: FontWeight.w700, color: Clay.text)),
                                        Text(
                                          '${s['latitude']}, ${s['longitude']}',
                                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 11, color: Clay.textMuted),
                                        ),
                                      ],
                                    ),
                                  ),
                                  ClayBadge(label: status, color: Clay.surfaceAlt, textColor: Clay.textMuted),
                                ],
                              ),
                            ),
                          );
                        }),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
