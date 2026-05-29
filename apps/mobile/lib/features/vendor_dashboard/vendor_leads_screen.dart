import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme.dart';
import '../../models/vendor_analytics.dart';
import '../../providers/vendor_analytics_provider.dart';
import '../../shared/widgets/empty_state_widget.dart';
import '../../shared/widgets/error_state_widget.dart';
import '../../shared/widgets/shimmer_state_widget.dart';

class VendorLeadsScreen extends ConsumerWidget {
  const VendorLeadsScreen({super.key});

  Future<void> _showAddLeadSheet(BuildContext context) async {
    final nameController = TextEditingController();
    final phoneController = TextEditingController();
    final eventTypeController = TextEditingController();
    final dateController = TextEditingController();
    final budgetController = TextEditingController();
    final notesController = TextEditingController();

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) => Padding(
        padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(sheetContext).viewInsets.bottom + 20),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 48,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text('Add Lead', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 16),
              TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Customer name')),
              const SizedBox(height: 12),
              TextField(
                controller: phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(labelText: 'Phone number'),
              ),
              const SizedBox(height: 12),
              TextField(controller: eventTypeController, decoration: const InputDecoration(labelText: 'Event type')),
              const SizedBox(height: 12),
              TextField(controller: dateController, decoration: const InputDecoration(labelText: 'Event date')),
              const SizedBox(height: 12),
              TextField(
                controller: budgetController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Budget'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: notesController,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'Notes'),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    final leadName = nameController.text.trim().isEmpty ? 'New lead' : nameController.text.trim();
                    Navigator.of(sheetContext).pop();
                    ScaffoldMessenger.of(context)
                      ..hideCurrentSnackBar()
                      ..showSnackBar(SnackBar(content: Text('Lead added for $leadName')));
                  },
                  child: const Text('Save Lead'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leadsAsync = ref.watch(vendorLeadsProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Enquiries & Leads'),
        automaticallyImplyLeading: false,
      ),
      body: leadsAsync.when(
        loading: () => const ShimmerStateWidget(itemCount: 5, itemHeight: 104),
        error: (e, _) => ErrorStateWidget(
          message: 'Leads could not be fetched. Check your connection and retry.',
          onRetry: () => ref.refresh(vendorLeadsProvider.future),
        ),
        data: (leads) => _LeadsBody(leads: leads),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddLeadSheet(context),
        icon: const Icon(Icons.add),
        label: const Text('Add Lead'),
        backgroundColor: AppColors.brand,
        foregroundColor: Colors.white,
      ),
    );
  }
}

class _LeadsBody extends StatefulWidget {
  final List<VendorLead> leads;
  const _LeadsBody({required this.leads});

  @override
  State<_LeadsBody> createState() => _LeadsBodyState();
}

class _LeadsBodyState extends State<_LeadsBody> {
  LeadStatus? _filter;

