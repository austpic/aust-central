import { ArrowLeft, Bell } from 'lucide-react';
import { useBookNotificationsViewModel } from '../viewmodels/useBookNotificationsViewModel';

// Mirrors BookNotificationPage in lib/screens/book_exchange/book_notification_page.dart.
export default function BookNotificationsView() {
  const vm = useBookNotificationsViewModel();

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Header */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={vm.goBack}
          aria-label="Back"
          className="glass flex h-11 w-11 items-center justify-center rounded-full text-darkgreen transition-transform duration-200 hover:-translate-y-0.5"
        >
          <ArrowLeft size={24} />
        </button>
        <span className="ml-1 font-display text-[20px] font-bold tracking-tight text-textdark">Notifications</span>
      </div>

      <div className="mt-4">
        {vm.notifications.length === 0 ? (
          <div className="py-12 text-center">
            <div className="glass-tint mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] text-mint-ink">
              <Bell size={28} />
            </div>
            <div className="mt-4 font-display text-[15px] font-bold text-textdark">No notifications yet</div>
            <p className="mx-auto mt-1 max-w-xs text-[13px] leading-[1.5] text-dim">
              Messages about your books will show up here when someone reaches out.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {vm.notifications.map((notification, i) => (
              <div
                key={i}
                className="glass glass-sheen flex items-center rounded-[16px] p-4 transition-shadow duration-200 hover:shadow-glass-lg"
              >
                <span className="glass-tint flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-darkgreen shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                  <Bell size={18} />
                </span>
                <div className="ml-3 min-w-0">
                  <div className="font-display text-[14px] font-bold text-ink">{notification.title}</div>
                  <div className="text-[13px] text-black54">{notification.body}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
