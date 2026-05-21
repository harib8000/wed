import { useState } from 'react';
import { Star, MessageCircle, ThumbsUp, ArrowUpDown } from 'lucide-react';

const REVIEWS = [
  { id: '1', customer: 'Priya Sharma', rating: 5, date: '10 Jan 2027', eventType: 'Wedding', comment: 'Absolutely stunning venue! The Grand Gold package was worth every penny. The staff was incredibly helpful and made our day truly magical. Would highly recommend to everyone.', helpful: 12, reply: null },
  { id: '2', customer: 'Ananya Reddy', rating: 5, date: '28 Dec 2026', eventType: 'Reception', comment: 'Beautiful space and excellent coordination. The lighting setup was breathtaking. Our guests couldn\'t stop complimenting the venue.', helpful: 8, reply: 'Thank you so much, Ananya! It was a pleasure hosting your reception.' },
  { id: '3', customer: 'Meera Kumar', rating: 4, date: '15 Dec 2026', eventType: 'Wedding', comment: 'Great venue overall. The food was excellent and arrangements were good. Minor issue with parking space but the team handled it well.', helpful: 5, reply: null },
  { id: '4', customer: 'Divya Verma', rating: 5, date: '2 Dec 2026', eventType: 'Engagement', comment: 'Perfect for our intimate engagement ceremony. The outdoor garden area is simply gorgeous. Very professional team.', helpful: 6, reply: 'We loved hosting your engagement, Divya! Wishing you both the best.' },
  { id: '5', customer: 'Swetha Iyer', rating: 3, date: '20 Nov 2026', eventType: 'Wedding', comment: 'Good venue but slightly overpriced for what you get. The AC in the main hall wasn\'t working properly. Food quality was good though.', helpful: 3, reply: null },
  { id: '6', customer: 'Kavitha Nair', rating: 5, date: '8 Nov 2026', eventType: 'Wedding', comment: 'Dream wedding venue! Everything from decor to catering was flawless. The Platinum package offers incredible value.', helpful: 15, reply: 'Thank you Kavitha! Your wedding was truly special and we were honored to be part of it.' },
  { id: '7', customer: 'Ritu Agarwal', rating: 4, date: '25 Oct 2026', eventType: 'Haldi', comment: 'Lovely outdoor space for our haldi. Good arrangements and the team was very accommodating with our custom requests.', helpful: 4, reply: null },
  { id: '8', customer: 'Pooja Desai', rating: 2, date: '10 Oct 2026', eventType: 'Wedding', comment: 'Disappointing experience. The venue looks great in photos but maintenance could be better. Some areas looked worn. Staff was polite but disorganized.', helpful: 2, reply: null },
];

type SortKey = 'newest' | 'highest' | 'lowest';

export function ReviewsPage() {
  const [filter, setFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const filtered = REVIEWS
    .filter((r) => filter === null || r.rating === filter)
    .sort((a, b) => {
      if (sortBy === 'highest') return b.rating - a.rating;
      if (sortBy === 'lowest') return a.rating - b.rating;
      return 0; // newest is default order
    });

  const totalReviews = REVIEWS.length;
  const avgRating = totalReviews > 0 ? (REVIEWS.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) : '0.0';
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: REVIEWS.filter((r) => r.rating === star).length,
    pct: Math.round((REVIEWS.filter((r) => r.rating === star).length / totalReviews) * 100),
  }));

  function renderStars(rating: number) {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={14} className={i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
        ))}
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-gray-500 text-sm">Manage and respond to customer reviews</p>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown size={14} className="text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="newest">Newest First</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>
      </div>

      {/* Rating Summary */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 mb-1">{avgRating}</div>
            <div className="flex items-center justify-center gap-0.5 mb-1">
              {renderStars(Math.round(Number(avgRating)))}
            </div>
            <p className="text-sm text-gray-500">{totalReviews} reviews</p>
          </div>
          <div className="flex-1 w-full space-y-2">
            {distribution.map((d) => (
              <div key={d.star} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-8">{d.star}★</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-yellow-400 h-2.5 rounded-full transition-all"
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-8">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${filter === null ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          All
        </button>
        {[5, 4, 3, 2, 1].map((star) => (
          <button
            key={star}
            onClick={() => setFilter(star)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${filter === star ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {star}★
          </button>
        ))}
      </div>

      {/* Review Cards */}
      <div className="space-y-4">
        {filtered.map((review) => (
          <div key={review.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                  <span className="text-brand-700 text-sm font-bold">{review.customer[0]}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{review.customer}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {renderStars(review.rating)}
                    <span className="text-xs text-gray-400">{review.date}</span>
                  </div>
                </div>
              </div>
              <span className="badge bg-gray-100 text-gray-600 text-xs">{review.eventType}</span>
            </div>

            <p className="text-sm text-gray-600 mb-3">{review.comment}</p>

            {/* Existing reply */}
            {review.reply && (
              <div className="bg-brand-50 rounded-xl p-3 mb-3 border border-brand-100">
                <p className="text-xs font-semibold text-brand-700 mb-1">Your Reply</p>
                <p className="text-sm text-gray-700">{review.reply}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <ThumbsUp size={12} /> {review.helpful} helpful
              </span>
              {!review.reply && (
                <button
                  onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  <MessageCircle size={12} /> Reply
                </button>
              )}
            </div>

            {/* Reply textarea */}
            {replyingTo === review.id && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your reply..."
                  className="input-field h-20 resize-none text-sm mb-2"
                />
                <div className="flex gap-2">
                  <button className="btn-primary text-xs py-1.5 px-3">Submit Reply</button>
                  <button
                    onClick={() => { setReplyingTo(null); setReplyText(''); }}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
