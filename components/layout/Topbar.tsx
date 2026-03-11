import Image from "next/image";

export function Topbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Freight Cargo Control
          </div>
          <div className="text-sm font-medium text-slate-900">
            Operational Overview
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-700">
        <div className="flex flex-col items-end">
          <span className="font-medium">Admin User</span>
          <span className="text-[11px] text-slate-500">
            Warehouse Admin · WH-01
          </span>
        </div>
        <div className="h-8 w-8 overflow-hidden rounded-full bg-slate-200">
          {/* <Image
            src="https://avatar.iran.liara.run/public"
            alt="User avatar"
            width={32}
            height={32}
          /> */}
        </div>
      </div>
    </header>
  );
}

