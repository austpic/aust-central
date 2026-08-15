import { useRef } from 'react';
import { ArrowLeft, Camera, Plus, CheckCircle2 } from 'lucide-react';
import { usePostListingViewModel } from '../viewmodels/usePostListingViewModel';

// Mirrors BookPostPage in lib/screens/book_exchange/book_post_page.dart.
export default function BookPostView() {
  const vm = usePostListingViewModel();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const extraInputRef = useRef<HTMLInputElement>(null);

  function readAsDataUrl(file: File, onDone: (dataUrl: string) => void) {
    const reader = new FileReader();
    reader.onload = () => onDone(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex min-h-svh flex-col">
      {/* Top bar */}
      <div className="flex items-center px-2 py-2">
        <button
          type="button"
          onClick={() => history.back()}
          aria-label="Back"
          className="glass flex h-11 w-11 items-center justify-center rounded-full text-darkgreen transition-transform duration-200 hover:-translate-y-0.5"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="flex-1 text-center font-display text-[18px] font-bold tracking-[1.1px] text-mint-ink">
          POST A BOOK
        </span>
        <span className="w-9" />
      </div>

      <div className="mx-auto w-full max-w-2xl flex-1 px-5 pb-6">
        {/* Photo pickers */}
        <div className="flex gap-4 overflow-x-auto pb-1">
          {vm.coverImage ? (
            <div className="relative h-[116px] w-[100px] shrink-0 overflow-hidden rounded-[16px]">
              <img src={vm.coverImage} alt="Cover" className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-[11px] font-bold text-white">
                Cover
              </div>
              <button
                type="button"
                onClick={vm.removeCoverImage}
                aria-label="Remove cover"
                className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white"
              >
                <span className="block h-3.5 w-3.5 text-[12px] leading-none">✕</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="glass flex h-[116px] w-[100px] shrink-0 flex-col items-center justify-center rounded-[16px] border-[1.4px] border-dashed border-darkgreen/35"
            >
              <Camera size={22} className="text-darkgreen" />
              <span className="mt-2 text-[12px] font-semibold text-black54">Add Cover</span>
            </button>
          )}

          {vm.additionalImages.map((src, i) => (
            <div key={i} className="relative h-[116px] w-[100px] shrink-0 overflow-hidden rounded-[16px]">
              <img src={src} alt={`Additional ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => vm.removeAdditionalImage(i)}
                aria-label="Remove image"
                className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white"
              >
                <span className="block h-3.5 w-3.5 text-[12px] leading-none">✕</span>
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => extraInputRef.current?.click()}
            aria-label="Add photo"
            className="glass flex h-[116px] w-[100px] shrink-0 items-center justify-center rounded-[16px] border-[1.4px] border-dashed border-darkgreen/35"
          >
            <Plus size={26} className="text-darkgreen" />
          </button>
        </div>

        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) readAsDataUrl(file, vm.addCoverImage);
            e.target.value = '';
          }}
        />
        <input
          ref={extraInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) readAsDataUrl(file, vm.addAdditionalImage);
            e.target.value = '';
          }}
        />

        <div className="mt-6">
          <SectionLabel label="Book Title" />
          <PlainField
            value={vm.title}
            onChange={vm.setTitle}
            hint="Book title"
          />
        </div>

        <div className="mt-6">
          <SectionLabel label="Course Code (autocomplete)" />
          <div className="glass-input flex h-[52px] items-center rounded-[16px] px-4">
            <input
              type="text"
              value={vm.course}
              onChange={(e) => vm.setCourse(e.target.value)}
              placeholder="e.g. CHEM 201"
              className="w-full bg-transparent text-[14px] text-ink uppercase outline-none placeholder:text-black38"
            />
            {vm.courseMatched && (
              <span className="tag-mint flex shrink-0 items-center gap-1 rounded-[10px] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.06em]">
                <CheckCircle2 size={13} />
                Matched
              </span>
            )}
          </div>
        </div>

        <div className="mt-6">
          <SectionLabel label="Condition" />
          <SegmentedControl
            options={vm.conditionOptions}
            selectedIndex={vm.conditionIndex}
            onChanged={vm.setConditionIndex}
          />
        </div>

        <div className="mt-6">
          <SectionLabel label="Price Type" />
          <SegmentedControl
            options={vm.priceTypeOptions}
            selectedIndex={vm.priceTypeIndex}
            onChanged={vm.setPriceTypeIndex}
          />
        </div>

        <div className="mt-6">
          <SectionLabel label="Description" />
          <textarea
            value={vm.description}
            onChange={(e) => vm.setDescription(e.target.value)}
            placeholder="Add condition notes, what you're looking to swap for, etc."
            rows={4}
            className="glass-input w-full rounded-[16px] px-4 py-3 text-[14px] leading-[1.4] text-ink outline-none placeholder:text-black38"
          />
        </div>

        <div className="mt-6 flex items-center">
          <div className="flex-1">
            <div className="text-[14px] font-bold text-ink">Contact via In-App Chat</div>
            <div className="text-[12px] text-black/45">Recommended for safety</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={vm.contactViaChat}
            onClick={() => vm.setContactViaChat(!vm.contactViaChat)}
            className={`h-7 w-[46px] rounded-full border transition-colors ${
              vm.contactViaChat ? 'glass-accent border-white/40' : 'border-white/60 bg-white/40'
            }`}
          >
            <span
              className={`block h-6 w-6 rounded-full bg-white shadow-[0_2px_6px_rgba(27,67,50,0.35),inset_0_1px_0_rgba(255,255,255,0.8)] transition-transform ${
                vm.contactViaChat ? 'translate-x-[21px]' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Bottom actions */}
        <div className="mt-6 border-t border-white/60 pt-6">
          <button
            type="button"
            onClick={vm.saveDraft}
            className="glass h-[50px] w-full rounded-[28px] border-[1.4px] border-mint-ink/40 font-bold text-mint-ink"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={vm.postListing}
            className="glass-accent glass-sheen mt-3 h-[50px] w-full rounded-[28px] font-bold text-white transition-transform duration-200 hover:-translate-y-0.5"
          >
            Post Listing
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <div className="eyebrow-rule mb-2">{label}</div>;
}

function PlainField({
  value,
  onChange,
  hint,
}: {
  value: string;
  onChange: (v: string) => void;
  hint: string;
}) {
  return (
    <div className="glass-input rounded-[16px] px-4 py-1">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={hint}
        className="w-full bg-transparent py-3 text-[14px] text-ink outline-none placeholder:text-black38"
      />
    </div>
  );
}

function SegmentedControl({
  options,
  selectedIndex,
  onChanged,
}: {
  options: string[];
  selectedIndex: number;
  onChanged: (index: number) => void;
}) {
  return (
    <div className="glass flex rounded-[30px] p-1">
      {options.map((option, index) => (
        <button
          key={option}
          type="button"
          onClick={() => onChanged(index)}
          className={`mx-0.5 flex-1 rounded-[26px] px-1 py-3 text-center text-[12.5px] font-bold transition-transform duration-200 hover:-translate-y-0.5 ${
            selectedIndex === index
              ? 'glass-pill-active'
              : 'text-black/45'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
