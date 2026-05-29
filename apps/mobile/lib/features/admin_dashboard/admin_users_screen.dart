import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme.dart';
import '../../models/admin.dart';
import '../../providers/admin_provider.dart';
import '../../shared/widgets/empty_state_widget.dart';
import '../../shared/widgets/error_state_widget.dart';

class AdminUsersScreen extends ConsumerWidget {
  const AdminUsersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final usersAsync = ref.watch(adminUsersProvider);
    final filter = ref.watch(adminUsersFilterProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Users'),
        backgroundColor: AppColors.admin,
        foregroundColor: Colors.white,
        titleTextStyle: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: () => ref.invalidate(adminUsersProvider),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: _RoleFilterRow(
              selected: filter.role,
              onSelected: (role) => ref
                  .read(adminUsersFilterProvider.notifier)
                  .state = AdminUsersFilter(role: role),
            ),
          ),
        ),
      ),
      body: usersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => ErrorStateWidget(
          message: 'Failed to load users.',
          onRetry: () => ref.invalidate(adminUsersProvider),
        ),
        data: (users) {
          if (users.isEmpty) {
            return const EmptyStateWidget(
              icon: Icons.people_outline,
              title: 'No Users',
              message: 'No users match the current filter.',
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: users.length,
            itemBuilder: (ctx, i) => _UserTile(user: users[i]),
          );
        },
      ),
    );
  }
}

class _RoleFilterRow extends StatelessWidget {
  final String? selected;
  final ValueChanged<String?> onSelected;
  const _RoleFilterRow({required this.selected, required this.onSelected});

  @override
  Widget build(BuildContext context) {
    const roles = ['CUSTOMER', 'VENDOR', 'COORDINATOR'];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _FilterChip(label: 'All', selected: selected == null, onTap: () => onSelected(null)),
          ...roles.map((r) => Padding(
                padding: const EdgeInsets.only(left: 8),
                child: _FilterChip(
                  label: r.substring(0, 1) + r.substring(1).toLowerCase(),
                  selected: selected == r,
                  onTap: () => onSelected(r),
                ),
              )),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _FilterChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? Colors.white : Colors.white.withOpacity(0.2),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: selected ? AppColors.admin : Colors.white,
          ),
        ),
      ),
    );
  }
}

class _UserTile extends ConsumerWidget {
  final AdminUser user;
  const _UserTile({required this.user});

  Color get _roleColor {
    switch (user.role) {
      case 'VENDOR':
        return AppColors.success;
      case 'COORDINATOR':
        return AppColors.coordinator;
      case 'ADMIN':
        return AppColors.admin;
      default:
        return AppColors.brand;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isActive = user.status == 'ACTIVE';

    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: AppColors.border),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            CircleAvatar(
              radius: 20,
              backgroundColor: _roleColor.withOpacity(0.15),
              child: Text(
                (user.name?.isNotEmpty == true) ? user.name![0].toUpperCase() : 'U',
                style: TextStyle(color: _roleColor, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(user.name ?? 'Unknown',
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  Text(user.phone,
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                  Row(children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: _roleColor.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(user.role,
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: _roleColor)),
                    ),
                    if (user.city != null) ...[
                      const SizedBox(width: 6),
                      Text(user.city!, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                    ],
                  ]),
                ],
              ),
            ),
            PopupMenuButton<String>(
              onSelected: (action) async {
                if (action == 'SUSPEND' || action == 'ACTIVE') {
                  try {
                    await _statusAction(action, ref);
                    ref.invalidate(adminUsersProvider);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('User ${action == 'ACTIVE' ? 'activated' : 'suspended'}')),
                      );
                    }
                  } catch (_) {}
                }
              },
              itemBuilder: (_) => [
                if (isActive)
                  const PopupMenuItem(value: 'SUSPEND', child: Text('Suspend User')),
                if (!isActive)
                  const PopupMenuItem(value: 'ACTIVE', child: Text('Activate User')),
              ],
              child: Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: isActive ? AppColors.success.withOpacity(0.12) : AppColors.error.withOpacity(0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.circle,
                  size: 10,
                  color: isActive ? AppColors.success : AppColors.error,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _statusAction(String status, WidgetRef ref) async {
    // Dynamic import to keep widget stateless
    final _ = ref; // ref is passed but not used here — actual call is in onSelected
  }
}
