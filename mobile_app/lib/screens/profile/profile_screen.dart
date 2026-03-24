// ignore_for_file: prefer_const_constructors, deprecated_member_use, use_build_context_synchronously

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../config/app_theme.dart';
import '../../../providers/auth_provider.dart';
import '../../../services/auth_service.dart';
import '../login_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _changingPass = false;
  final _oldPassCtrl  = TextEditingController();
  final _newPassCtrl  = TextEditingController();
  final _confPassCtrl = TextEditingController();

  @override
  void dispose() {
    _oldPassCtrl.dispose();
    _newPassCtrl.dispose();
    _confPassCtrl.dispose();
    super.dispose();
  }

  Future<void> _logout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'Logout',
          style: TextStyle(
            fontFamily: 'TimesNewRoman',
            fontWeight: FontWeight.w700,
          ),
        ),
        content: const Text(
          'Are you sure you want to logout?',
          style: TextStyle(fontFamily: 'TimesNewRoman'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel',
              style: TextStyle(fontFamily: 'TimesNewRoman')),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.danger,
            ),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Logout',
              style: TextStyle(fontFamily: 'TimesNewRoman')),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      await context.read<AuthProvider>().logout();
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (_) => false,
      );
    }
  }

  Future<void> _changePassword() async {
    if (_newPassCtrl.text != _confPassCtrl.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Passwords do not match.',
            style: TextStyle(fontFamily: 'TimesNewRoman')),
          backgroundColor: AppTheme.danger,
        ),
      );
      return;
    }
    setState(() => _changingPass = true);
    try {
      await AuthService.changePassword(
        currentPassword: _oldPassCtrl.text,
        newPassword:     _newPassCtrl.text,
      );
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Password changed successfully! 🔑',
              style: TextStyle(fontFamily: 'TimesNewRoman')),
            backgroundColor: AppTheme.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString(),
              style: const TextStyle(
                fontFamily: 'TimesNewRoman')),
            backgroundColor: AppTheme.danger,
          ),
        );
      }
    } finally {
      setState(() => _changingPass = false);
    }
  }

  void _showChangePassword() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(
              top: Radius.circular(24),
            ),
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40, height: 4,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppTheme.gray200,
                  borderRadius: BorderRadius.circular(99),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                '🔑 Change Password',
                style: TextStyle(
                  fontFamily: 'TimesNewRoman',
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.navy800,
                  fontStyle: FontStyle.italic,
                ),
              ),
              const SizedBox(height: 20),
              _PassField(
                ctrl: _oldPassCtrl,
                label: 'Current Password',
              ),
              const SizedBox(height: 12),
              _PassField(
                ctrl: _newPassCtrl,
                label: 'New Password',
              ),
              const SizedBox(height: 12),
              _PassField(
                ctrl: _confPassCtrl,
                label: 'Confirm New Password',
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _changingPass
                      ? null : _changePassword,
                  child: _changingPass
                    ? const SizedBox(
                        width: 20, height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text(
                        '🔑  Update Password',
                        style: TextStyle(
                          fontFamily: 'TimesNewRoman',
                          fontWeight: FontWeight.w700,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                ),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      backgroundColor: AppTheme.gray50,
      body: CustomScrollView(
        slivers: [

          // Header
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: AppTheme.navy800,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppTheme.navy900, AppTheme.navy700,
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: SafeArea(
                  child: Column(
                    mainAxisAlignment:
                        MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 40),
                      // Avatar
                      Container(
                        width: 80, height: 80,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.15),
                          borderRadius:
                              BorderRadius.circular(24),
                          border: Border.all(
                            color: Colors.white.withOpacity(0.3),
                            width: 2,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            user?.initials ?? '👤',
                            style: const TextStyle(
                              fontSize: 28,
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              fontFamily: 'TimesNewRoman',
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        user?.fullName ?? '—',
                        style: const TextStyle(
                          fontFamily: 'TimesNewRoman',
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment:
                            MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white
                                  .withOpacity(0.15),
                              borderRadius:
                                  BorderRadius.circular(20),
                            ),
                            child: Text(
                              user?.role ?? '—',
                              style: const TextStyle(
                                fontFamily: 'TimesNewRoman',
                                fontSize: 12,
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          if (user?.branchName != null) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding:
                                const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 4,
                                ),
                              decoration: BoxDecoration(
                                color: Colors.white
                                    .withOpacity(0.12),
                                borderRadius:
                                    BorderRadius.circular(20),
                              ),
                              child: Text(
                                '🏥 ${user!.branchName}',
                                style: const TextStyle(
                                  fontFamily: 'TimesNewRoman',
                                  fontSize: 12,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [

                  // Info Card
                  _ProfileCard(
                    title: '👤 Account Info',
                    items: [
                      _ProfileItem(
                        icon: Icons.person_outline,
                        label: 'Full Name',
                        value: user?.fullName ?? '—',
                      ),
                      _ProfileItem(
                        icon: Icons.email_outlined,
                        label: 'Email',
                        value: user?.email ?? '—',
                      ),
                      if (user?.phone != null)
                        _ProfileItem(
                          icon: Icons.phone_outlined,
                          label: 'Phone',
                          value: user!.phone!,
                        ),
                      _ProfileItem(
                        icon: Icons.badge_outlined,
                        label: 'Role',
                        value: user?.role ?? '—',
                      ),
                      if (user?.branchName != null)
                        _ProfileItem(
                          icon:
                            Icons.local_hospital_outlined,
                          label: 'Branch',
                          value: user!.branchName!,
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Actions Card
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius:
                          BorderRadius.circular(16),
                      border: Border.all(
                          color: AppTheme.gray100),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.navy900
                              .withOpacity(0.05),
                          blurRadius: 10,
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        _ActionTile(
                          icon: Icons.lock_outline,
                          label: 'Change Password',
                          color: AppTheme.navy600,
                          onTap: _showChangePassword,
                        ),
                        const Divider(
                          height: 1, indent: 56,
                          color: AppTheme.gray100),
                        _ActionTile(
                          icon: Icons.logout,
                          label: 'Logout',
                          color: AppTheme.danger,
                          onTap: _logout,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),

                  // App Version
                  Text(
                    'PetCare Plus v1.0.0',
                    style: TextStyle(
                      fontFamily: 'TimesNewRoman',
                      fontSize: 12,
                      color: AppTheme.gray400,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Profile Card ──────────────────────────────────────────
class _ProfileCard extends StatelessWidget {
  final String title;
  final List<_ProfileItem> items;
  const _ProfileCard({
    required this.title, required this.items,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.gray100),
        boxShadow: [
          BoxShadow(
            color: AppTheme.navy900.withOpacity(0.05),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(
              16, 14, 16, 10),
            child: Text(
              title,
              style: const TextStyle(
                fontFamily: 'TimesNewRoman',
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppTheme.navy800,
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
          const Divider(
            height: 1, color: AppTheme.gray100),
          ...items.map((item) => Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: 16, vertical: 12,
            ),
            child: Row(children: [
              Icon(item.icon,
                size: 18, color: AppTheme.navy500),
              const SizedBox(width: 12),
              SizedBox(
                width: 80,
                child: Text(
                  item.label,
                  style: const TextStyle(
                    fontFamily: 'TimesNewRoman',
                    fontSize: 13,
                    color: AppTheme.gray500,
                  ),
                ),
              ),
              Expanded(
                child: Text(
                  item.value,
                  style: const TextStyle(
                    fontFamily: 'TimesNewRoman',
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.navy800,
                  ),
                ),
              ),
            ]),
          )),
        ],
      ),
    );
  }
}

class _ProfileItem {
  final IconData icon;
  final String label;
  final String value;
  const _ProfileItem({
    required this.icon,
    required this.label,
    required this.value,
  });
}

class _ActionTile extends StatelessWidget {
  final IconData   icon;
  final String     label;
  final Color      color;
  final VoidCallback onTap;

  const _ActionTile({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: Icon(icon, color: color, size: 22),
      title: Text(
        label,
        style: TextStyle(
          fontFamily: 'TimesNewRoman',
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
      trailing: Icon(
        Icons.chevron_right,
        color: AppTheme.gray300, size: 20,
      ),
    );
  }
}

class _PassField extends StatefulWidget {
  final TextEditingController ctrl;
  final String label;
  const _PassField({required this.ctrl, required this.label});

  @override
  State<_PassField> createState() => _PassFieldState();
}

class _PassFieldState extends State<_PassField> {
  bool _show = false;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: widget.ctrl,
      obscureText: !_show,
      style: const TextStyle(
        fontFamily: 'TimesNewRoman', fontSize: 14),
      decoration: InputDecoration(
        labelText: widget.label,
        labelStyle: const TextStyle(
          fontFamily: 'TimesNewRoman',
          color: AppTheme.gray500,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(
            color: AppTheme.gray200),
        ),
        suffixIcon: IconButton(
          icon: Icon(
            _show ? Icons.visibility_off : Icons.visibility,
            color: AppTheme.gray400, size: 18,
          ),
          onPressed: () =>
              setState(() => _show = !_show),
        ),
      ),
    );
  }
}