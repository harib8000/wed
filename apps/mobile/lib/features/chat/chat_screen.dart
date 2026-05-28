import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:socket_io_client/socket_io_client.dart' as sio;
import '../../core/theme.dart';
import '../../core/api_client.dart';
import '../../models/vendor.dart';
import '../../providers/auth_provider.dart';
import '../../providers/vendor_provider.dart';

// ─── Chat Models ────────────────────────────────────────────
class ChatMessage {
  final String id;
  final String senderId;
  final String text;
  final DateTime sentAt;
  final bool isRead;
  final String? imageUrl;

  const ChatMessage({
    required this.id,
    required this.senderId,
    required this.text,
    required this.sentAt,
    this.isRead = false,
    this.imageUrl,
  });
}

// ─── Socket.IO Chat Notifier ─────────────────────────────────
class ChatNotifier extends StateNotifier<AsyncValue<List<ChatMessage>>> {
  final String vendorId;
  final String userId;
  sio.Socket? _socket;

  static const _storage = FlutterSecureStorage();

  ChatNotifier(this.vendorId, this.userId) : super(const AsyncValue.loading()) {
    _init();
  }

  Future<void> _init() async {
    // 1. Load history over REST first
    try {
      final res = await ApiClient.getChatHistory(vendorId);
      final messages = _parseMessages(res.data['data']['messages'] as List<dynamic>);
      state = AsyncValue.data(messages);
    } catch (e) {
      debugPrint('Chat history load failed, using mock: $e');
      state = AsyncValue.data(_mockMessages());
    }

    // 2. Connect Socket.IO for real-time updates
    await _connectSocket();
  }

  Future<void> _connectSocket() async {
    try {
      final token = await _storage.read(key: 'access_token');
      if (token == null) return;

      // Derive the Socket.IO base URL from the API base URL (strip /api/v1 suffix if present)
      final base = ApiClient.baseUrl;
      final socketUrl = base.contains('/api/v')
          ? base.replaceAll(RegExp(r'/api/v\d+.*$'), '')
          : base;

      _socket = sio.io(
        socketUrl,
        sio.OptionBuilder()
            .setTransports(['websocket'])
            .setAuth({'token': token})
            .disableAutoConnect()
            .build(),
      );

      _socket!
        ..onConnect((_) {
          debugPrint('[Chat] Socket connected');
          _socket!.emit('join:conversation', vendorId);
        })
        ..on('message:new', (data) {
          if (data is Map<String, dynamic>) {
            final incoming = ChatMessage(
              id: data['id'] as String? ?? DateTime.now().toIso8601String(),
              senderId: data['senderId'] as String? ?? vendorId,
              text: data['content'] as String? ?? '',
              sentAt: data['createdAt'] != null
                  ? DateTime.tryParse(data['createdAt'] as String) ?? DateTime.now()
                  : DateTime.now(),
              isRead: false,
            );
            final current = state.value ?? [];
            if (!current.any((m) => m.id == incoming.id)) {
              state = AsyncValue.data([...current, incoming]);
            }
          }
        })
        ..on('message:read', (_) {
          final current = state.value ?? [];
          state = AsyncValue.data(current.map((m) => ChatMessage(
            id: m.id, senderId: m.senderId, text: m.text,
            sentAt: m.sentAt, isRead: true, imageUrl: m.imageUrl,
          )).toList());
        })
        ..onConnectError((err) => debugPrint('[Chat] Connect error: $err'))
        ..onDisconnect((_) => debugPrint('[Chat] Socket disconnected'));

      _socket!.connect();
    } catch (e) {
      debugPrint('[Chat] Socket setup failed: $e');
    }
  }

  Future<void> sendMessage(String text) async {
    final current = state.value ?? [];
    final msg = ChatMessage(
      id: 'temp_${DateTime.now().millisecondsSinceEpoch}',
      senderId: userId,
      text: text,
      sentAt: DateTime.now(),
    );
    state = AsyncValue.data([...current, msg]);

    if (_socket?.connected == true) {
      _socket!.emit('message:send', {'bookingId': vendorId, 'content': text});
    } else {
      try {
        await ApiClient.sendChatMessage(vendorId, text);
      } catch (e) {
        debugPrint('[Chat] REST send failed: $e');
      }
    }
  }

