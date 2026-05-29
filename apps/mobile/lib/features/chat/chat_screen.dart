import 'dart:async';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:image_picker/image_picker.dart';
import 'package:socket_io_client/socket_io_client.dart' as sio;
import '../../core/api_client.dart';
import '../../core/theme.dart';
import '../../models/booking.dart';
import '../../models/vendor.dart';
import '../../providers/auth_provider.dart';
import '../../providers/booking_provider.dart';
import '../../providers/vendor_provider.dart';
import '../../shared/widgets/empty_state_widget.dart';
import '../../shared/widgets/error_state_widget.dart';

enum ChatDeliveryStatus { sending, sent, delivered, read }

class ChatMessage {
  final String id;
  final String senderId;
  final String text;
  final DateTime sentAt;
  final bool isRead;
  final String? imageUrl;
  final String? imageName;
  final ChatDeliveryStatus status;
  final String? replyPreview;

  const ChatMessage({
    required this.id,
    required this.senderId,
    required this.text,
    required this.sentAt,
    this.isRead = false,
    this.imageUrl,
    this.imageName,
    this.status = ChatDeliveryStatus.sent,
    this.replyPreview,
  });

  ChatMessage copyWith({
    bool? isRead,
    ChatDeliveryStatus? status,
    String? imageUrl,
    String? imageName,
    String? replyPreview,
  }) {
    return ChatMessage(
      id: id,
      senderId: senderId,
      text: text,
      sentAt: sentAt,
      isRead: isRead ?? this.isRead,
      imageUrl: imageUrl ?? this.imageUrl,
      imageName: imageName ?? this.imageName,
      status: status ?? this.status,
      replyPreview: replyPreview ?? this.replyPreview,
    );
  }
}

class ChatNotifier extends StateNotifier<AsyncValue<List<ChatMessage>>> {
  final String vendorId;
  final String userId;
  sio.Socket? _socket;

  static const _storage = FlutterSecureStorage();

  ChatNotifier(this.vendorId, this.userId) : super(const AsyncValue.loading()) {
    _init();
  }

  Future<void> _init() async {
    try {
      final res = await ApiClient.getChatHistory(vendorId);
      final messages = _parseMessages(res.data['data']['messages'] as List<dynamic>);
      state = AsyncValue.data(messages);
    } catch (e) {
      debugPrint('Chat history load failed, using mock: $e');
      state = AsyncValue.data(_mockMessages());
    }
    await _connectSocket();
  }

  Future<void> _connectSocket() async {
    try {
      final token = await _storage.read(key: 'access_token');
      if (token == null) return;
      final base = ApiClient.baseUrl;
      final socketUrl = base.contains('/api/v') ? base.replaceAll(RegExp(r'/api/v\d+.*$'), '') : base;

      _socket = sio.io(
        socketUrl,
        sio.OptionBuilder().setTransports(['websocket']).setAuth({'token': token}).disableAutoConnect().build(),
      );

      _socket!
        ..onConnect((_) => _socket?.emit('join:conversation', vendorId))
        ..on('message:new', (data) {
          if (data is! Map) return;
          final map = Map<String, dynamic>.from(data as Map);
          final incoming = ChatMessage(
            id: map['id'] as String? ?? DateTime.now().toIso8601String(),
            senderId: map['senderId'] as String? ?? vendorId,
            text: map['content'] as String? ?? map['text'] as String? ?? '',
            sentAt: DateTime.tryParse(map['createdAt'] as String? ?? '') ?? DateTime.now(),
            isRead: false,
            imageUrl: map['imageUrl'] as String?,
            imageName: map['imageName'] as String?,
            status: ChatDeliveryStatus.delivered,
            replyPreview: map['replyPreview'] as String?,
          );
          final current = state.value ?? [];
          if (!current.any((message) => message.id == incoming.id)) {
            state = AsyncValue.data([...current, incoming]);
          }
        })
        ..on('message:read', (_) {
          final current = state.value ?? [];
          state = AsyncValue.data(current.map((message) => message.copyWith(isRead: true, status: ChatDeliveryStatus.read)).toList());
        })
        ..onConnectError((err) => debugPrint('[Chat] Connect error: $err'))
        ..onDisconnect((_) => debugPrint('[Chat] Socket disconnected'));

      _socket?.connect();
    } catch (e) {
      debugPrint('[Chat] Socket setup failed: $e');
    }
  }

