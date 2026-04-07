export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-[#FCF9F8]">

      {/* Main */}
      <main className="flex-1 p-8 space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-[#1B1B1B] text-2xl font-semibold">
              Hello, 
            </h2>
            <p className="text-gray-500">Student ID: 670000000</p>
          </div>

          <button className="border border-dashed border-[#E3DFFF] px-4 py-2 rounded-xl text-[#513FDF] bg-[#FAF5FF] hover:bg-[#513FDF] hover:text-white transition">
            Join Course
          </button>
        </div>

        {/* Card Section */}
        <div className="grid grid-cols-3 gap-6">

          {/* Current Session */}
          <div className="col-span-2 bg-white p-6 rounded-2xl shadow">
            <p className="mt-3 text-[#AE2466] text-sm mb-2">
              <span>🛜 </span>
              CURRENTLY IN SESSION
            </p>

            <h3 className="text-xl text-[#1B1B1B] font-semibold mb-4">
              CS232: Intro to Cloud Computing
            </h3>

            <div className="flex gap-4">
              <div className="flex-1 text-[#1B1B1B] bg-[#F6F3F2] px-4 py-2 rounded-2xl text-sm">
  
                <p className="text-xs">🕑 Time remaining</p>
                13:30 - 16:30
              </div>
              <div className="flex-1 text-[#1B1B1B] bg-[#F6F3F2] px-4 py-2 rounded-2xl text-sm">
                <p className="text-xs">👨‍🏫 Instructor</p>
                Aj. Noon
              </div>
            </div>

            <button className="mt-6 bg-gradient-to-r from-[#513FDF] to-[#FD64A4] text-white px-6 py-2 rounded-full hover:opacity-50 transition">
              Ask Now
            </button>
          </div>

          {/* Stats */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <h3 className="text-[#1B1B1B]  mb-4">My Activity Stats</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 p-4 rounded-xl text-center">
                <p className="text-xl font-bold text-[#513FDF]">72%</p>
                <p className="text-xs text-gray-500">Participation</p>
              </div>

              <div className="bg-gray-100 p-4 rounded-xl text-center">
                <p className="text-xl font-bold text-pink-500">12</p>
                <p className="text-xs text-gray-500">Questions</p>
              </div>

              <div className="bg-gray-100 p-4 rounded-xl text-center">
                <p className="text-xl font-bold text-green-500">8</p>
                <p className="text-xs text-gray-500">Answered</p>
              </div>

              <div className="bg-gray-100 p-4 rounded-xl text-center">
                <p className="text-xl font-bold text-yellow-500">4</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-2 gap-6">

          {/* Chart */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <h3 className="text-[#1B1B1B] mb-4">
              Participation Overview
            </h3>

            <div className="flex items-end gap-3 h-40">
              {[40, 60, 50, 70, 90, 30, 50].map((h, i) => (
                <div
                  key={i}
                  className="bg-purple-400 w-6 rounded"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          {/* Questions */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <h3 className="text-[#1B1B1B] mb-4">
              Recent Questions
            </h3>

            <div className="text-[#1B1B1B] bg-gray-100 p-4 rounded-xl text-sm">
              ทำไมต้องตั้ง Source เป็น Web Security Group...
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}