  List<ChatMessage> _parseMessages(List<dynamic> raw) => raw.map((m) {
    final map = m as Map<String, dynamic>;
    return ChatMessage(
      id: map['id'] as String? ?? map['_id']?.toString() ?? '',
      senderId: map['senderId'] as String? ?? '',
      text: map['text'] as String? ?? map['content'] as String? ?? '',
      sentAt: map['sentAt'] != null
          ? DateTime.tryParse(map['sentAt'] as String) ?? DateTime.now()
          : map['createdAt'] != null
              ? DateTime.tryParse(map['createdAt'] as String) ?? DateTime.now()
              : DateTime.now(),
      isRead: map['isRead'] as bool? ?? false,
      imageUrl: map['imageUrl'] as String?,
    );
  }).toList();

  List<ChatMessage> _mockMessages() => [
    ChatMessage(id: '1', senderId: vendorId, text: 'Hi! Thank you for enquiring about our services. How can I help you?', sentAt: DateTime.now().subtract(const Duration(minutes: 30))),
    ChatMessage(id: '2', senderId: userId, text: 'We are planning a wedding in March. Can you share your availability?', sentAt: DateTime.now().subtract(const Duration(minutes: 28))),
    ChatMessage(id: '3', senderId: vendorId, text: 'Of course! March is mostly available. Could you share the exact date and approximate guest count?', sentAt: DateTime.now().subtract(const Duration(minutes: 25))),
  ];

  @override
  void dispose() {
    _socket?.disconnect();
    _socket?.dispose();
    super.dispose();
  }
}

final chatProvider = StateNotifierProvider.family<ChatNotifier, AsyncValue<List<ChatMessage>>, String>(
  (ref, vendorId) {
    final user = ref.watch(currentUserProvider);
    return ChatNotifier(vendorId, user?.id ?? 'me');
  },
);

// ─── Chat Screen ────────────────────────────────────────────
class ChatScreen extends ConsumerStatefulWidget {
  final String vendorId;
  const ChatScreen({super.key, required this.vendorId});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _textCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  bool _sending = false;

  @override
  void dispose() {
    _textCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(_scrollCtrl.position.maxScrollExtent, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
      }
    });
  }

  Future<void> _send() async {
    final txt = _textCtrl.text.trim();
    if (txt.isEmpty) return;
    _textCtrl.clear();
    setState(() => _sending = true);
    await ref.read(chatProvider(widget.vendorId).notifier).sendMessage(txt);
    setState(() => _sending = false);
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    final vendorAsync = ref.watch(vendorDetailProvider(widget.vendorId));
    final chatAsync = ref.watch(chatProvider(widget.vendorId));
    final currentUser = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: vendorAsync.when(
        loading: () => AppBar(title: const Text('Chat')),
        error: (_, __) => AppBar(title: const Text('Chat')),
        data: (vendor) => _buildAppBar(vendor),
      ),
      body: Column(children: [
        Expanded(
          child: chatAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (_, __) => const Center(child: Text('Could not load messages')),
            data: (messages) {
              if (messages.isEmpty) {
                return _EmptyChat(vendorName: vendorAsync.valueOrNull?.businessName ?? 'Vendor');
              }
              _scrollToBottom();
              return ListView.builder(
                controller: _scrollCtrl,
                padding: const EdgeInsets.all(12),
                itemCount: messages.length,
                itemBuilder: (context, i) {
                  final msg = messages[i];
                  final isMe = msg.senderId == (currentUser?.id ?? 'me');
                  final showDate = i == 0 || !_isSameDay(messages[i - 1].sentAt, msg.sentAt);
                  return Column(children: [
                    if (showDate) _DateDivider(date: msg.sentAt),
                    _BubbleTile(msg: msg, isMe: isMe, vendorImageUrl: vendorAsync.valueOrNull?.displayImage),
                  ]);
                },
              );
            },
          ),
        ),
        _buildInput(),
      ]),
    );
  }

  bool _isSameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;

  PreferredSizeWidget _buildAppBar(Vendor vendor) => AppBar(
    titleSpacing: 0,
    title: Row(children: [
      ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: CachedNetworkImage(imageUrl: vendor.displayImage, width: 36, height: 36, fit: BoxFit.cover),
      ),
      const SizedBox(width: 10),
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(vendor.businessName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        Text(vendor.city, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.normal, color: AppColors.textMuted)),
      ]),
    ]),
    actions: [Icons.call_outlined, Icons.videocam_outlined, Icons.more_vert]
        .map((icon) => IconButton(tooltip: 'Action', icon: Icon(icon, size: 20), onPressed: () {}))
        .toList(),
  );

  Widget _buildInput() => SafeArea(
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: AppColors.border))),
      child: Row(children: [
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
            decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(24)),
            child: TextField(
              controller: _textCtrl,
              maxLines: null,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => _send(),
              decoration: const InputDecoration(
                border: InputBorder.none,
                hintText: 'Type a message…',
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Semantics(
          button: true,
          label: 'Send message',
          child: GestureDetector(
            onTap: _sending ? null : _send,
            child: Container(
              width: 42,
              height: 42,
              decoration: const BoxDecoration(color: AppColors.brand, shape: BoxShape.circle),
              child: _sending
                  ? const Padding(padding: EdgeInsets.all(10), child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.send, color: Colors.white, size: 18),
            ),
          ),
        ),
      ]),
    ),
  );
}