  Future<void> sendMessage(String text, {String? imageName, String? imageUrl, String? replyPreview}) async {
    final current = state.value ?? [];
    final msg = ChatMessage(
      id: 'temp_${DateTime.now().millisecondsSinceEpoch}',
      senderId: userId,
      text: text,
      sentAt: DateTime.now(),
      imageName: imageName,
      imageUrl: imageUrl,
      replyPreview: replyPreview,
      status: ChatDeliveryStatus.sending,
    );
    state = AsyncValue.data([...current, msg]);

    if (_socket?.connected == true) {
      _socket?.emit('message:send', {
        'bookingId': vendorId,
        'content': text,
        if (imageName != null) 'imageName': imageName,
        if (imageUrl != null) 'imageUrl': imageUrl,
        if (replyPreview != null) 'replyPreview': replyPreview,
      });
      _markDelivered(msg.id);
    } else {
      try {
        await ApiClient.sendChatMessage(vendorId, text);
        _markDelivered(msg.id);
      } catch (e) {
        debugPrint('[Chat] REST send failed: $e');
      }
    }
  }

  void _markDelivered(String tempId) {
    final current = state.value ?? [];
    state = AsyncValue.data(
      current
          .map(
            (message) => message.id == tempId
                ? message.copyWith(status: ChatDeliveryStatus.delivered)
                : message,
          )
          .toList(),
    );
  }

