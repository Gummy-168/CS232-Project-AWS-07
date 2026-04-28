import Image from "next/image";

export default function Home() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/loginfillerlogo/loginbg.svg')" }}
    >
      <div className="w-[350px] bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center gap-5">
        
        <Image
          src="/loginfillerlogo/logo.svg" 
          alt="Askdemy Logo"
          width={180}
          height={60}
          style={{ height: 'auto' }}
          priority
        />

        <h2 className="text-lg text-black font-semibold">Welcome Back</h2>

        <div className="flex gap-5 justify-center w-full">
          <button className="w-24 py-2 rounded-3xl text-xs font-medium text-black bg-[#F0EDED] hover:bg-[#D9D6D6] transition-all duration-200">
            Student
          </button>
          <button className="w-24 py-2 rounded-3xl text-xs font-medium text-black bg-[#F0EDED] hover:bg-[#D9D6D6] transition-all duration-200">
            Professor
          </button>
        </div>

        <div className="w-full flex flex-col gap-3">
          <div>
            <label className="text-xs text-black font-medium">STUDENT NUMBER</label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Image src="/loginfillerlogo/profile.svg" alt="User Icon" width={20} height={20} />
              </div>
              <input
                type="text"
                placeholder="6700000000"
              className="w-full pl-11 pr-4 py-2 rounded-full bg-[#F0EDED] outline-none text-black placeholder:text-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-black font-medium">PASSWORD</label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Image src="/loginfillerlogo/lock.svg" alt="Lock Icon" width={12} height={12} />
              </div>
              <input
                type="password"
                placeholder="••••••••"
              className="w-full pl-11 pr-4 py-2 rounded-full bg-[#F0EDED] outline-none text-black placeholder:text-zinc-500"
              />
            </div>
          </div>
        </div>
        
        <button className="w-full py-3 rounded-full bg-gradient-to-r from-[#513FDF] to-[#FD64A4] text-white font-semibold hover:brightness-110 hover:shadow-lg hover:shadow-[#513FDF]/30 active:scale-[0.98] transition-all duration-200">
          Log in
        </button>

        <div className="text-sm text-black flex flex-col items-center">
          <span>If you don’t have an account?</span>
          <span className="text-[#AE2466] font-bold cursor-pointer underline">Create account</span>
        </div>
      </div>
    </div>
  );
}