  @override
  Widget build(BuildContext context) {
    final filtered = _filter == null
        ? widget.leads
        : widget.leads.where((l) => l.status == _filter).toList();

    return Column(
      children: [
        // Pipeline summary
        _PipelineSummary(leads: widget.leads, activeFilter: _filter, onFilter: (s) => setState(() => _filter = _filter == s ? null : s)),
        const SizedBox(height: 8),
        // Lead list
        Expanded(
          child: filtered.isEmpty
              ? const EmptyStateWidget(
                  icon: Icons.inbox_outlined,
                  title: 'No leads yet',
                  message: 'Fresh enquiries from Hyderabad couples and families will appear here first.',
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: filtered.length,
                  itemBuilder: (_, i) => _LeadCard(lead: filtered[i]),
                ),
        ),
      ],
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// PIPELINE
// ──────────────────────────────────────────────────────────────────────────────

class _PipelineSummary extends StatelessWidget {
  final List<VendorLead> leads;
  final LeadStatus? activeFilter;
  final ValueChanged<LeadStatus> onFilter;

  const _PipelineSummary({required this.leads, required this.activeFilter, required this.onFilter});

  int _count(LeadStatus s) => leads.where((l) => l.status == s).length;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 80,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
        children: [
          _PipelineChip(label: 'New', count: _count(LeadStatus.newLead), color: const Color(0xFFF97316), active: activeFilter == LeadStatus.newLead, onTap: () => onFilter(LeadStatus.newLead)),
          _PipelineChip(label: 'Contacted', count: _count(LeadStatus.contacted), color: const Color(0xFF3B82F6), active: activeFilter == LeadStatus.contacted, onTap: () => onFilter(LeadStatus.contacted)),
          _PipelineChip(label: 'Quoted', count: _count(LeadStatus.quoted), color: const Color(0xFF8B5CF6), active: activeFilter == LeadStatus.quoted, onTap: () => onFilter(LeadStatus.quoted)),
          _PipelineChip(label: 'Negotiating', count: _count(LeadStatus.negotiating), color: const Color(0xFFF59E0B), active: activeFilter == LeadStatus.negotiating, onTap: () => onFilter(LeadStatus.negotiating)),
          _PipelineChip(label: 'Won', count: _count(LeadStatus.won), color: const Color(0xFF10B981), active: activeFilter == LeadStatus.won, onTap: () => onFilter(LeadStatus.won)),
          _PipelineChip(label: 'Lost', count: _count(LeadStatus.lost), color: const Color(0xFFEF4444), active: activeFilter == LeadStatus.lost, onTap: () => onFilter(LeadStatus.lost)),
        ],
      ),
    );
  }
}

