import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/presentation/auth_screen.dart'; // for NB colors

class ResidentDashboard extends ConsumerStatefulWidget {
  const ResidentDashboard({super.key});

  @override
  ConsumerState<ResidentDashboard> createState() => _ResidentDashboardState();
}

class _ResidentDashboardState extends ConsumerState<ResidentDashboard> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: NB.cream,
      appBar: AppBar(
        title: const Text('Resident Ward Feed', style: TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Space Grotesk')),
        backgroundColor: NB.mint,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: Container(color: NB.black, height: 4),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text('RECENT INCIDENTS IN YOUR WARD', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1.5, color: NB.black)),
          const Divider(color: NB.black, thickness: 3),
          const SizedBox(height: 16),
          // Mock alert cards
          _buildAlertCard('Suspicious Activity', 'Reported near Central Park 10 mins ago', NB.yellow),
          _buildAlertCard('Road Block', 'Main Avenue closed for construction.', NB.blue, textColor: NB.white),
          _buildAlertCard('SOS Triggered', 'Emergency SOS signal received from tourist #B4F1...', NB.red, textColor: NB.white),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          // Open Report Form
        },
        backgroundColor: NB.mint,
        shape: RoundedRectangleBorder(side: const BorderSide(color: NB.black, width: 3), borderRadius: BorderRadius.circular(0)),
        label: const Text('REPORT', style: TextStyle(fontWeight: FontWeight.w900, color: NB.black)),
        icon: const Icon(Icons.add, color: NB.black),
      ),
    );
  }

  Widget _buildAlertCard(String title, String desc, Color bg, {Color textColor = NB.black}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bg,
        border: Border.all(color: NB.black, width: 3),
        boxShadow: const [BoxShadow(color: NB.black, offset: Offset(4, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: textColor)),
          const SizedBox(height: 8),
          Text(desc, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: textColor.withOpacity(0.9))),
        ],
      ),
    );
  }
}
