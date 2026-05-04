"use client";

import { useState } from "react";

export default function AskModal({ isOpen, onClose, onAdd }) {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!title.trim() || !detail.trim()) {
      alert("กรุณากรอกหัวข้อและรายละเอียด");
      return;
    }

    const payload = {
      id: Date.now(), 
      title,
      detail,
      anonymous,
      status: "IN DISCUSSION",
      createdAt: new Date().toISOString(),
      // สมมติข้อมูล User เบื้องต้น
      user: anonymous ? "Anonymous" : "สมปอง อยากรวย",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=shiba",
      isSolved: false
    };

    console.log("SEND:", payload);

    
    await new Promise((res) => setTimeout(res, 500));


    if (onAdd) {
      onAdd(payload);
    }

    alert("Posted!");


    setTitle("");
    setDetail("");

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[600px] rounded-3xl p-6 space-y-4 shadow-xl">

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Ask a Question</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <input
          placeholder="หัวข้อคำถาม"
          className="w-full p-3 rounded-xl bg-gray-100"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="รายละเอียดเพิ่มเติม"
          className="w-full p-3 rounded-xl bg-gray-100"
          rows={4}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
        />

        <div className="flex items-center justify-between bg-gray-100 p-3 rounded-xl">
          <span>แสดงชื่อแบบไม่ระบุตัวตน</span>
          <input
            type="checkbox"
            checked={anonymous}
            onChange={() => setAnonymous(!anonymous)}
          />
        </div>

        <div className="flex justify-end gap-4">
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-[#513FDF] to-[#FD64A4] text-white px-6 py-2 rounded-full shadow-lg shadow-purple-200 hover:scale-105 transition-transform"
          >
            Post Question
          </button>
        </div>
      </div>
    </div>
  );
}
