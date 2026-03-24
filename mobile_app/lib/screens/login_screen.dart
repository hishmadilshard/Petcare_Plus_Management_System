// ignore_for_file: prefer_const_literals_to_create_immutables, prefer_const_constructors, deprecated_member_use

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../providers/auth_provider.dart';
import 'main_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey  = GlobalKey<FormState>();
  final _emailCtrl    = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _showPass  = false;
  bool _remember  = false;

  final _quickLogins = [
    {
      'label': '👑 Super Admin',
      'email': 'admin@petcareplus.com',
      'pass':  'Admin@1234',
    },
    {
      'label': '🏥 Kandy Admin',
      'email': 'admin.kandy@petcareplus.com',
      'pass':  'password',
    },
    {
      'label': '🏥 Matale Admin',
      'email': 'admin.matale@petcareplus.com',
      'pass':  'password',
    },
    {
      'label': '🩺 Kandy Vet',
      'email': 'vet@petcareplus.com',
      'pass':  'Vet@1234',
    },
    {
      'label': '📋 Reception',
      'email': 'reception@petcareplus.com',
      'pass':  'Reception@1234',
    },
  ];

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    final ok   = await auth.login(
      _emailCtrl.text.trim(),
      _passwordCtrl.text.trim(),
    );
    if (!mounted) return;
    if (ok) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const MainScreen()),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            auth.error ?? 'Login failed.',
            style: const TextStyle(
              fontFamily: 'TimesNewRoman',
            ),
          ),
          backgroundColor: AppTheme.danger,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end:   Alignment.bottomRight,
            colors: [
              AppTheme.navy900,
              AppTheme.navy800,
              Color(0xFF1A3A6B),
            ],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            child: ConstrainedBox(
              constraints: BoxConstraints(
                minHeight: MediaQuery.of(context).size.height -
                    MediaQuery.of(context).padding.top,
              ),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    const SizedBox(height: 32),

                    // ── Logo ──────────────────────
                    Container(
                      width: 80, height: 80,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(
                          color: Colors.white.withOpacity(0.2),
                        ),
                      ),
                      child: const Center(
                        child: Text('🐾',
                          style: TextStyle(fontSize: 40)),
                      ),
                    ),
                    const SizedBox(height: 16),

                    const Text(
                      'PetCare Plus',
                      style: TextStyle(
                        fontFamily: 'TimesNewRoman',
                        fontSize: 28, fontWeight: FontWeight.w700,
                        color: Colors.white,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Veterinary Management System',
                      style: TextStyle(
                        fontFamily: 'TimesNewRoman',
                        fontSize: 13,
                        color: Colors.white.withOpacity(0.55),
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                    const SizedBox(height: 32),

                    // ── Form Card ─────────────────
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.15),
                            blurRadius: 30,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.all(28),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment:
                              CrossAxisAlignment.start,
                          children: [

                            // Title
                            const Text(
                              'Welcome Back',
                              style: TextStyle(
                                fontFamily: 'TimesNewRoman',
                                fontSize: 22,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.navy900,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Sign in to your account',
                              style: TextStyle(
                                fontFamily: 'TimesNewRoman',
                                fontSize: 13,
                                color: AppTheme.gray500,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                            const SizedBox(height: 24),

                            // Quick Logins
                            const Text(
                              'QUICK LOGIN',
                              style: TextStyle(
                                fontFamily: 'TimesNewRoman',
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.gray400,
                                letterSpacing: 0.8,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 8, runSpacing: 8,
                              children: _quickLogins.map((q) =>
                                GestureDetector(
                                  onTap: () {
                                    _emailCtrl.text =
                                        q['email']!;
                                    _passwordCtrl.text =
                                        q['pass']!;
                                  },
                                  child: Container(
                                    padding:
                                      const EdgeInsets
                                        .symmetric(
                                          horizontal: 12,
                                          vertical: 7,
                                        ),
                                    decoration: BoxDecoration(
                                      color: AppTheme.navy50,
                                      borderRadius:
                                          BorderRadius.circular(8),
                                      border: Border.all(
                                        color: AppTheme.navy100,
                                      ),
                                    ),
                                    child: Text(
                                      q['label']!,
                                      style: const TextStyle(
                                        fontFamily:
                                          'TimesNewRoman',
                                        fontSize: 12,
                                        fontWeight:
                                          FontWeight.w700,
                                        color: AppTheme.navy700,
                                      ),
                                    ),
                                  ),
                                ),
                              ).toList(),
                            ),
                            const SizedBox(height: 20),

                            // Divider
                            Row(children: [
                              const Expanded(child: Divider(
                                color: AppTheme.gray200)),
                              Padding(
                                padding: const EdgeInsets
                                    .symmetric(horizontal: 12),
                                child: Text(
                                  'or sign in manually',
                                  style: TextStyle(
                                    fontFamily: 'TimesNewRoman',
                                    fontSize: 12,
                                    color: AppTheme.gray400,
                                    fontStyle: FontStyle.italic,
                                  ),
                                ),
                              ),
                              const Expanded(child: Divider(
                                color: AppTheme.gray200)),
                            ]),
                            const SizedBox(height: 20),

                            // Email
                            const Text('Email Address',
                              style: TextStyle(
                                fontFamily: 'TimesNewRoman',
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.gray700,
                              ),
                            ),
                            const SizedBox(height: 6),
                            TextFormField(
                              controller: _emailCtrl,
                              keyboardType:
                                  TextInputType.emailAddress,
                              style: const TextStyle(
                                fontFamily: 'TimesNewRoman',
                                fontSize: 15,
                              ),
                              decoration:
                                const InputDecoration(
                                  hintText: 'your@email.com',
                                  prefixIcon: Icon(
                                    Icons.email_outlined,
                                    color: AppTheme.gray400,
                                    size: 20,
                                  ),
                                ),
                              validator: (v) {
                                if (v == null || v.isEmpty) {
                                  return 'Email is required';
                                }
                                if (!v.contains('@')) {
                                  return 'Enter valid email';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),

                            // Password
                            Row(
                              mainAxisAlignment:
                                  MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Password',
                                  style: TextStyle(
                                    fontFamily: 'TimesNewRoman',
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: AppTheme.gray700,
                                  ),
                                ),
                                TextButton(
                                  onPressed: () {},
                                  style: TextButton.styleFrom(
                                    padding: EdgeInsets.zero,
                                    minimumSize: Size.zero,
                                  ),
                                  child: const Text(
                                    'Forgot password?',
                                    style: TextStyle(
                                      fontFamily: 'TimesNewRoman',
                                      fontSize: 12,
                                      color: AppTheme.navy600,
                                      fontStyle: FontStyle.italic,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            TextFormField(
                              controller: _passwordCtrl,
                              obscureText: !_showPass,
                              style: const TextStyle(
                                fontFamily: 'TimesNewRoman',
                                fontSize: 15,
                              ),
                              decoration: InputDecoration(
                                hintText: 'Enter your password',
                                prefixIcon: const Icon(
                                  Icons.lock_outline,
                                  color: AppTheme.gray400,
                                  size: 20,
                                ),
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _showPass
                                        ? Icons.visibility_off
                                        : Icons.visibility,
                                    color: AppTheme.gray400,
                                    size: 20,
                                  ),
                                  onPressed: () => setState(
                                    () => _showPass = !_showPass,
                                  ),
                                ),
                              ),
                              validator: (v) {
                                if (v == null || v.isEmpty) {
                                  return 'Password is required';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),

                            // Remember Me
                            Row(children: [
                              GestureDetector(
                                onTap: () => setState(
                                  () => _remember = !_remember,
                                ),
                                child: Container(
                                  width: 20, height: 20,
                                  decoration: BoxDecoration(
                                    color: _remember
                                        ? AppTheme.navy700
                                        : Colors.white,
                                    border: Border.all(
                                      color: _remember
                                          ? AppTheme.navy700
                                          : AppTheme.gray300,
                                      width: 1.5,
                                    ),
                                    borderRadius:
                                        BorderRadius.circular(5),
                                  ),
                                  child: _remember
                                    ? const Icon(Icons.check,
                                        color: Colors.white,
                                        size: 14)
                                    : null,
                                ),
                              ),
                              const SizedBox(width: 10),
                              const Text(
                                'Remember me for 30 days',
                                style: TextStyle(
                                  fontFamily: 'TimesNewRoman',
                                  fontSize: 13,
                                  color: AppTheme.gray600,
                                ),
                              ),
                            ]),
                            const SizedBox(height: 24),

                            // Sign In Button
                            SizedBox(
                              width: double.infinity,
                              height: 52,
                              child: ElevatedButton(
                                onPressed: auth.loading
                                    ? null : _login,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor:
                                      AppTheme.navy800,
                                  shape: RoundedRectangleBorder(
                                    borderRadius:
                                        BorderRadius.circular(12),
                                  ),
                                ),
                                child: auth.loading
                                  ? const SizedBox(
                                      width: 22, height: 22,
                                      child:
                                        CircularProgressIndicator(
                                          strokeWidth: 2.5,
                                          color: Colors.white,
                                        ),
                                    )
                                  : const Text(
                                      '🔐  Sign In to Dashboard',
                                      style: TextStyle(
                                        fontFamily:
                                          'TimesNewRoman',
                                        fontSize: 15,
                                        fontWeight:
                                          FontWeight.w700,
                                        fontStyle:
                                          FontStyle.italic,
                                        letterSpacing: 0.3,
                                      ),
                                    ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Footer
                    Text(
                      '© 2025 PetCare Plus · Secure & Reliable',
                      style: TextStyle(
                        fontFamily: 'TimesNewRoman',
                        fontSize: 12,
                        color: Colors.white.withOpacity(0.35),
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}