  List<ChatMessage> _parseMessages(List<dynamic> raw) => raw.map((item) {
        final map = item as Map<String, dynamic>;
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
          imageName: map['imageName'] as String?,
          replyPreview: map['replyPreview'] as String?,
          status: (map['isRead'] as bool? ?? false) ? ChatDeliveryStatus.read : ChatDeliveryStatus.delivered,
        );
      }).toList();

  List<ChatMessage> _mockMessages() => [
        ChatMessage(id: '1', senderId: vendorId, text: 'Hi! Thank you for enquiring about our services. How can I help you?', sentAt: DateTime.now().subtract(const Duration(minutes: 30)), status: ChatDeliveryStatus.read),
        ChatMessage(id: '2', senderId: userId, text: 'We are planning a wedding in March. Can you share your availability?', sentAt: DateTime.now().subtract(const Duration(minutes: 28)), status: ChatDeliveryStatus.read),
        ChatMessage(id: '3', senderId: vendorId, text: 'Of course! March is mostly available. Could you share the exact date and approximate guest count?', sentAt: DateTime.now().subtract(const Duration(minutes: 25)), status: ChatDeliveryStatus.delivered),
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

class ChatScreen extends ConsumerStatefulWidget {
  final String vendorId;
  const ChatScreen({super.key, required this.vendorId});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _textController = TextEditingController();
  final _scrollController = ScrollController();
  final _picker = ImagePicker();
  bool _sending = false;
  bool _vendorTyping = false;
  XFile? _pendingImage;
  ChatMessage? _replyTo;
  Timer? _typingTimer;

  @override
  void dispose() {
    _typingTimer?.cancel();
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(_scrollController.position.maxScrollExtent + 120, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
      }
    });
  }

  Future<void> _pickImage() async {
    final image = await _picker.pickImage(imageQuality: 75, source: ImageSource.gallery);
    if (!mounted || image == null) return;
    setState(() => _pendingImage = image);
  }

  Future<void> _send() async {
    final text = _textController.text.trim();
    if (text.isEmpty && _pendingImage == null) return;
    final replyPreview = _replyTo?.text.isNotEmpty == true ? _replyTo!.text : _replyTo?.imageName;
    final image = _pendingImage;
    _textController.clear();
    setState(() {
      _sending = true;
      _vendorTyping = true;
      _pendingImage = null;
      _replyTo = null;
    });
    await ref.read(chatProvider(widget.vendorId).notifier).sendMessage(
          text,
          imageName: image?.name,
          imageUrl: image?.path,
          replyPreview: replyPreview,
        );
    _typingTimer?.cancel();
    _typingTimer = Timer(const Duration(seconds: 2), () {
      if (mounted) setState(() => _vendorTyping = false);
    });
    if (mounted) setState(() => _sending = false);
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    final vendorAsync = ref.watch(vendorDetailProvider(widget.vendorId));
    final chatAsync = ref.watch(chatProvider(widget.vendorId));
    final currentUser = ref.watch(currentUserProvider);
    final bookings = ref.watch(bookingsProvider).valueOrNull ?? const <Booking>[];
    Booking? relatedBooking;
    for (final booking in bookings) {
      if (booking.vendorId == widget.vendorId) {
        relatedBooking = booking;
        break;
      }
    }

    return Scaffold(
      appBar: vendorAsync.when(
        loading: () => AppBar(title: const Text('Chat')),
        error: (_, __) => AppBar(title: const Text('Chat')),
        data: _buildAppBar,
      ),
      body: Column(
        children: [
          if (relatedBooking != null) _BookingBanner(booking: relatedBooking),
          Expanded(
            child: chatAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (_, __) => ErrorStateWidget(message: 'Could not load messages.', onRetry: () => ref.refresh(chatProvider(widget.vendorId))),
              data: (messages) {
                if (messages.isEmpty) {
                  return EmptyStateWidget(
                    icon: Icons.chat_bubble_outline,
                    title: 'Start the conversation',
                    message: 'Ask about availability, pricing, add-ons, or event-day support.',
                  );
                }
                _scrollToBottom();
                return ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(12),
                  itemCount: messages.length + (_vendorTyping ? 1 : 0),
                  itemBuilder: (context, index) {
                    if (_vendorTyping && index == messages.length) {
                      return const _TypingIndicator();
                    }
                    final message = messages[index];
                    final isMe = message.senderId == (currentUser?.id ?? 'me');
                    final showDate = index == 0 || !_isSameDay(messages[index - 1].sentAt, message.sentAt);
                    return Column(
                      children: [
                        if (showDate) _DateDivider(date: message.sentAt),
                        _BubbleTile(
                          message: message,
                          isMe: isMe,
                          vendorImageUrl: vendorAsync.valueOrNull?.displayImage,
                          onReply: () => setState(() => _replyTo = message),
                        ),
                      ],
                    );
                  },
                );
              },
            ),
          ),
          _buildComposer(),
        ],
      ),
    );
  }

  bool _isSameDay(DateTime a, DateTime b) => a.year == b.year && a.month == b.month && a.day == b.day;

  PreferredSizeWidget _buildAppBar(Vendor vendor) {
    return AppBar(
      titleSpacing: 0,
      title: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: CachedNetworkImage(imageUrl: vendor.displayImage, width: 36, height: 36, fit: BoxFit.cover),
          ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(vendor.businessName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              Text(_vendorTyping ? 'Typing…' : vendor.city, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.normal, color: AppColors.textMuted)),
            ],
          ),
        ],
      ),
      actions: [
        IconButton(icon: const Icon(Icons.photo_library_outlined, size: 20), onPressed: _pickImage),
        IconButton(icon: const Icon(Icons.call_outlined, size: 20), onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Calling support integration coming soon.')))),
      ],
    );
  }

  Widget _buildComposer() {
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 10),
        decoration: BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: AppColors.border))),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_replyTo != null)
              Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: AppColors.brandLight, borderRadius: BorderRadius.circular(12)),
                child: Row(
                  children: [
                    const Icon(Icons.reply, color: AppColors.brand, size: 18),
                    const SizedBox(width: 8),
                    Expanded(child: Text(_replyTo!.text.isNotEmpty ? _replyTo!.text : (_replyTo!.imageName ?? 'Attachment'), maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.brand, fontWeight: FontWeight.w600))),
                    IconButton(onPressed: () => setState(() => _replyTo = null), icon: const Icon(Icons.close, size: 18)),
                  ],
                ),
              ),
            if (_pendingImage != null)
              Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(12)),
                child: Row(
                  children: [
                    const Icon(Icons.image_outlined, color: AppColors.brand),
                    const SizedBox(width: 8),
                    Expanded(child: Text(_pendingImage!.name, maxLines: 1, overflow: TextOverflow.ellipsis)),
                    IconButton(onPressed: () => setState(() => _pendingImage = null), icon: const Icon(Icons.close, size: 18)),
                  ],
                ),
              ),
            Row(
              children: [
                IconButton(onPressed: _pickImage, icon: const Icon(Icons.add_photo_alternate_outlined)),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                    decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(24)),
                    child: TextField(
                      controller: _textController,
                      maxLines: null,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _send(),
                      decoration: const InputDecoration(border: InputBorder.none, hintText: 'Type a message…', contentPadding: EdgeInsets.zero),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
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
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _BookingBanner extends StatelessWidget {
  final Booking booking;
  const _BookingBanner({required this.booking});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(12, 10, 12, 6),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppColors.brandLight, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.brand.withOpacity(0.15))),
      child: Row(
        children: [
          const Icon(Icons.event_available_outlined, color: AppColors.brand),
          const SizedBox(width: 10),
          Expanded(child: Text('Booking ${booking.bookingNumber} · ${booking.status.label}', style: const TextStyle(color: AppColors.brand, fontWeight: FontWeight.w700))),
          TextButton(onPressed: () => context.push('/bookings/${booking.id}'), child: const Text('View')),
        ],
      ),
    );
  }
}

