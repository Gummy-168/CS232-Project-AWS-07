"use client";
import React, { useEffect, useState } from "react";
import { User, Bell, Lock, Edit3, Activity, Camera } from "lucide-react";
import Header from "../../components/Header";
import CreateCourse from "../../components/createcourse";

const fetchProfessorData = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        professor: { name: "อาจารย์สะปุกนิก", id: "PRF000001" },
        course: { title: "CS232: Intro to Cloud Computing", code: "7A3456" },
      });
    }, 600);
  });
};

const ProfessorSettingsPage = () => {
  // Mock Data
  const professorInfo = {
    fullName: "อาจารย์สะปุกนิก",
    displayName: "อาจารย์สะปุกนิก",
    email: "professor@example.com",
    studentId: "6700000000",
    semester: "2/2026",
    enrolledCourses: 1,
    profileImage: "https://api.dicebear.com/7.x/bottts/svg?seed=shiba",
  };

  const [notifications, setNotifications] = useState({
    answers: false,
    liveBoard: false,
    gmail: false,
  });
  const [avatarUrl, setAvatarUrl] = useState(
    "https://img.freepik.com/free-photo/cute-shiba-inu-dog-portrait_23-2149174154.jpg",
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(professorInfo.displayName);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchProfessorData().then(setData);
  }, []);
  const [showSuccess, setShowSuccess] = useState(false);
  const handleSaveProfile = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsEditing(false);
      setShowSuccess(true);
    } catch (error) {
      console.error("Update failed", error);
    }
  };
  const handleCreateCourse = () => {};

  return (
    <div className="h-full bg-[#FCF9F8] font-sans text-slate-700 overflow-y-auto">
      <Header
        professorName={data?.professor?.name}
        onJoinCourse={() => setIsModalOpen(true)}
        courseTitle={data?.course?.title}
        codeId={data?.course?.code}
        mode="settingsprof"
      />
      <CreateCourse
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateCourse={handleCreateCourse}
      />
      <main className="px-8 pt-[140px] pb-10 w-full">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Profile & Settings */}
          <div className="md:col-span-3 space-y-8">
            {/* PROFILE CARD */}
            <div className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-slate-100">
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                      <User size={24} />
                    </div>
                    <h2 className="text-xl font-medium text-slate-800">
                      Profile Information
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      if (isEditing) {
                        handleSaveProfile();
                      } else {
                        setIsEditing(true);
                      }
                    }}
                    className={`${
                      isEditing
                        ? "bg-emerald-500 text-white"
                        : "bg-indigo-50 text-indigo-600"
                    } px-6 py-2 rounded-full font-medium hover:opacity-90 transition-all flex items-center gap-2`}
                  >
                    {isEditing ? <> บันทึกข้อมูล </> : <> Edit Profile </>}
                  </button>
                </div>

                <div className="flex flex-col md:flex-row gap-10 items-start">
                  {/* Avatar Section */}
                  <div className="flex flex-col items-center gap-4">
                    <div
                      onClick={() => {
                        if (isEditing) {
                          document.getElementById("avatarInput").click();
                        }
                      }}
                      className={`relative w-32 h-32 rounded-full overflow-hidden border-4 ${
                        isEditing
                          ? "border-emerald-400 ring-4 ring-emerald-500/10 cursor-pointer"
                          : "border-slate-50"
                      } shadow-inner group transition-all duration-300`}
                    >
                      <img
                        src={avatarUrl} // ใช้ค่าจาก State
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />

                      {/* Overlay แสดงรูปกล้องเมื่อเอาเมาส์มาวาง (Hover) ในโหมดแก้ไข */}
                      {isEditing && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera size={32} className="text-white" />
                        </div>
                      )}
                    </div>

                    {/* Input สำหรับเลือกไฟล์ (ซ่อนไว้) */}
                    {isEditing && (
                      <input
                        id="avatarInput"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    )}

                    <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                      Professor Profile
                    </span>
                  </div>

                  {/* Form Fields */}
                  <div className="flex-1 w-full space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
                          <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>{" "}
                          Full Name
                        </label>
                        <div className="flex items-center justify-between bg-slate-100 px-4 py-3 rounded-2xl border border-slate-200">
                          <span className="text-slate-600">
                            {professorInfo.fullName}
                          </span>
                          <Lock size={16} className="text-slate-400" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
                        <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>{" "}
                        Email
                      </label>
                      <div className="flex items-center justify-between bg-slate-100 px-4 py-3 rounded-2xl border border-slate-200">
                        <span className="text-slate-600">
                          {professorInfo.email}
                        </span>
                        <Lock size={16} className="text-slate-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Gray banner at bottom of card */}
              <div className="h-16 bg-slate-200/70 w-full mt-4 rounded-b-[40px]"></div>
            </div>
          </div>

          {/* NOTIFICATION SETTINGS */}
          <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 md:col-span-2">
            <div className="flex items-center gap-4 mb-10">
              <div className="bg-rose-50 p-3 rounded-2xl text-rose-400">
                <Bell size={28} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                การตั้งค่าการแจ้งเตือน
              </h2>
            </div>

            <div className="space-y-8">
              {[
                {
                  id: "questions",
                  title: "คำถามจากนักศึกษา",
                  desc: "ได้รับแจ้งเตือนเมื่อนักศึกษาถามคำถาม",
                },
                {
                  id: "gmail",
                  title: "Gmail Notification",
                  desc: "รับแจ้งเตือนผ่าน Email",
                },
              ].map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800">{item.title}</h4>
                    <p className="text-sm text-slate-400 font-medium">
                      {item.desc}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={
                        notifications[item.id as keyof typeof notifications]
                      }
                      onChange={() =>
                        setNotifications((prev) => ({
                          ...prev,
                          [item.id]:
                            !prev[item.id as keyof typeof notifications],
                        }))
                      }
                    />
                    <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-500"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-10 shadow-2xl flex flex-col items-center gap-4 w-80">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="16" fill="#d1fae5" />
                <path
                  d="M9 16l5 5 9-9"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800">อัปเดตสำเร็จ!</h3>
            <p className="text-sm text-slate-400 text-center">
              ข้อมูลโปรไฟล์ของคุณถูกบันทึกเรียบร้อยแล้ว
            </p>
            <button
              onClick={() => setShowSuccess(false)}
              className="mt-2 px-8 py-2.5 rounded-2xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 active:scale-95 transition-all"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessorSettingsPage;
