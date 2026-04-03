import 'dart:convert';
import 'package:crypto/crypto.dart';

class BlockchainIdGenerator {
  /// Generates a Blockchain ID equivalent to the Node.js implementation.
  /// Needs: userId, role, idHash (or phone), issuedAt, salt
  static String generateId({
    required String userId,
    required String role,
    required String idHash,
    required String issuedAt,
    required String salt,
  }) {
    // Construct Canonical JSON mapping
    final Map<String, dynamic> payload = {
      'idHash': idHash,
      'issuedAt': issuedAt,
      'role': role,
      'salt': salt,
      'userId': userId,
    };
    
    // Convert to JSON string
    final payloadString = jsonEncode(payload);
    
    // Hash with SHA-256
    final bytes = utf8.encode(payloadString);
    final digest = sha256.convert(bytes);
    
    // Hex string
    final hexString = digest.toString();
    
    // First 16 characters
    final truncated = hexString.substring(0, 16);
    
    // Prefix
    String prefix = 'BC';
    switch (role.toLowerCase()) {
      case 'tourist':
        prefix = 'BC';
        break;
      case 'resident':
        prefix = 'RE';
        break;
      case 'business':
        prefix = 'BZ';
        break;
      case 'authority':
        prefix = 'AU';
        break;
    }
    
    return '$prefix$truncated';
  }
}
