import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

enum ClayButtonVariant { primary, secondary, ghost, danger }

class ClayCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final Color? color;
  final Color? borderColor;
  final double radius;
  final VoidCallback? onTap;

  const ClayCard({
    super.key,
    required this.child,
    this.padding,
    this.color,
    this.borderColor,
    this.radius = 20,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final card = Container(
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color ?? Clay.card,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: borderColor ?? Clay.border, width: 1),
        boxShadow: const [
          BoxShadow(color: Color(0x1A1B1D2A), offset: Offset(6, 6), blurRadius: 14),
          BoxShadow(color: Color(0xE6FFFFFF), offset: Offset(-3, -3), blurRadius: 10),
        ],
      ),
      child: child,
    );

    if (onTap == null) return card;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(radius),
      child: card,
    );
  }
}

class ClayInset extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final double radius;

  const ClayInset({
    super.key,
    required this.child,
    this.padding,
    this.radius = 14,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Clay.surfaceAlt,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: Clay.border, width: 1),
        boxShadow: const [
          BoxShadow(color: Color(0x0F1B1D2A), offset: Offset(2, 2), blurRadius: 6),
          BoxShadow(color: Color(0xCCFFFFFF), offset: Offset(-2, -2), blurRadius: 4),
        ],
      ),
      child: child,
    );
  }
}

class ClayBadge extends StatelessWidget {
  final String label;
  final Color? color;
  final Color? textColor;

  const ClayBadge({
    super.key,
    required this.label,
    this.color,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color ?? Clay.surfaceAlt,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Clay.border, width: 1),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontWeight: FontWeight.w700,
          fontSize: 10,
          letterSpacing: 0.6,
          color: textColor ?? Clay.text,
        ),
      ),
    );
  }
}

class ClayButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final ClayButtonVariant variant;
  final bool isLoading;
  final bool fullWidth;
  final IconData? icon;

  const ClayButton({
    super.key,
    required this.label,
    this.onTap,
    this.variant = ClayButtonVariant.primary,
    this.isLoading = false,
    this.fullWidth = true,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final isDisabled = onTap == null || isLoading;

    Color bg = Clay.surface;
    Color fg = Clay.text;
    List<BoxShadow> shadow = const [
      BoxShadow(color: Color(0x1A1B1D2A), offset: Offset(4, 4), blurRadius: 10),
      BoxShadow(color: Color(0xE6FFFFFF), offset: Offset(-2, -2), blurRadius: 8),
    ];

    if (variant == ClayButtonVariant.primary) {
      bg = Clay.primary;
      fg = Colors.white;
      shadow = const [BoxShadow(color: Color(0x406C63FF), offset: Offset(0, 6), blurRadius: 16)];
    } else if (variant == ClayButtonVariant.danger) {
      bg = Clay.critical;
      fg = Colors.white;
      shadow = const [BoxShadow(color: Color(0x40EF4444), offset: Offset(0, 6), blurRadius: 16)];
    } else if (variant == ClayButtonVariant.ghost) {
      bg = Clay.surfaceAlt;
      fg = Clay.text;
    }

    return GestureDetector(
      onTap: isDisabled ? null : onTap,
      child: Container(
        width: fullWidth ? double.infinity : null,
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(14),
          border: variant == ClayButtonVariant.primary || variant == ClayButtonVariant.danger
              ? null
              : Border.all(color: Clay.border, width: 1),
          boxShadow: shadow,
        ),
        child: isLoading
            ? const Center(
                child: SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: fullWidth ? MainAxisSize.max : MainAxisSize.min,
                children: [
                  if (icon != null) ...[Icon(icon, size: 16, color: fg), const SizedBox(width: 8)],
                  Text(
                    label,
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 12,
                      letterSpacing: 0.6,
                      color: fg,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

class ClayInput extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final bool obscure;
  final int maxLines;
  final TextInputType? keyboardType;
  final Widget? prefixIcon;

  const ClayInput({
    super.key,
    required this.controller,
    this.hint = '',
    this.obscure = false,
    this.maxLines = 1,
    this.keyboardType,
    this.prefixIcon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Clay.surfaceAlt,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Clay.border, width: 1),
        boxShadow: const [
          BoxShadow(color: Color(0x0F1B1D2A), offset: Offset(2, 2), blurRadius: 6),
          BoxShadow(color: Color(0xCCFFFFFF), offset: Offset(-2, -2), blurRadius: 4),
        ],
      ),
      child: TextField(
        controller: controller,
        obscureText: obscure,
        maxLines: maxLines,
        keyboardType: keyboardType,
        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Clay.text),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Clay.textMuted, fontWeight: FontWeight.w500),
          prefixIcon: prefixIcon,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          isDense: true,
        ),
      ),
    );
  }
}