class _BubbleTile extends StatelessWidget {
  final ChatMessage message;
  final bool isMe;
  final String? vendorImageUrl;
  final VoidCallback onReply;
  const _BubbleTile({required this.message, required this.isMe, required this.vendorImageUrl, required this.onReply});

  String _time(DateTime date) => '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';

  IconData _statusIcon(ChatDeliveryStatus status) {
    switch (status) {
      case ChatDeliveryStatus.sending:
        return Icons.schedule;
      case ChatDeliveryStatus.sent:
      case ChatDeliveryStatus.delivered:
        return Icons.done_all;
      case ChatDeliveryStatus.read:
        return Icons.done_all;
    }
  }

  Color _statusColor(ChatDeliveryStatus status) {
    switch (status) {
      case ChatDeliveryStatus.read:
        return const Color(0xFF93C5FD);
      case ChatDeliveryStatus.sending:
        return Colors.white70;
      case ChatDeliveryStatus.sent:
      case ChatDeliveryStatus.delivered:
        return Colors.white70;
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onLongPress: onReply,
      child: Padding(
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
                    : Container(width: 28, height: 28, decoration: const BoxDecoration(color: AppColors.brand, shape: BoxShape.circle), child: const Icon(Icons.store, color: Colors.white, size: 14)),
              ),
              const SizedBox(width: 6),
            ],
            Container(
              constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.72),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
              decoration: BoxDecoration(
                color: isMe ? AppColors.brand : Colors.white,
                borderRadius: BorderRadius.only(topLeft: const Radius.circular(18), topRight: const Radius.circular(18), bottomLeft: Radius.circular(isMe ? 18 : 4), bottomRight: Radius.circular(isMe ? 4 : 18)),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (message.replyPreview != null) ...[
                    Container(
                      width: double.infinity,
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: isMe ? Colors.white.withOpacity(0.16) : Colors.grey.shade100, borderRadius: BorderRadius.circular(10)),
                      child: Text(message.replyPreview!, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(color: isMe ? Colors.white70 : AppColors.textMuted, fontSize: 11)),
                    ),
                  ],
                  if (message.imageName != null) ...[
                    Container(
                      width: double.infinity,
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(color: isMe ? Colors.white.withOpacity(0.16) : Colors.grey.shade100, borderRadius: BorderRadius.circular(12)),
                      child: Row(
                        children: [
                          Icon(Icons.image_outlined, color: isMe ? Colors.white : AppColors.brand),
                          const SizedBox(width: 8),
                          Expanded(child: Text(message.imageName!, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: isMe ? Colors.white : AppColors.textPrimary, fontSize: 12))),
                        ],
                      ),
                    ),
                  ],
                  if (message.text.isNotEmpty) Text(message.text, style: TextStyle(color: isMe ? Colors.white : AppColors.textPrimary, fontSize: 14)),
                  const SizedBox(height: 3),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(_time(message.sentAt), style: TextStyle(color: isMe ? Colors.white70 : AppColors.textMuted, fontSize: 10)),
                      if (isMe) ...[
                        const SizedBox(width: 4),
                        Icon(_statusIcon(message.status), size: 13, color: _statusColor(message.status)),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TypingIndicator extends StatelessWidget {
  const _TypingIndicator();

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(left: 34, top: 6),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 4)]),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(width: 6, height: 6, decoration: const BoxDecoration(color: AppColors.textMuted, shape: BoxShape.circle)),
            const SizedBox(width: 4),
            Container(width: 6, height: 6, decoration: const BoxDecoration(color: AppColors.textMuted, shape: BoxShape.circle)),
            const SizedBox(width: 4),
            Container(width: 6, height: 6, decoration: const BoxDecoration(color: AppColors.textMuted, shape: BoxShape.circle)),
          ],
        ),
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
      child: Row(
        children: [
          const Expanded(child: Divider()),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
          ),
          const Expanded(child: Divider()),
        ],
      ),
    );
  }
}
