"use client";
import React, { useState } from "react";
import { User, Bell, Lock, Edit3, Activity, Camera } from "lucide-react";

const StudentProfilePage = () => {
  // Mock Data
  const studentInfo = {
    fullName: "สมปอง อยากรวย",
    displayName: "สมชาย กุ๊กกิ๊ก",
    email: "sompong.yak@dome.tu.ac.th",
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
  const [avatarUrl, setAvatarUrl] = useState("https://img.freepik.com/free-photo/cute-shiba-inu-dog-portrait_23-2149174154.jpg");


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
  const [displayName, setDisplayName] = useState(studentInfo.displayName);

  const handleSaveProfile = async () => {
    try {
      console.log("Saving to Database...", displayName);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsEditing(false);
      alert("อัปเดตโปรไฟล์สำเร็จ!");
    } catch (error) {
      console.error("Update failed", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] p-8 font-sans text-slate-700">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile & Settings */}
        <div className="md:col-span-2 space-y-8">
          {/* PROFILE CARD */}
          <div className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-slate-100">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                    <User size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">
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
                  className={`${isEditing
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

                        document.getElementById('avatarInput').click();
                      }
                    }}
                    className={`relative w-32 h-32 rounded-full overflow-hidden border-4 ${isEditing
                      ? "border-emerald-400 ring-4 ring-emerald-500/10 cursor-pointer"
                      : "border-slate-50"
                      } shadow-inner group transition-all duration-300`}
                  >
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />

                    {isEditing && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={32} className="text-white" />
                      </div>
                    )}
                  </div>

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
                    Student Profile
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
                          {studentInfo.fullName}
                        </span>
                        <Lock size={16} className="text-slate-400" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
                        <span className="w-1.5 h-4 bg-rose-400 rounded-full"></span>{" "}
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        disabled={!isEditing}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className={`w-full px-4 py-3 rounded-2xl border transition-all ${isEditing
                            ? "bg-white border-indigo-400 ring-4 ring-indigo-500/10 shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-500"
                          } focus:outline-none`}
                      />
                      {isEditing && (
                        <p className="text-[10px] text-indigo-500 font-medium ml-2">
                          กำลังอยู่ในโหมดแก้ไข...
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>{" "}
                      Email
                    </label>
                    <div className="flex items-center justify-between bg-slate-100 px-4 py-3 rounded-2xl border border-slate-200">
                      <span className="text-slate-600">
                        {studentInfo.email}
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

          {/* NOTIFICATION SETTINGS */}
          <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-10">
              <div className="bg-rose-50 p-3 rounded-2xl text-rose-400">
                <Bell size={28} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">
                การตั้งค่าการแจ้งเตือน
              </h2>
            </div>

            <div className="space-y-8">
              {[
                {
                  id: "answers",
                  title: "การตอบคำถาม",
                  desc: "ได้รับแจ้งเตือนเมื่ออาจารย์หรือนักศึกษาตอบคำถาม",
                },
                {
                  id: "liveBoard",
                  title: "Live Board",
                  desc: "ได้รับแจ้งเตือนเมื่อมี Live Board",
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

        {/* Academic Pulse */}
        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 flex flex-col items-center">
          <div className="flex items-center gap-2 w-full mb-8 text-rose-500">
            <Activity size={24} />
            <h2 className="text-xl font-bold text-slate-800">Academic Pulse</h2>
          </div>

          <div className="w-full space-y-4">
            {/* Student ID */}
            <div className="bg-slate-50/50 p-5 rounded-3xl flex justify-between items-center border border-slate-100">
              <span className="text-sm font-bold text-slate-500">
                Student ID
              </span>
              <span className="text-lg font-bold text-indigo-600">
                {studentInfo.studentId}
              </span>
            </div>

            {/* Semester */}
            <div className="bg-slate-50/50 p-5 rounded-3xl flex justify-between items-center border border-slate-100">
              <span className="text-sm font-bold text-slate-500">Semester</span>
              <span className="text-lg font-bold text-slate-800">
                {studentInfo.semester}
              </span>
            </div>

            {/* Enrolled */}
            <div className="bg-slate-50/50 p-5 rounded-3xl flex justify-between items-center border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-500">
                  Enrolled
                </span>
                <span className="bg-rose-100 text-rose-500 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Active
                </span>
              </div>
              <span className="text-lg font-bold text-rose-500">
                {studentInfo.enrolledCourses} COURSES
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;
