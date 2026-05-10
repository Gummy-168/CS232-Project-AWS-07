"use client";

import { Layers3, X } from "lucide-react";

type SectionItem = {
  id: string;
  label: string;
};

interface SelectSectionModalProps {
  isOpen: boolean;
  courseCode: string;
  sections: SectionItem[];
  onClose: () => void;
  onSelect: (sectionId: string) => void;
}

export default function SelectSectionModal({
  isOpen,
  courseCode,
  sections,
  onClose,
  onSelect,
}: SelectSectionModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F163F]/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-[32px] bg-white shadow-[0_28px_80px_rgba(74,48,147,0.28)]">
        <div className="flex items-start justify-between gap-4 px-7 pb-4 pt-7 sm:px-8 sm:pt-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F3EEFF] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#6C56EC]">
              <Layers3 size={14} />
              Select Section
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-[#241B47]">
              Choose a section for this board
            </h2>
            <p className="mt-2 max-w-md text-sm leading-7 text-[#7B719D]">
              Open the board in the correct section so students join the right class
              stream in {courseCode}.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close modal"
          >
            <X size={22} />
          </button>
        </div>

        <div className="px-7 pb-2 sm:px-8">
          <div className="rounded-[28px] bg-[linear-gradient(135deg,#F8F4FF_0%,#FFF7FB_100%)] p-5">
            <p className="text-sm font-semibold text-[#261F46]">
              Available sections
            </p>
            <div className="mt-4 grid gap-3">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => onSelect(section.id)}
                  className="flex items-center justify-between rounded-[22px] border border-[#E9E1FC] bg-white px-4 py-4 text-left transition hover:border-[#CBBEFF] hover:bg-[#FCFAFF]"
                >
                  <div>
                    <p className="text-base font-semibold text-[#2A2340]">
                      {section.label}
                    </p>
                    <p className="mt-1 text-xs text-[#9B91C7]">
                      Open the board in this section
                    </p>
                  </div>
                  <span className="rounded-full bg-[#F3EEFF] px-3 py-1 text-xs font-bold text-[#6C56EC]">
                    Use
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end px-7 py-6 sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