class _BubbleTile extends StatelessWidget {
  final ChatMessage msg;
  final bool isMe;
  final String? vendorImageUrl;
  const _BubbleTile({required this.msg, required this.isMe, this.vendorImageUrl});

  @override
  Widget build(BuildContext context) {
    final time = '${msg.sentAt.hour.toString().padLeft(2, '0')}:${msg.sentAt.minute.toString().padLeft(2, '0')}';
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isMe) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: vendorImageUrl != null
                  ? CachedNetworkImage(imageUrl: vendorImageUrl!, width: 28, height: 28, fit: BoxFit.cover)
                  : Container(
                      width: 28, height: 28,
                      decoration: const BoxDecoration(color: AppColors.brand, shape: BoxShape.circle),
                      child: const Icon(Icons.store, color: Colors.white, size: 14),
                    ),
            ),
            const SizedBox(width: 6),
          ],
          Container(
            constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.68),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
            decoration: BoxDecoration(
              color: isMe ? AppColors.brand : Colors.white,
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(18),
                topRight: const Radius.circular(18),
                bottomLeft: Radius.circular(isMe ? 18 : 4),
                bottomRight: Radius.circular(isMe ? 4 : 18),
              ),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2))],
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text(msg.text, style: TextStyle(color: isMe ? Colors.white : AppColors.textPrimary, fontSize: 14)),
              const SizedBox(height: 3),
              Row(mainAxisSize: MainAxisSize.min, children: [
                Text(time, style: TextStyle(color: isMe ? Colors.white70 : AppColors.textMuted, fontSize: 10)),
                if (isMe) ...[
                  const SizedBox(width: 3),
                  Icon(msg.isRead ? Icons.done_all : Icons.done, size: 12, color: Colors.white70),
                ],
              ]),
            ]),
          ),
          if (isMe) const SizedBox(width: 4),
        ],
      ),
    );
  }
}

class _DateDivider extends StatelessWidget {
  final DateTime date;
  const _DateDivider({required this.date});

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    String label;
    if (date.year == now.year && date.month == now.month && date.day == now.day) {
      label = 'Today';
    } else if (date.year == now.year && date.month == now.month && date.day == now.day - 1) {
      label = 'Yesterday';
    } else {
      label = '${date.day}/${date.month}/${date.year}';
    }
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(children: [
        const Expanded(child: Divider()),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
        ),
        const Expanded(child: Divider()),
      ]),
    );
  }
}

class _EmptyChat extends StatelessWidget {
  final String vendorName;
  const _EmptyChat({required this.vendorName});

  @override
  Widget build(BuildContext context) => Center(
    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      Icon(Icons.chat_bubble_outline, size: 56, color: AppColors.textMuted.withOpacity(0.4)),
      const SizedBox(height: 12),
      Text(
        'Start a conversation with $vendorName',
        textAlign: TextAlign.center,
        style: const TextStyle(color: AppColors.textMuted, fontSize: 14),
      ),
      const SizedBox(height: 4),
      const Text(
        'Ask about availability, pricing, and more',
        textAlign: TextAlign.center,
        style: TextStyle(color: AppColors.textMuted, fontSize: 12),
      ),
    ]),
  );
}
