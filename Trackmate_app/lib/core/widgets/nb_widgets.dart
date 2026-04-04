import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Reusable Neo-Brutalism styled widgets
class NBCard extends StatelessWidget {
  final Widget child;
  final Color? color;
  final Color? borderColor;
  final double borderWidth;
  final EdgeInsetsGeometry? padding;
  final Color? topBorderColor;

  const NBCard({
    super.key,
    required this.child,
    this.color,
    this.borderColor,
    this.borderWidth = 3,
    this.padding,
    this.topBorderColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color ?? NB.white,
        border: Border(
          top: BorderSide(color: topBorderColor ?? (borderColor ?? NB.black), width: topBorderColor != null ? 6 : borderWidth),
          left: BorderSide(color: borderColor ?? NB.black, width: borderWidth),
          right: BorderSide(color: borderColor ?? NB.black, width: borderWidth),
          bottom: BorderSide(color: borderColor ?? NB.black, width: borderWidth),
        ),
        boxShadow: [BoxShadow(color: borderColor ?? NB.black, offset: const Offset(4, 4))],
      ),
      child: child,
    );
  }
}

class NBButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final Color? color;
  final Color? textColor;
  final IconData? icon;
  final bool isLoading;
  final bool fullWidth;
  final double? fontSize;

  const NBButton({
    super.key,
    required this.label,
    this.onTap,
    this.color,
    this.textColor,
    this.icon,
    this.isLoading = false,
    this.fullWidth = true,
    this.fontSize,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: isLoading ? null : onTap,
      child: Container(
        width: fullWidth ? double.infinity : null,
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
        decoration: BoxDecoration(
          color: color ?? NB.yellow,
          border: Border.all(color: NB.black, width: 3),
          boxShadow: const [BoxShadow(color: NB.black, offset: Offset(4, 4))],
        ),
        child: isLoading
            ? const Center(child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 3, color: NB.black)))
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: fullWidth ? MainAxisSize.max : MainAxisSize.min,
                children: [
                  if (icon != null) ...[Icon(icon, size: 18, color: textColor ?? NB.black), const SizedBox(width: 8)],
                  Text(label, style: TextStyle(fontWeight: FontWeight.w900, fontSize: fontSize ?? 13, letterSpacing: 1, color: textColor ?? NB.black)),
                ],
              ),
      ),
    );
  }
}

class NBInput extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final bool obscure;
  final int maxLines;
  final TextInputType? keyboardType;

  const NBInput({
    super.key,
    required this.controller,
    this.hint = '',
    this.obscure = false,
    this.maxLines = 1,
    this.keyboardType,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: NB.white,
        border: Border.all(color: NB.black, width: 3),
        boxShadow: const [BoxShadow(color: NB.black, offset: Offset(3, 3))],
      ),
      child: TextField(
        controller: controller,
        obscureText: obscure,
        maxLines: maxLines,
        keyboardType: keyboardType,
        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: Colors.grey.shade400, fontWeight: FontWeight.w500),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          isDense: true,
        ),
      ),
    );
  }
}

class NBLabel extends StatelessWidget {
  final String text;
  const NBLabel(this.text, {super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(text, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1.2, color: NB.textMuted)),
    );
  }
}

class NBBadge extends StatelessWidget {
  final String label;
  final Color color;
  final Color? textColor;

  const NBBadge({super.key, required this.label, required this.color, this.textColor});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        border: Border.all(color: NB.black, width: 2),
      ),
      child: Text(
        label,
        style: TextStyle(fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 0.8, color: textColor ?? NB.black),
      ),
    );
  }
}

class NBStatCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final IconData? icon;

  const NBStatCard({super.key, required this.label, required this.value, required this.color, this.icon});

  @override
  Widget build(BuildContext context) {
    return NBCard(
      topBorderColor: color,
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (icon != null) Icon(icon, color: color, size: 22),
          if (icon != null) const SizedBox(height: 8),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 24, fontFamily: 'JetBrains Mono')),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 9, letterSpacing: 1.2, color: NB.textMuted)),
        ],
      ),
    );
  }
}