class _PipelineChip extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  final bool active;
  final VoidCallback onTap;

  const _PipelineChip({required this.label, required this.count, required this.color, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 90,
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: active ? color.withOpacity(0.15) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: active ? color : AppColors.border, width: active ? 1.5 : 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('$count', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 20, color: color)),
            const Spacer(),
            Text(label, style: TextStyle(fontSize: 11, color: active ? color : AppColors.textSecondary, fontWeight: active ? FontWeight.w600 : FontWeight.normal)),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// LEAD CARD
// ──────────────────────────────────────────────────────────────────────────────

class _LeadCard extends StatelessWidget {
  final VendorLead lead;
  const _LeadCard({required this.lead});

  void _showLeadSnackBar(BuildContext context, String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _showQuoteDialog(BuildContext context) async {
    final amountController = TextEditingController();
    final messageController = TextEditingController(
      text: 'Hi ${lead.customerName}, sharing a tailored quote for your ${lead.eventType.toLowerCase()}.',
    );

    await showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Send Quote'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: amountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Quote amount'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: messageController,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Message'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(dialogContext).pop();
              _showLeadSnackBar(context, 'Quote sent to ${lead.customerName}');
            },
            child: const Text('Send Quote'),
          ),
        ],
      ),
    );
  }

  Color get _statusColor {
    switch (lead.status) {
      case LeadStatus.newLead: return const Color(0xFFF97316);
      case LeadStatus.contacted: return const Color(0xFF3B82F6);
      case LeadStatus.quoted: return const Color(0xFF8B5CF6);
      case LeadStatus.negotiating: return const Color(0xFFF59E0B);
      case LeadStatus.won: return const Color(0xFF10B981);
      case LeadStatus.lost: return const Color(0xFFEF4444);
    }
  }

  String get _statusLabel {
    switch (lead.status) {
      case LeadStatus.newLead: return 'NEW';
      case LeadStatus.contacted: return 'CONTACTED';
      case LeadStatus.quoted: return 'QUOTED';
      case LeadStatus.negotiating: return 'NEGOTIATING';
      case LeadStatus.won: return 'WON';
      case LeadStatus.lost: return 'LOST';
    }
  }

  IconData get _priorityIcon {
    switch (lead.priority) {
      case 1: return Icons.local_fire_department;
      case 2: return Icons.wb_sunny;
      default: return Icons.ac_unit;
    }
  }

  Color get _priorityColor {
    switch (lead.priority) {
      case 1: return const Color(0xFFEF4444);
      case 2: return const Color(0xFFF97316);
      default: return const Color(0xFF3B82F6);
    }
  }

  String get _priorityLabel {
    switch (lead.priority) {
      case 1: return 'Hot';
      case 2: return 'Warm';
      default: return 'Cold';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          // Top: customer info
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 10),
            child: Row(
              children: [
                Container(
                  width: 42, height: 42,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [_statusColor.withOpacity(0.15), _statusColor.withOpacity(0.05)]),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(lead.customerName[0],
                        style: TextStyle(color: _statusColor, fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(lead.customerName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Text(lead.eventType, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                          const Text(' · ', style: TextStyle(color: AppColors.textMuted)),
                          Text(lead.receivedAgo, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                        ],
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                      decoration: BoxDecoration(color: _statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                      child: Text(_statusLabel, style: TextStyle(color: _statusColor, fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(_priorityIcon, size: 12, color: _priorityColor),
                        const SizedBox(width: 2),
                        Text(_priorityLabel, style: TextStyle(fontSize: 10, color: _priorityColor, fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Details row
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 14),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                _DetailPill(icon: Icons.calendar_today, text: lead.eventDate),
                const SizedBox(width: 12),
                _DetailPill(icon: Icons.people_outline, text: '${lead.guestCount} pax'),
                if (lead.budgetPaise != null) ...[
                  const Spacer(),
                  Text(_formatBudget(lead.budgetPaise!),
                      style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.brand, fontSize: 13)),
                ],
              ],
            ),
          ),

          // Notes
          if (lead.notes != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 8, 14, 0),
              child: Row(
                children: [
                  const Icon(Icons.note_outlined, size: 12, color: AppColors.textMuted),
                  const SizedBox(width: 4),
                  Expanded(child: Text(lead.notes!, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary, fontStyle: FontStyle.italic))),
                ],
              ),
            ),

          // Quick actions
          if (lead.status != LeadStatus.won && lead.status != LeadStatus.lost)
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 12),
              child: Row(
                children: [
                  _QuickAction(
                    icon: Icons.phone_outlined,
                    label: 'Call',
                    color: const Color(0xFF10B981),
                    onTap: () => _showLeadSnackBar(context, 'Call ${lead.phone}'),
                  ),
                  const SizedBox(width: 8),
                  _QuickAction(
                    icon: Icons.chat_outlined,
                    label: 'WhatsApp',
                    color: const Color(0xFF25D366),
                    onTap: () => _showLeadSnackBar(context, 'WhatsApp ${lead.phone}'),
                  ),
                  const SizedBox(width: 8),
                  _QuickAction(
                    icon: Icons.request_quote_outlined,
                    label: 'Send Quote',
                    color: AppColors.brand,
                    onTap: () => _showQuoteDialog(context),
                  ),
                ],
              ),
            )
          else
            const SizedBox(height: 12),
        ],
      ),
    );
  }
}

class _DetailPill extends StatelessWidget {
  final IconData icon;
  final String text;
  const _DetailPill({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: AppColors.textMuted),
        const SizedBox(width: 4),
        Text(text, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
      ],
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickAction({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.08),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: color.withOpacity(0.2)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 14, color: color),
              const SizedBox(width: 4),
              Text(label, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ),
    );
  }
}

String _formatBudget(int paise) {
  final rupees = paise ~/ 100;
  if (rupees >= 10000000) return '₹${(rupees / 10000000).toStringAsFixed(1)}Cr';
  if (rupees >= 100000) return '₹${(rupees / 100000).toStringAsFixed(1)}L';
  if (rupees >= 1000) return '₹${(rupees / 1000).toStringAsFixed(0)}K';
  return '₹$rupees';
}
